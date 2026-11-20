#!/usr/bin/env python3
"""Gate evaluation and ledger recording for Shoten auto publication.

Implements the objective gates of PRODUCT_OPERATIONS_V1 section 8 (standing
delegation, 2026-11-20): a product may be published without per-item owner
confirmation when every objective condition is satisfied. This script only
prepares the Commerce ledger (approvals / placements / publication_state)
and computes the catalog limit for tools/build_shoten_catalog.py; it never
commits, pushes, or writes the public catalog itself.

Two groups are published:
  READY  - every record already exists (owner approval was recorded through
           the normal flow) but the product is not in the public catalog yet.
           No ledger edits are made for these.
  NEW    - the only missing pieces are the records this workflow is
           delegated to create (product approval, placement, placement
           approval). At most --limit (hard-capped at 10) per run.

Anything else is reported as blocked with its reasons. Ledger anomalies
(duplicate IDs, duplicate ASINs, dangling references) abort the run before
anything is written (fail-closed).

Modes:
  evaluate (default): --commerce DIR --catalog FILE --result FILE
                      [--limit N] [--dry-run] [--run-url URL]
  verify:             --verify-catalog FILE --baseline RESULT_JSON
"""
import argparse
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

SURFACE_ID = "rhythmspeaker-web"
MAX_DAILY_NEW = 10
# Missing items that this workflow is delegated to fix by creating records.
RECORD_MISSING = {
    "product_publication_approval",
    "approved_placement",
    "placement_link_match",
    "owner_placement_approval",
}
EVIDENCE = (
    "PRODUCT_OPERATIONS_V1 §8 standing delegation (owner instruction "
    "2026-11-20); recorded by the shoten-auto-publish workflow"
)

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_shoten_catalog as builder  # noqa: E402


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def write_json(path, data):
    Path(path).write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def find_anomalies(products, links, placements, approvals):
    errors = []

    def duplicates(values):
        seen, dup = set(), set()
        for value in values:
            if value in seen:
                dup.add(value)
            seen.add(value)
        return sorted(dup)

    for label, values in [
        ("product_id", [p.get("product_id") for p in products]),
        ("link_id", [l.get("link_id") for l in links]),
        ("placement_id", [p.get("placement_id") for p in placements]),
        ("approval_id", [a.get("approval_id") for a in approvals]),
        ("product+surface link", [(l.get("product_id"), l.get("surface_id")) for l in links]),
        ("product+surface placement", [(p.get("product_id"), p.get("surface_id")) for p in placements]),
    ]:
        dup = duplicates(values)
        if dup:
            errors.append(f"duplicate {label}: {dup}")
    asin_pairs = [
        (p.get("marketplace"), p.get("asin")) for p in products if p.get("asin")
    ]
    dup = duplicates(asin_pairs)
    if dup:
        errors.append(f"duplicate marketplace/ASIN: {dup}")
    product_ids = {p.get("product_id") for p in products}
    link_ids = {l.get("link_id") for l in links}
    for link in links:
        if link.get("product_id") not in product_ids:
            errors.append(f"{link.get('link_id')}: unknown product")
    for place in placements:
        if place.get("product_id") not in product_ids:
            errors.append(f"{place.get('placement_id')}: unknown product")
        if place.get("link_id") and place.get("link_id") not in link_ids:
            errors.append(f"{place.get('placement_id')}: unknown link")
    return errors


def category_ok(product):
    """Mirror the builder's category resolution: exactly one category tuple."""
    cats = product.get("category_ids") or []
    selected = [t for t in cats if t in builder.CATEGORY_BY_TAG]
    specialist = [t for t in selected if t not in {"life", "work", "outdoor"}]
    return len({builder.CATEGORY_BY_TAG[t] for t in (specialist or selected)}) == 1


def editorial_reasons(product):
    reasons = []
    editorial = product.get("editorial") or {}
    try:
        date.fromisoformat(editorial["verified_at"]).isoformat()
    except (KeyError, TypeError, ValueError):
        reasons.append("editorial_verified_at")
    sources = [
        value
        for value in editorial.get("source_urls") or []
        if builder.secure_url(value) and not builder.secure_url(value).query
    ]
    if not sources:
        reasons.append("editorial_sources")
    if not editorial.get("why_recommend"):
        reasons.append("editorial_why_recommend")
    return reasons


def link_ok(link, product, surface):
    """Mirror the link acceptance checks of build_shoten_catalog.project()."""
    if not link or link.get("status") not in {"VERIFIED", "OWNER_PROVIDED"}:
        return False
    if not link.get("verification_method"):
        return False
    asin, tracking_id = product.get("asin"), link.get("tracking_id")
    if link.get("status") == "VERIFIED":
        if not link.get("verified_at"):
            return False
        if link.get("generated_by") not in {
            "SITESTRIPE", "MOBILE_GETLINK", "AMAZON_OFFICIAL_OTHER",
            "CREATORS_API", "PA_API",
        }:
            return False
        if not re.fullmatch(r"[A-Za-z0-9_-]+-22", tracking_id or ""):
            return False
    if surface.get("tracking_id") and tracking_id and tracking_id != surface["tracking_id"]:
        return False
    return bool(
        builder.verified_special_link(link.get("special_link"), asin, tracking_id)
        or builder.owner_verified_short_link(link, asin, tracking_id)
    )


