/** Authors from a citation string like "A, B and C. 2026. Title. Venue." */
export function parseAuthors(citation: string): string[] {
  const match = citation.match(/^(.*?)\.\s*\(?(19|20)\d{2}\)?[.,]/);
  if (!match) return [];
  return match[1]
    .split(/,\s*(?:and\s+)?|\s+and\s+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export interface BibtexInput {
  slug: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  url?: string;
}

export function buildBibtex({ slug, title, authors, venue, year, url }: BibtexInput): string {
  const firstSurname = (authors[0] ?? 'wang').split(/\s+/).pop()!.toLowerCase().replace(/[^a-z]/g, '');
  const firstWord = title.toLowerCase().match(/[a-z0-9]+/g)?.find((w) => w.length > 3) ?? slug;
  const key = `${firstSurname}${year}${firstWord}`;
  const isPreprint = /arxiv|preprint/i.test(venue);
  const isJournal = /journal|transactions|tois|jasist|information processing/i.test(venue);
  const type = isPreprint ? 'misc' : isJournal ? 'article' : 'inproceedings';
  const venueField = isPreprint ? 'howpublished' : isJournal ? 'journal' : 'booktitle';
  const fields: [string, string | undefined][] = [
    ['title', `{${title}}`],
    ['author', authors.map((name) => name.replace(/\*$/, '')).join(' and ')],
    [venueField, venue],
    ['year', String(year)],
    ['url', url],
  ];
  const body = fields
    .filter(([, value]) => value)
    .map(([name, value]) => `  ${name} = {${value}}`)
    .join(',\n');
  return `@${type}{${key},\n${body}\n}`;
}
