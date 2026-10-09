import { useEffect, useMemo, useState } from 'react';
import CopyButton from './CopyButton';

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
  topics: Record<string, string>;
}

const normalise = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

export default function PublicationExplorer({ items, labels, self = 'Shuai Wang' }: { items: ExplorerItem[]; labels: ExplorerLabels; self?: string }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [year, setYear] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') ?? '');
    setTopic(params.get('topic') ?? 'all');
    setYear(params.get('year') ?? 'all');
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (topic !== 'all') params.set('topic', topic);
    if (year !== 'all') params.set('year', year);
    const search = params.toString();
    window.history.replaceState(null, '', search ? `?${search}` : window.location.pathname);
  }, [query, topic, year]);

  const haystacks = useMemo(
    () => items.map((item) => normalise([item.title, item.authors.join(' '), item.venue, item.abstract, labels.topics[item.topic] ?? ''].join(' '))),
    [items, labels.topics],
  );
  const years = useMemo(() => [...new Set(items.map((i) => i.year))].sort((a, b) => b - a), [items]);
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) counts[item.topic] = (counts[item.topic] ?? 0) + 1;
    return counts;
  }, [items]);

  const terms = normalise(query).split(/\s+/).filter(Boolean);
  const visible = items.filter((item, i) =>
    (topic === 'all' || item.topic === topic) &&
    (year === 'all' || String(item.year) === year) &&
    terms.every((term) => haystacks[i].includes(term)),
  );
  const filtered = terms.length > 0 || topic !== 'all' || year !== 'all';
  const groups = years
    .map((y) => ({ year: y, items: visible.filter((item) => item.year === y) }))
    .filter((group) => group.items.length);

  return (
    <div>
      <div className="glass sticky top-3 z-10 flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <label className="flex flex-1 items-center gap-3 rounded-full border border-line bg-[var(--bg)] px-4">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[var(--muted)]" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span className="sr-only">{labels.search}</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={labels.search} className="h-10 w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--muted)]" type="search" />
        </label>
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
        <span className="label ml-auto" aria-live="polite">
          {(filtered ? labels.matching : labels.count).replace('{n}', String(visible.length))}
          {filtered && <button type="button" className="ml-3 underline" onClick={() => { setQuery(''); setTopic('all'); setYear('all'); }}>{labels.reset}</button>}
        </span>
      </div>

      {groups.length === 0 && <p className="glass mt-8 p-10 text-center text-[var(--muted)]">{labels.empty}</p>}

      {groups.map((group) => (
        <section key={group.year} className="mt-10 grid gap-4 md:grid-cols-[88px_1fr]">
          <h2 className="serif text-3xl text-[var(--muted)] md:sticky md:top-24 md:self-start">{group.year}</h2>
          <ol className="glass px-6">
            {group.items.map((item) => (
              <li key={item.url} className="border-b border-line py-5 last:border-b-0">
                <p className="label flex flex-wrap gap-x-2">
                  <span className="text-[var(--ink)]">{item.venueLabel}</span>
                  {item.type && <><span aria-hidden="true">·</span><span>{item.type}</span></>}
                  <span aria-hidden="true">·</span><span className="text-[var(--plum)]">{labels.topics[item.topic]}</span>
                  {item.cited ? <><span aria-hidden="true">·</span><span>{labels.cited.replace('{n}', String(item.cited))}</span></> : null}
                </p>
                <h3 className="serif mt-1 text-[21px] leading-snug"><a href={item.url} className="hover:text-[var(--teal)]">{item.title}</a></h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {item.authors.map((name, i) => (
                    <span key={i}>{i > 0 && ', '}{name.replace(/\*$/, '') === self ? <strong className="font-semibold text-[var(--ink)]">{name}</strong> : name}</span>
                  ))}
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