def strict_reasons(product, link, surface):
    """Section 8 gates that go beyond the readiness audit's missing list."""
    reasons = []
    if not re.fullmatch(r"[A-Z0-9]{10}", product.get("asin") or ""):
        reasons.append("product_asin")
    if product.get("marketplace") != "amazon.co.jp":
        reasons.append("marketplace")
    if not category_ok(product):
        reasons.append("category_unresolved")
    reasons.extend(editorial_reasons(product))
    if not link_ok(link, product, surface):
        reasons.append("affiliate_link_not_accepted")
    return reasons


def next_id(existing_ids, prefix):
    highest = 0
    for value in existing_ids:
        match = re.fullmatch(re.escape(prefix) + r"(\d+)", value or "")
        if match:
            highest = max(highest, int(match.group(1)))
    return f"{prefix}{highest + 1:04d}"


def run_commerce_script(commerce, name):
    proc = subprocess.run(
        [sys.executable, str(commerce / "scripts" / name)],
        cwd=commerce, capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"{name} failed: {proc.stdout.strip()} {proc.stderr.strip()}")


def export_row_count(commerce):
    run_commerce_script(commerce, "build_exports.py")
    rows = read_json(commerce / "exports" / (SURFACE_ID + ".json"))
    return len(rows)


def evaluate(args):
    commerce = Path(args.commerce)
    data = commerce / "data"
    products = read_json(data / "products.json")
    links = read_json(data / "affiliate_links.json")
    placements = read_json(data / "placements.json")
    approvals = read_json(data / "approvals.json")
    surfaces = read_json(data / "surfaces.json")
    surface = next((s for s in surfaces if s["surface_id"] == SURFACE_ID), None)
    catalog = read_json(args.catalog)
    published_ids = [p["product_id"] for p in catalog.get("products", [])]

    result = {
        "dry_run": bool(args.dry_run),
        "publish_count": 0,
        "published": [],
        "ready": [],
        "new_approvals": [],
        "blocked": [],
        "previous_count": len(published_ids),
        "previous_product_ids": published_ids,
        "catalog_limit": len(published_ids),
        "ledger_changed": False,
    }

    anomalies = find_anomalies(products, links, placements, approvals)
    if anomalies:
        result["error"] = anomalies
        write_json(args.result, result)
        print("Ledger anomalies detected; nothing was changed:")
        for error in anomalies:
            print(f"- {error}")
        return 2
    if surface is None:
        result["error"] = [f"surface {SURFACE_ID} not found"]
        write_json(args.result, result)
        print("Publishing surface not found; nothing was changed.")
        return 2

    sys.path.insert(0, str(commerce / "scripts"))
    import publication_readiness

    rows = publication_readiness.audit(
        products, links, placements, approvals, surface, published_ids
    )
    missing_by_id = {row["product_id"]: row["missing"] for row in rows}
    product_by_id = {p["product_id"]: p for p in products}
    link_by_product = {
        l["product_id"]: l for l in links if l.get("surface_id") == SURFACE_ID
    }
    placement_by_product = {
        p["product_id"]: p for p in placements if p.get("surface_id") == SURFACE_ID
    }
    approved_objects = {
        a["object_id"]
        for a in approvals
        if a.get("actor_role") == "OWNER" and a.get("decision") == "APPROVED"
    }

    ready, candidates, blocked = [], [], []
    for pid in sorted(product_by_id):
        if pid in published_ids:
            continue
        product = product_by_id[pid]
        missing = missing_by_id.get(pid, [])
        link = link_by_product.get(pid)
        placement = placement_by_product.get(pid)
        reasons = strict_reasons(product, link, surface)
        if not missing:
            if reasons:
                blocked.append({"product_id": pid, "reasons": reasons})
            else:
                ready.append(pid)
            continue
        if (
            set(missing) <= RECORD_MISSING
            and link is not None
            and product.get("publication_state") in {"CANDIDATE", "APPROVED"}
        ):
            if placement is not None and placement.get("link_id") != link["link_id"]:
                blocked.append({"product_id": pid, "reasons": ["placement_link_match"]})
            elif reasons:
                blocked.append({"product_id": pid, "reasons": reasons})
            else:
                candidates.append(pid)
            continue
        merged = list(dict.fromkeys(missing + reasons))
        blocked.append({"product_id": pid, "reasons": merged})

    limit = min(max(args.limit, 0), MAX_DAILY_NEW)
    selected_new = candidates[:limit]
    publish = ready + selected_new
    result.update(
        publish_count=len(publish),
        published=publish,
        ready=ready,
        new_approvals=selected_new,
        blocked=blocked,
    )

    try:
        baseline_rows = export_row_count(commerce)
    except RuntimeError as exc:
        result["error"] = [str(exc)]
        write_json(args.result, result)
        print(str(exc))
        return 3

    if selected_new and not args.dry_run:
        placement_ids = [p["placement_id"] for p in placements]
        approval_ids = [a["approval_id"] for a in approvals]
        evidence = EVIDENCE + (f"; run: {args.run_url}" if args.run_url else "")
        for pid in selected_new:
            product = product_by_id[pid]
            link = link_by_product[pid]
            placement = placement_by_product.get(pid)
            if placement is None:
                placement = {
                    "placement_id": next_id(placement_ids, "RS-PL"),
                    "product_id": pid,
                    "surface_id": SURFACE_ID,
                    "link_id": link["link_id"],
                    "status": "APPROVED",
                }
                placements.append(placement)
                placement_ids.append(placement["placement_id"])
                placement_by_product[pid] = placement
            elif placement.get("status") != "APPROVED":
                placement["status"] = "APPROVED"
            if placement["placement_id"] not in approved_objects:
                approval = {
                    "approval_id": next_id(approval_ids, "RS-A"),
                    "object_id": placement["placement_id"],
                    "actor_role": "OWNER",
                    "decision": "APPROVED",
                    "evidence": evidence,
                }
                approvals.append(approval)
                approval_ids.append(approval["approval_id"])
                approved_objects.add(placement["placement_id"])
            if product.get("publication_state") != "APPROVED":
                product["publication_state"] = "APPROVED"
        write_json(data / "products.json", products)
        write_json(data / "approvals.json", approvals)
        write_json(data / "placements.json", placements)
        result["ledger_changed"] = True
        try:
            run_commerce_script(commerce, "validate.py")
            run_commerce_script(commerce, "check_schemas.py")
            final_rows = export_row_count(commerce)
        except RuntimeError as exc:
            result["error"] = [str(exc)]
            write_json(args.result, result)
            print(str(exc))
            return 3
        if final_rows != baseline_rows + len(selected_new):
            result["error"] = [
                f"export rows changed unexpectedly: {baseline_rows} -> {final_rows}"
            ]
            write_json(args.result, result)
            print(result["error"][0])
            return 3
        result["catalog_limit"] = final_rows
    else:
        result["catalog_limit"] = baseline_rows + len(selected_new)

    write_json(args.result, result)
    print(f"publish_count: {result['publish_count']} (ready={len(ready)}, "
          f"new={len(selected_new)}, blocked={len(blocked)}, "
          f"catalog_limit={result['catalog_limit']}, dry_run={result['dry_run']})")
    for pid in publish:
        print(f"- publish: {pid}")
    for entry in blocked:
        print(f"- blocked: {entry['product_id']}: {', '.join(entry['reasons'])}")
    return 0


