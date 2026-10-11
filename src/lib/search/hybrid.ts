import { DENSE_CEILING, DENSE_THRESHOLD, Encoder, MODEL_FILE, VOCAB_FILE } from './encoder.ts';
import { WordPiece } from './wordpiece.ts';

/**
 * Hybrid site search: BM25 over titles, metadata and text, interpolated with Starbucks 2L-32
 * dense scores after per-query min-max normalisation of each over all passages:
 *   score = 0.6 · minmax(BM25) + 0.4 · minmax(Starbucks)
 * Thresholds (see rank) only decide which passages are returned, not their scores. A result needs a BM25 match or a dense score ≥ τ. BM25 results
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
/** score = hybrid score; lexicalNorm/denseNorm = min-max normalised BM25/Starbucks; lexical/dense = raw scores. */
export interface SearchResult { doc: SearchDoc; score: number; lexical: number; dense: number; lexicalNorm: number; denseNorm: number; relaxed?: boolean }
export interface LexicalScores { scores: number[]; coverage: number[] }

const STOPWORDS = new Set('a an and are as at be by can do does for from how i in is it of on or that the to was what when which who why with my me you'.split(' '));
const K1 = 1.2;
const B = 0.75;
/** Interpolation weight of the Starbucks score (BM25 gets 1 − this); 0.2–0.5 perform the same on tests/search_queries.json. */
const WEIGHT_DENSE = 0.4;
/** A keyword match must cover at least this share of the query's total idf weight. */
const MIN_COVERAGE = 0.4;
/** A passage with any keyword hit also counts if its Starbucks score reaches this. */
const DENSE_AGREEMENT = 16;
/** How BM25 and Starbucks scores are normalised before interpolation. */
const NORMALIZATION: 'minmax' | 'fixed' = 'minmax';
/** Min-max is computed over each signal's top-k passages (scores below the k-th become 0). */
const NORM_TOP_K = Infinity; // top-100 lowered R@3 from 0.983 to 0.934 on the query suite
/** Minimum hybrid score for a passage to be shown (after the relevance gate below). */
const MIN_HYBRID = 0.4;
/**
 * Fallback when nothing passes the normal cutoffs: return up to RELAXED_LIMIT "closest matches"
 * with a lower hybrid score, a partial keyword match or a lower Starbucks score.
 */
const RELAXED = { minHybrid: 0.3, minCoverage: 0.25, threshold: 17 };
export const RELAXED_LIMIT = 3;

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

  /**
   * BM25 score per document, plus the share of the query's idf weight each document matches.
   * A last word still being typed ("rerank") also matches the index words it starts ("reranker").
   */
  scores(query: string): LexicalScores {
    const terms = [...new Set(lexicalTokens(query))];
    const groups = terms.map((term) => [term]);
    const last = terms[terms.length - 1];
    if (last && /^[a-z]{3,}$/.test(last) && !/\s$/.test(query) && !this.df.has(last)) {
      const expansions = [...this.df.keys()].filter((t) => t.startsWith(last));
      if (expansions.length) groups[groups.length - 1] = expansions;
    }
    // A group's weight is its most common member's idf, so a prefix never outweighs a full word.
    const groupIdf = groups.map((group) => Math.min(...group.map((t) => this.idf(t))));
    const totalIdf = groupIdf.reduce((a, b) => a + b, 0);
    const scores: number[] = [];
    const coverage: number[] = [];
    this.tf.forEach((counts, i) => {
      let score = 0;
      let matchedIdf = 0;
      groups.forEach((group, g) => {
        let best = 0;
        for (const term of group) {
          const tf = counts.get(term);
          if (!tf) continue;
          best = Math.max(best, this.idf(term) * (tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * this.lengths[i]) / this.avgLength)));
        }
        if (best > 0) { score += best; matchedIdf += groupIdf[g]; }
      });
      scores.push(score);
      coverage.push(totalIdf > 0 ? matchedIdf / totalIdf : 0);
    });
    return { scores, coverage };
  }
}

