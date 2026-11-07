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
}
# Values are (display label, route, explanatory subline, CSS role).
MENU_GROUPS = [
    ("quick", "よく使うメニュー", [
        ("レッスン予約", "schedule/", "開催日程・講師から探す", "schedule"),
        ("初回体験 ¥1,000", "trial/", "初めての方はこちら", "trial"),
    ]),
    ("services", "レンタル・グッズ", [
        ("スタジオレンタル", "rental/", "空き時間・料金・予約", "rental"),
        ("グッズを買う", "https://rhythmspeaker.stores.jp/?all_items=true", "Rhythm Speaker オリジナル商品", "goods"),
    ]),
    ("member", "会員の方へ", [
        ("マイページ", "https://tips-app-seven.vercel.app/", "残高・レッスン利用・会員情報", "wallet"),
    ]),
    ("support", "お問い合わせ・ご案内", [
        ("お問い合わせ・相談", "https://lin.ee/zC5YLe7", "質問・予約・変更はこちら", "line"),
        ("アクセス", "access/", "池袋駅からの行き方", "access"),
        ("よくある質問", "faq/", "初めての方の疑問を解決", "faq"),
    ]),
    ("lessons", "教室・レッスン", [
        ("料金・通い方", "pricing/", "", "pricing"),
        ("クラス紹介", "classes/", "", "classes"),
        ("講師紹介", "instructors/", "", "instructors"),
        ("ワークショップ", "workshops/", "", "workshops"),
    ]),
    ("media", "観る・聴く・学ぶ", [
        ("番組・動画", "broadcast/", "", "broadcast"),
        ("Rhythm Speaker Show", "rss/", "", "rss"),
        ("音楽を聴く", "music/", "", "music"),
        ("タップダンスを学ぶ", "https://tapdance-rhythmspeaker.hatenablog.com/", "", "tapblog"),
    ]),
    ("more", "その他のページ", [
        ("教室トップ", "", "", "home"),
        ("教室紹介", "about/", "", "about"),
        ("全サービス", "ecosystem/", "", "ecosystem"),
        ("商品レビューを読む", "https://rhythmspeaker.hatenablog.com/", "", "reviewblog"),
    ]),
]


CARD_GROUPS = {"quick", "services", "member", "support"}
ICON_PATHS = {
    "rental": '<path d="M3 10l9-7 9 7v11H3zM9 21v-7h6v7"/>',
    "goods": '<path d="M4 8h16l1 13H3zM8 9V6a4 4 0 0 1 8 0v3"/>',
    "wallet": '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    "line": '<path d="M21 11a9 8 0 0 1-9 8H9l-5 3 1-6a9 8 0 1 1 16-5Z"/>',
    "access": '<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2"/>',
    "faq": '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 3h.01"/>',
}


def render_card(label: str, href: str, detail: str, role: str, current: bool) -> str:
    attr = ' aria-current="page"' if current else ''
    icon = ''
    if role in ICON_PATHS:
        icon = ('<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" '
                'fill="none" stroke="currentColor" stroke-width="1.75" '
                'stroke-linecap="round" stroke-linejoin="round">' + ICON_PATHS[role] + '</svg>')
    badge = ' <em>RS Wallet</em>' if role == 'wallet' else ''
    return (f'<a class="rs-menu-action rs-menu-action--{role}" href="{href}"{attr}>'
            f'{icon}<strong>{label}{badge}</strong><small>{detail}</small><span aria-hidden="true">↗</span></a>')


def href_for(prefix: str, route: str) -> str:
    if route.startswith(("https://", "mailto:")):
        return route
    return (prefix + route) if route else (prefix or "./")


def render_menu(prefix: str, current: str) -> str:
    out = ['<button id="menu-button" class="menu-button" type="button" aria-expanded="false" aria-controls="menu" aria-label="メニューを開く">メニュー <span aria-hidden="true">＋</span></button>',
           '<div id="menu" class="rs-menu" hidden><nav class="rs-menu-nav" aria-label="すべてのページ">']
    for key, heading, items in MENU_GROUPS:
        lines = []
        for label, route, detail, role in items:
            if route == current and key not in CARD_GROUPS:
                continue
            href = href_for(prefix, route)
            if key in CARD_GROUPS:
                lines.append(render_card(label, href, detail, role, route == current))
            else:
                lines.append(f'<li><a class="rs-menu-link rs-menu-link--{role}" href="{href}">{label}</a></li>')
        if not lines:
            continue
        out.append(f'<section class="rs-menu-group rs-menu-group--{key}" aria-label="{heading}"><p class="rs-menu-label">{heading}</p>')
        if key in CARD_GROUPS:
            out.append('<div class="rs-menu-primary">' + ''.join(lines) + '</div>')
        else:
            out.append('<ul class="rs-menu-links">' + ''.join(lines) + '</ul>')
        out.append('</section>')
    out.append('</nav></div>')
    return ''.join(out)


def main() -> int:
    changed = 0
    for path, current in PAGES.items():
        source = path.read_text(encoding="utf-8")
        prefix = "" if path == Path("index.html") else "../"
        menu = render_menu(prefix, current)
        # Exact bounded replacement; never change booking content or footer.
        updated, count = re.subn(
            r'<button id="menu-button".*?</header>',
            lambda _: menu + '</header>',
            source,
            count=1,
            flags=re.S,
        )
        if count != 1:
            raise SystemExit(f"menu boundary missing: {path}")
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
