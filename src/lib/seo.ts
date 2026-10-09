/**
 * schema.org structured data (JSON-LD) for search engines. Person and WebSite describe the
 * site owner on the home page; every paper and project page adds its own item plus breadcrumbs.
 */
import { localePath, TOPIC_LABELS, type Lang } from '../i18n/ui';
import { venueFull } from './data';
import { authorsOf, bibtexOf, profile, pubSlug, scholar, SELF, authorLinks, type Project, type Publication } from './data';

const SITE = 'https://shuaiwang.io';
const abs = (path: string) => new URL(path, SITE).href;
const PERSON_ID = `${SITE}/#person`;

export function personSchema() {
  const seo = profile.seo;
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Shuai Wang',
    alternateName: seo.alternate_names,
    givenName: seo.given_name,
    familyName: seo.family_name,
    honorificPrefix: seo.honorific,
    jobTitle: 'Research Fellow',
    description: seo.description.en.replace(/\s+/g, ' '),
    url: `${SITE}/`,
    image: abs(profile.portrait),
    email: `mailto:${profile.email}`,
    affiliation: {
      '@type': 'Organization',
      name: 'The University of Queensland',
      department: { '@type': 'Organization', name: seo.department, url: profile.links.ielab },
      url: 'https://www.uq.edu.au/',
    },
    alumniOf: seo.alumni_of.map((name: string) => ({ '@type': 'CollegeOrUniversity', name })),
    knowsAbout: seo.knows_about,
    identifier: { '@type': 'PropertyValue', propertyID: 'ORCID', value: profile.orcid },
    sameAs: [
      profile.links.orcid, profile.links.scholar, profile.links.semanticscholar, profile.links.github,
      profile.links.linkedin, profile.links.researchgate, profile.links.twitter,
    ].filter(Boolean),
    interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CitationAction', userInteractionCount: scholar.citations },
  };
}

export function websiteSchema(lang: Lang) {
  return {
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    url: `${SITE}/`,
    name: 'Dr. Shuai Wang',
    alternateName: ['Shuai Wang', '王率', 'shuaiwang.io'],
    inLanguage: ['en', 'zh-CN'],
    description: profile.seo.description[lang].replace(/\s+/g, ' '),
    publisher: { '@id': PERSON_ID },
  };
}

export function breadcrumbs(lang: Lang, trail: [string, string][]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(localePath(lang, path)) })),
  };
}

const plainAbstract = (pub: Publication) => (pub.body ?? '').replace(/^##\s*Abstract\s*/i, '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();

export function articleSchema(pub: Publication, lang: Lang) {
  const isPreprint = /arxiv|preprint/i.test(pub.data.venue);
  const authors = authorsOf(pub).map((raw) => {
    const name = raw.replace(/\*$/, '');
    if (name === SELF) return { '@id': PERSON_ID, '@type': 'Person', name };
    return authorLinks[name] ? { '@type': 'Person', name, url: authorLinks[name] } : { '@type': 'Person', name };
  });
  const sameAs = [pub.data.paperurl, pub.data.doi && `https://doi.org/${pub.data.doi}`, pub.data.arxiv && `https://arxiv.org/abs/${pub.data.arxiv}`].filter(Boolean);
  return {
    '@type': 'ScholarlyArticle',
    '@id': `${abs(pub.data.permalink)}#article`,
    headline: pub.data.title.slice(0, 110),
    name: pub.data.title,
    author: authors,
    datePublished: pub.data.date.toISOString().slice(0, 10),
    abstract: plainAbstract(pub),
    url: abs(localePath(lang, pub.data.permalink)),
    mainEntityOfPage: abs(localePath(lang, pub.data.permalink)),
    inLanguage: 'en',
    image: pub.data.image ? abs(pub.data.image) : undefined,
    isPartOf: pub.data.venue ? { '@type': isPreprint ? 'Periodical' : 'PublicationEvent', name: venueFull(pub.data.venue, pub.data.date.getUTCFullYear()) } : undefined,
    sameAs: [...new Set(sameAs)],
    about: TOPIC_LABELS[pub.data.topic]?.en,
    identifier: pub.data.doi ? { '@type': 'PropertyValue', propertyID: 'DOI', value: pub.data.doi } : undefined,
    encoding: { '@type': 'MediaObject', encodingFormat: 'application/x-bibtex', text: bibtexOf(pub) },
  };
}

export function projectSchema(project: Project, lang: Lang, pubs: Publication[]) {
  const summary = lang === 'zh' ? project.summary_zh : project.summary;
  const papers = pubs.filter((p) => project.papers.includes(pubSlug(p))).map((p) => ({ '@id': `${abs(p.data.permalink)}#article`, '@type': 'ScholarlyArticle', name: p.data.title }));
  return {
    '@type': project.links.code ? 'SoftwareSourceCode' : 'CreativeWork',
    name: project.name,
    description: summary,
    url: abs(localePath(lang, `/research/${project.slug}/`)),
    image: abs(project.image),
    creator: { '@id': PERSON_ID },
    dateCreated: String(project.year),
    codeRepository: project.links.code,
    sameAs: [project.links.site, project.links.code].filter(Boolean),
    subjectOf: papers,
  };
}

/** Wrap one or more schema.org nodes into a JSON-LD document. */
export function jsonLd(...nodes: object[]) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }, (_, v) => (v === undefined ? undefined : v));
}
