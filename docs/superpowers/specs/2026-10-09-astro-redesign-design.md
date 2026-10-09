# shuaiwang.io — Astro redesign

Date: 2026-10-09 · Branch: `astro-redesign`

## Goal

Replace the Jekyll/Academic Pages site with an Astro site that looks like the approved
"hybrid" mockup (editorial serif + teal/plum in light mode, glass/glow tech look in dark
mode), reorganises the information architecture, adds site search, and keeps itself up to
date automatically so new papers, news and metrics need no manual edits.

## Non-goals

- No server, CMS or database. The site stays static on GitHub Pages.
- No change to the domain (`shuaiwang.io`) or to any public URL that exists today.
- No translation of paper content into Chinese; `/zh/` translates UI and hand-written prose.

## Stack

- Astro 7, static output, `build.format: 'preserve'` so `src/pages/publication/x.astro`
  emits `publication/x.html` (served at `/publication/x`, as today) while `cv/index.astro`
  emits `cv/index.html` (served at `/cv/`).
- React 19 islands only where interaction is needed. Everything else is zero-JS Astro.
- Tailwind CSS 4 via `@tailwindcss/vite`, with design tokens as CSS variables.
- Pagefind for the site search index, generated after `astro build`.
- `@astrojs/sitemap` and `@astrojs/rss` replace jekyll-sitemap and jekyll-feed (`/feed.xml`).
- Fonts are self-hosted: Manrope (existing woff2), Newsreader and JetBrains Mono (@fontsource).

## Information architecture

Navigation: Home · Research · Publications · Teaching · CV, plus theme toggle, 中文/EN and
⌘K search. Talks, Awards and News live in the footer.

| Route | Content |
|---|---|
| `/` | Hero (pill with latest news, serif headline, bio, CTAs, portrait), hero search box, stat cards (citations, h-index, papers, highlight), Selected work (featured projects), News ticker |
| `/research/` | Research themes; projects grouped by theme as cards; background (education, industry, service) |
| `/research/<slug>/` | Project detail: figure, summary, highlights, related papers, links (project site, code, demo, paper), BibTeX copy, GitHub stars |
| `/publications/` | Publication explorer (search, year, topic, venue type, `?q=` prefill) |
| `/publication/<slug>` | Paper page: metadata, abstract, links, citation count, copy BibTeX |
| `/teaching/`, `/teaching/<slug>` | Courses |
| `/talks/`, `/talks/<slug>`, `/awards/`, `/awards/<slug>` | Archives |
| `/news/` | Full news timeline |
| `/cv/` | CV (content migrated from `_pages/cv.md`), link to PDF thesis |
| `/zh/...` | Chinese mirror of every route above |
| `/feed.xml`, `/sitemap-index.xml`, `/404.html` | Feeds and errors |

Redirects (static HTML redirects): `/about/`, `/about.html` → `/`; `/resume` → `/cv/`;
`/projects/` → `/research/#projects`.

Removed: `/markdown/`, `/non-menu-page/`, `/terms/`, `/categories/`, `/tags/`,
`/collection-archive/`, `/talkmap.html`, MathJax (no content uses math), comment/share config.

## Content model

```
src/content/publications/*.md   moved from _publications (front matter kept; slug = permalink tail)
src/content/teaching/*.md       moved from _teaching
src/content/talks/*.md          moved from _talks
src/content/awards/*.md         moved from _awards
src/data/news.yml               moved from _data/news.yml
src/data/projects.yml           merge of research_projects.yml + research_figures.yml
src/data/scholar_metrics.json   moved from _data (daily workflow writes here)
src/data/citations.json         per-paper citation counts (weekly workflow)
src/data/github.json            stars for project repositories (weekly workflow)
src/data/publication_ignore.yml titles/ids the sync must never add
src/i18n/{en,zh}.ts             UI strings and Chinese prose
public/                         images/, files/, CNAME, favicon
```

Publication front matter (zod schema): `title`, `date`, `venue`, `page_type`, `paperurl`,
`citation`, `permalink` (required, kept verbatim) and optional `topic`, `image`, `code`,
`demo`, `project`, `doi`, `arxiv`, `openalex`, `bibtex`, `featured`, `auto`. The body holds
the abstract. Unknown legacy fields (`collection`, `excerpt`) are tolerated.

Project entry: `slug`, `name`, `topic`, `year`, `summary`, `summary_zh`, `image`,
`figure_caption`, `links` (`site`, `code`, `demo`, `paper`), `papers` (publication slugs),
`featured`, optional `highlights`/`highlights_zh`.