/** The k-th highest value (the minimum of the top-k list); with k = Infinity, the overall minimum. */
function kthBest(values: number[], k: number): number {
  if (!Number.isFinite(k) || k >= values.length) return Math.min(...values);
  return [...values].sort((a, b) => b - a)[k - 1];
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
/** Why the encoder could not load, shown in the search badge. */
export let encoderError = '';
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
      encoderError = error instanceof Error ? error.message : String(error);
      console.warn('Starbucks could not load; search uses BM25 only.', error);
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
export async function search(query: string, options: { types?: SearchDoc['type'][]; lang?: 'en' | 'zh'; limit?: number; semantic?: boolean } = {}) {
  const { docs, bm25 } = await loadIndex();
  const lexical = lexicalFor(bm25, query, docs);
  const useDense = options.semantic !== false && encoderReady && query.trim();
  const queryVector = useDense ? await encoderReady!.embed(translateZh(query)) : null;
  const results = bestPerPage(rank(docs, lexical, queryVector))
    .filter((r) => (!options.types || options.types.includes(r.doc.type)) && (r.doc.lang === 'en' || options.lang === 'zh'));
  return { mode: (queryVector ? 'hybrid' : 'lexical') as SearchMode, results: results.slice(0, options.limit ?? results.length) };
}

/** Common Chinese research terms → the English words used in the papers (longest first). */
const ZH_TERMS: [string, string][] = Object.entries({
  检索增强生成: 'retrieval augmented generation', 系统综述: 'systematic review', 系统评价: 'systematic review',
  布尔查询: 'boolean query', 查询生成: 'query generation', 查询扩展: 'query expansion', 稠密检索: 'dense retrieval',
  稀疏检索: 'sparse retrieval', 重排序: 'rerank reranker', 排序器: 'ranker', 大语言模型: 'large language model llm',
  大模型: 'llm', 语言模型: 'language model', 搜索智能体: 'search agent', 智能体: 'agent', 深度研究: 'deep research',
  提示注入: 'prompt injection', 生物医学: 'biomedical', 医学: 'medical', 筛选: 'screening', 文献: 'literature',
  嵌入: 'embedding', 向量: 'embedding', 压缩: 'compression', 上下文: 'context', 分块: 'chunking', 切分: 'segmentation',
  记忆: 'memory', 复现: 'reproducibility', 可复现: 'reproducibility', 评测: 'evaluation', 评估: 'evaluation',
  强化学习: 'reinforcement learning', 推理: 'reasoning', 词干: 'stemming', 主题词: 'mesh term', 种子研究: 'seed studies',
  信息检索: 'information retrieval', 检索: 'retrieval', 搜索: 'search', 排序: 'ranking', 生成: 'generation', 查询: 'query',
  套娃: 'matryoshka', 高效: 'efficient', 教学: 'teaching', 课程: 'course',
}).sort((a, b) => b[0].length - a[0].length);

export function translateZh(query: string): string {
  if (!/\p{Script=Han}/u.test(query)) return query;
  let out = query;
  for (const [zh, en] of ZH_TERMS) out = out.split(zh).join(` ${en} `);
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * BM25 for a query. Papers are indexed in English, so for a Chinese query each passage is scored
 * in its own language: Chinese passages with the query as typed, English ones with its English
 * rendering (raw Chinese character matches would otherwise swamp the English scores).
 */
export function lexicalFor(bm25: Bm25, query: string, docs: SearchDoc[]): LexicalScores {
  const english = translateZh(query);
  if (english === query) return bm25.scores(query);
  const zh = bm25.scores(query);
  const en = bm25.scores(english);
  const pick = (i: number) => (docs[i].lang === 'zh' ? zh : en);
  // Rare Chinese character bigrams get far higher idf than common English words; give both groups
  // the same top score so min-max normalisation treats them alike.
  const top = (lang: string) => Math.max(0, ...docs.map((d, i) => (d.lang === lang ? pick(i).scores[i] : 0)));
  const [topZh, topEn] = [top('zh'), top('en')];
  const target = Math.max(topZh, topEn);
  const factor = (i: number) => {
    const groupTop = docs[i].lang === 'zh' ? topZh : topEn;
    return groupTop > 0 ? target / groupTop : 1;
  };
  return { scores: docs.map((_, i) => pick(i).scores[i] * factor(i)), coverage: docs.map((_, i) => pick(i).coverage[i]) };
}

type RankOptions = Parameters<typeof rankWith>[3];

/**
 * Rank with the normal cutoffs; if no passage passes them, retry once with relaxed cutoffs and
 * return the best few pages marked `relaxed`, so semantic queries still get an answer.
 */
export function rank(docs: SearchDoc[], lexical: LexicalScores, queryVector: number[] | null, options: RankOptions = {}): SearchResult[] {
  const strict = rankWith(docs, lexical, queryVector, options);
  if (strict.length || !queryVector) return strict;
  const relaxed = rankWith(docs, lexical, queryVector, { ...options, ...RELAXED });
  return bestPerPage(relaxed).slice(0, RELAXED_LIMIT).map((r) => ({ ...r, relaxed: true }));
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
  const cjk = doc.text.match(/\p{Script=Han}[\p{Script=Han}\p{L}\p{N}]{3,9}/u)?.[0];
  const phrase = start >= 0 ? words.slice(start, start + 4).join(' ') : cjk;
  const fragment = phrase ? `:~:text=${encodeURIComponent(phrase).replace(/-/g, '%2D')}` : '';
  const hash = `${doc.anchor ?? ''}${fragment}`;
  return hash ? `${base}#${hash}` : base;
}

/**
 * 1. Min-max normalise BM25 and Starbucks per query over each signal's top-NORM_TOP_K; 2. interpolate into the hybrid score
 * (1 − α)·BM25 + α·Starbucks; 3. keep passages with hybrid ≥ MIN_HYBRID that also pass the
 * relevance gate on raw scores: a keyword match covering ≥ MIN_COVERAGE of the query's idf
 * weight, a Starbucks score ≥ τ, or a keyword hit plus Starbucks ≥ DENSE_AGREEMENT. The gate is
 * needed because min-max is relative: every query, even an off-topic one, has a passage at 1.
 */
function rankWith(
  docs: SearchDoc[],
  { scores: lexical, coverage }: LexicalScores,
  queryVector: number[] | null,
  { threshold = DENSE_THRESHOLD, ceiling = DENSE_CEILING, minCoverage = MIN_COVERAGE, weightDense = WEIGHT_DENSE, agreement = DENSE_AGREEMENT, normalization = NORMALIZATION as 'minmax' | 'fixed', minHybrid = MIN_HYBRID, rawCutoffs = true, normK = NORM_TOP_K } = {},
): SearchResult[] {
  const dense = queryVector ? docs.map((d) => d.vector.reduce((sum, v, i) => sum + v * queryVector[i], 0)) : docs.map(() => 0);
  // minmax: per-query min-max on both signals over all passages. fixed: BM25/max and
  // Starbucks clamped to [threshold, ceiling].
  const nl = normalization === 'minmax' ? scale(lexical, kthBest(lexical, normK)) : scale(lexical, 0);
  const nd = !queryVector ? dense : normalization === 'minmax' ? scale(dense, kthBest(dense, normK)) : scale(dense, threshold, ceiling);
  return docs
    .map((doc, i) => ({ doc, lexical: lexical[i], dense: dense[i], lexicalNorm: nl[i], denseNorm: queryVector ? nd[i] : 0, keyword: lexical[i] > 0 && coverage[i] >= minCoverage, score: queryVector ? (1 - weightDense) * nl[i] + weightDense * nd[i] : nl[i] }))
    // Strong keyword match, strong semantic match, or weaker evidence from both signals together.
    .filter((r) => r.score >= minHybrid && (!rawCutoffs || r.keyword || (queryVector !== null && (r.dense >= threshold || (r.lexical > 0 && r.dense >= agreement)))))
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
