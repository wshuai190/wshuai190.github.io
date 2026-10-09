import { DENSE_CEILING, DENSE_THRESHOLD, Encoder, MODEL_FILE, VOCAB_FILE } from './encoder.ts';
import { WordPiece } from './wordpiece.ts';

/**
 * Hybrid site search: BM25 over titles, metadata and text, fused with Starbucks 2L-32 dense
 * scores: 0.5 · BM25/max(BM25) + 0.5 · clamp((dense − τ)/(ceiling − τ)), so dense scores below
 * the threshold τ count as 0 and only strong semantic matches earn full credit. A result needs a BM25 match or a dense score ≥ τ. BM25 results
 * are available immediately; dense scores join once the ~15 MB model has loaded.
 */

/** One passage of /search-index.json (see scripts/build_search_index.mjs). */
export interface SearchDoc {
  url: string; // English path; the client adds /zh on Chinese pages
  anchor?: string;
  type: 'paper' | 'project' | 'page' | 'news' | 'teaching' | 'talk' | 'award';
  lang: 'en' | 'zh';
  title: string;
  section?: string;
  text: string;
  vector: number[];
}
export type SearchMode = 'lexical' | 'hybrid';
export interface SearchResult { doc: SearchDoc; score: number; lexical: number; dense: number }
export interface LexicalScores { scores: number[]; coverage: number[] }

const STOPWORDS = new Set('a an and are as at be by can do does for from how i in is it of on or that the to was what when which who why with my me you'.split(' '));
const K1 = 1.2;
const B = 0.75;
const WEIGHT_DENSE = 0.5;
/** A keyword match must cover at least this share of the query's total idf weight. */
const MIN_COVERAGE = 0.4;
/** A passage with any keyword hit also counts if its Starbucks score reaches this. */
const DENSE_AGREEMENT = 16;

/** Lowercased word tokens; CJK runs become character unigrams and bigrams. */
export function lexicalTokens(text: string): string[] {
  const out: string[] = [];
  const lowered = text.toLowerCase().normalize('NFKD').replace(/\p{Mn}/gu, '');
  for (const match of lowered.matchAll(/[\p{Script=Han}]+|[a-z0-9]+/gu)) {
    const run = match[0];
    if (/^[a-z0-9]/.test(run)) {
      if (!STOPWORDS.has(run)) out.push(run);
    } else {
      const chars = [...run];
      chars.forEach((ch, i) => { out.push(ch); if (i + 1 < chars.length) out.push(ch + chars[i + 1]); });
    }
  }
  return out;
}

export class Bm25 {
  private tf: Map<string, number>[];
  private lengths: number[];
  private avgLength: number;
  private df = new Map<string, number>();

  constructor(texts: string[]) {
    this.tf = texts.map((text) => {
      const counts = new Map<string, number>();
      for (const token of lexicalTokens(text)) counts.set(token, (counts.get(token) ?? 0) + 1);
      return counts;
    });
    this.lengths = this.tf.map((counts) => [...counts.values()].reduce((a, b) => a + b, 0));
    this.avgLength = this.lengths.reduce((a, b) => a + b, 0) / Math.max(1, this.lengths.length);
    for (const counts of this.tf) for (const token of counts.keys()) this.df.set(token, (this.df.get(token) ?? 0) + 1);
  }

  private idf(term: string): number {
    const n = this.tf.length;
    const df = this.df.get(term) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  /** BM25 score per document, plus the share of the query's idf weight each document matches. */
  scores(query: string): LexicalScores {
    const terms = [...new Set(lexicalTokens(query))];
    const totalIdf = terms.reduce((sum, term) => sum + this.idf(term), 0);
    const scores: number[] = [];
    const coverage: number[] = [];
    this.tf.forEach((counts, i) => {
      let score = 0;
      let matchedIdf = 0;
      for (const term of terms) {
        const tf = counts.get(term);
        if (!tf) continue;
        const idf = this.idf(term);
        matchedIdf += idf;
        score += idf * (tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * this.lengths[i]) / this.avgLength));
      }
      scores.push(score);
      coverage.push(totalIdf > 0 ? matchedIdf / totalIdf : 0);
    });
    return { scores, coverage };
  }
}

/** Scale to [0, 1] between `floor` and `ceiling` (default: the maximum value), clamped. */
function scale(values: number[], floor: number, ceiling = Math.max(...values)): number[] {
  const range = ceiling - floor;
  return values.map((v) => (range > 0 ? Math.min(1, Math.max(0, (v - floor) / range)) : 0));
}

/** Text BM25 sees for a passage: page title (twice, as a field boost), section heading and passage. */
export const bm25Text = (d: SearchDoc) => `${d.title} ${d.title} ${d.section ?? ''} ${d.text}`;

let indexPromise: Promise<{ docs: SearchDoc[]; bm25: Bm25 }> | null = null;
export function loadIndex() {
  indexPromise ??= fetch('/search-index.json')
    .then((r) => r.json())
    .then(({ docs }: { docs: SearchDoc[] }) => ({ docs, bm25: new Bm25(docs.map(bm25Text)) }));
  return indexPromise;
}

