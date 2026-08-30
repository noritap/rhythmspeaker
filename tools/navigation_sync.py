#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

PAGES = {
    Path("index.html"): None,
    Path("trial/index.html"): "初回体験",
    Path("classes/index.html"): "クラス",
    Path("about/index.html"): "教室紹介",
    Path("ecosystem/index.html"): "サービス一覧",
    Path("faq/index.html"): "FAQ",
    Path("access/index.html"): "アクセス",
    Path("rss/index.html"): "RSS",
}

ITEMS = [
    ("教室トップ", ""),
    ("初回体験", "trial/"),
    ("クラス", "classes/"),
    ("教室紹介", "about/"),
    ("サービス一覧", "ecosystem/"),
    ("FAQ", "faq/"),
    ("アクセス", "access/"),
    ("RSS", "rss/"),
]
SHOP_URL = "https://rhythmspeaker.stores.jp/"
SHOP_LABEL = "SHOP"


def href_for(prefix: str, route: str, current: str | None, label: str) -> str:
    if current == label:
        return "./"
    if not prefix:
        return route
    return prefix if route == "" else prefix + route


def render_list(prefix: str, current: str | None, css_class: str, mobile: bool) -> str:
    indent = "      " if mobile else "    "
    item_indent = indent + "  "
    attrs = ' aria-label="モバイルサイト案内"' if mobile else ""
    lines = [f'{indent}<ul class="{css_class}"{attrs}>']
    for label, route in ITEMS:
        href = href_for(prefix, route, current, label)
        current_attr = ' aria-current="page"' if current == label else ""
        lines.append(f'{item_indent}<li><a href="{href}"{current_attr}>{label}</a></li>')
    external_attrs = '' if mobile else ' class="nav-external" aria-label="Rhythm Speaker Official Shopへ"'
    lines.append(f'{item_indent}<li><a href="{SHOP_URL}"{external_attrs}>{SHOP_LABEL}</a></li>')
    lines.append(f"{indent}</ul>")
    return "\n".join(lines)


def replace_once(text: str, css_class: str, replacement: str, path: Path) -> str:
    updated, count = re.subn(
        rf'\s*<ul\s+class="{re.escape(css_class)}"[^>]*>.*?</ul>',
        "\n" + replacement,
        text,
        count=1,
        flags=re.S | re.I,
    )
    if count != 1:
        raise SystemExit(f"{css_class} block not found exactly once: {path}")
    return updated


def main() -> int:
    changed = 0
    for path, current in PAGES.items():
        text = path.read_text(encoding="utf-8")
        prefix = "" if path == Path("index.html") else "../"
        updated = replace_once(text, "nav-links", render_list(prefix, current, "nav-links", False), path)
        updated = replace_once(updated, "mobile-nav-panel", render_list(prefix, current, "mobile-nav-panel", True), path)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            print(f"UPDATED {path}")
            changed += 1
        else:
            print(f"OK {path}")
    print(f"changed_pages={changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