Topics (shared by projects, publications and filters): `agents`, `evidence`, `rag`,
`retrieval`, `robustness`, each with an English and Chinese label.

## Design system

Tokens follow the approved hybrid mockup (`/tmp/sw-mockups/d-hybrid.html`).

- Light: bg `#faf8f4`, ink `#1b1d1c`, muted `#6b6f6c`, teal `#0f766e`, plum `#8a3b62`.
- Dark: bg `#080a0e`, ink `#e9ecf1`, muted `#8d95a3`, teal `#5eead4`, plum `#c4a1ff`.
- Headlines Newsreader (serif, italic gradient emphasis); body Manrope; labels JetBrains Mono.
- Glass surfaces (translucent gradient, 1px hairline, 18px radius, backdrop blur), soft radial
  glow behind the hero, hover lift with teal glow on cards.
- Theme: `class="dark"` on `<html>`, chosen from localStorage then `prefers-color-scheme`,
  set by an inline script before paint (no flash).
- All motion respects `prefers-reduced-motion`.
- Responsive down to 360px; nav collapses to a menu button under 820px.

## Interactive islands (React)

- `NewsTicker` — vertical, continuously scrolling list (4 visible), seamless loop, pauses on
  hover/focus, static list under reduced motion, link to `/news/`.
- `HeroSearch` — input with a typewriter placeholder cycling example queries; submit goes to
  `/publications/?q=`.
- `PublicationExplorer` — text search across title/authors/venue/abstract, year, topic and
  type chips, result count, empty state, `?q=` and `?topic=` prefill, copy BibTeX per item.
- `SearchPalette` — ⌘K / `/` dialog backed by Pagefind; searches papers, projects, teaching,
  talks, awards and news in the current language; keyboard navigable.
- `ThemeToggle`, `CopyButton`.

## Automation

| Workflow | Schedule | Does |
|---|---|---|
| `deploy.yml` | push to `master`, after either update workflow, manual | `npm ci`, `astro build`, Pagefind, link/URL checks, deploy to Pages |
| `update-scholar-metrics.yml` | daily 06:00 UTC (unchanged) | writes `src/data/scholar_metrics.json` |
| `update-publications.yml` | weekly Mon 04:00 Brisbane | `scripts/sync_publications.py`: new papers, citations, news, GitHub stars |
| `validate.yml` | pull requests | build + checks, no deploy |

`scripts/sync_publications.py` (standard library only, Python ≥3.9):

1. Fetch works for ORCID `0000-0002-0726-5250` from OpenAlex (polite pool via
   `OPENALEX_MAILTO`); optionally cross-check against the Scholar profile via SerpApi when
   `SERPAPI_KEY` is set (existing secret).
2. Drop types that are not papers, works before 2019, and anything in `publication_ignore.yml`.
3. Match against existing publications by normalised title, DOI and arXiv id. Existing
   entries are never rewritten; only `citations.json` is updated for them.
4. For each new work, write `src/content/publications/<date>-<slug>.md` with `auto: true`,
   permalink `/publication/<date>-<slug>`, authors, venue, abstract (rebuilt from OpenAlex's
   inverted index), links and a generated BibTeX entry; add a `news.yml` item
   (`auto: true`, "New paper: …").
5. Fetch stargazer counts for every `links.code` GitHub repository into `github.json`.
6. Exit 0 with a summary; the workflow commits only if files changed. New papers publish
   directly; hand-editing an auto file is the way to correct it.

## Validation

- `npm run build` must pass with no warnings from content schemas.
- `scripts/check_urls.py`: every URL in the current Jekyll `_site` sitemap (captured into
  `scripts/legacy_urls.txt`) resolves to a file in `dist/` or a redirect.
- `scripts/check_site.py` adapted to `dist/`: no broken internal links or assets.
- `scripts/sync_publications.py --dry-run` runs against the live APIs without writing.
- Visual check: headless Chrome screenshots of every top-level page in light, dark, mobile
  and `/zh/`.

## Rollout

Develop on `astro-redesign` in the sibling worktree; preview with `npm run dev`
(`localhost:4321`) while Jekyll keeps serving `localhost:4000`. On approval, merge to
`master`; the merge deletes Jekyll files (`_config.yml`, `_layouts`, `_includes`, `_sass`,
`Gemfile*`, `vendor`, `markdown_generator`, `talkmap*`) and swaps the deploy workflow.
The pre-migration state is preserved on `redesign-snapshot`.
