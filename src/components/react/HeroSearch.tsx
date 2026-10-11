import { useEffect, useRef, useState } from 'react';
import { passageLink, snippet } from '../../lib/search/hybrid.ts';
import { useHybridSearch, useSemanticPreference } from './useHybridSearch';
import ScoreChips from './ScoreChips';
import SearchBadge from './SearchBadge';

interface Props {
  action: string;
  label: string;
  button: string;
  examples: string[];
  lang: 'en' | 'zh';
}

/**
 * Home-page search: typewriter placeholder, live hybrid results (BM25 + Starbucks) in a
 * dropdown, Enter opens the full ranked list on the Publications page. Focusing the box
 * starts loading the Starbucks model so semantic ranking is ready by the time you type.
 */
export default function HeroSearch({ action, label, button, examples, lang }: Props) {
  const [placeholder, setPlaceholder] = useState(examples[0] ?? '');
  const [value, setValue] = useState('');
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const focused = useRef(false);
  const exampleIndex = useRef(0);
  const [semantic, setSemantic] = useSemanticPreference();
  const { results, mode, model } = useHybridSearch(value, active, undefined, lang, semantic);
  const shown = (results ?? []).slice(0, 5);
  const expanded = open && Boolean(value.trim() && results);

  useEffect(() => setHighlight(-1), [results]);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let example = 0, chars = 0, deleting = false, timer = 0;
    const tick = () => {
      if (!(focused.current && value)) {
        const text = examples[example];
        chars += deleting ? -1 : 1;
        setPlaceholder(text.slice(0, chars));
        let delay = deleting ? 22 : 48;
        if (!deleting && chars === text.length) { deleting = true; delay = 2200; }
        else if (deleting && chars === 0) { deleting = false; example = (example + 1) % examples.length; exampleIndex.current = example; delay = 350; }
        timer = window.setTimeout(tick, delay);
      } else {
        timer = window.setTimeout(tick, 400);
      }
    };
    timer = window.setTimeout(tick, 900);
    return () => window.clearTimeout(timer);
  }, [examples, value]);

  return (
    <div
      className="relative"
      onFocus={() => setOpen(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}
    >
      <form
        action={action}
        method="get"
        role="search"
        className="glass flex items-center gap-2 !rounded-full p-1.5 pl-5 transition-shadow focus-within:shadow-[var(--lift)]"
        onSubmit={(event) => {
          if (!value.trim()) {
            event.preventDefault();
            // Search the whole example sentence, not the half-typed placeholder.
            window.location.href = `${action}?q=${encodeURIComponent(examples[exampleIndex.current] ?? '')}`;
          } else if (expanded && shown[highlight]) {
            event.preventDefault();
            window.location.href = passageLink(shown[highlight].doc, lang);
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-[var(--muted)]" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <label className="sr-only" htmlFor="hero-q">{label}</label>
        <input
          id="hero-q"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => { focused.current = true; setActive(true); }}
          onBlur={() => { focused.current = false; }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { if (expanded) setOpen(false); else setValue(''); }
            else if (e.key === 'ArrowDown' && shown.length) { e.preventDefault(); setOpen(true); setHighlight((i) => Math.min(i + 1, shown.length - 1)); }
            else if (e.key === 'ArrowUp' && shown.length) { e.preventDefault(); setHighlight((i) => Math.max(i - 1, -1)); }
          }}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={expanded ? 'hero-results' : undefined}
          aria-expanded={expanded}
          aria-activedescendant={expanded && shown[highlight] ? `hero-result-${highlight}` : undefined}
          className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--muted)]"
        />
        <button type="submit" className="btn btn-solid !py-2">{button}</button>
      </form>
      {expanded && (
        // Keep focus in the input while clicking inside the dropdown (Safari doesn't focus links on click).
        <div className="glass absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden !bg-[var(--bg-raised)] shadow-2xl" onMouseDown={(e) => e.preventDefault()}>
          <ul id="hero-results" role="listbox" aria-label={label} className="max-h-[50vh] overflow-y-auto p-2">
            {shown[0]?.relaxed && <li role="presentation" className="mono px-4 pb-1 pt-2 text-[11px] uppercase tracking-wide text-[var(--muted)]">{lang === 'zh' ? '没有很匹配的结果 · 最接近的结果' : 'No strong matches — closest results'}</li>}
            {shown.map((result, i) => { const { doc } = result; return (
              <li key={doc.url + (doc.section ?? '')} role="presentation">
                <a id={`hero-result-${i}`} role="option" aria-selected={i === highlight} tabIndex={-1} href={passageLink(doc, lang)} onMouseEnter={() => setHighlight(i)} className={`block rounded-xl px-4 py-2.5 ${i === highlight ? 'bg-[color-mix(in_srgb,var(--teal)_10%,transparent)]' : ''}`}>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[15px] font-semibold">{doc.title}{doc.section && <span className="font-normal text-[var(--muted)]"> › {doc.section}</span>}</span>
                    <span className="shrink-0"><ScoreChips result={result} hybrid={mode === 'hybrid'} /></span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[13px] text-[var(--muted)] [&_mark]:bg-transparent [&_mark]:font-semibold [&_mark]:text-[var(--teal)]" dangerouslySetInnerHTML={{ __html: snippet(doc.text, value) }} />
                </a>
              </li>
            ); })}
            {shown.length === 0 && (
              <li role="presentation" className="px-4 py-4 text-sm text-[var(--muted)]">
                {semantic ? (lang === 'zh' ? '没有结果' : 'No results') : (
                  <>
                    {lang === 'zh' ? '没有关键词匹配的结果。试试按语义搜索？' : 'No keyword matches. Search by meaning instead?'}
                    <button type="button" className="link-pill ml-2" onMouseDown={(e) => e.preventDefault()} onClick={() => setSemantic(true)}>{lang === 'zh' ? '开启语义搜索' : 'Turn on semantic search'}</button>
                  </>
                )}
              </li>
            )}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-2">
            <span className="mono text-[11px] text-[var(--muted)]">↵ {lang === 'zh' ? '查看全部论文结果' : 'all matching papers'}</span>
            <SearchBadge mode={mode} model={model} lang={lang} on={semantic} onToggle={setSemantic} />
          </div>
        </div>
      )}
    </div>
  );
}
