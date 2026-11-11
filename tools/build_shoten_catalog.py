#!/usr/bin/env python3
"""Build a public, medium-scoped Shoten catalog from a pinned private Commerce snapshot."""
import argparse
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SURFACE_ID = "rhythmspeaker-web"
SURFACE_URL = "https://noritap.github.io/rhythmspeaker/shoten/"
CATEGORY_BY_TAG = {
    "cleaning": ("home", "robot-vacuums", "ロボット掃除機", "peach", "time"),
    "audio": ("sound", "wireless-headphones", "ワイヤレスヘッドホン", "blue", "focus"),
    "ac-power": ("outdoor", "ac-power", "AC対応電源", "green", "carry"),
    "dc-power": ("outdoor", "dc-power", "USB・DC電源", "green", "carry"),
}


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def secure_url(url):
    if not isinstance(url, str) or any(c.isspace() or c == "\\" for c in url):
        return None
    try:
        parts = urlsplit(url)
        if parts.scheme == "https" and parts.hostname and not (
            parts.username or parts.password or parts.port
        ):
            return parts
    except ValueError:
        pass
    return None


def verified_special_link(url, asin, tracking_id):
    parts = secure_url(url)
    if not parts or parts.hostname not in {"www.amazon.co.jp", "amazon.co.jp"} or parts.fragment:
        return False
    if not re.fullmatch(r"/(?:dp|gp/product)/" + re.escape(asin) + r"/?", parts.path):
        return False
    query = parse_qs(parts.query, keep_blank_values=True)
    if any(re.fullmatch(r"key|token|api[_-]?key|access[_-]?token|password|secret|signature", key, re.I) for key in query):
        return False
    return bool(re.fullmatch(r"[A-Za-z0-9_-]+", tracking_id or "")) and query.get("tag") == [tracking_id]


def owner_verified_short_link(link, asin, tracking_id):
    """Only a specific owner-attested Amazon-issued short link may be published."""
    url = link.get("special_link")
    parts = secure_url(url)
    return bool(
        parts and parts.hostname == "link.amazon" and not parts.query and not parts.fragment
        and re.fullmatch(r"/[A-Za-z0-9]+", parts.path)
        and link.get("generated_by") in {"SITESTRIPE", "MOBILE_GETLINK", "AMAZON_OFFICIAL_OTHER"}
        and link.get("verification_method") == "OWNER_CONFIRMED_AMAZON_ISSUED_AND_CHROME_DESTINATION"
        and link.get("source_page_url") == f"https://www.amazon.co.jp/dp/{asin}"
        and link.get("tracking_id") == tracking_id
    )


def photo_path(export, product, shop):
    image = export.get("image") or {}
    original = product.get("image") or {}
    ref = image.get("asset_ref")
    if (
        image.get("source_kind") not in {"ORIGINAL_OWNED", "LICENSED"}
        or image.get("source_kind") != original.get("source_kind")
        or ref != original.get("asset_ref")
        or not original.get("rights_evidence")
        or not re.fullmatch(r"\./assets/products/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp|avif)", ref or "")
    ):
        return None
    path = shop / ref
    return ref if path.is_file() and not path.is_symlink() else None


