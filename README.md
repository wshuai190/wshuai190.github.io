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

⌘K search and the Publications search box use **hybrid retrieval**: BM25 fused 50/50 (after
min-max normalisation) with dense scores from a 2-layer, 32-dim cut of
[Starbucks](https://huggingface.co/ielabgroup/Starbucks-msmarco) (`public/models/starbucks-2l-32`,
int8, 10k-token vocabulary, ~15 MB gzipped). Every build re-encodes all papers, projects and news
into `/search-index.json` with the same onnxruntime-web kernels the browser uses, so new papers —
added by hand or by the daily sync — are searchable after the next deploy. BM25 answers instantly;
the model loads in the background on first search. Regenerate the model with
`python3 scripts/export_starbucks.py` (needs torch, transformers, onnx, onnxruntime).

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
