import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import sync_publications as sp  # noqa: E402


EXISTING = [
    {"slug": "2024-07-16-COCOM", "title": "Context Embeddings for Efficient Answer Generation in RAG", "arxiv": "2407.09252", "doi": None},
    {"slug": "2026-07-01-vulnerability-llm-rankers", "title": "The Vulnerability of LLM Rankers to Prompt Injection Attacks", "arxiv": "2602.16752", "doi": None},
    {"slug": "2022-07-02-hang-sigirprfi", "title": "To Interpolate or not to Interpolate: PRF, Dense and Sparse Retrievers", "arxiv": None, "doi": None},
    {"slug": "2024-03-28-llm-stemming", "title": "Large Language Models for Stemming: Promises, Pitfalls and Failures", "arxiv": "2402.11757", "doi": None},
    {"slug": "2023-07-23-sigirchatgpt", "title": "Can ChatGPT Write a Good Boolean Query for Systematic Review Literature Search?", "arxiv": None, "doi": None},
]


class TitleMatchingTest(unittest.TestCase):
    def test_norm_title(self):
        self.assertEqual(sp.norm_title("  Rank-R1: Enhancing <i>Reasoning</i>!  "), "rank r1 enhancing reasoning")

    def test_same_paper_variants(self):
        pairs = [
            ("Context Embeddings for Efficient Answer Generation in Retrieval-Augmented Generation", "2024-07-16-COCOM"),
            ("The Vulnerability of LLM Rankers to Prompt Injection Attacks: You are what you rank", "2026-07-01-vulnerability-llm-rankers"),
            ("To Interpolate or not to Interpolate", "2022-07-02-hang-sigirprfi"),
            ("Large Language Models Based Stemming for Information Retrieval: Promises, Pitfalls and Failures", "2024-03-28-llm-stemming"),
            ("Can ChatGPT write a good Boolean query for systematic review literature search?", "2023-07-23-sigirchatgpt"),
        ]
        for title, slug in pairs:
            with self.subTest(title=title):
                self.assertEqual(sp.match_existing({"title": title}, EXISTING), slug)

    def test_different_papers_do_not_match(self):
        for title in [
            "Reassessing Large Language Model Boolean Query Generation for Systematic Reviews",
            "Generating Natural Language Queries for More Effective Systematic Review Screening Prioritisation",
            "Large Language Models are Strong Resource Selectors for Federated Search",
        ]:
            with self.subTest(title=title):
                self.assertIsNone(sp.match_existing({"title": title}, EXISTING))

    def test_match_by_arxiv_id(self):
        self.assertEqual(sp.match_existing({"title": "Totally different", "arxiv": "2402.11757"}, EXISTING), "2024-03-28-llm-stemming")


class HelpersTest(unittest.TestCase):
    def test_abstract_from_inverted_index(self):
        self.assertEqual(sp.abstract_from_inverted_index({"world": [1], "Hello": [0], "again": [2]}), "Hello world again")
        self.assertEqual(sp.abstract_from_inverted_index(None), "")

    def test_arxiv_id(self):
        self.assertEqual(sp.arxiv_id("https://arxiv.org/abs/2608.02751v2"), "2608.02751")
        self.assertIsNone(sp.arxiv_id("https://doi.org/10.1145/1"))

    def test_slugify(self):
        self.assertEqual(sp.slugify("ITER: Interaction-Aware Retrieval for Agentic Search"), "iter-interaction-aware-retrieval-for")

    def test_topic(self):
        self.assertEqual(sp.topic_for("Prompt injection in RAG"), "security")
        self.assertEqual(sp.topic_for("Naive RAG is just as good for memory management"), "memory")
        self.assertEqual(sp.topic_for("Boolean queries for systematic reviews"), "evidence")
        self.assertEqual(sp.topic_for("Dense retrievers at scale"), "retrieval")

    def test_citation_string(self):
        self.assertEqual(
            sp.citation_string(["Shuai Wang", "Guido Zuccon"], 2026, "A Title", "SIGIR 2026"),
            "Shuai Wang and Guido Zuccon. 2026. A Title. SIGIR 2026.",
        )
        self.assertEqual(
            sp.citation_string(["A", "B", "C"], 2025, "T", "arXiv preprint"),
            "A, B and C. 2025. T. arXiv preprint.",
        )


