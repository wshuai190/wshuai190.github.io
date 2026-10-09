import { load as parseYaml } from 'js-yaml';
import { getCollection, type CollectionEntry } from 'astro:content';
import newsRaw from '../data/news.yml?raw';
import projectsRaw from '../data/projects.yml?raw';
import profileRaw from '../data/profile.yml?raw';
import metrics from '../data/scholar_metrics.json';
import citations from '../data/citations.json';
import github from '../data/github.json';
import { buildBibtex, parseAuthors } from './bibtex';

export type Publication = CollectionEntry<'publications'>;

export interface NewsItem {
  title: string;
  title_zh?: string;
  date: Date;
  url?: string;
  description?: string;
  description_zh?: string;
  status?: string;
  auto?: boolean;
}

export interface Project {
  slug: string;
  name: string;
  topic: string;
  year: number;
  summary: string;
  summary_zh: string;
  image: string;
  figure_caption?: string;
  figure_source?: string;
  links: { site?: string; code?: string; demo?: string; paper?: string };
  papers: string[];
  featured: boolean;
  highlights?: string[];
  highlights_zh?: string[];
}

export const profile = parseYaml(profileRaw) as any;
export const scholar = metrics as { citations: number; h_index: number; i10_index: number; last_updated: string };
const citationCounts = citations as Record<string, number>;
const githubStars = github as Record<string, number>;

export const news: NewsItem[] = (parseYaml(newsRaw) as NewsItem[])
  .map((item) => ({ ...item, date: new Date(item.date) }))
  .sort((a, b) => b.date.getTime() - a.date.getTime());

export const projects: Project[] = parseYaml(projectsRaw) as Project[];

export function pubSlug(pub: Publication): string {
  return pub.data.permalink.split('/').pop()!;
}

export async function getPublications(): Promise<Publication[]> {
  const pubs = await getCollection('publications');
  return pubs.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getEntries(name: 'teaching' | 'talks' | 'awards') {
  const entries = await getCollection(name);
  return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function entrySlug(entry: { data: { permalink: string } }): string {
  return entry.data.permalink.split('/').pop()!;
}

export function authorsOf(pub: Publication): string[] {
  return pub.data.authors ?? parseAuthors(pub.data.citation ?? '');
}

export const SELF = 'Shuai Wang';

/** 'first' when listed first, 'cofirst' when marked with an equal-contribution asterisk. */
export function authorship(authors: string[]): 'first' | 'cofirst' | undefined {
  const index = authors.findIndex((name) => name.replace(/\*$/, '') === SELF);
  if (index < 0) return undefined;
  if (authors[index].endsWith('*')) return 'cofirst';
  return index === 0 ? 'first' : undefined;
}

export function bibtexOf(pub: Publication): string {
  return pub.data.bibtex ?? buildBibtex({
    slug: pubSlug(pub),
    title: pub.data.title,
    authors: authorsOf(pub),
    venue: pub.data.venue,
    year: pub.data.date.getUTCFullYear(),
    url: pub.data.paperurl,
  });
}

export function citationsOf(pub: Publication): number | undefined {
  return citationCounts[pubSlug(pub)];
}

export function starsOf(repoUrl?: string): number | undefined {
  if (!repoUrl) return undefined;
  const key = repoUrl.replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
  return githubStars[key];
}

export function projectsForPaper(slug: string): Project[] {
  return projects.filter((p) => p.papers.includes(slug));
}

const VENUE_NAMES: [RegExp, string][] = [
  [/web search and data mining/i, 'WSDM'],
  [/intelligent systems with applications/i, 'ISWA'],
];

/** Short venue label for chips, e.g. "SIGIR 2026" or "arXiv". Falls back to the publication year. */
export function venueLabel(venue: string, fallbackYear?: number): string {
  if (/arxiv/i.test(venue)) return 'arXiv';
  const year = venue.match(/(20\d{2})/)?.[1] ?? fallbackYear;
  // Also matches "SIGIR-2026", "ECIR2026" and "SIGIR-AP-2023".
  const acronym = venue.match(/\b(SIGIR-AP|SIGIR|WSDM|WWW|ECIR|EMNLP|EACL|ACL|CIKM|ICTIR|ADCS|TOIS|TREC|JASIST|IPM)(?=\b|-?\d)/i)?.[1]
    ?? VENUE_NAMES.find(([pattern]) => pattern.test(venue))?.[1];
  if (acronym) return `${acronym.toUpperCase()}${year ? ` ${year}` : ''}`;
  return venue.replace(/^Accepted\s+/i, '').replace(/^Proceedings of the /i, '').slice(0, 40);
}
