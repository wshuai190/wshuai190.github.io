import { useCallback, useEffect, useRef, useState } from 'react';
import { t, type Lang } from '../../i18n/ui';
import { passageLink, snippet } from '../../lib/search/hybrid.ts';
import { useHybridSearch, useSemanticPreference } from './useHybridSearch';
import SearchBadge from './SearchBadge';
import ScoreChips from './ScoreChips';

const TYPE_LABEL: Record<string, Record<Lang, string>> = {
  paper: { en: 'Paper', zh: '论文' },
  page: { en: 'Page', zh: '页面' },
  project: { en: 'Project', zh: '项目' },
  news: { en: 'News', zh: '动态' },
  teaching: { en: 'Teaching', zh: '教学' },
  talk: { en: 'Talk', zh: '报告' },
  award: { en: 'Award', zh: '奖项' },
};


/** ⌘K / "/" dialog: hybrid BM25 + Starbucks search over papers, projects, news and more. */
export default function SearchPalette({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [semantic, setSemantic] = useSemanticPreference();
  const { results, mode, model } = useHybridSearch(query, open, undefined, lang, semantic);
  const shown = (results ?? []).slice(0, 8);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
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

  useEffect(() => setActive(0), [results]);

  if (!open) return null;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') close();
    else if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => Math.min(i + 1, shown.length - 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (event.key === 'Enter' && shown[active]) window.location.href = passageLink(shown[active].doc, lang);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-label={t(lang, 'nav.search')} className="glass w-full max-w-xl overflow-hidden !bg-[var(--bg-raised)] shadow-2xl" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-line px-5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[var(--muted)]" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(lang, 'search.placeholder')}
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--muted)]"
            aria-controls="search-results"
            aria-activedescendant={shown[active] ? `search-result-${active}` : undefined}
          />
          <kbd className="mono rounded border border-line px-1.5 py-0.5 text-[11px] text-[var(--muted)]">esc</kbd>
        </div>
        <ul id="search-results" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
          {shown[0]?.relaxed && <li className="label px-4 pb-1 pt-2" role="presentation">{t(lang, 'search.closest')}</li>}
          {shown.map((result, i) => { const { doc } = result; return (
            <li key={doc.url + doc.title} id={`search-result-${i}`} role="option" aria-selected={i === active}>
              <a href={passageLink(doc, lang)} onMouseEnter={() => setActive(i)} className={`block rounded-xl px-4 py-3 ${i === active ? 'bg-[color-mix(in_srgb,var(--teal)_10%,transparent)]' : ''}`}>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{doc.title}{doc.section && <span className="font-normal text-[var(--muted)]"> › {doc.section}</span>}</span>
                  <span className="tag shrink-0">{TYPE_LABEL[doc.type]?.[lang] ?? doc.type}</span>
                </span>
                <span className="mt-0.5 flex items-baseline justify-between gap-3">
                  <span />
                  <span className="shrink-0"><ScoreChips result={result} hybrid={mode === 'hybrid'} /></span>
                </span>
                <span className="mt-1 block text-sm text-[var(--muted)] [&_mark]:bg-transparent [&_mark]:font-semibold [&_mark]:text-[var(--teal)]" dangerouslySetInnerHTML={{ __html: snippet(doc.text, query) }} />
              </a>
            </li>
          ); })}
          {query.trim() && results && shown.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-[var(--muted)]">
              {semantic ? t(lang, 'search.empty') : (
                <>
                  {t(lang, 'search.trySemantic')}
                  <button type="button" className="link-pill mx-auto mt-3 flex" onClick={() => setSemantic(true)}>{t(lang, 'search.trySemanticButton')}</button>
                </>
              )}
            </li>
          )}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-2.5">
          <span className="mono text-[11px] text-[var(--muted)]">↵ {t(lang, 'search.hint')}</span>
          <SearchBadge mode={mode} model={model} lang={lang} on={semantic} onToggle={setSemantic} />
        </div>
      </div>
    </div>
  );
}
