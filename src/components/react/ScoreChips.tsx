import { DENSE_THRESHOLD } from '../../lib/search/encoder.ts';

/** Raw ranking signals for one result: BM25 and the Starbucks dot product (greyed below the threshold). */
export default function ScoreChips({ lexical, dense, hybrid }: { lexical: number; dense: number; hybrid: boolean }) {
  const semantic = hybrid && dense >= DENSE_THRESHOLD;
  return (
    <span className="mono inline-flex items-center gap-2 text-[10.5px] tabular-nums text-[var(--muted)]" title={`Starbucks counts from ${DENSE_THRESHOLD}`}>
      <span className={lexical > 0 ? 'text-[var(--ink)]' : 'opacity-50'}>BM25 {lexical.toFixed(2)}</span>
      {hybrid && <span className={semantic ? 'text-[var(--teal)]' : 'opacity-50'}>Starbucks {dense.toFixed(1)}</span>}
    </span>
  );
}
