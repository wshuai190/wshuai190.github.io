import { authorsOf, citationsOf, getEntries, getPublications, news, profile, projects, scholar, venueFull } from '@/lib/data';
import { TOPIC_LABELS } from '@/i18n/ui';

/**
 * /llms-full.txt — the whole site as one Markdown document (profile, experience, every paper with
 * its abstract, every project), so AI assistants and answer engines can read and cite it in one fetch.
 */
export async function GET() {
  const site = 'https://shuaiwang.io';
  const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const pubs = await getPublications();
  const talks = await getEntries('talks');
  const awards = await getEntries('awards');
  const teaching = await getEntries('teaching');
  const out: string[] = [];
  const push = (...lines: string[]) => out.push(...lines);

  push(
    '# Dr. Shuai Wang (王率, Dylan) — full profile',
    '',
    `> ${strip(profile.seo.description.en)}`,
    '',
    'This file is a complete, citable summary of https://shuaiwang.io for AI assistants. A short overview is at /llms.txt.',
    '',
    '## Key facts',
    `- Name: Shuai Wang (Chinese: 王率; also known as Dylan Wang)`,
    `- Current role: ${profile.role.en}`,
    `- PhD: The University of Queensland, 2025, supervised by Guido Zuccon, Bevan Koopman and Harrisen Scells`,
    `- Research: search agents, retrievers and rerankers, biomedical evidence search, efficient retrieval-augmented generation (RAG)`,
    `- Publications: ${pubs.length} papers at venues including SIGIR, WSDM, WWW, ECIR, EMNLP, EACL and SIGIR-AP`,
    `- Google Scholar: ${scholar.citations.toLocaleString('en')} citations, h-index ${scholar.h_index}, i10-index ${scholar.i10_index} (updated ${scholar.last_updated})`,
    `- Teaching: Course Coordinator and Lecturer, INFS7410 Information Retrieval and Web Search, UQ`,
    `- Location: Brisbane, Australia`,
    `- Contact: ${profile.email}`,
    `- ORCID: ${profile.orcid}; Google Scholar: ${profile.links.scholar}; Semantic Scholar: ${profile.links.semanticscholar}; GitHub: ${profile.links.github}`,
    '',
    '## Summary',
    strip(profile.summary.en),
    '',
    '## 中文简介',
    strip(profile.summary.zh),
    '',
    '## Research areas',
    ...profile.themes.map((theme: any) => `- **${theme.en.title}** — ${theme.en.body}`),
    '',
    '## Education',
    ...profile.education.map((e: any) => `- ${e.year}: ${e.en.title}, ${e.en.org}`),
    '',
    '## Experience',
    ...profile.experience.map((e: any) => `- ${e.years.en}: ${e.en.title}, ${e.en.org}. ${e.en.detail ?? ''}`.trim()),
    '',
    '## Professional service',
    ...profile.service.roles.map((r: any) => `- ${r.en}`),
    `- Journal reviewing: ${profile.service.journals.map((j: any) => j.en).join('; ')}`,
    `- Programme committees: ${profile.service.conferences.join('; ')}`,
    '',
    '## Teaching and supervision',
    strip(profile.teaching.body.en),
    ...teaching.map((e) => `- ${e.data.date.getUTCFullYear()}: ${e.data.title}`),
    `- ${profile.supervision.role.en}: ${profile.supervision.students.map((s: any) => s.name).join(', ')}`,
    '',
    '## Projects',
  );
  for (const p of projects) {
    push(
      '',
      `### ${p.name}`,
      `- Page: ${site}/research/${p.slug}/`,
      `- Area: ${TOPIC_LABELS[p.topic]?.en} (${p.year})`,
      ...(p.links.code ? [`- Code: ${p.links.code}`] : []),
      ...(p.links.site ? [`- Project site: ${p.links.site}`] : []),
      '',
      p.summary,
    );
  }
  push('', '## Publications (newest first; * = equal contribution)');
  for (const pub of pubs) {
    const year = pub.data.date.getUTCFullYear();
    const cited = citationsOf(pub);
    push(
      '',
      `### ${pub.data.title}`,
      `- Authors: ${authorsOf(pub).join(', ')}`,
      `- Venue: ${venueFull(pub.data.venue, year)}, ${year}`,
      `- Page: ${site}${pub.data.permalink}`,
      ...(pub.data.paperurl ? [`- Paper: ${pub.data.paperurl}`] : []),
      ...(pub.data.doi ? [`- DOI: ${pub.data.doi}`] : []),
      ...(cited ? [`- Google Scholar citations: ${cited}`] : []),
      '',
      strip((pub.body ?? '').replace(/^##\s*Abstract\s*/i, '').replace(/\*\*/g, '')),
    );
  }
  push('', '## Awards', ...awards.map((e) => `- ${e.data.date.getUTCFullYear()}: ${e.data.title}`));
  push('', '## Talks', ...talks.map((e) => `- ${e.data.date.getUTCFullYear()}: ${e.data.title}${e.data.venue ? ` (${e.data.venue})` : ''}`));
  push('', '## Recent news', ...news.slice(0, 15).map((n) => `- ${n.date.toISOString().slice(0, 7)}: ${n.title}${n.description ? ` — ${strip(n.description)}` : ''}`), '');
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
