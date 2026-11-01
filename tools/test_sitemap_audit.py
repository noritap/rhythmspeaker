"""Sitemap routing and exclusion contract tests; no network or credentials."""
import sys
import unittest
from pathlib import Path
from xml.etree import ElementTree as ET

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sitemap_audit as audit


class SitemapRules(unittest.TestCase):
    def test_all_tracked_html_explicitly_classified(self):
        self.assertEqual(audit.check(), (43, 10))

    def test_essential_pages_included(self):
        routes = set(audit.load_registry()["public_html"])
        for p in ("index.html", "trial/apply/index.html",
                  "trial/index.html", "schedule/index.html",
                  "ecosystem/index.html", "rental/index.html",
                  "classes/step/index.html", "instructors/furusho/index.html",
                  "music/index.html", "workshops/index.html",
                  "rss/015/index.html", "broadcast/episodes/ayako-003/index.html"):
            self.assertIn(p, routes)

    def test_duplicate_preview_and_private_routes_excluded(self):
        excluded = audit.load_registry()["excluded_html"]
        for p in ("rss-theater/index.html",
                  "rss-theater/qa/index.html", "rss-theater/qa/program.html",
                  "ui-style-catalog/index.html",
                  "workshops/admin/index.html", "workshops/instructor/index.html"):
            self.assertTrue(excluded[p].startswith("noindex:"), p)
        self.assertEqual(excluded["workshops/event.html"].split(":")[0], "dynamic")

    def test_urls_are_unique_and_under_official_base(self):
        xml = ET.fromstring(audit.render(audit.load_registry()))
        ns = {"s": audit.XMLNS}
        locs = [e.text for e in xml.findall("s:url/s:loc", ns)]
        self.assertEqual(len(locs), 43)
        self.assertEqual(len(set(locs)), len(locs))
        self.assertTrue(all(u.startswith("https://noritap.github.io/rhythmspeaker/")
                            for u in locs))

    def test_no_unverifiable_lastmod(self):
        self.assertNotIn("lastmod", audit.render(audit.load_registry()))

    def test_explicit_route_conversion(self):
        base = audit.load_registry()["base_url"]
        self.assertEqual(audit.url_for("index.html", base), base)
        self.assertEqual(audit.url_for("classes/step/index.html", base),
                         base + "classes/step/")
        self.assertEqual(audit.url_for("workshops/sakaida-koji-20261122.html", base),
                         base + "workshops/sakaida-koji-20261122.html")


if __name__ == "__main__":
    unittest.main()
