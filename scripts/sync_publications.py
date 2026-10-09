#!/usr/bin/env python3
"""Keep the site's publications, citation counts and metrics in sync with Google Scholar.

Ground truth for *which* papers are Shuai's is the Google Scholar profile (fetched through
SerpApi, one request per run). OpenAlex and arXiv only enrich new papers with full author
lists, abstracts and links, because OpenAlex's ORCID attribution mixes in other people
named Shuai Wang.

Each run:
  1. Updates src/data/scholar_metrics.json (citations, h-index, i10-index).
  2. Updates src/data/citations.json with per-paper Scholar citation counts.
  3. Adds Scholar papers from this year or last year that the site does not list yet as
     src/content/publications/<date>-<slug>.md (auto: true) plus a news item.
     Older unmatched papers are only reported, never added.
  4. Updates src/data/github.json with stars for every linked GitHub repository.

Usage: python3 scripts/sync_publications.py [--dry-run]
Env:   SERPAPI_KEY (required for steps 1-3), OPENALEX_MAILTO, GITHUB_TOKEN (optional).
Standard library only; Python 3.9+.
"""

import argparse
import datetime as dt
import difflib
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBS_DIR = ROOT / "src" / "content" / "publications"
DATA_DIR = ROOT / "src" / "data"
SCHOLAR_ID = "JDKYomkAAAAJ"
SELF = "Shuai Wang"
USER_AGENT = "shuaiwang.io publication sync (+https://shuaiwang.io)"

MATCH_THRESHOLD = 0.75
ENRICH_THRESHOLD = 0.9
NOT_PAPERS = re.compile(r"thesis|dissertation|patent", re.I)
TOPIC_RULES = [  # first match wins, checked against the lowercased title
    ("security", r"injection|attack|vulnerab|adversarial"),
    ("agents", r"agent"),
    ("memory", r"memory"),
    ("evidence", r"systematic review|boolean|mesh|screening|medical|clinical|biomedical"),
    ("rag", r"retrieval[- ]augmented|\brag\b|generative"),
]

# ------------------------------------------------------------------ pure helpers


def norm_title(title):
    title = html.unescape(re.sub(r"<[^>]+>", " ", title or ""))
    return " ".join(re.sub(r"[^a-z0-9]+", " ", title.lower()).split())


def arxiv_id(text):
    match = re.search(r"(?:arxiv\.org/(?:abs|pdf|html)/|arXiv:)(\d{4}\.\d{4,5})", text or "", re.I)
    return match.group(1) if match else None


def title_score(a, b):
    """Similarity in [0, 1]: sequence ratio, word overlap, or containment of one title in the other."""
    a, b = norm_title(a), norm_title(b)
    if not a or not b:
        return 0.0
    shorter, longer = sorted((a, b), key=len)
    if len(shorter.split()) >= 4 and longer.startswith(shorter):
        return 1.0
    words_a, words_b = set(a.split()), set(b.split())
    jaccard = len(words_a & words_b) / len(words_a | words_b)
    return max(difflib.SequenceMatcher(None, a, b).ratio(), jaccard)


def match_existing(paper, existing):
    """Slug of the existing publication that is the same paper, or None."""
    for pub in existing:
        if paper.get("arxiv") and paper["arxiv"] == pub.get("arxiv"):
            return pub["slug"]
        if paper.get("doi") and pub.get("doi") and paper["doi"].lower() == pub["doi"].lower():
            return pub["slug"]
    best = max(existing, key=lambda pub: title_score(paper["title"], pub["title"]), default=None)
    if best and title_score(paper["title"], best["title"]) >= MATCH_THRESHOLD:
        return best["slug"]
    return None


def is_ignored(paper, ignore):
    for rule in ignore or []:
        if rule.get("title") and norm_title(rule["title"]) == norm_title(paper["title"]):
            return True
        for key in ("doi", "arxiv", "openalex"):
            if rule.get(key) and rule[key] == paper.get(key):
                return True
    return False


