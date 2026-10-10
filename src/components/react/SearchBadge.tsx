import type { ModelStatus } from './useHybridSearch';
import { encoderError, type SearchMode } from '../../lib/search/hybrid.ts';
import { DENSE_THRESHOLD } from '../../lib/search/encoder.ts';

const MODEL_URL = 'https://huggingface.co/ielabgroup/Starbucks-msmarco';
const TEXT = {
  en: {
    off: 'Semantic search · Starbucks (15 MB)',
    loading: 'Loading Starbucks…',
    on: 'Semantic: BM25 + Starbucks 2L-32',
    failed: 'Starbucks failed to load · BM25 only',
    about: `Off: BM25 keyword search. On: BM25 fused with a 2-layer, 32-dim cut of Starbucks-msmarco (downloaded once, ~15 MB; semantic matches need ≥ ${DENSE_THRESHOLD}).`,
    model: 'About the model',
  },
  zh: {
    off: '语义搜索 · Starbucks（15 MB）',
    loading: '正在加载 Starbucks…',
    on: '语义：BM25 + Starbucks 2 层',
    failed: 'Starbucks 加载失败 · 仅 BM25',
    about: `关闭：BM25 关键词搜索。开启：BM25 融合 Starbucks-msmarco 的 2 层 32 维模型（只下载一次，约 15 MB；语义分 ≥ ${DENSE_THRESHOLD} 才计入）。`,
    model: '关于模型',
  },
};

/** Switch for semantic (Starbucks) ranking, off by default, with the model state and a link to the model. */
export default function SearchBadge({ mode, model, lang, on, onToggle }: { mode: SearchMode; model: ModelStatus; lang: 'en' | 'zh'; on: boolean; onToggle: (on: boolean) => void }) {
  const text = TEXT[lang];
  const failed = on && model === 'unavailable';
  const ready = on && (mode === 'hybrid' || model === 'ready');
  const label = !on ? text.off : failed ? text.failed : ready ? text.on : text.loading;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        title={failed && encoderError ? `${text.about}\n${encoderError}` : text.about}
        onClick={() => onToggle(!on)}
        className="mono inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
      >
        <span className={`relative h-3.5 w-6 rounded-full transition-colors ${on ? (failed ? 'bg-red-500' : 'bg-[var(--teal)]') : 'bg-[var(--line)]'}`} aria-hidden="true">
          <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--bg)] shadow transition-all ${on ? 'left-3' : 'left-0.5'} ${on && !ready && !failed ? 'animate-pulse' : ''}`} />
        </span>
        {label}
      </button>
      <a href={MODEL_URL} target="_blank" rel="noopener" className="mono text-[11px] text-[var(--muted)] hover:text-[var(--teal)]" title={text.model} aria-label={text.model}>↗</a>
    </span>
  );
}
