#!/usr/bin/env python3
from pathlib import Path
import sys

PAGE = Path("ecosystem/index.html")

checks = [
    ("internal governance copy removed", "内部10部門のPrimary Owner" not in PAGE.read_text(encoding="utf-8")),
    ("ABOUT links to access", 'href="../access/"' in PAGE.read_text(encoding="utf-8")),
    ("ABOUT links to FAQ", 'href="../faq/"' in PAGE.read_text(encoding="utf-8")),
    ("all seven category anchors exist", all(f'id="{x}"' in PAGE.read_text(encoding="utf-8") for x in ("studio", "watch", "music", "events", "learn", "shop", "about"))),
]

failed = False
for label, ok in checks:
    print(f"{'PASS' if ok else 'FAIL'}: {label}")
    failed |= not ok

sys.exit(1 if failed else 0)