def plan(articles, existing, ignore, this_year):
    """Split Scholar articles into per-slug citation counts, new papers and skipped papers."""
    citations, new, skipped, seen = {}, [], [], []
    for article in articles:
        slug = match_existing(article, existing)
        cited = int(article.get("cited_by") or 0)
        if slug:
            citations[slug] = max(citations.get(slug, 0), cited)
            continue
        year = int(article.get("year") or 0)
        duplicate = any(title_score(article["title"], other["title"]) >= MATCH_THRESHOLD for other in seen)
        if is_ignored(article, ignore) or duplicate:
            continue
        if year < this_year - 1 or NOT_PAPERS.search(article.get("publication") or ""):
            skipped.append(article)
            continue
        seen.append(article)
        new.append(article)
    return citations, new, skipped


def abstract_from_inverted_index(index):
    if not index:
        return ""
    positions = [(pos, word) for word, slots in index.items() for pos in slots]
    return " ".join(word for _, word in sorted(positions))


def slugify(title, words=5):
    return "-".join(norm_title(title).split()[:words])


def topic_for(title):
    lowered = title.lower()
    for topic, pattern in TOPIC_RULES:
        if re.search(pattern, lowered):
            return topic
    return "retrieval"


def citation_string(authors, year, title, venue):
    names = authors[0] if len(authors) == 1 else ", ".join(authors[:-1]) + " and " + authors[-1]
    return f"{names}. {year}. {title}. {venue}."


def yaml_quote(value):
    return "'" + str(value).replace("'", "''") + "'"


def unique_slug(paper, out_dir):
    base = f"{paper['date']}-{slugify(paper['title'])}"
    slug, n = base, 2
    while (out_dir / f"{slug}.md").exists():
        slug, n = f"{base}-{n}", n + 1
    return slug


def render_markdown(paper, slug):
    year = paper["date"][:4]
    fields = [
        ("title", yaml_quote(paper["title"])),
        ("collection", "publications"),
        ("permalink", f"/publication/{slug}"),
        ("date", paper["date"]),
        ("venue", yaml_quote(paper["venue"])),
        ("paperurl", yaml_quote(paper["url"]) if paper.get("url") else None),
        ("citation", yaml_quote(citation_string(paper["authors"], year, paper["title"], paper["venue"]))),
        ("topic", yaml_quote(topic_for(paper["title"]))),
        ("arxiv", yaml_quote(paper["arxiv"]) if paper.get("arxiv") else None),
        ("doi", yaml_quote(paper["doi"]) if paper.get("doi") else None),
        ("auto", "true"),
    ]
    front = "\n".join(f"{key}: {value}" for key, value in fields if value is not None)
    body = paper.get("abstract") or "Abstract coming soon."
    return f"---\n{front}\n---\n## Abstract\n{body}\n"


def append_news(news_text, paper, slug):
    block = (
        f"\n- title: {yaml_quote('New paper: ' + paper['title'])}\n"
        f"  date: {paper['date']}\n"
        f"  url: /publication/{slug}\n"
        f"  description: {yaml_quote(paper['venue'])}\n"
        f"  status: celebrate\n"
        f"  auto: true\n"
    )
    return news_text.rstrip("\n") + "\n" + block


# ------------------------------------------------------------------ network


def get(url, headers=None, raw=False):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, **(headers or {})})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                data = response.read().decode("utf-8")
                return data if raw else json.loads(data)
        except urllib.error.HTTPError as exc:
            if exc.code < 500 or attempt == 2:  # client errors (404, 403) will not fix themselves
                raise
            time.sleep(2 ** (attempt + 1))
        except (urllib.error.URLError, TimeoutError) as exc:
            if attempt == 2:
                raise
            print(f"  retrying {url.split('?')[0]} ({exc})", file=sys.stderr)
            time.sleep(2 ** (attempt + 1))


def fetch_scholar(api_key):
    """Metrics and articles of the Scholar profile (one SerpApi search per 100 articles)."""
    params = {"engine": "google_scholar_author", "author_id": SCHOLAR_ID, "hl": "en", "num": 100, "sort": "pubdate", "api_key": api_key}
    data = get("https://serpapi.com/search.json?" + urllib.parse.urlencode(params))
    if "error" in data:
        raise RuntimeError(f"SerpApi: {data['error']}")
    table = {k: v for row in data.get("cited_by", {}).get("table", []) for k, v in row.items()}

    def pick(name):
        values = table.get(name) or {}
        total = int(values.get("all", 0))
        recent = next((int(v) for k, v in values.items() if k != "all"), total)
        return total, recent

    citations, citations_5y = pick("citations")
    h_index, h_index_5y = pick("h_index")
    i10, i10_5y = pick("i10_index")
    metrics = {
        "citations": citations, "h_index": h_index, "i10_index": i10,
        "citations_5y": citations_5y, "h_index_5y": h_index_5y, "i10_index_5y": i10_5y,
        "last_updated": dt.date.today().isoformat(),
    }
    articles = [
        {
            "title": a.get("title", ""),
            "authors_short": a.get("authors", ""),
            "publication": a.get("publication", ""),
            "year": a.get("year", ""),
            "cited_by": (a.get("cited_by") or {}).get("value") or 0,
            "link": a.get("link"),
        }
        for a in data.get("articles", [])
    ]
    return metrics, articles


