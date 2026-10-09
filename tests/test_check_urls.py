import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import check_urls  # noqa: E402


class ResolveTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dist = Path(self.tmp.name)
        for rel in ["index.html", "cv/index.html", "publication/a.html", "zh/index.html"]:
            path = self.dist / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("<html></html>")

    def tearDown(self):
        self.tmp.cleanup()

    def test_root(self):
        self.assertEqual(check_urls.resolve("/", self.dist), self.dist / "index.html")

    def test_trailing_slash_maps_to_index(self):
        self.assertEqual(check_urls.resolve("/cv/", self.dist), self.dist / "cv/index.html")

    def test_extensionless_maps_to_html_file(self):
        self.assertEqual(check_urls.resolve("/publication/a", self.dist), self.dist / "publication/a.html")

    def test_missing_returns_none(self):
        self.assertIsNone(check_urls.resolve("/publication/b", self.dist))
        self.assertIsNone(check_urls.resolve("/cv", self.dist))

    def test_main_reports_missing(self):
        urls = self.dist / "urls.txt"
        urls.write_text("/\n/cv/\n/missing\n")
        self.assertEqual(check_urls.main([str(urls), str(self.dist)]), 1)
        urls.write_text("/\n/cv/\n")
        self.assertEqual(check_urls.main([str(urls), str(self.dist)]), 0)


if __name__ == "__main__":
    unittest.main()
