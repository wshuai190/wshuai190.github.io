#!/usr/bin/env python3
"""
Fetch Google Scholar metrics and save to _data/scholar_metrics.json.
Run by GitHub Actions daily. Falls back to keeping existing data on failure.
"""

import json
import os
import sys
from datetime import datetime


def fetch_metrics(scholar_id):
    from scholarly import scholarly, ProxyGenerator

    # Try free proxies to reduce chance of being blocked on cloud runners
    try:
        pg = ProxyGenerator()
        pg.FreeProxies()
        scholarly.use_proxy(pg)
        print("Using free proxy.")
    except Exception as e:
        print(f"Note: skipping proxy ({e}).", file=sys.stderr)

    author = scholarly.search_author_id(scholar_id)
    author = scholarly.fill(author, sections=["basics", "indices", "counts"])

    return {
        "citations":     author.get("citedby",    0),
        "h_index":       author.get("hindex",     0),
        "i10_index":     author.get("i10index",   0),
        "citations_5y":  author.get("citedby5y",  0),
        "h_index_5y":    author.get("hindex5y",   0),
        "i10_index_5y":  author.get("i10index5y", 0),
        "last_updated":  datetime.utcnow().strftime("%Y-%m-%d"),
    }


def main():
    scholar_id = "JDKYomkAAAAJ"

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_file = os.path.join(repo_root, "_data", "scholar_metrics.json")

    # Load existing data as fallback
    existing_data = {}
    if os.path.exists(data_file):
        with open(data_file) as f:
            existing_data = json.load(f)

    try:
        metrics = fetch_metrics(scholar_id)
        print("Fetched metrics:")
        print(json.dumps(metrics, indent=2))
    except Exception as e:
        print(f"Error fetching metrics: {e}", file=sys.stderr)
        if existing_data:
            print("Keeping existing data — no file update.", file=sys.stderr)
            sys.exit(0)
        else:
            print("No existing data; writing placeholder.", file=sys.stderr)
            metrics = {
                "citations": 0, "h_index": 0, "i10_index": 0,
                "citations_5y": 0, "h_index_5y": 0, "i10_index_5y": 0,
                "last_updated": datetime.utcnow().strftime("%Y-%m-%d"),
                "fetch_error": str(e),
            }

    with open(data_file, "w") as f:
        json.dump(metrics, f, indent=2)
        f.write("\n")
    print(f"Wrote metrics to {data_file}")


if __name__ == "__main__":
    main()
