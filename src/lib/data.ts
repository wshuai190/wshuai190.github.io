import { load as parseYaml } from 'js-yaml';
import { getCollection, type CollectionEntry } from 'astro:content';
import newsRaw from '../data/news.yml?raw';
import projectsRaw from '../data/projects.yml?raw';
import profileRaw from '../data/profile.yml?raw';
import authorsRaw from '../data/authors.yml?raw';
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

/** Co-author name → personal homepage (src/data/authors.yml). */
export const authorLinks = (parseYaml(authorsRaw) ?? {}) as Record<string, string>;

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
  // Checked before the acronym list: SIGIR-sponsored venues (SIGIR-AP, ICTIR) must not become SIGIR.
  [/SIGIR[- ]AP\b|SIGIR Asia[- ]Pacific/i, 'SIGIR-AP'],
  [/\bICTIR\b|Theory of Information Retrieval/i, 'ICTIR'],
  [/web search and data mining/i, 'WSDM'],
  [/intelligent systems with applications/i, 'ISWA'],
];

/** Short venue label for chips, e.g. "SIGIR 2026" or "arXiv". Falls back to the publication year. */
export function venueLabel(venue: string, fallbackYear?: number): string {
  if (/arxiv/i.test(venue)) return 'arXiv';
  const year = venue.match(/(20\d{2})/)?.[1] ?? fallbackYear;
  // Also matches "SIGIR-2026", "ECIR2026" and "SIGIR-AP-2023".
  const acronym = VENUE_NAMES.find(([pattern]) => pattern.test(venue))?.[1]
    ?? venue.match(/\b(SIGIR|WSDM|WWW|ECIR|EMNLP|EACL|ACL|CIKM|ICTIR|ADCS|TOIS|TREC|JASIST|IPM)(?=\b|-?\d)/i)?.[1];
  if (acronym) return `${acronym.toUpperCase()}${year ? ` ${year}` : ''}`;
  return venue.replace(/^Accepted\s+/i, '').replace(/^Proceedings of the /i, '').slice(0, 40);
}

const VENUE_FULL: Record<string, string> = {
  'SIGIR-AP': 'Annual International ACM SIGIR Conference on Research and Development in Information Retrieval in the Asia Pacific Region',
  SIGIR: 'International ACM SIGIR Conference on Research and Development in Information Retrieval',
  WSDM: 'ACM International Conference on Web Search and Data Mining',
  WWW: 'ACM Web Conference',
  ECIR: 'European Conference on Information Retrieval',
  EMNLP: 'Conference on Empirical Methods in Natural Language Processing',
  EACL: 'Conference of the European Chapter of the Association for Computational Linguistics',
  ICTIR: 'ACM SIGIR International Conference on the Theory of Information Retrieval',
  ADCS: 'Australasian Document Computing Symposium',
  TREC: 'Text REtrieval Conference',
  ISWA: 'Intelligent Systems with Applications',
};

/**
 * Full venue name for citation metadata. Venues already written out in the data are kept as
 * they are; short forms like "SIGIR-2024" become "International ACM SIGIR Conference … (SIGIR 2024)".
 */
export function venueFull(venue: string, year: number): string {
  const original = venue.replace(/^Accepted\s+/i, '').trim();
  if (original.split(/\s+/).length >= 4 && /[a-z]{3}/.test(original)) return original;
  const label = venueLabel(venue, year);
  const acronym = label.split(' ')[0];
  return VENUE_FULL[acronym] ? `${VENUE_FULL[acronym]} (${label})` : original;
}