def project(export_rows, source_dir, shop, source_sha, limit):
    if not re.fullmatch(r"[0-9a-f]{40}", source_sha):
        raise ValueError("Pin the reviewed Commerce main commit SHA")
    snapshot = {"schema_version": 1, "surface": SURFACE_ID, "source_sha": source_sha, "products": []}
    if not export_rows:
        return snapshot

    def index(name, key):
        return {item[key]: item for item in read(source_dir / "data" / (name + ".json"))}

    surface = index("surfaces", "surface_id").get(SURFACE_ID)
    if not surface or surface["url"] != SURFACE_URL or (
        surface.get("amazon_registered_status") != "CONFIRMED"
        or surface.get("publication_authorized") is not True
        or surface.get("disclosure_verified") is not True
    ):
        raise ValueError("The exact /shoten/ publishing surface is not approved")
    products = index("products", "product_id")
    links = index("affiliate_links", "link_id")
    placements = index("placements", "placement_id")
    approvals = read(source_dir / "data/approvals.json")
    used_ids, used_asins = set(), set()
    for row in export_rows:
        pid, asin = row["product_id"], row["asin"]
        product = products.get(pid)
        place = placements.get(row["placement_id"], {})
        link = links.get(place.get("link_id"), {})
        if (
            not product or not re.fullmatch(r"RS-P\d{4,}", pid)
            or product.get("marketplace") != "amazon.co.jp"
            or product.get("publication_state") not in {"APPROVED", "PUBLIC"}
            or not re.fullmatch(r"[A-Z0-9]{10}", asin)
            or (asin, row["brand"], row["product_name"], row["category_ids"], row["editorial"]) != (
                product.get("asin"), product.get("brand"), product.get("product_name"),
                product.get("category_ids"), product.get("editorial")
            )
            or not row["brand"] or not row["product_name"]
            or row.get("disclosure_required") is not True
            or place.get("status") != "APPROVED" or place.get("product_id") != pid
            or place.get("surface_id") != SURFACE_ID
            or not any(a.get("object_id") == row["placement_id"] and a.get("actor_role") == "OWNER"
                       and a.get("decision") == "APPROVED" for a in approvals)
            or link.get("product_id") != pid or link.get("surface_id") != SURFACE_ID
            or link.get("status") != "VERIFIED" or not link.get("verification_method")
            or not link.get("verified_at") or link.get("generated_by") not in {"SITESTRIPE", "MOBILE_GETLINK", "AMAZON_OFFICIAL_OTHER", "CREATORS_API", "PA_API"}
            or link.get("special_link") != row["affiliate_url"]
            or link.get("tracking_id") != surface.get("tracking_id")
            or not (verified_special_link(row["affiliate_url"], asin, surface.get("tracking_id"))
                    or owner_verified_short_link(link, asin, surface.get("tracking_id")))
            or pid in used_ids or asin in used_asins
        ):
            raise ValueError("Commerce approval, identity or Special Link mismatch")
        used_ids.add(pid)
        used_asins.add(asin)
        categories = {CATEGORY_BY_TAG[tag] for tag in row["category_ids"] if tag in CATEGORY_BY_TAG}
        if len(categories) != 1:
            raise ValueError("Product needs one supported editorial category")
        category, subcategory, kind, tint, purpose = categories.pop()
        editorial = row["editorial"]
        checked = date.fromisoformat(editorial["verified_at"]).isoformat()
        sources = [
            {"url": value, "label": "商品情報の出典"}
            for value in editorial["source_urls"] if secure_url(value) and not secure_url(value).query
        ]
        if not sources or not editorial["why_recommend"]:
            raise ValueError("Approved product needs a sourced description")
        good = "・".join(editorial["good_for"]) or "用途に合うかをご確認ください。"
        caution = "・".join(editorial["limitations"]) or "購入前にメーカーの仕様をご確認ください。"
        name = row["product_name"]
        snapshot["products"].append({
            "product_id": pid, "asin": asin, "brand": row["brand"], "model": name,
            "formal_name": f"{row['brand']} {name}", "category": category, "subcategory": subcategory,
            "kind": kind, "tint": tint, "purpose": purpose, "tags": editorial["good_for"],
            "eyebrow": editorial["short_copy"] or "", "summary": editorial["why_recommend"],
            "good": good, "caution": caution, "highlight": good, "date": checked,
            "specs": {}, "comparison": {"選ぶ基準": good, "主な仕様": editorial["why_recommend"]},
            "reasons": [editorial["why_recommend"]], "sources": sources, "href": row["affiliate_url"],
            "approvedPhoto": photo_path(row, product, shop),\n            "affiliateLinkKind": "AMAZON_OFFICIAL_SHORT" if owner_verified_short_link(link, asin, surface.get("tracking_id")) else "AMAZON_DIRECT",\n            "ownerVerifiedShortLink": owner_verified_short_link(link, asin, surface.get("tracking_id")),\n            "trackingId": surface.get("tracking_id")
        })
    if len(snapshot["products"]) > limit:
        raise ValueError("Approved export exceeds the explicitly authorized publication count")
    return snapshot


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--commerce", type=Path, required=True, help="Reviewed private Commerce main snapshot")
    parser.add_argument("--sha", required=True, help="Exact commit SHA of the reviewed main snapshot")
    parser.add_argument("--output", type=Path, default=ROOT / "shoten/catalog.json")
    parser.add_argument("--limit", type=int, default=1, help="Maximum approved products, one for the pilot")
    args = parser.parse_args()
    source = args.commerce.resolve()
    if source.is_relative_to(ROOT):
        raise ValueError("Keep the Commerce source outside the public repository")
    if args.limit < 1 or not re.fullmatch(r"[0-9a-f]{40}", args.sha):
        raise ValueError("Use a valid source SHA and positive publication limit")
    if (source / ".git").exists():
        head = subprocess.check_output(["git", "-C", source, "rev-parse", "HEAD"], text=True).strip()
        dirty = subprocess.check_output(["git", "-C", source, "status", "--porcelain", "--untracked-files=no"], text=True)
        if head != args.sha or dirty:
            raise ValueError("The Commerce checkout must match the reviewed SHA with clean tracked files")
    else:
        evidence = read(source / "snapshot-source.json")
        if evidence != {"repository": "noritap/AMAZON_COMMERCE_DATA_OS", "branch": "main", "sha": args.sha}:
            raise ValueError("A connector snapshot needs the exact source repository, main branch and SHA")
    for script in ["validate.py", "check_schemas.py", "build_exports.py"]:
        subprocess.run([sys.executable, str(source / "scripts" / script)], cwd=source, check=True)
    rows = read(source / "exports" / (SURFACE_ID + ".json"))
    snapshot = project(rows, source, ROOT / "shoten", args.sha, args.limit)
    payload = json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n"
    tmp = args.output.with_suffix(args.output.suffix + ".tmp")
    tmp.write_text(payload, encoding="utf-8")
    tmp.replace(args.output)
    print(f"Shoten: {len(snapshot['products'])} approved products")


if __name__ == "__main__":
    main()
