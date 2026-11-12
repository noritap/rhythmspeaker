#!/usr/bin/env python3
"""Read-only publication guard for Shoten product ops; no network or credentials."""
import json
import re
from pathlib import Path
from urllib.parse import urlsplit, parse_qs

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "shoten/catalog.json"
ASSET = ROOT / "shoten"
PATTERN = re.compile(r"^\./assets/products/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp|avif)$")
ID = re.compile(r"^RS-P\d{4,}$")
ASIN = re.compile(r"^[A-Z0-9]{10}$")

def validate(data, root=ASSET):
    errors = []
    ids, asins = set(), set()
    for n, p in enumerate(data.get("products", []), 1):
        prefix = f"product[{n}]"
        pid, asin = p.get("product_id"), p.get("asin")
        if not isinstance(pid, str) or not ID.fullmatch(pid) or pid in ids:
            errors.append(f"{prefix}: invalid/duplicate product_id")
        ids.add(pid)
        if not isinstance(asin, str) or not ASIN.fullmatch(asin) or asin in asins:
            errors.append(f"{prefix}: invalid/duplicate ASIN")
        asins.add(asin)
        for key in ("brand", "model", "formal_name", "summary", "caution"):
            if not isinstance(p.get(key), str) or not p[key].strip():
                errors.append(f"{prefix}: missing {key}")
        href = p.get("href", "")
        try:
            u = urlsplit(href)
            query = parse_qs(u.query)
            short = u.scheme == "https" and u.netloc == "link.amazon" and bool(re.fullmatch(r"/[A-Za-z0-9]+", u.path)) and not u.query and not u.fragment and p.get("affiliateLinkKind") == "AMAZON_OFFICIAL_SHORT" and p.get("ownerVerifiedShortLink") is True and bool(re.fullmatch(r"[A-Za-z0-9_-]+-22", p.get("trackingId", "")))
            direct = u.scheme == "https" and u.netloc in ("www.amazon.co.jp", "amazon.co.jp") and asin in u.path and len(query.get("tag", [])) == 1 and bool(query["tag"][0])
            if not (short or direct):
                errors.append(f"{prefix}: unverified affiliate URL")
        except (TypeError, ValueError):
            errors.append(f"{prefix}: invalid affiliate URL")
        photos = p.get("gallery", [])
        if not isinstance(photos, list) or len(photos) > 5:
            errors.append(f"{prefix}: gallery must contain at most 5 images")
            photos = []
        approved = p.get("approvedPhoto")
        if approved and not any(item.get("src") == approved for item in photos if isinstance(item, dict)):
            errors.append(f"{prefix}: approvedPhoto missing from gallery")
        for item in photos:
            if not isinstance(item, dict) or not isinstance(item.get("src"), str) or not isinstance(item.get("alt"), str) or not item["alt"].strip():
                errors.append(f"{prefix}: invalid gallery item")
                continue
            src = item["src"]
            if PATTERN.fullmatch(src):
                if not (root / src).is_file():
                    errors.append(f"{prefix}: missing image {src}")
                continue
            remote = urlsplit(src)
            allowed_remote = remote.scheme == "https" and (
                (remote.netloc == "www.pbtech.co.nz" and remote.path.startswith("/imgprod/")) or
                (remote.netloc == "www.jbhifi.com.au" and remote.path.startswith("/cdn/shop/products/")) or
                (remote.netloc == "bf1af2.akinoncloudcdn.com" and remote.path.startswith("/products/"))
            )
            if not allowed_remote:
                errors.append(f"{prefix}: invalid gallery image URL")
        blog = p.get("blogArticle")
        if blog is not None:
            if not isinstance(blog, dict) or not isinstance(blog.get("title"), str) or not blog["title"].strip() or not isinstance(blog.get("url"), str) or not blog["url"].startswith("https://rhythmspeaker.hatenablog.com/entry/"):
                errors.append(f"{prefix}: invalid blogArticle")
    return errors

def main():
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    errors = validate(data)
    if errors:
        print("\n".join(errors))
        raise SystemExit(1)
    print(f"Shoten product ops: OK ({len(data['products'])} products)")

if __name__ == "__main__":
    main()
