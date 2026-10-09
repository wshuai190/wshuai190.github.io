// Build dist/search-index.json from the generated site: split every content page into
// heading-scoped passages of ~CHUNK_WORDS words and attach a Starbucks 2L-32 vector to each.
// Vectors are cached in src/data/search-embeddings.json by content hash, so only new or
// changed passages are encoded. Runs after `astro build` (npm "postbuild").
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import * as ort from 'onnxruntime-web';
import { WordPiece } from '../src/lib/search/wordpiece.ts';
import { DENSE_THRESHOLD, Encoder, MODEL_FILE, VOCAB_FILE } from '../src/lib/search/encoder.ts';

const DIST = 'dist';
const CACHE = 'src/data/search-embeddings.json';
const CHUNK_WORDS = 120;
const CHUNK_OVERLAP = 20;
const MIN_WORDS = 6;
// Elements that never contain page content of their own.
const SKIP = new Set(['script', 'style', 'nav', 'button', 'pre', 'details', 'svg', 'astro-island', 'noscript', 'form']);

/** Page type by URL; null means the page is not indexed (lists that repeat other pages). */
function pageType(url) {
  const path = url.replace(/^\/zh(?=\/)/, '');
  if (path.startsWith('/publication/')) return 'paper';
  if (/^\/research\/[^/]+\/$/.test(path)) return 'project';
  if (path === '/research/' || path === '/teaching/') return 'page';
  if (path === '/news/') return 'news';
  if (/^\/teaching\/.+/.test(path)) return 'teaching';
  if (/^\/talks\/.+/.test(path)) return 'talk';
  if (/^\/awards\/.+/.test(path)) return 'award';
  return null;
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? htmlFiles(path) : name.endsWith('.html') ? [path] : [];
  });
}

function urlOf(file) {
  const rel = '/' + relative(DIST, file).split('\\').join('/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel.replace(/\.html$/, '');
}

const SYMBOLS = /[↗→←★⧉✦✈●▶❚]/g;

/**
 * Walk <main> in document order, splitting text into sections at h1–h3. Text before the
 * page's h1 (eyebrows, back links, metadata labels) is not indexed.
 */
function sections(main) {
  const out = [];
  let seenH1 = false;
  let current = { heading: '', anchor: '', words: [] };
  const flush = () => { if (current.words.length && seenH1) out.push(current); };
  const visit = (node, anchor) => {
    if (node.nodeType === 3) {
      current.words.push(...node.text.replace(SYMBOLS, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean));
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.rawTagName?.toLowerCase();
    if (!tag || SKIP.has(tag) || node.hasAttribute('data-search-skip') || node.getAttribute('aria-hidden') === 'true' || node.hasAttribute('hidden') || node.classList?.contains('sr-only')) return;
    const ownId = node.getAttribute('id');
    const id = ownId && ownId !== 'main' ? ownId : anchor;
    if (/^h[1-3]$/.test(tag)) {
      flush();
      if (tag === 'h1') seenH1 = true;
      current = { heading: node.text.replace(SYMBOLS, ' ').replace(/\s+/g, ' ').trim(), anchor: (ownId !== 'main' && ownId) || id, words: [] };
      return;
    }
    node.childNodes.forEach((child) => visit(child, id));
  };
  visit(main, '');
  flush();
  return out;
}

function chunks(words) {
  if (words.length <= CHUNK_WORDS) return [words];
  const out = [];
  for (let start = 0; start < words.length; start += CHUNK_WORDS - CHUNK_OVERLAP) {
    out.push(words.slice(start, start + CHUNK_WORDS));
    if (start + CHUNK_WORDS >= words.length) break;
  }
  return out;
}

const hasHan = (text) => /\p{Script=Han}/u.test(text);
/** Real Chinese prose: at least 8 Han characters making up at least 20% of the text. */
function isChinese(text) {
  const han = (text.match(/\p{Script=Han}/gu) ?? []).length;
  return han >= 8 && han / text.replace(/\s/g, '').length >= 0.2;
}

// ------------------------------------------------------------------ collect passages
const passages = [];
for (const file of htmlFiles(DIST)) {
  const url = urlOf(file);
  const type = pageType(url);
  if (!type) continue;
  const root = parse(readFileSync(file, 'utf8'));
  const main = root.querySelector('main');
  if (!main) continue;
  const lang = url.startsWith('/zh/') ? 'zh' : 'en';
  const pageTitle = (main.querySelector('h1')?.text ?? root.querySelector('title')?.text ?? '').replace(/\s+/g, ' ').trim();
  for (const section of sections(main)) {
    for (const words of chunks(section.words)) {
      const text = words.join(' ');
      // Chinese pages repeat the English content; keep only their Chinese passages.
      if (lang === 'zh' ? !isChinese(text) : words.length < MIN_WORDS && !hasHan(text)) continue;
      passages.push({
        url: url.replace(/^\/zh(?=\/)/, ''),
        anchor: section.anchor || undefined,
        type,
        lang,
        title: pageTitle,
        section: section.heading && section.heading !== pageTitle ? section.heading : undefined,
        text,
      });
    }
  }
}

// ------------------------------------------------------------------ encode (cached)
const modelBytes = readFileSync(`public${MODEL_FILE}`);
const modelHash = createHash('sha1').update(modelBytes).digest('hex').slice(0, 12);
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
let encoder = null;
const fresh = {};
let encoded = 0;
for (const passage of passages) {
  // The encoder sees "page title. section. passage", like a titled MS MARCO passage.
  const input = [passage.title, passage.section, passage.text].filter(Boolean).join('. ');
  const key = createHash('sha1').update(`${modelHash}\n${input}`).digest('hex').slice(0, 16);
  if (!cache[key]) {
    if (!encoder) {
      ort.env.wasm.numThreads = 1;
      encoder = new Encoder(ort, await ort.InferenceSession.create(modelBytes), new WordPiece(readFileSync(`public${VOCAB_FILE}`, 'utf8')));
    }
    cache[key] = (await encoder.embed(input)).map((v) => Math.round(v * 1000) / 1000);
    encoded += 1;
  }
  fresh[key] = cache[key];
  passage.vector = fresh[key];
}
writeFileSync(CACHE, '{\n' + Object.entries(fresh).map(([k, v]) => `"${k}":${JSON.stringify(v)}`).join(',\n') + '\n}\n');
writeFileSync(join(DIST, 'search-index.json'), JSON.stringify({
  model: 'ielabgroup/Starbucks-msmarco (2 layers, 32 dims)',
  threshold: DENSE_THRESHOLD,
  docs: passages,
}));
const pages = new Set(passages.map((p) => `${p.lang}:${p.url}`)).size;
console.log(`[search] ${passages.length} passages from ${pages} pages: ${encoded} encoded, ${passages.length - encoded} from cache`);