def enrich_openalex(title):
    params = {"search": title, "per-page": 5}
    if os.environ.get("OPENALEX_MAILTO"):
        params["mailto"] = os.environ["OPENALEX_MAILTO"]
    for work in get("https://api.openalex.org/works?" + urllib.parse.urlencode(params)).get("results", []):
        if title_score(title, work.get("display_name") or "") < ENRICH_THRESHOLD:
            continue
        authors = [a["author"]["display_name"] for a in work.get("authorships", [])]
        if not any(name.lower() == SELF.lower() for name in authors):
            continue
        locations = [work.get("primary_location") or {}] + (work.get("locations") or [])
        arxiv = next((arxiv_id(loc.get("landing_page_url")) for loc in locations if arxiv_id(loc.get("landing_page_url"))), None)
        source = ((work.get("primary_location") or {}).get("source") or {}).get("display_name") or ""
        doi = (work.get("doi") or "").replace("https://doi.org/", "") or None
        return {
            "authors": authors,
            "abstract": abstract_from_inverted_index(work.get("abstract_inverted_index")),
            "doi": doi,
            "arxiv": arxiv,
            "openalex": work["id"].rsplit("/", 1)[-1],
            "venue": None if "arxiv" in source.lower() else source or None,
            "date": work.get("publication_date"),
        }
    return None


def enrich_arxiv(title):
    query = urllib.parse.urlencode({"search_query": f'ti:"{norm_title(title)}"', "max_results": 5})
    feed = ET.fromstring(get(f"https://export.arxiv.org/api/query?{query}", raw=True))
    ns = {"a": "http://www.w3.org/2005/Atom"}
    for entry in feed.findall("a:entry", ns):
        found = " ".join((entry.findtext("a:title", "", ns)).split())
        authors = [a.findtext("a:name", "", ns) for a in entry.findall("a:author", ns)]
        if title_score(title, found) < ENRICH_THRESHOLD or SELF not in authors:
            continue
        return {
            "authors": authors,
            "abstract": " ".join(entry.findtext("a:summary", "", ns).split()),
            "arxiv": arxiv_id(entry.findtext("a:id", "", ns)),
            "date": entry.findtext("a:published", "", ns)[:10],
        }
    return None


def build_paper(article):
    """Combine Scholar data with OpenAlex/arXiv metadata for a new publication."""
    extra = {}
    for enrich in (enrich_arxiv, enrich_openalex):
        try:
            found = enrich(article["title"]) or {}
        except Exception as exc:  # enrichment is best effort
            print(f"  {enrich.__name__} failed: {exc}", file=sys.stderr)
            found = {}
        for key, value in found.items():
            if value and not extra.get(key):
                extra[key] = value
    year = str(article.get("year") or dt.date.today().year)
    date = extra.get("date") or f"{year}-01-01"
    authors = extra.get("authors") or [n.strip() for n in article.get("authors_short", "").split(",") if n.strip() and n.strip() != "..."]
    venue = extra.get("venue") or article.get("publication") or (f"arXiv preprint ({year})" if extra.get("arxiv") else year)
    url = f"https://arxiv.org/abs/{extra['arxiv']}" if extra.get("arxiv") else (f"https://doi.org/{extra['doi']}" if extra.get("doi") else article.get("link"))
    return {
        "title": article["title"], "date": date, "authors": authors, "venue": venue, "url": url,
        "arxiv": extra.get("arxiv"), "doi": extra.get("doi"), "abstract": extra.get("abstract", ""),
    }


def github_repos():
    text = "\n".join([(DATA_DIR / "projects.yml").read_text()] + [p.read_text() for p in PUBS_DIR.glob("*.md")])
    # Owner/repo, without a trailing sentence period or ".git".
    repos = re.findall(r"https://github\.com/([\w-]+/[\w.-]*[\w-])", text)
    return sorted(set(repo.removesuffix(".git") for repo in repos))


