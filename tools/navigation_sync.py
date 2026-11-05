#!/usr/bin/env python3
"""Generate the purpose-ranked right-header menu from one canonical route registry.

Preserves the ten historical RS-NAV-2 destinations and adds existing schedule,
pricing, instructor, rental, Wallet and LINE routes. The priority schedule action
remains visible on /schedule/; other same-page links are omitted.
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
# P0 first; other destinations are sorted by how the visitor uses them.
# Values are (display label, route, explanatory subline, CSS role).
MENU_GROUPS = [
    ("quick", "よく使うメニュー", [
        ("レッスン日程", "schedule/", "日時・講師から探す", "schedule"),
        ("初回体験 ¥1,000", "trial/", "初めての方はこちら", "trial"),
    ]),
    ("lessons", "教室・レッスン", [
        ("料金", "pricing/", "", "pricing"),
        ("クラス紹介", "classes/", "", "classes"),
        ("講師紹介", "instructors/", "", "instructors"),
        ("ワークショップ", "workshops/", "", "workshops"),
        ("アクセス", "access/", "", "access"),
        ("スタジオレンタル", "rental/", "", "rental"),
    ]),
    ("media", "観る・聴く・学ぶ", [
        ("番組・動画", "broadcast/", "", "broadcast"),
        ("Rhythm Speaker Show", "rss/", "", "rss"),
        ("音楽を聴く", "music/", "", "music"),
        ("タップダンスを学ぶ", "https://tapdance-rhythmspeaker.hatenablog.com/", "", "tapblog"),
    ]),
    ("shopping", "買う・選ぶ", [
        ("オリジナルグッズ", "https://rhythmspeaker.stores.jp/?all_items=true", "", "goods"),
        ("商品レビューを読む", "https://rhythmspeaker.hatenablog.com/", "", "reviewblog"),
    ]),
    ("member", "会員・お問い合わせ", [
        ("マイページ", "https://tips-app-seven.vercel.app/", "RS Wallet", "wallet"),
        ("公式LINE", "https://lin.ee/zC5YLe7", "相談・変更", "line"),
    ]),
    ("more", "その他のページ", [
        ("教室トップ", "", "", "home"),
        ("教室紹介", "about/", "", "about"),
        ("よくある質問", "faq/", "", "faq"),
        ("すべてのサービス", "ecosystem/", "", "ecosystem"),
    ]),
]


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
            is_schedule_here = key == "quick" and role == "schedule" and current == "schedule/"
            if route == current and not is_schedule_here:
                continue  # omit routine self-links, but keep the main booking action visible
            href = href_for(prefix, route)
            if key == "quick":
                current_page_attr = ' aria-current="page"' if is_schedule_here else ''
                lines.append(f'<a class="rs-menu-action rs-menu-action--{role}" href="{href}"{current_page_attr}><strong>{label}</strong><small>{detail}</small><span aria-hidden="true">↗</span></a>')
            else:
                extra = f'<small>{detail}</small>' if detail else ''
                lines.append(f'<li><a class="rs-menu-link rs-menu-link--{role}" href="{href}">{label}{extra}</a></li>')
        if not lines:
            continue
        out.append(f'<section class="rs-menu-group rs-menu-group--{key}" aria-label="{heading}"><p class="rs-menu-label">{heading}</p>')
        if key == "quick":
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
