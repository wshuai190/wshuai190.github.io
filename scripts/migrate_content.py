"""One-off migration of Jekyll data into the Astro content model (kept for history).

- Merges _data/research_figures.yml and _data/research_projects.yml into src/data/projects.yml.
- Adds `topic`, `arxiv` and `image` front matter to each publication.

Run from the repository root: python3 scripts/migrate_content.py
"""

import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
PUBS = ROOT / "src" / "content" / "publications"

TOPIC_RULES = [  # first match wins; checked against the lowercased title
    ("security", r"injection|attack|vulnerab"),
    ("agents", r"agent"),
    ("evidence", r"systematic review|boolean|mesh|screening|medical|seed studies|sdr for"),
    ("rag", r"retrieval[- ]augmented|\brag\b|memory|generative ad hoc"),
]
FEATURED = ["sieve", "iter", "autobool", "cocom"]


def front_matter(path):
    text = path.read_text()
    _, fm, body = text.split("---", 2)
    return yaml.safe_load(fm), text


def arxiv_id(url):
    match = re.search(r"(\d{4}\.\d{4,5})", url or "")
    return match.group(1) if match else None


def topic_for(title):
    lowered = title.lower()
    for topic, pattern in TOPIC_RULES:
        if re.search(pattern, lowered):
            return topic
    return "retrieval"


def main():
    figures = yaml.safe_load((ROOT / "_data" / "research_figures.yml").read_text())
    legacy_projects = yaml.safe_load((ROOT / "_data" / "research_projects.yml").read_text())

    pubs = {}
    for path in sorted(PUBS.glob("*.md")):
        data, text = front_matter(path)
        slug = data["permalink"].rsplit("/", 1)[-1]
        pubs[slug] = {"path": path, "data": data, "text": text, "arxiv": arxiv_id(data.get("paperurl"))}

    by_arxiv = {p["arxiv"]: slug for slug, p in pubs.items() if p["arxiv"]}
    pub_extra = {slug: {"topic": topic_for(p["data"]["title"])} for slug, p in pubs.items()}
    for slug, p in pubs.items():
        if p["arxiv"]:
            pub_extra[slug]["arxiv"] = p["arxiv"]

    projects = []
    for fig in figures:
        pub_slug = by_arxiv.get(str(fig.get("arxiv")))
        pub = pubs[pub_slug]["data"] if pub_slug else {}
        if pub_slug:
            pub_extra[pub_slug].update(topic=fig["topic"], image=fig["image"])
        links = {}
        if fig.get("project"):
            links["site"] = fig["project"]
        if pub.get("demo"):
            links["demo"] = pub["demo"]
        if pub.get("paperurl") or fig.get("paper"):
            links["paper"] = pub.get("paperurl") or fig.get("paper")
        if "github.com" in (fig.get("source") or ""):
            links["code"] = re.sub(r"/blob/.*$", "", fig["source"])
        projects.append({
            "slug": fig["id"],
            "name": fig.get("title") or pub.get("title"),
            "topic": fig["topic"],
            "year": int(fig.get("year") or str(pub.get("date"))[:4]),
            "summary": fig["description"],
            "summary_zh": fig["description_zh"],
            "image": fig["image"],
            "figure_caption": fig.get("figure"),
            "figure_source": fig.get("source"),
            "links": links,
            "papers": [pub_slug] if pub_slug else [],
            "featured": fig["id"] in FEATURED,
        })

    skim = next(p for p in legacy_projects if p["name"] == "SkimSearchAgent")
    projects.insert(0, {
        "slug": "skim-search-agent",
        "name": "SkimSearchAgent",
        "topic": "agents",
        "year": 2026,
        "summary": skim["description"],
        "summary_zh": skim["description_zh"],
        "image": "/images/research/sieve.webp",
        "figure_caption": "Sieve workflow, one of the agents built on SkimSearchAgent",
        "links": {"site": skim["url"], "code": skim["code"]},
        "papers": [p.rsplit("/", 1)[-1] for p in skim["papers"]],
        "featured": False,
    })
    # Fold the "Adaptive retrieval" legacy project's paper into Starbucks.
    starbucks = next(p for p in projects if p["slug"] == "starbucks")
    starbucks["papers"].append("2025-05-14-2dmse-ir")
    # Sieve and ITER also link to the umbrella code repository.
    for p in projects:
        if p["slug"] in ("sieve", "iter"):
            p["links"].setdefault("code", skim["code"] if p["slug"] == "sieve" else "https://github.com/ielab/ITER")

    out = ROOT / "src" / "data" / "projects.yml"
    out.write_text(
        "# Research projects. Each entry gets a page at /research/<slug>/.\n"
        "# papers: publication slugs (the last part of their permalink).\n"
        + yaml.safe_dump(projects, allow_unicode=True, sort_keys=False, width=1000)
    )

    for slug, extra in pub_extra.items():
        p = pubs[slug]
        lines = [f"{k}: '{v}'" for k, v in extra.items() if k not in p["data"]]
        if not lines:
            continue
        head, fm, body = p["text"].split("---", 2)
        p["path"].write_text(f"---{fm.rstrip()}\n" + "\n".join(lines) + "\n---" + body)

    print(f"{len(projects)} projects, {len(pub_extra)} publications tagged")
    for slug, extra in sorted(pub_extra.items()):
        print(f"  {extra['topic']:9} {slug}")


if __name__ == "__main__":
    main()
