#!/usr/bin/env python3
"""
Fetch Google Scholar metrics and save to _data/scholar_metrics.json.
Run by GitHub Actions daily.

Strategy (tries in order, returns first success):
  1. ScraperAPI via scholarly (if SCRAPERAPI_KEY set) — most reliable
  2. Direct HTML scrape of the public Scholar profile (no proxy)
  3. FreeProxies via scholarly — last resort, often blocked

On total failure: exits non-zero so the GitHub Actions run shows red ✗
(previously we silently exited 0 which hid the failure for weeks).
"""

import json
import os
import re
import sys
import urllib.request
from datetime import datetime


SCHOLAR_ID = "JDKYomkAAAAJ"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)


def fetch_via_scholarly(use_scraperapi: bool):
    from scholarly import scholarly, ProxyGenerator

    pg = ProxyGenerator()
    if use_scraperapi:
        scraper_key = os.environ.get("SCRAPERAPI_KEY", "").strip()
        if not scraper_key:
            raise RuntimeError("SCRAPERAPI_KEY not set")
        if not pg.ScraperAPI(scraper_key):
            raise RuntimeError("ScraperAPI proxy setup failed")
        scholarly.use_proxy(pg)
        print("[scholarly] Using ScraperAPI proxy.")
    else:
        pg.FreeProxies()
        scholarly.use_proxy(pg)
        print("[scholarly] Using FreeProxies (unreliable).")

    author = scholarly.search_author_id(SCHOLAR_ID)
    author = scholarly.fill(author, sections=["basics", "indices", "counts"])
    return {
        "citations":    author.get("citedby",    0),
        "h_index":      author.get("hindex",     0),
        "i10_index":    author.get("i10index",   0),
        "citations_5y": author.get("citedby5y",  0),
        "h_index_5y":   author.get("hindex5y",   0),
        "i10_index_5y": author.get("i10index5y", 0),
    }


def fetch_via_direct_html():
    """Parse the public Scholar profile HTML directly. Often works on
    fresh runners even when scholarly is blocked, because we look like
    a normal browser and only need one request."""
    url = f"https://scholar.google.com/citations?user={SCHOLAR_ID}&hl=en"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        html = resp.read().decode("utf-8", errors="ignore")

    # Scholar profile renders a stats table with rows: Citations / h-index / i10-index
    # All numbers appear inside <td class="gsc_rsb_std">N</td>.
    nums = re.findall(r'class="gsc_rsb_std"[^>]*>(\d+)</td>', html)
    if len(nums) < 6:
        raise RuntimeError(
            f"Direct HTML scrape returned only {len(nums)} numbers; "
            "page format may have changed or request was rate-limited."
        )

    # Order on the page: citations_all, citations_5y, h_all, h_5y, i10_all, i10_5y
    citations, citations_5y, h_index, h_5y, i10, i10_5y = (int(n) for n in nums[:6])
    print(f"[direct] Parsed: citations={citations} h={h_index} i10={i10}")
    return {
        "citations":    citations,
        "h_index":      h_index,
        "i10_index":    i10,
        "citations_5y": citations_5y,
        "h_index_5y":   h_5y,
        "i10_index_5y": i10_5y,
    }


def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_file = os.path.join(repo_root, "_data", "scholar_metrics.json")

    attempts = [
        ("ScraperAPI",   lambda: fetch_via_scholarly(use_scraperapi=True)),
        ("DirectHTML",   fetch_via_direct_html),
        ("FreeProxies",  lambda: fetch_via_scholarly(use_scraperapi=False)),
    ]

    metrics = None
    errors = []
    for name, fn in attempts:
        try:
            print(f"--- Trying {name} ---")
            metrics = fn()
            print(f"--- {name} succeeded ---")
            break
        except Exception as e:
            msg = f"{name} failed: {type(e).__name__}: {e}"
            print(msg, file=sys.stderr)
            errors.append(msg)

    if metrics is None:
        print("\nALL fetch attempts failed:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        print("\nTo fix: add SCRAPERAPI_KEY repo secret "
              "(free tier at https://scraperapi.com gives 1000 reqs/mo).",
              file=sys.stderr)
        sys.exit(1)

    metrics["last_updated"] = datetime.utcnow().strftime("%Y-%m-%d")
    with open(data_file, "w") as f:
        json.dump(metrics, f, indent=2)
        f.write("\n")
    print(f"\nWrote metrics to {data_file}:")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
