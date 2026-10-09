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
export const scholar = metrics as { citations: number; h_index: number; last_updated: string };
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

/** Short venue label for chips, e.g. "SIGIR 2026" or "arXiv". */
export function venueLabel(venue: string): string {
  if (/arxiv/i.test(venue)) return 'arXiv';
  const match = venue.match(/\b(SIGIR-AP|SIGIR|WSDM|WWW|ECIR|EMNLP|EACL|ACL|CIKM|ICTIR|ADCS|TOIS|TREC|JASIST|IPM)\b/i);
  const year = venue.match(/(20\d{2})/);
  if (match) return `${match[1].toUpperCase()}${year ? ` ${year[1]}` : ''}`;
  return venue.replace(/^Accepted\s+/i, '').replace(/^(Proceedings of the )/i, '').slice(0, 40);
}
