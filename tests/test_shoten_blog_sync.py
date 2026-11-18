"""Regression tests for Shoten Hatena RSS parser."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from sync_shoten_blog import parse_feed

class BlogFeedTests(unittest.TestCase):
    def test_extracts_exact_product_links_and_deduplicates(self):
        xml = """<rss version="2.0"><channel>
        <item><title>掃除の道具</title><link>https://rhythmspeaker.hatenablog.com/entry/2026/11/18/120000</link>
        <description><![CDATA[おすすめ <a href="https://noritap.github.io/rhythmspeaker/shoten/#/product/RS-P0001">商品</a>]]></description></item>
        <item><title>重複</title><link>https://rhythmspeaker.hatenablog.com/entry/2026/11/18/120000</link></item>
        <item><title>別ドメイン</title><link>https://invalid.example/entry/test</link></item>
        </channel></rss>"""
        posts = parse_feed(xml.encode(), {"RS-P0001", "RS-P0002"})
        self.assertEqual(len(posts), 1)
        self.assertEqual(posts[0]["product_ids"], ["RS-P0001"])
        self.assertEqual(posts[0]["title"], "掃除の道具")
    def test_unrelated_articles_have_no_product(self):
        xml = '<rss><channel><item><title>暮らしの工夫</title><link>https://rhythmspeaker.hatenablog.com/entry/example</link><description>音楽の話</description></item></channel></rss>'
        self.assertEqual(parse_feed(xml.encode(), {"RS-P0001"})[0]["product_ids"], [])

if __name__ == "__main__":
    unittest.main()
