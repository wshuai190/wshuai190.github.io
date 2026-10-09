// Site-search regression test: runs the exact ranking code used in the browser
// (src/lib/search) on dist/search-index.json and fails if quality drops.
// Usage: npm run build && node scripts/eval_search.mjs [--verbose]
import { readFileSync } from 'node:fs';
import * as ort from 'onnxruntime-web';
import { WordPiece } from '../src/lib/search/wordpiece.ts';
import { Encoder, MODEL_FILE, VOCAB_FILE } from '../src/lib/search/encoder.ts';
import { Bm25, bestPerPage, bm25Text, rank } from '../src/lib/search/hybrid.ts';

const verbose = process.argv.includes('--verbose');
const BARS = {
  known_item: { mrr: 0.9, r3: 0.85 },
  natural_language: { mrr: 0.85, r3: 0.8 },
  paraphrase: { mrr: 0.6, r3: 0.6 },
  robustness: { mrr: 0.85, r3: 0.5 },
  chinese_projects: { mrr: 0.75, r3: 0.5 },
};
const MAX_OFF_TOPIC_RESULTS = 2;

ort.env.wasm.numThreads = 1;
const encoder = new Encoder(
  ort,
  await ort.InferenceSession.create(readFileSync(`public${MODEL_FILE}`)),
  new WordPiece(readFileSync(`public${VOCAB_FILE}`, 'utf8')),
);
const { docs } = JSON.parse(readFileSync('dist/search-index.json', 'utf8'));
const suite = JSON.parse(readFileSync('tests/search_queries.json', 'utf8'));
const corpus = (type) => {
  const subset = docs.filter((d) => d.type === type && (type === 'project' || d.lang === 'en'));
  return { subset, bm25: new Bm25(subset.map(bm25Text)) };
};
const papers = corpus('paper');
const projectsCorpus = corpus('project');
const slugOf = (url) => url.replace(/\/$/, '').split('/').pop();

let failed = false;
const report = (name, ok, line) => {
  if (!ok) failed = true;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(17)} ${line}`);
};

for (const [category, bar] of Object.entries(BARS)) {
  const { subset, bm25 } = category === 'chinese_projects' ? projectsCorpus : papers;
  let mrr = 0;
  let r3 = 0;
  for (const { q, relevant } of suite[category]) {
    const results = bestPerPage(rank(subset, bm25.scores(q), await encoder.embed(q)));
    const slugs = results.map((r) => slugOf(r.doc.url));
    const first = slugs.slice(0, 10).findIndex((s) => relevant.includes(s));
    const reciprocal = first < 0 ? 0 : 1 / (first + 1);
    mrr += reciprocal;
    r3 += slugs.slice(0, 3).filter((s) => relevant.includes(s)).length / Math.min(3, relevant.length);
    if (verbose || reciprocal < 0.5) {
      console.log(`      ${reciprocal < 0.5 ? '!' : ' '} "${q}" → ${results.slice(0, 3).map((r) => `${slugOf(r.doc.url)} (hybrid ${r.score.toFixed(2)}, raw ${r.lexical.toFixed(1)}/${r.dense.toFixed(1)})`).join(', ') || 'no results'}`);
    }
  }
  const n = suite[category].length;
  report(category, mrr / n >= bar.mrr && r3 / n >= bar.r3, `MRR@10 ${(mrr / n).toFixed(3)} (≥ ${bar.mrr})  R@3 ${(r3 / n).toFixed(3)} (≥ ${bar.r3})  n=${n}`);
}

const offTopic = [];
const allBm25 = new Bm25(docs.map(bm25Text));
for (const q of suite.off_topic) offTopic.push([q, bestPerPage(rank(docs, allBm25.scores(q), await encoder.embed(q))).length]);
const worst = Math.max(...offTopic.map(([, n]) => n));
report('off_topic', worst <= MAX_OFF_TOPIC_RESULTS, `max ${worst} results (≤ ${MAX_OFF_TOPIC_RESULTS})  ${offTopic.map(([q, n]) => `${q}: ${n}`).join(' · ')}`);

process.exit(failed ? 1 : 0);
