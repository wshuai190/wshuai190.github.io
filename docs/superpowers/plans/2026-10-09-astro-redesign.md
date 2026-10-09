# shuaiwang.io Astro Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild shuaiwang.io in Astro with the approved hybrid design, search, and self-updating content, without breaking any existing URL.

**Architecture:** Static Astro 7 site (`build.format: 'preserve'`) with content collections migrated from Jekyll, shared page components rendered for `en` and `zh` routes, React islands for interactive parts, Pagefind for search, and Python stdlib scripts run by GitHub Actions to sync publications/metrics.

**Tech Stack:** Astro 7, React 19, Tailwind CSS 4, Pagefind, @astrojs/sitemap, @astrojs/rss, Python 3.9+ (stdlib, unittest), GitHub Actions.

Spec: `docs/superpowers/specs/2026-10-09-astro-redesign-design.md`

---

## File map

```
astro.config.mjs                 site, build.format, integrations, redirects
package.json                     scripts: dev, build (astro build && pagefind), check
tsconfig.json
src/content.config.ts            zod schemas for publications/teaching/talks/awards
src/content/{publications,teaching,talks,awards}/*.md   migrated content
src/data/{news.yml,projects.yml,scholar_metrics.json,citations.json,github.json,publication_ignore.yml}
src/i18n/{ui.ts,topics.ts}       strings + topic labels, t(lang,key), localePath(lang,path)
src/lib/{content.ts,bibtex.ts,format.ts}   queries, BibTeX builder, date/author formatting
src/styles/global.css            Tailwind import + tokens + base styles
src/layouts/Base.astro           <head>, theme script, Header, Footer, glow
src/components/*.astro           Header, Footer, Hero, StatCards, ProjectCard, PubItem, Section, LinkPills
src/components/react/*.tsx       NewsTicker, HeroSearch, PublicationExplorer, SearchPalette, ThemeToggle, CopyButton
src/views/*.astro                HomeView, ResearchView, ProjectView, PublicationsView, PublicationView,
                                 TeachingView, ArchiveView, EntryView, NewsView, CvView (take lang prop)
src/pages/**                     thin routes: en at root, zh under /zh, each renders a view
src/pages/feed.xml.ts            RSS
public/{images,files,CNAME,...}  static assets
scripts/migrate_content.py       one-off Jekyll → Astro content move (kept for history)
scripts/sync_publications.py     weekly sync (OpenAlex, SerpApi, GitHub)
scripts/fetch_scholar_metrics.py moved output path
scripts/check_urls.py, scripts/legacy_urls.txt, scripts/check_site.py
tests/test_sync_publications.py, tests/test_check_urls.py
.github/workflows/{deploy,validate,update-scholar-metrics,update-publications}.yml
```

## Task 1: Scaffold Astro project

**Files:** Create `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/styles/global.css`, `src/pages/index.astro`

- [ ] Install: `npm i astro@7 @astrojs/react @astrojs/sitemap @astrojs/rss react react-dom tailwindcss @tailwindcss/vite @fontsource/newsreader @fontsource/jetbrains-mono js-yaml` and `npm i -D pagefind @types/react @types/react-dom @astrojs/check typescript`.
- [ ] `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://shuaiwang.io',
  trailingSlash: 'ignore',
  build: { format: 'preserve' },
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  redirects: {
    '/about': '/', '/about.html': '/', '/resume': '/cv/', '/projects': '/research/#projects',
    '/zh/about': '/zh/', '/zh/projects': '/zh/research/#projects',
  },
});
```

- [ ] `package.json` scripts: `"dev": "astro dev"`, `"build": "astro build && pagefind --site dist"`, `"check": "astro check"`.
- [ ] Run `npm run build`; expected: `dist/index.html` exists. Commit `chore: scaffold Astro project`.

## Task 2: Migrate content and assets

**Files:** Create `scripts/migrate_content.py`, `src/content.config.ts`, `src/data/*`; move `_publications`, `_teaching`, `_talks`, `_awards`, `images`, `files`, `CNAME`.

