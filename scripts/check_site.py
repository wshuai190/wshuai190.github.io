"""Fail if any page in the build links to a missing internal page or asset."""

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
    if errors:
        print("\n".join(sorted(set(errors))))
        print(f"{len(set(errors))} broken internal links or assets")
        return 1
    print(f"Checked internal links and assets on {len(pages)} pages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
