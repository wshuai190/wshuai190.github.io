"""Fail if any URL the old Jekyll site served is missing from the Astro build.

Usage: python3 scripts/check_urls.py [urls_file] [dist_dir]

GitHub Pages serves `/x/` from `x/index.html` and `/x` from `x.html`, so each legacy
URL must map to exactly that file in `dist/`.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_URLS = ROOT / "scripts" / "legacy_urls.txt"
DEFAULT_DIST = ROOT / "dist"


def resolve(url, dist):
    """Return the file GitHub Pages would serve for `url`, or None if it is absent."""
    rel = url.lstrip("/")
    if rel == "" or rel.endswith("/"):
        candidate = dist / rel / "index.html"
    else:
        candidate = dist / (rel + ".html")
    return candidate if candidate.is_file() else None


def main(argv):
    urls_file = Path(argv[0]) if argv else DEFAULT_URLS
    dist = Path(argv[1]) if len(argv) > 1 else DEFAULT_DIST
    urls = [line.strip() for line in urls_file.read_text().splitlines() if line.strip()]
    missing = [url for url in urls if resolve(url, dist) is None]
    for url in missing:
        print(f"missing: {url}")
    print(f"{len(urls) - len(missing)}/{len(urls)} legacy URLs resolve ({len(missing)} missing)")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
