#!/usr/bin/env python3
"""Generate the purpose-ranked right-header menu from one canonical route registry.

Preserves existing destinations and keeps priority and support actions visible
on their own pages.
"""
from __future__ import annotations

import re
from pathlib import Path

PAGES = {
    Path("index.html"): "",
    Path("trial/index.html"): "trial/",
    Path("classes/index.html"): "classes/",
    Path("about/index.html"): "about/",
    Path("ecosystem/index.html"): "ecosystem/",
    Path("faq/index.html"): "faq/",
    Path("access/index.html"): "access/",
    Path("schedule/index.html"): "schedule/",
    Path("pricing/index.html"): "pricing/",
    Path("instructors/index.html"): "instructors/",
    Path("rental/index.html"): "rental/",
    Path("rental/booking.html"): "rental/",
    Path("rental/legacy.html"): "rental/",
    Path("rental/backstage/index.html"): "rental/",
    Path("rental/coworking/index.html"): "rental/",
    Path("rental/creator/index.html"): "rental/",
    Path("rental/dance/index.html"): "rental/",
    Path("rental/night/index.html"): "rental/",
    Path("rental/share/index.html"): "rental/",
    Path("rental/workshop/index.html"): "rental/",
}
# Values are (display label, route, explanatory subline, CSS role).
MENU_GROUPS = [
    ("quick", "よく使うメニュー", [
        ("レッスン予約", "schedule/", "開催日程から探す", "schedule"),
        ("初回体験 ¥1,000", "trial/", "初めての方はこちら", "trial"),
    ]),
    ("services", "主なサービス", [
        ("スタジオレンタル", "rental/", "", "rental"),
        ("グッズを買う", "https://rhythmspeaker.stores.jp/?all_items=true", "", "goods"),
        ("マイページ", "https://tips-app-seven.vercel.app/", "", "wallet"),
        ("お問い合わせ", "https://lin.ee/zC5YLe7", "", "line"),
    ]),
    ("blogs", "タプ太郎の毎日ブログ", [
        ("タップダンスを学ぶ", "https://tapdance-rhythmspeaker.hatenablog.com/", "", "tapblog"),
        ("商品レビュー", "https://rhythmspeaker.hatenablog.com/", "", "reviewblog"),
    ]),
    ("lessons", "教室・レッスン", [
        ("料金・通い方", "pricing/", "", "pricing"),
        ("クラス紹介", "classes/", "", "classes"),
        ("講師紹介", "instructors/", "", "instructors"),
        ("ワークショップ", "workshops/", "", "workshops"),
    ]),
    ("media", "観る・聴く", [
        ("番組・動画", "broadcast/", "", "broadcast"),
        ("Rhythm Speaker Show", "rss/", "", "rss"),
        ("音楽を聴く", "music/", "", "music"),
    ]),
    ("more", "ご案内", [
        ("アクセス", "access/", "", "access"),
        ("よくある質問", "faq/", "", "faq"),
        ("教室紹介", "about/", "", "about"),
        ("全サービス", "ecosystem/", "", "ecosystem"),
    ]),
]


CARD_GROUPS = {"quick", "services"}
ICON_PATHS = {
    "rental": '<path d="M3 10l9-7 9 7v11H3zM9 21v-7h6v7"/>',
    "goods": '<path d="M4 8h16l1 13H3zM8 9V6a4 4 0 0 1 8 0v3"/>',
    "wallet": '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    "line": '<path d="M21 11a9 8 0 0 1-9 8H9l-5 3 1-6a9 8 0 1 1 16-5Z"/>',
}


def render_card(label: str, href: str, detail: str, role: str, current: bool) -> str:
    attr = ' aria-current="page"' if current else ''
    icon = ''
    if role in ICON_PATHS:
        icon = ('<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" '
                'fill="none" stroke="currentColor" stroke-width="1.75" '
                'stroke-linecap="round" stroke-linejoin="round">' + ICON_PATHS[role] + '</svg>')
    badge = ' <em>RS Wallet</em>' if role == 'wallet' else ''
    subline = f'<small>{detail}</small>' if detail else ''
    return (f'<a class="rs-menu-action rs-menu-action--{role}" href="{href}"{attr}>'
            f'{icon}<strong>{label}{badge}</strong>{subline}<span aria-hidden="true">↗</span></a>')


def href_for(prefix: str, route: str) -> str:
    if route.startswith(("https://", "mailto:")):
        return route
    return prefix + route


def render_menu(prefix: str, current: str) -> str:
    out = ['<button id="menu-button" class="menu-button" type="button" aria-expanded="false" aria-controls="menu" aria-label="メニューを開く">メニュー <span aria-hidden="true">＋</span></button>',
           '<div id="menu" class="rs-menu" hidden><nav class="rs-menu-nav" aria-label="すべてのページ">']
    for key, heading, items in MENU_GROUPS:
        lines = []
        for label, route, detail, role in items:
            href = href_for(prefix, route)
            if key in CARD_GROUPS:
                lines.append(render_card(label, href, detail, role, route == current))
            else:
                attr = ' aria-current="page"' if route == current else ''
                lines.append(f'<li><a class="rs-menu-link rs-menu-link--{role}" href="{href}"{attr}>{label}</a></li>')
        out.append(f'<section class="rs-menu-group rs-menu-group--{key}" aria-label="{heading}"><p class="rs-menu-label">{heading}</p>')
        if key in CARD_GROUPS:
            out.append('<div class="rs-menu-primary">' + ''.join(lines) + '</div>')
        else:
            out.append('<ul class="rs-menu-links">' + ''.join(lines) + '</ul>')
        out.append('</section>')
    out.append('</nav></div>')
    return ''.join(out)


def page_prefix(path: Path) -> str:
    return "../" * (len(path.parts) - 1)


def main() -> int:
    changed = 0
    for path, current in PAGES.items():
        source = path.read_text(encoding="utf-8")
        prefix = page_prefix(path)
        menu = render_menu(prefix, current)
        # Exact bounded replacement; never change booking content or footer.
        updated, count = re.subn(
            r'<button id="menu-button".*?</nav></div>(?=[\s\S]*?</header>)',
            lambda _: menu,
            source,
            count=1,
            flags=re.S,
        )
        if count != 1:
            raise SystemExit(f"menu boundary missing: {path}")
        updated = re.sub(r'(?<=assets/ux-lab/app.css)(?:\?[^"]*)?(?=")', '?v=20261111menulevel3', updated)
        updated = re.sub(r'(?<=assets/ux-lab/app.js)(?:\?[^"]*)?(?=")', '?v=20261111homejourney' if path == ROOT / 'index.html' else '?v=20261111menulevel3', updated)
        if updated != source:
            path.write_text(updated, encoding="utf-8")
            changed += 1
            print(f"UPDATED {path}")
        else:
            print(f"OK {path}")
    print(f"changed_pages={changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
