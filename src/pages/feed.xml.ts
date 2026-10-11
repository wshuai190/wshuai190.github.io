import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublications, news, newsAnchor } from '@/lib/data';

/** /feed.xml — new publications and news, newest first (replaces jekyll-feed). */
export async function GET(context: APIContext) {
  const pubs = await getPublications();
  const items = [
    ...pubs.map((pub) => ({
      title: pub.data.title,
      link: pub.data.permalink,
      pubDate: pub.data.date,
      description: `${pub.data.venue}. ${(pub.body ?? '').replace(/^##\s*Abstract\s*/i, '').replace(/\*\*/g, '').slice(0, 400)}`,
      categories: ['publication', pub.data.topic],
    })),
    ...news.map((item) => ({
      title: item.title,
      // Each news item gets its own link (and therefore GUID) so feed readers keep them apart.
      link: item.url?.startsWith('/') ? item.url : `/news/#${newsAnchor(item)}`,
      pubDate: item.date,
      description: item.description ?? item.title,
      categories: ['news'],
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'Dr. Shuai Wang',
    description: 'Publications and news from Shuai Wang, Research Fellow at The University of Queensland.',
    site: context.site!,
    trailingSlash: false, // publication pages live at /publication/<slug> (no trailing slash)
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: '<language>en</language><atom:link href="https://shuaiwang.io/feed.xml" rel="self" type="application/rss+xml" />',
    items: items.slice(0, 50),
  });
}
