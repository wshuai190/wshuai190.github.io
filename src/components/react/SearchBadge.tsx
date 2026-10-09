import type { ModelStatus } from './useHybridSearch';
import type { SearchMode } from '../../lib/search/hybrid.ts';

const TEXT = {
  en: { hybrid: 'Hybrid · Starbucks 2L-32 + BM25', loading: 'BM25 · loading semantic model…', lexical: 'BM25', about: 'How search works' },
  zh: { hybrid: '混合检索 · Starbucks 2L-32 + BM25', loading: 'BM25 · 正在加载语义模型…', lexical: 'BM25', about: '搜索原理' },
};

/** Shows which ranking is active and links to the Starbucks project that powers it. */
export default function SearchBadge({ mode, model, lang }: { mode: SearchMode; model: ModelStatus; lang: 'en' | 'zh' }) {
  const text = TEXT[lang];
  const label = mode === 'hybrid' ? text.hybrid : model === 'loading' ? text.loading : text.lexical;
  return (
    <a
      href={`${lang === 'zh' ? '/zh' : ''}/research/starbucks/`}
      title={text.about}
      className="mono inline-flex items-center gap-1.5 text-[11px] text-[var(--muted)] hover:text-[var(--teal)]"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${mode === 'hybrid' ? 'bg-[var(--teal)] shadow-[0_0_8px_var(--teal)]' : model === 'loading' ? 'animate-pulse bg-[var(--plum)]' : 'bg-[var(--muted)]'}`} />
      {label}
    </a>
  );
}
