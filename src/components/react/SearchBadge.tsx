import type { ModelStatus } from './useHybridSearch';
import type { SearchMode } from '../../lib/search/hybrid.ts';
import { DENSE_THRESHOLD } from '../../lib/search/encoder.ts';

const MODEL_URL = 'https://huggingface.co/ielabgroup/Starbucks-msmarco';
const TEXT = {
  en: { hybrid: 'BM25 + Starbucks-msmarco · 2 layers · 32 dims', loading: 'BM25 · loading Starbucks…', lexical: 'BM25 only', about: `Hybrid search: BM25 fused with a 2-layer, 32-dim cut of Starbucks-msmarco (semantic matches need ≥ ${DENSE_THRESHOLD})` },
  zh: { hybrid: 'BM25 + Starbucks-msmarco · 2 层 · 32 维', loading: 'BM25 · 正在加载 Starbucks…', lexical: '仅 BM25', about: `混合检索：BM25 融合 Starbucks-msmarco 的 2 层 32 维模型（语义分 ≥ ${DENSE_THRESHOLD} 才计入）` },
};

/** Which ranking is active; links to the Starbucks model on HuggingFace. */
export default function SearchBadge({ mode, model, lang }: { mode: SearchMode; model: ModelStatus; lang: 'en' | 'zh' }) {
  const text = TEXT[lang];
  const label = mode === 'hybrid' ? text.hybrid : model === 'loading' ? text.loading : text.lexical;
  return (
    <a href={MODEL_URL} target="_blank" rel="noopener" title={text.about}
      className="mono inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-[var(--muted)] hover:text-[var(--teal)]">
      <span className={`h-1.5 w-1.5 rounded-full ${mode === 'hybrid' ? 'bg-[var(--teal)] shadow-[0_0_8px_var(--teal)]' : model === 'loading' ? 'animate-pulse bg-[var(--plum)]' : 'bg-[var(--muted)]'}`} />
      {label} ↗
    </a>
  );
}
