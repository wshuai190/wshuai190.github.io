"""Fail if any page links to a missing internal page or asset, or lacks basic SEO tags."""

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        key = "href" if tag in ("a", "link") else "src" if tag in ("img", "script") else None
        if key and attributes.get(key):
            self.targets.append(attributes[key])


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "dist")
    pages = [p for p in root.rglob("*.html") if "pagefind" not in p.parts]
    if not pages:
        print(f"No HTML pages found under {root}")
        return 1
    errors = []
    for path in pages:
        parser = Links()
        parser.feed(path.read_text(encoding="utf-8"))
        page_url = "/" + path.relative_to(root).as_posix()
        for target in parser.targets:
            url = urlsplit(target)
            if url.scheme or url.netloc or not url.path:
                continue
            resolved = urlsplit(urljoin(page_url, target)).path
            destination = root / unquote(resolved).lstrip("/")
            if not any(candidate.is_file() for candidate in (
                destination, destination / "index.html", destination.with_name(destination.name + ".html")
            )):
                errors.append(f"{path.relative_to(root)}: missing {target}")
    errors += seo_errors(root, pages)
    errors += feed_errors(root)
    if errors:
        print("\n".join(sorted(set(errors))))
        print(f"{len(set(errors))} problems")
        return 1
    print(f"Checked internal links, assets and SEO tags on {len(pages)} pages.")
    return 0


def feed_errors(root):
    """Every on-site link in feed.xml must resolve, and items must not share a link (GUID)."""
    feed = root / "feed.xml"
    if not feed.exists():
        return ["feed.xml missing"]
    links = re.findall(r"<link>https://shuaiwang\.io([^<]*)</link>", feed.read_text(encoding="utf-8"))
    errors = []
    for link in links:
        path = link.split("#")[0]
        target = root / (path.lstrip("/") + "index.html" if path.endswith("/") or not path else path.lstrip("/") + ".html")
        if not target.is_file():
            errors.append(f"feed.xml: broken link {link}")
    duplicates = {link for link in links if links.count(link) > 1}
    errors += [f"feed.xml: duplicate item link {link}" for link in duplicates if link not in ("", "/")]
    return errors


def seo_errors(root, pages):
    """Every real page needs a title, description, canonical URL and valid JSON-LD; papers need Scholar tags."""
    errors = []
    for path in pages:
        html = path.read_text(encoding="utf-8")
        rel = path.relative_to(root).as_posix()
        if 'http-equiv="refresh"' in html:  # legacy redirect stubs
            continue
        noindex = 'content="noindex"' in html
        for label, pattern in [
            ("title", r"<title>[^<]{10,}</title>"),
            ("canonical", r'<link rel="canonical" href="https://shuaiwang\.io/[^"]*"'),
            ("hreflang x-default", r'hreflang="x-default"'),
            ("og:image", r'<meta property="og:image" content="https://'),
        ]:
            if label == "canonical" and noindex:
                continue  # noindex pages (404) intentionally have no canonical
            if not re.search(pattern, html):
                errors.append(f"{rel}: missing {label}")
        description = re.search(r'<meta name="description" content="([^"]*)"', html)
        text = description.group(1) if description else ""
        # CJK characters carry roughly two Latin characters' worth of information.
        if len(text) + len(re.findall(r"[\u4e00-\u9fff]", text)) < 50:
            errors.append(f"{rel}: missing or short meta description")
        for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
            try:
                json.loads(block)
            except json.JSONDecodeError as exc:
                errors.append(f"{rel}: invalid JSON-LD ({exc})")
        if rel.startswith("publication/"):
            for tag in ("citation_title", "citation_author", "citation_publication_date", "ScholarlyArticle"):
                if tag not in html:
                    errors.append(f"{rel}: missing {tag}")
        if rel.startswith("zh/publication/") and "citation_title" in html:
            # Scholar tags only on the English (canonical) page, to avoid duplicate Scholar versions.
            errors.append(f"{rel}: has citation_* tags (English page only)")
    return errors


if __name__ == "__main__":
    raise SystemExit(main())
