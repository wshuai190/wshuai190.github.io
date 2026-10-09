"""Check local navigation and assets on the site's primary generated pages."""

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
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "_site")
    routes = ("", "research/", "publications/", "cv/", "awards/", "teaching/", "talks/", "news/")
    errors = []
    checked = 0
    for language in ("", "zh/"):
        for route in routes:
            path = root / language / route / "index.html"
            if not path.exists():
                errors.append(f"Missing page: {path}")
                continue
            parser = Links()
            parser.feed(path.read_text(encoding="utf-8"))
            checked += 1
            for target in parser.targets:
                url = urlsplit(target)
                if url.scheme or url.netloc or not url.path:
                    continue
                resolved = urlsplit(urljoin("/" + language + route, target)).path
                destination = root / unquote(resolved).lstrip("/")
                if not any(candidate.is_file() for candidate in (
                    destination, destination / "index.html", destination.with_suffix(".html")
                )):
                    errors.append(f"{path}: missing {target}")
    if errors:
        print("\n".join(sorted(set(errors))))
        return 1
    print(f"Checked navigation and assets on {checked} primary pages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
