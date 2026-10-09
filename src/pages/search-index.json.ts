import { readFileSync } from 'node:fs';
// onnxruntime-web (WASM) on purpose: the browser uses the same kernels, so int8 activation
// quantization rounds identically and document and query vectors match exactly.
import * as ort from 'onnxruntime-web';
import { Encoder, MODEL_FILE, VOCAB_FILE } from '@/lib/search/encoder';
import { WordPiece } from '@/lib/search/wordpiece';
import { authorsOf, getEntries, getPublications, news, projects, venueLabel } from '@/lib/data';

/**
 * /search-index.json — every searchable item with its text (for BM25 and snippets) and its
 * Starbucks 2L-32 document vector, computed at build time.
 */
export interface SearchDoc {
  url: string; // English path; the client adds /zh for Chinese pages
  type: 'paper' | 'project' | 'news' | 'teaching' | 'talk' | 'award';
  title: string;
  titleZh?: string;
  meta: string;
  text: string;
  textZh?: string;
  vector: number[];
}

const clean = (text = '') => text.replace(/^##\s*Abstract\s*/i, '').replace(/[*_`#>]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();

export async function GET() {
  const root = `${process.cwd()}/public`;
  ort.env.wasm.numThreads = 1;
  const session = await ort.InferenceSession.create(readFileSync(root + MODEL_FILE));
  const encoder = new Encoder(ort, session, new WordPiece(readFileSync(root + VOCAB_FILE, 'utf8')));

  const pubs = await getPublications();
  const items: Omit<SearchDoc, 'vector'>[] = [
    ...pubs.map((pub) => ({
      url: pub.data.permalink,
      type: 'paper' as const,
      title: pub.data.title,
      meta: `${venueLabel(pub.data.venue, pub.data.date.getUTCFullYear())} · ${authorsOf(pub).map((a) => a.replace(/\*$/, '')).join(', ')}`,
      text: clean(pub.body).slice(0, 1500),
    })),
    ...projects.map((project) => ({
      url: `/research/${project.slug}/`,
      type: 'project' as const,
      title: project.name,
      meta: String(project.year),
      text: project.summary,
      textZh: project.summary_zh,
    })),
    ...news.map((item) => ({
      url: item.url?.startsWith('/') ? item.url : '/news/',
      type: 'news' as const,
      title: item.title,
      titleZh: item.title_zh,
      meta: item.date.toISOString().slice(0, 7),
      text: clean(item.description),
    })),
    ...(await Promise.all((['teaching', 'talks', 'awards'] as const).map(async (name) =>
      (await getEntries(name)).map((entry) => ({
        url: entry.data.permalink,
        type: (name === 'teaching' ? 'teaching' : name === 'talks' ? 'talk' : 'award') as SearchDoc['type'],
        title: entry.data.title,
        meta: [entry.data.venue, entry.data.date.getUTCFullYear()].filter(Boolean).join(' · '),
        text: clean(entry.body).slice(0, 600),
      })),
    ))).flat(),
  ];

  const docs: SearchDoc[] = [];
  for (const item of items) {
    // The encoder sees the title and the start of the text, like a passage in MS MARCO.
    const vector = await encoder.embed(`${item.title}. ${item.text}`);
    docs.push({ ...item, vector: vector.map((v) => Math.round(v * 1000) / 1000) });
  }
  return new Response(JSON.stringify({ model: 'Starbucks-msmarco (2 layers, 32 dims)', docs }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