- [ ] `git mv` collections into `src/content/<name>/`, `_data/news.yml` → `src/data/news.yml`, `_data/scholar_metrics.json` → `src/data/`, `images files CNAME` → `public/`.
- [ ] `migrate_content.py` merges `research_projects.yml` + `research_figures.yml` into `src/data/projects.yml` (slug = figure `id`; topic from figure `topic`; links from `project/url`, `code`, `paper`; `papers` = publication slugs whose `paperurl` contains the figure's arXiv id or whose permalink is listed in `research_projects.yml`; `featured: true` for sieve, iter, autobool, cocom) and adds `topic` to each publication matched to a project.
- [ ] `src/content.config.ts` defines `publications` with the schema from the spec (permalink required, `date: z.coerce.date()`, everything else optional, `.passthrough()`), and `teaching`, `talks`, `awards` with `title`, `date`, `permalink`, optional `venue`, `location`, `type`, `excerpt`.
- [ ] Run `npx astro sync`; expected: no schema errors. Commit `content: migrate Jekyll collections`.

## Task 3: URL preservation check (test first)

**Files:** Create `scripts/legacy_urls.txt` (from `_site` of the Jekyll build), `scripts/check_urls.py`, `tests/test_check_urls.py`.

- [ ] Generate legacy list: every `*.html` under the Jekyll `_site` except removed template pages → URL (`x/index.html` → `/x/`, `x.html` → `/x`).
- [ ] Test `resolve(url, dist)` maps `/publication/a` → `dist/publication/a.html`, `/cv/` → `dist/cv/index.html`, and returns None for missing; test `main()` exits 1 when any legacy URL is unresolved.
- [ ] Implement, run `python3 -m unittest tests/test_check_urls.py`; expected PASS. Commit.

## Task 4: Design system, layout, header/footer, theme

**Files:** `src/styles/global.css`, `src/layouts/Base.astro`, `src/components/Header.astro`, `Footer.astro`, `react/ThemeToggle.tsx`, `src/i18n/ui.ts`, `src/i18n/topics.ts`

- [ ] Tokens from the spec as CSS variables on `:root` / `.dark`, mapped into Tailwind with `@theme inline`. Utility classes `.glass`, `.glow`, `.pill`, `.btn`, `.btn-solid`, `.eyebrow`, `.serif`.
- [ ] Inline head script: `const t=localStorage.getItem('theme')??(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'); document.documentElement.classList.toggle('dark',t==='dark')`.
- [ ] Header: brand (Shuai Wang 王率), glass pill nav with active state, ⌘K button, ThemeToggle, language switch computing the mirrored path; mobile menu under 820px.
- [ ] `ui.ts` exports `t(lang, key)` and `localePath(lang, path)`; every visible string on every view goes through it.
- [ ] Build; screenshot `/` in light and dark. Commit.

## Task 5: Home page

**Files:** `src/views/HomeView.astro`, `src/components/{Hero,StatCards,ProjectCard}.astro`, `src/components/react/{NewsTicker,HeroSearch}.tsx`, `src/pages/index.astro`, `src/pages/zh/index.astro`

- [ ] Hero per mockup; pill shows latest news title; stats read `scholar_metrics.json` + publication count.
- [ ] Featured projects (3 cards, `featured`) with links to `/research/<slug>/` and external links.
- [ ] NewsTicker: duplicate the list, CSS `translateY` animation over `n * 3.2s`, `animation-play-state: paused` on hover/focus-within, static under reduced motion; news sorted newest first.
- [ ] HeroSearch: typewriter placeholder (example queries from ielab pattern), submit → `/publications/?q=`.
- [ ] Screenshot light/dark/mobile/zh. Commit.

## Task 6: Research and project detail pages

**Files:** `src/views/{ResearchView,ProjectView}.astro`, `src/pages/research/{index,[slug]/index}.astro` and zh mirrors

- [ ] Research: themes intro, projects grouped by topic (`id="projects"`), background sections migrated from `_pages/research.md` and its zh text.
- [ ] Project detail: figure, summary, highlights, related papers (PubItem), link pills (site/code/demo/paper) and GitHub stars from `github.json`.
- [ ] Commit.

## Task 7: Publications explorer and paper pages

**Files:** `src/views/{PublicationsView,PublicationView}.astro`, `src/components/PubItem.astro`, `src/components/react/{PublicationExplorer,CopyButton}.tsx`, `src/lib/bibtex.ts`, routes `publications/index.astro`, `publication/[slug].astro` (+ zh)

- [ ] `publication/[slug].astro` uses `getStaticPaths` from each entry's `permalink` tail so file output is `publication/<slug>.html`.
- [ ] Explorer gets a serialised list (title, authors, venue, year, topic, type, url, links, bibtex, citations); filters by text/year/topic/type; reads `?q=`/`?topic=`.
- [ ] `bibtex.ts` uses the entry's `bibtex` field when present, else builds `@inproceedings`/`@article`/`@misc` from title, authors (parsed from `citation`), venue, year.
- [ ] Commit.

## Task 8: Teaching, talks, awards, news, CV, 404, RSS

- [ ] Shared `ArchiveView` (list grouped by year) and `EntryView` (single entry) for teaching/talks/awards with permalink-derived routes.
- [ ] `NewsView` timeline, `CvView` from `_pages/cv.md` (moved to `src/content/pages/cv.md` and rendered), `404.astro`, `feed.xml.ts` (publications + news).
- [ ] Run `python3 scripts/check_urls.py`; expected `0 missing`. Commit.

## Task 9: Site search

**Files:** `src/components/react/SearchPalette.tsx`, Base layout `data-pagefind-body` markers

- [ ] Mark main content with `data-pagefind-body`, set `data-pagefind-filter="lang:en|zh"` and `data-pagefind-meta="type:..."`.
- [ ] Palette: opens on ⌘K/Ctrl+K and `/`, lazily `import('/pagefind/pagefind.js')`, debounced search, arrow-key navigation, Enter to open, Esc to close, lang filter.
- [ ] Build, verify `dist/pagefind/` exists and a query for "Boolean" returns AutoBool in a headless test. Commit.

## Task 10: Publication sync script (TDD)

**Files:** `scripts/sync_publications.py`, `tests/test_sync_publications.py`, `tests/fixtures/openalex_works.json`, `src/data/publication_ignore.yml`

Tests (unittest, fixture-based, no network):
- [ ] `norm_title` lowercases, strips punctuation/HTML, collapses spaces.
- [ ] `abstract_from_inverted_index({"Hello":[0],"world":[1]}) == "Hello world"`.
- [ ] `is_known(work, index)` true on matching title, DOI or arXiv id.
- [ ] `render_markdown(work)` produces front matter with `permalink: /publication/<date>-<slug>`, `auto: true`, quoted title, and body `## Abstract`.
- [ ] `plan_changes(works, existing, ignore)` returns only unknown, non-ignored works from ≥2019 with type in article/preprint/proceedings.
- [ ] `add_news(news_yaml_text, work)` appends an item with `auto: true` without reformatting existing items (append-only text).
- [ ] Implement with `urllib`; CLI `--dry-run`; network functions `fetch_openalex(orcid)`, `fetch_scholar_serpapi(user_id)`, `fetch_github_stars(repos)`.
- [ ] `python3 -m unittest discover tests`; PASS. Run `--dry-run` live; expected summary with 0 or more new papers. Commit.

## Task 11: Workflows

- [ ] `deploy.yml`: triggers as today plus `workflow_run` for both update workflows; Node 22, `npm ci`, `npm run build`, `python3 scripts/check_urls.py`, `python3 scripts/check_site.py dist`, upload `dist`, deploy.
- [ ] `update-scholar-metrics.yml`: output path `src/data/scholar_metrics.json`.
- [ ] `update-publications.yml`: weekly, runs sync, commits `src/content/publications src/data`.
- [ ] `validate.yml`: PR build + checks.
- [ ] Commit.

## Task 12: Remove Jekyll, final verification

- [ ] Delete Jekyll-only files listed in the spec; update `README.md` and `AGENTS.md` for the Astro workflow (how to add content, what is automatic).
- [ ] `npm run build && python3 scripts/check_urls.py && python3 scripts/check_site.py dist && python3 -m unittest discover tests`.
- [ ] Screenshots of every top-level page: light, dark, 390px mobile, zh. Fix issues.
- [ ] Commit; hand over for user review before merging to `master`.