let encoderPromise: Promise<Encoder | null> | null = null;
let encoderReady: Encoder | null = null;
/** Load onnxruntime-web and the Starbucks model once; resolves to null if unavailable. */
export function loadEncoder(): Promise<Encoder | null> {
  encoderPromise ??= (async () => {
    try {
      const runtime = '/ort/ort.wasm.min.mjs';
      const ort = await import(/* @vite-ignore */ runtime);
      ort.env.wasm.wasmPaths = '/ort/';
      ort.env.wasm.numThreads = 1; // GitHub Pages cannot enable cross-origin isolation for threads
      const [vocab, session] = await Promise.all([
        fetch(VOCAB_FILE).then((r) => r.text()),
        ort.InferenceSession.create(MODEL_FILE),
      ]);
      encoderReady = new Encoder(ort, session, new WordPiece(vocab));
      return encoderReady;
    } catch (error) {
      console.warn('Semantic search unavailable, using BM25 only.', error);
      return null;
    }
  })();
  return encoderPromise;
}

export function encoderLoaded(): boolean {
  return encoderReady !== null;
}

/**
 * Rank passages for `query` and keep the best passage per page. Chinese passages are only
 * searched on Chinese pages. Uses dense scores only once the model has loaded.
 */
export async function search(query: string, options: { types?: SearchDoc['type'][]; lang?: 'en' | 'zh'; limit?: number } = {}) {
  const { docs, bm25 } = await loadIndex();
  const queryVector = encoderReady && query.trim() ? await encoderReady.embed(query) : null;
  const results = bestPerPage(rank(docs, bm25.scores(query), queryVector))
    .filter((r) => (!options.types || options.types.includes(r.doc.type)) && (r.doc.lang === 'en' || options.lang === 'zh'));
  return { mode: (queryVector ? 'hybrid' : 'lexical') as SearchMode, results: results.slice(0, options.limit ?? results.length) };
}

/** Keep the highest-scoring passage of each page (results must already be sorted). */
export function bestPerPage(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => !seen.has(r.doc.url) && seen.add(r.doc.url));
}

/**
 * Link to the page, scrolled to the passage: the section anchor plus a text fragment
 * (#:~:text=) built from the first plain words of the passage, which browsers highlight.
 */
export function passageLink(doc: SearchDoc, lang: 'en' | 'zh'): string {
  const base = lang === 'zh' ? `/zh${doc.url}` : doc.url;
  const words = doc.text.split(' ');
  const start = words.findIndex((_, i) => words.slice(i, i + 4).every((w) => /^[\p{L}\p{N}'’-]+$/u.test(w)));
  const fragment = start >= 0 ? `:~:text=${encodeURIComponent(words.slice(start, start + 4).join(' ')).replace(/-/g, '%2D')}` : '';
  return `${base}#${doc.anchor ?? ''}${fragment}`;
}

/**
 * Fuse BM25 with Starbucks dot products (if a query vector is given) and sort. A document is
 * returned if it is a keyword match (its matched terms cover ≥ MIN_COVERAGE of the query's idf
 * weight, so one common word like "results" is not enough) or a semantic match (dense ≥ τ).
 * The cutoff only decides inclusion; ranking always uses the full BM25 score.
 */
export function rank(
  docs: SearchDoc[],
  { scores: lexical, coverage }: LexicalScores,
  queryVector: number[] | null,
  { threshold = DENSE_THRESHOLD, ceiling = DENSE_CEILING, minCoverage = MIN_COVERAGE, weightDense = WEIGHT_DENSE, agreement = DENSE_AGREEMENT } = {},
): SearchResult[] {
  const dense = queryVector ? docs.map((d) => d.vector.reduce((sum, v, i) => sum + v * queryVector[i], 0)) : docs.map(() => 0);
  const nl = scale(lexical, 0);
  const nd = queryVector ? scale(dense, threshold, ceiling) : dense;
  return docs
    .map((doc, i) => ({ doc, lexical: lexical[i], dense: dense[i], keyword: lexical[i] > 0 && coverage[i] >= minCoverage, score: queryVector ? (1 - weightDense) * nl[i] + weightDense * nd[i] : nl[i] }))
    // Strong keyword match, strong semantic match, or weaker evidence from both signals together.
    .filter((r) => r.keyword || (queryVector !== null && (r.dense >= threshold || (r.lexical > 0 && r.dense >= agreement))))
    .map(({ keyword, ...result }) => result)
    .sort((a, b) => b.score - a.score);
}

/** A short excerpt around the first query term, with matches wrapped in <mark>. */
export function snippet(text: string, query: string, width = 150): string {
  const terms = lexicalTokens(query).filter((t) => t.length > 2 || /\p{Script=Han}/u.test(t));
  const lower = text.toLowerCase();
  const hit = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, hit - 40);
  let excerpt = (start > 0 ? '…' : '') + text.slice(start, start + width) + (start + width < text.length ? '…' : '');
  excerpt = excerpt.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  if (!terms.length) return excerpt;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return excerpt.replace(pattern, '<mark>$1</mark>');
}
