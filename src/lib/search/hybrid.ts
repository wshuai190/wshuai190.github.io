import { Encoder, MODEL_FILE, VOCAB_FILE } from './encoder.ts';
import { WordPiece } from './wordpiece.ts';
import type { SearchDoc } from '../../pages/search-index.json';

/**
 * Hybrid site search: BM25 over titles, metadata and text, fused with Starbucks 2L-32
 * dense scores (0.5 · min-max(BM25) + 0.5 · min-max(dense)). BM25 results are available
 * immediately; dense scores join once the ~15 MB model has loaded in the browser.
 */

export type { SearchDoc };
export type SearchMode = 'lexical' | 'hybrid';
export interface SearchResult { doc: SearchDoc; score: number; lexical: number; dense: number }

const STOPWORDS = new Set('a an and are as at be by can do does for from how i in is it of on or that the to was what when which who why with my me you'.split(' '));
const K1 = 1.2;
const B = 0.75;
const WEIGHT_DENSE = 0.5;

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

class Bm25 {
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

  scores(query: string): number[] {
    const n = this.tf.length;
    const terms = [...new Set(lexicalTokens(query))];
    return this.tf.map((counts, i) => terms.reduce((sum, term) => {
      const tf = counts.get(term);
      if (!tf) return sum;
      const df = this.df.get(term)!;
      const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
      return sum + idf * (tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * this.lengths[i]) / this.avgLength));
    }, 0));
  }
}

function minMax(values: number[]): number[] {
  const min = Math.min(...values);
  const range = Math.max(...values) - min;
  return range > 0 ? values.map((v) => (v - min) / range) : values.map(() => 0);
}

let indexPromise: Promise<{ docs: SearchDoc[]; bm25: Bm25 }> | null = null;
export function loadIndex() {
  indexPromise ??= fetch('/search-index.json')
    .then((r) => r.json())
    .then(({ docs }: { docs: SearchDoc[] }) => ({ docs, bm25: new Bm25(docs.map((d) => `${d.title} ${d.title} ${d.titleZh ?? ''} ${d.meta} ${d.text} ${d.textZh ?? ''}`)) }));
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

/** Rank documents for `query`. Uses dense scores only when the model is already loaded. */
export async function search(query: string, options: { types?: SearchDoc['type'][]; limit?: number } = {}) {
  const { docs, bm25 } = await loadIndex();
  const lexical = bm25.scores(query);
  let dense = docs.map(() => 0);
  let mode: SearchMode = 'lexical';
  if (encoderReady && query.trim()) {
    const q = await encoderReady.embed(query);
    dense = docs.map((d) => d.vector.reduce((sum, v, i) => sum + v * q[i], 0));
    mode = 'hybrid';
  }
  const nl = minMax(lexical);
  const nd = minMax(dense);
  const results: SearchResult[] = docs
    .map((doc, i) => ({ doc, lexical: lexical[i], dense: dense[i], score: mode === 'hybrid' ? (1 - WEIGHT_DENSE) * nl[i] + WEIGHT_DENSE * nd[i] : nl[i] }))
    .filter((r) => (!options.types || options.types.includes(r.doc.type)) && (mode === 'hybrid' || r.lexical > 0))
    .sort((a, b) => b.score - a.score);
  return { mode, results: results.slice(0, options.limit ?? results.length) };
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