def verify(args):
    baseline = read_json(args.baseline)
    catalog = read_json(args.verify_catalog)
    previous = baseline.get("previous_product_ids", [])
    expected_delta = baseline.get("publish_count", 0)
    current = [p["product_id"] for p in catalog.get("products", [])]
    errors = []
    if len(current) < len(previous):
        errors.append(f"catalog shrank: {len(previous)} -> {len(current)}")
    if len(current) - len(previous) != expected_delta:
        errors.append(
            f"catalog grew by {len(current) - len(previous)}, expected {expected_delta}"
        )
    vanished = [pid for pid in previous if pid not in current]
    if vanished:
        errors.append(f"previously published products vanished: {vanished}")
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print(f"Catalog verified: {len(previous)} -> {len(current)} products, none lost.")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--commerce", type=Path, help="Commerce ledger checkout")
    parser.add_argument("--catalog", type=Path, help="Current public shoten/catalog.json")
    parser.add_argument("--limit", type=int, default=MAX_DAILY_NEW,
                        help="Max new standing-delegation approvals (hard cap 10)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Evaluate only; never edit the ledger")
    parser.add_argument("--run-url", default="", help="Workflow run URL for evidence")
    parser.add_argument("--result", type=Path, help="Where to write the result JSON")
    parser.add_argument("--verify-catalog", type=Path,
                        help="Verify a rebuilt catalog against a previous result JSON")
    parser.add_argument("--baseline", type=Path,
                        help="Result JSON written by the evaluate mode")
    args = parser.parse_args()
    if args.verify_catalog:
        if not args.baseline:
            parser.error("--verify-catalog requires --baseline")
        return verify(args)
    if not (args.commerce and args.catalog and args.result):
        parser.error("--commerce, --catalog and --result are required")
    return evaluate(args)


if __name__ == "__main__":
    raise SystemExit(main())