class PlanTest(unittest.TestCase):
    def test_plan_splits_known_new_old_and_ignored(self):
        articles = [
            {"title": "Context Embeddings for Efficient Answer Generation in Retrieval-Augmented Generation", "year": "2024", "cited_by": 12},
            {"title": "Context Embeddings for Efficient Answer Generation in RAG", "year": "2024", "cited_by": 30},
            {"title": "A Brand New Agent Paper", "year": "2026", "cited_by": 0},
            {"title": "Some Old Unlisted Paper", "year": "2019", "cited_by": 3},
            {"title": "Ignored Paper", "year": "2026", "cited_by": 0},
            {"title": "AI-driven automated systematic reviews", "year": "2025", "publication": "PhD thesis, The University of Queensland", "cited_by": 0},
        ]
        citations, new, skipped = sp.plan(articles, EXISTING, [{"title": "ignored paper"}], this_year=2026)
        self.assertEqual(citations, {"2024-07-16-COCOM": 30})
        self.assertEqual([a["title"] for a in new], ["A Brand New Agent Paper"])
        self.assertIn("Some Old Unlisted Paper", [a["title"] for a in skipped])
        self.assertIn("AI-driven automated systematic reviews", [a["title"] for a in skipped])


class RenderTest(unittest.TestCase):
    PAPER = {
        "title": 'Search "Agents": A Study',
        "date": "2026-08-03",
        "authors": ["Shuai Wang", "Guido Zuccon"],
        "venue": "arXiv preprint (2026)",
        "url": "https://arxiv.org/abs/2608.00001",
        "arxiv": "2608.00001",
        "doi": None,
        "abstract": "We study agents.",
    }

    def test_render_markdown(self):
        text = sp.render_markdown(self.PAPER, "2026-08-03-search-agents-a-study")
        self.assertTrue(text.startswith("---\n"))
        self.assertIn("title: 'Search \"Agents\": A Study'\n", text)
        self.assertIn("permalink: /publication/2026-08-03-search-agents-a-study\n", text)
        self.assertIn("auto: true\n", text)
        self.assertIn("topic: 'agents'\n", text)
        self.assertIn("citation: 'Shuai Wang and Guido Zuccon. 2026. Search \"Agents\": A Study. arXiv preprint (2026).'\n", text)
        self.assertTrue(text.rstrip().endswith("## Abstract\nWe study agents."))

    def test_news_block_is_append_only(self):
        original = "- title: \"Old\"\n  date: 2026-01-01\n"
        updated = sp.append_news(original, self.PAPER, "2026-08-03-search-agents-a-study")
        self.assertTrue(updated.startswith(original))
        self.assertIn("- title: 'New paper: Search \"Agents\": A Study'", updated)
        self.assertIn("  url: /publication/2026-08-03-search-agents-a-study", updated)
        self.assertIn("  auto: true", updated)

    def test_write_new_paper_avoids_existing_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            (out / "2026-08-03-search-agents-a-study.md").write_text("existing")
            slug = sp.unique_slug(self.PAPER, out)
            self.assertEqual(slug, "2026-08-03-search-agents-a-study-2")


class FileParsingTest(unittest.TestCase):
    def test_load_ignore_skips_comments(self):
        with tempfile.TemporaryDirectory() as tmp:
            original = sp.DATA_DIR
            sp.DATA_DIR = Path(tmp)
            try:
                (Path(tmp) / "publication_ignore.yml").write_text(
                    '# Example:\n#   - title: "Not mine"\n- title: "AI-driven automated systematic reviews"   # thesis\n- doi: 10.1/x\n'
                )
                self.assertEqual(sp.load_ignore(), [{"title": "AI-driven automated systematic reviews"}, {"doi": "10.1/x"}])
            finally:
                sp.DATA_DIR = original


if __name__ == "__main__":
    unittest.main()
