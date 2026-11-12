import re
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
        bad = self.html.replace('class="rs-menu-action rs-menu-action--schedule" href="../schedule/"', 'class="rs-menu-action rs-menu-action--schedule" href="../not-schedule/"', 1)
        self.assertIn('PRIORITY_MENU_CONTENT_OR_ORDER_DRIFT', portal_problems(bad))

    def test_missing_or_duplicate_navigation_is_detected(self):
        bad = self.html.replace('class="rs-menu-nav"', 'class="missing"')
        self.assertIn('SINGLE_MENU_NAV_REQUIRED', portal_problems(bad))
        self.assertIn('DUPLICATE_LEGACY_NAV', portal_problems(self.html + '<ul class="nav-links"><li>old</li></ul>'))

    def test_reordered_or_duplicate_item_is_detected(self):
        bad = self.html.replace('>レッスン予約</strong>', '>アクセス</strong>', 1)
        self.assertIn('PRIORITY_MENU_CONTENT_OR_ORDER_DRIFT', portal_problems(bad))

    def test_priority_menu_is_unique_and_action_first(self):
        from navigation_sync import PAGES, page_prefix, render_menu
        for path, current in PAGES.items():
            html = (ROOT / path).read_text()
            prefix = page_prefix(path)
            expected = render_menu(prefix, current)
            self.assertEqual(html.count(expected), 1, f'{path} must match the canonical menu')
            self.assertEqual(html.count('class="rs-menu-nav"'), 1)
            menu = html[html.index('<div id="menu"'):html.index('</header>')]
            self.assertEqual(
                re.findall(r'class="rs-menu-group rs-menu-group--(\w+)"', menu),
                ['quick', 'services', 'blogs', 'lessons', 'media', 'more'],
            )
            self.assertEqual(
                re.findall(r'class="rs-menu-action rs-menu-action--(\w+)"', menu),
                ['schedule', 'trial', 'rental', 'goods', 'wallet', 'line'],
            )
            self.assertIn('https://lin.ee/zC5YLe7', menu)
            self.assertIn('https://tips-app-seven.vercel.app/', menu)
            self.assertIn('https://rhythmspeaker.stores.jp/?all_items=true', menu)
            self.assertIn('class="rs-menu-link rs-menu-link--broadcast"', menu)
            self.assertIn('class="rs-menu-link rs-menu-link--music"', menu)
            self.assertEqual(menu.count('class="rs-menu-link rs-menu-link--rss"'), 1)
            self.assertEqual(menu.count('class="rs-menu-action rs-menu-action--goods"'), 1)
            self.assertEqual(menu.count('https://tapdance-rhythmspeaker.hatenablog.com/'), 1)
            self.assertEqual(menu.count('https://rhythmspeaker.hatenablog.com/'), 1)
            blogs = menu.split('aria-label="タプ太郎の毎日ブログ"', 1)[1].split('</section>', 1)[0]
            self.assertIn('>タップダンスを学ぶ</a>', blogs)
            self.assertIn('>商品レビュー</a>', blogs)
            self.assertNotIn('class="mobile-nav-panel"', menu)
            if current:
                self.assertIn(f'href="{prefix}{current}" aria-current="page"', menu)
            self.assertEqual(menu.count('aria-current="page"'), int(bool(current)))
        self.assertNotIn('>すべてのサービス</a>', self.html[self.html.index('id="menu"'):self.html.index('</header>')])

    def test_service_cards_have_headings_and_safe_destinations(self):
        """The compact menu must retain distinct, safe destination links."""
        from html.parser import HTMLParser
        class Compact(HTMLParser):
            def __init__(self):
                super().__init__()
                self.groups = 0
                self.links = []
                self.in_summary = False
                self.summaries = []
            def handle_starttag(self, tag, attrs):
                a = dict(attrs)
                if tag == 'details' and 'rs-eco-group' in a.get('class','').split():
                    self.groups += 1
                if tag == 'summary':
                    self.in_summary = True
                if tag == 'a':
                    self.links.append(a.get('href'))
            def handle_data(self, data):
                if self.in_summary:
                    self.summaries.append(data.strip())
            def handle_endtag(self, tag):
                if tag == 'summary':
                    self.in_summary = False
        p = Compact()
        p.feed(self.html)
        self.assertEqual(p.groups, 5)
        self.assertEqual([x for x in p.summaries if x], [
            '教室・レッスン', 'スタジオを使う', '観る・聴く',
            'グッズ・学び', '会員・ご案内'
        ])
        for destination in (
            '../classes/', '../workshops/', '../rental/', '../rental/share/',
            '../broadcast/', '../rss/', '../music/', '../classes/step/',
            'https://rhythmspeaker.stores.jp/?all_items=true',
            'https://tips-app-seven.vercel.app/', 'https://lin.ee/zC5YLe7',
            '../about/', 'https://noritap.github.io/furusho-official/',
            'mailto:rhythmspeaker296@gmail.com'
        ):
            self.assertIn(destination, p.links)
        self.assertEqual(self.html.count('class="rs-eco-group"'), 5)

    def test_primary_routes_and_shop_review_distinction(self):
        self.assertIn('class="rs-eco-quick-grid"', self.html)
        self.assertIn('class="rs-eco-blog-grid"', self.html)
        self.assertIn('<h2 id="rs-eco-blogs-title">タプ太郎の毎日ブログ</h2>', self.html)
        self.assertEqual(self.html.count('class="rs-eco-quick-grid"'), 1)
        self.assertEqual(self.html.count('class="rs-eco-blog-grid"'), 1)
        self.assertEqual(self.html.count('class="rs-eco-accordion"'), 1)
        quick = self.html.split('class="rs-eco-quick-grid"', 1)[1].split('</div>', 1)[0]
        self.assertEqual(quick.count('<a href='), 4)
        for url in ('../trial/', '../schedule/', '../rental/', '../shoten/'):
            self.assertIn(f'href="{url}"', quick)
        blogs = self.html.split('class="rs-eco-blog-grid"', 1)[1].split('</div>', 1)[0]
        self.assertIn('https://tapdance-rhythmspeaker.hatenablog.com/', blogs)
        self.assertIn('https://rhythmspeaker.hatenablog.com/', blogs)
        self.assertLess(self.html.index('class="rs-eco-quick-grid"'), self.html.index('class="rs-eco-blog-grid"'))
        self.assertLess(self.html.index('class="rs-eco-blog-grid"'), self.html.index('class="rs-eco-accordion"'))
        self.assertNotIn('class="portal-purpose portal-shortcuts"', self.html)

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

    def test_compact_menu_is_accessible_without_javascript(self):
        # Native details/summary works with keyboard and without JS.
        self.assertEqual(self.html.count('<details class="rs-eco-group"'), 5)
        self.assertEqual(self.html.count('<summary>'), 5)
        self.assertEqual(self.html.count('</details>'), 5)
        self.assertIn('@media(max-width:600px)', self.html)
        self.assertIn('@media(prefers-reduced-motion:reduce)', self.html)
        self.assertIn('.rs-eco-group summary::-webkit-details-marker', self.html)
        self.assertIn('id="portal-heading-blogs"', self.html)
        self.assertIn('id="portal-heading-lessons"', self.html)
        self.assertIn('id="portal-heading-rental"', self.html)
        self.assertIn('id="portal-heading-media"', self.html)
        self.assertIn('id="portal-heading-support"', self.html)


if __name__ == '__main__':
    unittest.main()