def fetch_stars(repos):
    headers = {"Accept": "application/vnd.github+json"}
    if os.environ.get("GITHUB_TOKEN"):
        headers["Authorization"] = f"Bearer {os.environ['GITHUB_TOKEN']}"
    stars = {}
    for repo in repos:
        try:
            stars[repo] = get(f"https://api.github.com/repos/{repo}", headers)["stargazers_count"]
        except Exception as exc:
            print(f"  stars for {repo} failed: {exc}", file=sys.stderr)
    return stars


# ------------------------------------------------------------------ main


def load_existing():
    existing = []
    for path in sorted(PUBS_DIR.glob("*.md")):
        text = path.read_text()
        front = text.split("---", 2)[1]

        def field(name):
            match = re.search(rf"^{name}:\s*['\"]?(.*?)['\"]?\s*$", front, re.M)
            return match.group(1) if match else None

        existing.append({
            "slug": (field("permalink") or "").rsplit("/", 1)[-1],
            "title": field("title") or "",
            "arxiv": field("arxiv") or arxiv_id(field("paperurl")),
            "doi": field("doi"),
        })
    return existing


def load_ignore():
    path = DATA_DIR / "publication_ignore.yml"
    rules = []
    lines = [line for line in path.read_text().splitlines() if not line.lstrip().startswith("#")] if path.exists() else []
    for block in re.split(r"\n(?=\s*-\s)", "\n".join(lines)):
        rule = dict(re.findall(r"(title|doi|arxiv|openalex):\s*['\"]?(.*?)['\"]?\s*(?:#.*)?$", block, re.M))
        if rule:
            rules.append(rule)
    return rules


def write_json(path, data, dry_run):
    text = json.dumps(data, indent=2, ensure_ascii=False, sort_keys=True) + "\n"
    if path.exists() and path.read_text() == text:
        return False
    if not dry_run:
        path.write_text(text)
    return True


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--dry-run", action="store_true", help="report changes without writing files")
    args = parser.parse_args(argv)
    changed = []

    key = os.environ.get("SERPAPI_KEY", "").strip()
    if key:
        metrics, articles = fetch_scholar(key)
        print(f"Scholar: {len(articles)} articles, {metrics['citations']} citations, h-index {metrics['h_index']}")
        old_metrics = json.loads((DATA_DIR / "scholar_metrics.json").read_text())
        if {k: v for k, v in metrics.items() if k != "last_updated"} != {k: v for k, v in old_metrics.items() if k != "last_updated"}:
            write_json(DATA_DIR / "scholar_metrics.json", metrics, args.dry_run)
            changed.append("scholar_metrics.json")

        citations, new, skipped = plan(articles, load_existing(), load_ignore(), dt.date.today().year)
        if write_json(DATA_DIR / "citations.json", citations, args.dry_run):
            changed.append("citations.json")
        for article in skipped:
            print(f"  skipped (old or not a paper): {article['year']} {article['title']}")
        news_path = DATA_DIR / "news.yml"
        news_text = news_path.read_text()
        for article in new:
            paper = build_paper(article)
            slug = unique_slug(paper, PUBS_DIR)
            print(f"  NEW: {slug} — {paper['venue']} — {len(paper['authors'])} authors")
            news_text = append_news(news_text, paper, slug)
            if not args.dry_run:
                (PUBS_DIR / f"{slug}.md").write_text(render_markdown(paper, slug))
            changed.append(f"{slug}.md")
        if new and not args.dry_run:
            news_path.write_text(news_text)
    else:
        print("SERPAPI_KEY not set: skipping Scholar metrics, citations and new papers.")

    # Keep the last known count for repositories whose lookup failed this run.
    previous = json.loads((DATA_DIR / "github.json").read_text()) if (DATA_DIR / "github.json").exists() else {}
    repos = github_repos()
    stars = {repo: count for repo, count in {**previous, **fetch_stars(repos)}.items() if repo in repos}
    if stars and write_json(DATA_DIR / "github.json", stars, args.dry_run):
        changed.append("github.json")

    print(("Would change: " if args.dry_run else "Changed: ") + (", ".join(changed) or "nothing"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
