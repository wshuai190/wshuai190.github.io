import { useCallback, useEffect, useRef, useState } from 'react';
import { t, type Lang } from '../../i18n/ui';

interface Result {
  url: string;
  title: string;
  excerpt: string;
  type?: string;
}

interface Pagefind {
  search: (term: string, options?: object) => Promise<{ results: { data: () => Promise<any> }[] }>;
  options?: (opts: object) => Promise<void>;
}

let pagefindPromise: Promise<Pagefind | null> | null = null;
function loadPagefind(): Promise<Pagefind | null> {
  // The path is built at runtime so Vite does not try to bundle the generated index.
  const path = ['', 'pagefind', 'pagefind.js'].join('/');
  pagefindPromise ??= import(/* @vite-ignore */ path).catch(() => null);
  return pagefindPromise;
}

const TYPE_LABEL: Record<string, Record<Lang, string>> = {
  paper: { en: 'Paper', zh: '论文' },
  project: { en: 'Project', zh: '项目' },
  teaching: { en: 'Teaching', zh: '教学' },
  talk: { en: 'Talk', zh: '报告' },
  award: { en: 'Award', zh: '奖项' },
  page: { en: 'Page', zh: '页面' },
};

export default function SearchPalette({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'unavailable'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    const onClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('[data-open-search]')) setOpen(true);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([]);
      return;
    }
    const id = ++requestId.current;
    setStatus('loading');
    const timer = window.setTimeout(async () => {
      const pagefind = await loadPagefind();
      if (!pagefind) {
        setStatus('unavailable');
        return;
      }
      const search = await pagefind.search(query, { filters: { lang } });
      const data = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
      if (id !== requestId.current) return;
      setResults(data.map((d) => ({ url: d.url.replace(/\.html$/, ''), title: d.meta?.title ?? d.url, excerpt: d.excerpt, type: d.meta?.type })));
      setActive(0);
      setStatus('idle');
    }, 120);
    return () => window.clearTimeout(timer);
  }, [query, open, lang]);

  if (!open) return null;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') close();
    else if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (event.key === 'Enter' && results[active]) window.location.href = results[active].url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-label={t(lang, 'nav.search')} className="glass w-full max-w-xl overflow-hidden !bg-[var(--bg-raised)] shadow-2xl" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-line px-5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-muted" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(lang, 'search.placeholder')}
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `search-result-${active}` : undefined}
          />
          <kbd className="mono rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">esc</kbd>
        </div>
        <ul id="search-results" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
          {results.map((result, i) => (
            <li key={result.url} id={`search-result-${i}`} role="option" aria-selected={i === active}>
              <a href={result.url} onMouseEnter={() => setActive(i)} className={`block rounded-xl px-4 py-3 ${i === active ? 'bg-[color-mix(in_srgb,var(--teal)_10%,transparent)]' : ''}`}>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{result.title}</span>
                  {result.type && <span className="tag shrink-0">{TYPE_LABEL[result.type]?.[lang] ?? result.type}</span>}
                </span>
                <span className="mt-1 block text-sm text-muted [&_mark]:bg-transparent [&_mark]:font-semibold [&_mark]:text-[var(--teal)]" dangerouslySetInnerHTML={{ __html: result.excerpt }} />
              </a>
            </li>
          ))}
          {query.trim() && results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted">
              {status === 'loading' ? t(lang, 'search.loading') : status === 'unavailable' ? t(lang, 'search.dev') : t(lang, 'search.empty')}
            </li>
          )}
        </ul>
        <div className="mono border-t border-line px-5 py-2.5 text-[11px] text-muted">↵ {t(lang, 'search.hint')}</div>
      </div>
    </div>
  );
}
