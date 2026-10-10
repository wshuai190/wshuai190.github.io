# shuaiwang.io

Personal academic site of Dr. Shuai Wang (王率), built with [Astro](https://astro.build) and
deployed to GitHub Pages at <https://shuaiwang.io>. English pages live at `/`, Chinese at `/zh/`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site + hybrid search index in dist/
npx astro preview  # serve dist/
```

Node 22+ is required.

## What updates itself

The **Update papers and metrics** workflow runs daily (06:00 UTC) with one SerpApi request to the
Google Scholar profile and then rebuilds the site:

- citation metrics (`src/data/scholar_metrics.json`) and per-paper citation counts (`src/data/citations.json`)
- **new papers** from this year or last year that the site does not list yet: a page in
  `src/content/publications/` marked `auto: true`, enriched from arXiv/OpenAlex, plus a "New paper" news item
- GitHub stars for every linked repository (`src/data/github.json`)

Google Scholar decides which papers are mine (OpenAlex's ORCID attribution includes other people
named Shuai Wang). To stop a Scholar entry from being added, list it in
`src/data/publication_ignore.yml`. Auto-added pages can be edited like any other.

Secrets: `SERPAPI_KEY` (required). Optional repository variable `OPENALEX_MAILTO`.

## Site search

⌘K search, the home search box and the Publications search use BM25 by default. A **semantic search**
switch (off by default, remembered per browser) downloads the model once and turns on **hybrid retrieval with score
fusion**: `0.6 · minmax(BM25) + 0.4 · minmax(Starbucks)` (per-query min-max over all passages),
where Starbucks is the dot product from a 2-layer, 32-dim cut of
[ielabgroup/Starbucks-msmarco](https://huggingface.co/ielabgroup/Starbucks-msmarco)
(`public/models/starbucks-2l-32`: first 2 layers, first 10k vocabulary rows, CLS[:32], int8,
~15 MB gzipped).

- **Index**: after `astro build`, `scripts/build_search_index.mjs` splits every content page
  (papers incl. abstracts, projects, Research, Teaching, News, talks, awards) into ~120-word
  passages per heading and links each result to its passage (`#anchor` + `#:~:text=`).
  List pages that repeat other pages (home, Publications, CV) are not indexed.
- **No re-encoding**: vectors are cached in `src/data/search-embeddings.json` by content hash;
  a build only encodes new or changed passages (new papers from the daily sync included).
- **Pipeline**: min-max normalise BM25 and Starbucks per query →
  hybrid = 0.6·BM25 + 0.4·Starbucks → show passages with hybrid ≥ 0.4 that pass a relevance gate on raw scores (keyword match
  covering ≥ 40% of the query's idf weight, Starbucks ≥ 20, or a keyword hit plus Starbucks ≥ 16;
  needed because min-max is relative per query). If nothing passes, up to 3 "closest matches"
  are shown using relaxed cutoffs (hybrid ≥ 0.3, keyword coverage ≥ 25% or Starbucks ≥ 17). Results show the normalised BM25, Starbucks and
  hybrid scores (raw scores in the tooltip). Settings were chosen by grid search on the query suite.
- **Tests**: `node scripts/eval_search.mjs` runs `tests/search_queries.json` (known-item,
  natural-language, paraphrase, robustness, Chinese and off-topic queries) on every deploy.

Regenerate the model with `python3 scripts/export_starbucks.py` (needs torch, transformers,
onnx, onnxruntime).

## Search engine optimisation

- **Structured data** (`src/lib/seo.ts`): ProfilePage + Person + WebSite on the home page (names
  incl. 王率 and Dylan, ORCID, Scholar, Semantic Scholar, affiliations); CollectionPage + ItemList on
  Publications and Research; Course (INFS7410) on Teaching; ScholarlyArticle + breadcrumbs on paper
  pages; SoftwareSourceCode/CreativeWork + breadcrumbs on project pages.
- **Google Scholar tags** on paper pages: `citation_*` (title, authors, date, full venue name,
  arXiv id, PDF, DOI, plus institution and ORCID for Shuai Wang) and Dublin Core.
- **Head tags**: unique title/description per page, canonical URL, `hreflang` en / zh-CN /
  x-default, Open Graph and Twitter cards (`public/images/og.png`; project/paper figures).
- **Discovery**: `robots.txt` (AI crawlers explicitly allowed), `sitemap-index.xml` with hreflang
  alternates, IndexNow (Bing, Yandex, …) and Baidu push (`BAIDU_PUSH_TOKEN` secret) after deploys
  that change content. Baidu also gets `keywords` and `applicable-device` meta tags.
- **GEO** (answer engines such as ChatGPT, Perplexity, Gemini, Kimi): `/llms.txt` overview and
  `/llms-full.txt` with key facts, experience, every project and every paper with its abstract.
- **Verification**: Google Search Console uses a Domain property verified by a DNS TXT record at
  Porkbun; meta-tag codes (e.g. Bing) go in `src/data/profile.yml` → `seo.verification`.
- Robots meta allows large image previews and full snippets on every page except the 404.
- `scripts/check_site.py` fails the build if a page lacks a title, description, canonical,
  `x-default`, og:image or valid JSON-LD, or a paper lacks Scholar tags.

## Editing content

| What | Where |
|---|---|
| Bio, headline, education, experience, service, teaching blurb | `src/data/profile.yml` (`en` + `zh`) |
| Research projects (cards and `/research/<slug>/` pages) | `src/data/projects.yml`, figures in `public/images/research/` |
| Publications | `src/content/publications/*.md` — keep `permalink`; mark equal contribution with `*` after names in `citation` |
| News | `src/data/news.yml` (optional `title_zh`, `description_zh`) |
| Co-author homepages | `src/data/authors.yml` |
| Teaching, talks, awards | `src/content/{teaching,talks,awards}/*.md` |
| UI text (both languages) | `src/i18n/ui.ts` |
| Colours, fonts, components | `src/styles/global.css`, `src/components/` |

Topics used for filters: `agents`, `evidence`, `rag`, `memory`, `retrieval`, `security`.

## Checks

```bash
npm run build
python3 scripts/check_urls.py          # every URL of the old Jekyll site still resolves
python3 scripts/check_site.py dist     # no broken internal links or assets
python3 -m unittest discover -s tests  # sync and URL-check tests
```

These run on every deploy and pull request.

## History

Until October 2026 this site was a Jekyll site based on Academic Pages / Minimal Mistakes.
The last Jekyll state is preserved in git history (branch `redesign-snapshot`).
