"""Protect the single shared menu and the nine doors' approved destinations."""
import unittest
from html.parser import HTMLParser
from pathlib import Path
from navigation_audit import portal_problems

ROOT = Path(__file__).resolve().parents[1]


class Cards(HTMLParser):
    def __init__(self):
        super().__init__()
        self.cards = []
        self.card = None
        self.headings = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'article' and 'portal-card' in a.get('class', '').split():
            self.card = {'main': [], 'links': [], 'h2': 0}
            self.cards.append(self.card)
        if self.card is not None:
            if tag == 'h2':
                self.card['h2'] += 1
            if tag == 'a':
                self.card['links'].append(a['href'])
                if 'portal-main-link' in a.get('class', '').split():
                    self.card['main'].append(a['href'])

    def handle_endtag(self, tag):
        if tag == 'article':
            self.card = None


class PortalContractTest(unittest.TestCase):
    def setUp(self):
        self.html = (ROOT / 'ecosystem/index.html').read_text()

    def test_shared_nav_matches_full_contract(self):
        self.assertEqual(portal_problems(self.html), [])

    def test_wrong_url_is_detected_even_when_label_exists(self):
        bad = self.html.replace('href="../trial/"', 'href="../not-trial/"', 1)
        self.assertIn('PORTAL_NAV_LABEL_HREF_ORDER_DRIFT', portal_problems(bad))

    def test_missing_or_duplicate_navigation_is_detected(self):
        bad = self.html.replace('class="portal-site-links"', 'class="missing"')
        self.assertIn('SINGLE_PORTAL_NAV_REQUIRED', portal_problems(bad))
        self.assertIn('DUPLICATE_LEGACY_NAV', portal_problems(self.html + '<ul class="nav-links"><li>old</li></ul>'))

    def test_reordered_or_duplicate_item_is_detected(self):
        bad = self.html.replace('>FAQ</a>', '>アクセス</a>', 1)
        self.assertIn('PORTAL_NAV_LABEL_HREF_ORDER_DRIFT', portal_problems(bad))

    def test_nine_categories_have_headings_and_safe_destinations(self):
        p = Cards()
        p.feed(self.html)
        self.assertEqual(len(p.cards), 9)
        expected = ['../', '../broadcast/', '../music/', '../workshops/', None, None,
                    'https://noritap.github.io/furusho-official/',
                    'https://tips-app-seven.vercel.app/',
                    'mailto:rhythmspeaker296@gmail.com?subject=Rhythm%20Speaker%E3%81%B8%E3%81%AE%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B']
        for card, main in zip(p.cards, expected):
            self.assertEqual(card['main'], [] if main is None else [main])
            self.assertEqual(card['h2'], 1)
            self.assertLessEqual(len(card['links']) - len(card['main']), 3)
        self.assertIn('https://rhythmspeaker.stores.jp/', p.cards[5]['links'])
        self.assertIn('../classes/', p.cards[4]['links'])

    def test_all_first_party_link_targets_exist(self):
        class Links(HTMLParser):
            def __init__(self):
                super().__init__(); self.hrefs = []
            def handle_starttag(self, tag, attrs):
                if tag == 'a':
                    self.hrefs.append(dict(attrs).get('href', ''))
        p = Links(); p.feed(self.html)
        for href in p.hrefs:
            self.assertNotIn(href, ['', '#'])
            if href.startswith(('../', './')):
                target = (ROOT / 'ecosystem' / href).resolve()
                self.assertTrue((target / 'index.html').is_file(), href)


if __name__ == '__main__':
    unittest.main()
