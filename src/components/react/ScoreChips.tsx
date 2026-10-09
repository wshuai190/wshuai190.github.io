import type { SearchResult } from '../../lib/search/hybrid.ts';

/** Min-max normalised BM25 and Starbucks scores and their hybrid; raw scores in the tooltip. */
export default function ScoreChips({ result, hybrid }: { result: SearchResult; hybrid: boolean }) {
  const { lexical, dense, lexicalNorm, denseNorm, score } = result;
  const title = `raw: BM25 ${lexical.toFixed(2)}${hybrid ? ` · Starbucks ${dense.toFixed(1)}` : ''}\nnormalised (min-max over each signal's top 100 per query), hybrid = 0.6·BM25 + 0.4·Starbucks`;
  return (
    <span className="mono inline-flex items-center gap-2 text-[10.5px] tabular-nums text-[var(--muted)]" title={title}>
      <span>BM25 {lexicalNorm.toFixed(2)}</span>
      {hybrid && <span>Starbucks {denseNorm.toFixed(2)}</span>}
      <span className="font-semibold text-[var(--teal)]">{hybrid ? 'hybrid' : 'score'} {score.toFixed(2)}</span>
    </span>
  );
}
