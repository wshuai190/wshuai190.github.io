import { authorsOf, getPublications, profile, projects, scholar, venueLabel } from '@/lib/data';
import { TOPIC_LABELS } from '@/i18n/ui';

/** /llms.txt — a Markdown overview of the site for AI assistants and AI search (llmstxt.org). */
export async function GET() {
  const site = 'https://shuaiwang.io';
  const pubs = await getPublications();
  const strip = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const lines = [
    '# Dr. Shuai Wang (王率, Dylan)',
    '',
    `> ${strip(profile.seo.description.en)}`,
    '',
    `Research Fellow at ielab, The University of Queensland (Brisbane, Australia). ${scholar.citations.toLocaleString('en')} citations, h-index ${scholar.h_index} on Google Scholar. ORCID ${profile.orcid}. Contact: ${profile.email}.`,
    '',
    '## Research areas',
    ...profile.themes.map((theme: any) => `- **${theme.en.title}**: ${theme.en.body}`),
    '',
    '## Pages',
    `- [Home](${site}/): overview, selected work and news`,
    `- [Research](${site}/research/): research themes, projects, education, experience and service`,
    `- [Publications](${site}/publications/): all ${pubs.length} papers with abstracts and BibTeX`,
    `- [Teaching](${site}/teaching/): INFS7410 Information Retrieval and Web Search, PhD supervision`,
    `- [CV](${site}/cv/)`,
    `- [About me](${site}/about/): the person behind the papers (grand strategy games, xianxia novels, renovation videos)`,
    `- [Chinese version](${site}/zh/)`,
    `- [Full text for AI assistants](${site}/llms-full.txt): profile, experience, every project and every paper with its abstract`,
    '',
    '## Projects',
    ...projects.map((p) => `- [${p.name}](${site}/research/${p.slug}/) (${TOPIC_LABELS[p.topic]?.en}, ${p.year}): ${p.summary}${p.links.code ? ` Code: ${p.links.code}` : ''}`),
    '',
    '## Publications',
    ...pubs.map((pub) => {
      const authors = authorsOf(pub).map((a) => a.replace(/\*$/, '')).join(', ');
      return `- [${pub.data.title}](${site}${pub.data.permalink}) — ${authors}. ${venueLabel(pub.data.venue, pub.data.date.getUTCFullYear())}.`;
    }),
    '',
    '## Profiles',
    ...[
      ['Google Scholar', profile.links.scholar],
      ['Semantic Scholar', profile.links.semanticscholar],
      ['ORCID', profile.links.orcid],
      ['GitHub', profile.links.github],
      ['LinkedIn', profile.links.linkedin],
    ].map(([name, url]) => `- [${name}](${url})`),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
