import { useEffect, useMemo, useState } from 'react';
import CopyButton from './CopyButton';
import SearchBadge from './SearchBadge';
import ScoreChips from './ScoreChips';
import { useHybridSearch, useSemanticPreference } from './useHybridSearch';

export interface ExplorerItem {
  url: string;
  title: string;
  authors: string[];
  venue: string;
  venueLabel: string;
  year: number;
  topic: string;
  type?: string;
  abstract: string;
  links: { label: string; href: string }[];
  bibtex: string;
  cited?: number;
  role?: 'first' | 'cofirst';
}

export interface ExplorerLabels {
  search: string;
  all: string;
  allYears: string;
  count: string;
  matching: string;
  empty: string;
  reset: string;
  cited: string;
  bibtex: string;
  copied: string;
  first: string;
  cofirst: string;
  leading: string;
  closest: string;
  trySemantic: string;
  trySemanticButton: string;
  topics: Record<string, string>;
}

const PAPERS: ['paper'] = ['paper'];

export default function PublicationExplorer({ items, labels, lang, authorLinks = {}, self = 'Shuai Wang' }: { items: ExplorerItem[]; labels: ExplorerLabels; lang: 'en' | 'zh'; authorLinks?: Record<string, string>; self?: string }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [year, setYear] = useState('all');
  const [leading, setLeading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') ?? '');
    setTopic(params.get('topic') ?? 'all');
    setYear(params.get('year') ?? 'all');
    setLeading(params.get('lead') === '1');
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (topic !== 'all') params.set('topic', topic);
    if (year !== 'all') params.set('year', year);
    if (leading) params.set('lead', '1');
    const search = params.toString();
    window.history.replaceState(null, '', search ? `?${search}` : window.location.pathname);
  }, [query, topic, year, leading]);

  const [semantic, setSemantic] = useSemanticPreference();
  const { results: ranked, mode, model } = useHybridSearch(query, true, PAPERS, lang, semantic);
  // Relevance order for the current query (results already passed the BM25 / Starbucks cutoff).
  const relevance = useMemo(
    () => (ranked ? new Map(ranked.slice(0, 20).map((r, i) => [r.doc.url, { rank: i, result: r }])) : null),
    [ranked],
  );
  const years = useMemo(() => [...new Set(items.map((i) => i.year))].sort((a, b) => b - a), [items]);
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) counts[item.topic] = (counts[item.topic] ?? 0) + 1;
    return counts;
  }, [items]);

  const searching = query.trim().length > 0;
  const enPath = (url: string) => url.replace(/^\/zh(?=\/)/, '');
  const visible = items
    .filter((item) =>
      (topic === 'all' || item.topic === topic) &&
      (year === 'all' || String(item.year) === year) &&
      (!leading || Boolean(item.role)) &&
      (!searching || (relevance?.has(enPath(item.url)) ?? false)))
    .sort((a, b) => (searching && relevance ? relevance.get(enPath(a.url))!.rank - relevance.get(enPath(b.url))!.rank : 0));
  const filtered = searching || topic !== 'all' || year !== 'all' || leading;
  // While searching, show one list in relevance order; otherwise group by year.
  const groups = searching
    ? (visible.length ? [{ year: 0, items: visible }] : [])
    : years.map((y) => ({ year: y, items: visible.filter((item) => item.year === y) })).filter((group) => group.items.length);

  return (
    <div>
      <div className="glass sticky top-3 z-10 flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <label className="flex flex-1 items-center gap-3 rounded-full border border-line bg-[var(--bg)] px-4">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[var(--muted)]" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span className="sr-only">{labels.search}</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={labels.search} className="h-10 w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--muted)]" type="search" />
        </label>
        <div className="px-2 md:order-last"><SearchBadge mode={mode} model={model} lang={lang} on={semantic} onToggle={setSemantic} /></div>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="h-10 rounded-full border border-line bg-[var(--bg)] px-4 text-sm" aria-label={labels.allYears}>
          <option value="all">{labels.allYears}</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group">
        <button type="button" className="chip" aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>{labels.all} <span className="mono text-[11px] opacity-60">{items.length}</span></button>
        {Object.entries(labels.topics).map(([key, label]) => (
          <button key={key} type="button" className="chip" aria-pressed={topic === key} onClick={() => setTopic(topic === key ? 'all' : key)}>
            {label} <span className="mono text-[11px] opacity-60">{topicCounts[key] ?? 0}</span>
          </button>
        ))}
        <button type="button" className="chip" aria-pressed={leading} onClick={() => setLeading((v) => !v)}>★ {labels.leading} <span className="mono text-[11px] opacity-60">{items.filter((i) => i.role).length}</span></button>
        <span className="label ml-auto" aria-live="polite">
          {(filtered ? labels.matching : labels.count).replace('{n}', String(visible.length))}
          {filtered && <button type="button" className="ml-3 underline" onClick={() => { setQuery(''); setTopic('all'); setYear('all'); setLeading(false); }}>{labels.reset}</button>}
        </span>
      </div>

      {groups.length === 0 && (
        <div className="glass mt-8 p-10 text-center text-[var(--muted)]">
          {searching && !semantic ? (
            <>
              <p>{labels.trySemantic}</p>
              <button type="button" className="link-pill mx-auto mt-4 flex" onClick={() => setSemantic(true)}>{labels.trySemanticButton}</button>
            </>
          ) : <p>{labels.empty}</p>}
        </div>
      )}
      {searching && ranked?.[0]?.relaxed && groups.length > 0 && <p className="label mt-8">{labels.closest}</p>}

      {groups.map((group) => (
        <section key={group.year} className="mt-10 grid gap-4 md:grid-cols-[88px_1fr]">
          <h2 className="serif text-3xl text-[var(--muted)] md:sticky md:top-24 md:self-start">{group.year || '↓'}</h2>
          <ol className="glass px-6">
            {group.items.map((item) => (
              <li key={item.url} className="border-b border-line py-5 last:border-b-0">
                <p className="label flex flex-wrap gap-x-2">
                  <span className="text-[var(--ink)]">{item.venueLabel}</span>
                  {item.type && <><span aria-hidden="true">·</span><span>{item.type}</span></>}
                  <span aria-hidden="true">·</span><span className="text-[var(--plum)]">{labels.topics[item.topic]}</span>
                  {item.cited ? <><span aria-hidden="true">·</span><span>{labels.cited.replace('{n}', String(item.cited))}</span></> : null}
                  {item.role && <span className="rounded-full border border-[color-mix(in_srgb,var(--teal)_40%,transparent)] px-2 py-px text-[var(--teal)]">{item.role === 'first' ? labels.first : labels.cofirst}</span>}
                  {searching && relevance?.get(enPath(item.url)) && (
                    <span className="ml-auto normal-case tracking-normal"><ScoreChips result={relevance.get(enPath(item.url))!.result} hybrid={mode === 'hybrid'} /></span>
                  )}
                </p>
                <h3 className="serif mt-1 text-[21px] leading-snug"><a href={item.url} className="hover:text-[var(--teal)]">{item.title}</a></h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {item.authors.map((raw, i) => {
                    const name = raw.replace(/\*$/, '');
                    const href = authorLinks[name];
                    return (
                      <span key={i}>
                        {i > 0 && ', '}
                        {name === self ? <strong className="font-semibold text-[var(--ink)]">{name}</strong>
                          : href ? <a href={href} target="_blank" rel="noopener" className="underline decoration-[var(--line)] underline-offset-2 hover:text-[var(--teal)] hover:decoration-current">{name}</a>
                          : name}
                        {raw.endsWith('*') && <sup className="text-[var(--teal)]">*</sup>}
                      </span>
                    );
                  })}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.links.map((link) => (
                    <a key={link.href} className="link-pill" href={link.href} target={link.href.startsWith('/') ? undefined : '_blank'} rel="noopener">{link.label} <span aria-hidden="true">↗</span></a>
                  ))}
                  <CopyButton text={item.bibtex} label={labels.bibtex} done={labels.copied} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
