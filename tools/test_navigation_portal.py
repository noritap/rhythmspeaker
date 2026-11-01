"""Protect the single shared menu and the nine doors' approved destinations."""
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
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
        if tag == 'article' and any(c in a.get('class', '').split() for c in ('portal-card','portal-tile')):
            self.card = {'main': [], 'links': [], 'h3': 0}
            self.cards.append(self.card)
        if self.card is not None:
            if tag == 'h3':
                self.card['h3'] += 1
            if tag == 'a':
                self.card['links'].append(a['href'])
                if any(c in a.get('class', '').split() for c in ('portal-main-link','portal-main')):
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

    def test_ten_categories_have_headings_and_safe_destinations(self):
        p = Cards()
        p.feed(self.html)
        self.assertEqual(len(p.cards), 10)
        expected = [
            '../', '../workshops/', '../broadcast/', '../music/',
            '../ecosystem/?category=learn',
            'https://rhythmspeaker.stores.jp/?all_items=true',
            'https://rhythmspeaker.hatenablog.com/',
            '../about/', 'https://tips-app-seven.vercel.app/',
            'https://lin.ee/zC5YLe7',
        ]
        for card, main in zip(p.cards, expected):
            self.assertEqual(card['main'], [main])
            self.assertEqual(card['h3'], 1)
            self.assertLessEqual(len(card['links']) - len(card['main']), 5)
        self.assertIn('../schedule/', p.cards[0]['links'])
        self.assertIn('../classes/', p.cards[0]['links'])
        self.assertIn('https://noritap.github.io/furusho-official/', p.cards[7]['links'])
        self.assertIn('mailto:rhythmspeaker296@gmail.com', p.cards[9]['links'])

    def test_primary_routes_and_shop_review_distinction(self):
        self.assertIn('class="portal-quick-card portal-quick-card--trial" href="../trial/"', self.html)
        self.assertIn('class="portal-quick-card portal-quick-card--schedule" href="../schedule/"', self.html)
        self.assertIn('>レッスン日程</strong>', self.html)
        self.assertIn('<h3>オリジナルグッズ</h3>', self.html)
        self.assertIn('<h3>商品レビュー</h3>', self.html)
        self.assertIn('リズムスピーカー商店を読む', self.html)
        self.assertIn('<h2 id="portal-heading-shopping">買う・選ぶ</h2>', self.html)
        self.assertNotIn('通常クラス予約', self.html)

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
                target = (ROOT / 'ecosystem' / urlsplit(href).path).resolve()
                self.assertTrue((target / 'index.html').is_file(), href)

    def test_icon_sprite_has_no_layout_box_even_without_css(self):
        class Sprite(HTMLParser):
            def __init__(self):
                super().__init__(); self.sprites = []
            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                if tag == 'svg' and 'eco-sr' in attrs.get('class', '').split():
                    self.sprites.append(attrs)
        p = Sprite(); p.feed(self.html)
        if 'data-ux-source="sites-v6"' in self.html:
            self.assertEqual(len(p.sprites),0)  # Inline scoped icons; no hidden sprite needed.
            self.assertEqual(self.html.count('aria-hidden="true" fill="none"'),9)
            return
        self.assertEqual(len(p.sprites), 1)
        self.assertEqual(p.sprites[0].get('width'), '0')
        self.assertEqual(p.sprites[0].get('height'), '0')


if __name__ == '__main__':
    unittest.main()
