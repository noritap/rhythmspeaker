"""Unit tests for the approved-only Shoten projection."""
import json
import tempfile
import unittest
from pathlib import Path

from build_shoten_catalog import SURFACE_ID, SURFACE_URL, project, verified_special_link

SHA = "a" * 40


def fixture(index=1):
    asin = f"TEST{index:06}"
    pid, lid, placement = f"RS-P{index:04}", f"test-link-{index}", f"test-place-{index}"
    href = f"https://www.amazon.co.jp/dp/{asin}?tag=fixture-only"
    product = {
        "product_id": pid, "asin": asin, "brand": "QA Fiction", "product_name": f"動作検証用 {index}",
        "marketplace": "amazon.co.jp", "publication_state": "APPROVED", "category_ids": ["cleaning"],
        "editorial": {
            "verified_at": "2026-11-04", "good_for": ["家事の時短"],
            "limitations": ["テストデータ"], "short_copy": "QA サンプル",
            "why_recommend": "検証用の説明", "source_urls": ["https://example.invalid/product"]
        }
    }
    return {
        "products": product,
        "affiliate_links": {
            "link_id": lid, "product_id": pid, "surface_id": SURFACE_ID, "status": "VERIFIED",
            "verification_method": "manual", "verified_at": "2026-11-04", "generated_by": "SITESTRIPE",
            "special_link": href, "tracking_id": "fixture-only",
        },
        "placements": {
            "placement_id": placement, "status": "APPROVED", "product_id": pid,
            "link_id": lid, "surface_id": SURFACE_ID,
        },
        "approvals": {"object_id": placement, "actor_role": "OWNER", "decision": "APPROVED"},
        "row": {
            **{k: product[k] for k in ("product_id", "asin", "brand", "product_name", "category_ids", "editorial")},
            "placement_id": placement, "disclosure_required": True, "affiliate_url": href, "image": None,
        },
    }


def setup_snapshot(root, *items, surface_url=SURFACE_URL):
    data = root / "data"
    data.mkdir(exist_ok=True)
    surface = {
        "surface_id": SURFACE_ID, "url": surface_url, "amazon_registered_status": "CONFIRMED",
        "publication_authorized": True, "disclosure_verified": True, "tracking_id": "fixture-only",
    }
    (data / "surfaces.json").write_text(json.dumps([surface]), encoding="utf-8")
    for name in ("products", "affiliate_links", "placements", "approvals"):
        (data / f"{name}.json").write_text(json.dumps([i[name] for i in items]), encoding="utf-8")
    return [i["row"] for i in items]


class TestShotenCatalog(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)

    def run_projection(self, *items, limit=1, surface_url=SURFACE_URL):
        rows = setup_snapshot(self.root, *items, surface_url=surface_url)
        return project(rows, self.root, self.root, SHA, limit)["products"]

    def test_empty_does_not_emit_candidate_data(self):
        self.assertEqual(self.run_projection(), [])

    def test_pilot_preserves_canonical_id_and_exact_link(self):
        item = fixture()
        row, = self.run_projection(item)
        self.assertEqual(row["product_id"], item["products"]["product_id"])
        self.assertEqual(row["href"], item["affiliate_links"]["special_link"])
        self.assertIsNone(row["approvedPhoto"])
        self.assertNotIn("verification_method", row)

    def test_root_website_is_not_shoten_registration_evidence(self):
        with self.assertRaisesRegex(ValueError, "publishing surface"):
            self.run_projection(fixture(), surface_url=SURFACE_URL.removesuffix("shoten/"))

    def test_pilot_cap_and_owner_gate(self):
        with self.assertRaisesRegex(ValueError, "publication count"):
            self.run_projection(fixture(), fixture(2))
        item = fixture()
        item["approvals"]["decision"] = "PENDING"
        with self.assertRaisesRegex(ValueError, "approval"):
            self.run_projection(item)

    def test_links_fail_closed(self):
        item = fixture()
        href = item["row"]["affiliate_url"]
        asin = item["row"]["asin"]
        for link in (href.replace(asin, "TEST000099"), href + "&tag=extra",
                     href.replace("fixture-only", "wrong"), href + "&access_token=bad",
                     "https://amzn.to/not-an-approved-url"):
            with self.subTest(link=link):
                self.assertFalse(verified_special_link(link, asin, "fixture-only"))

    def test_owner_attested_amazon_short_link(self):
        item = fixture()
        short = "https://link.amazon/B01BvACr5"
        item["affiliate_links"].update({
            "special_link": short,
            "generated_by": "AMAZON_OFFICIAL_OTHER",
            "verification_method": "OWNER_CONFIRMED_AMAZON_ISSUED_AND_CHROME_DESTINATION",
            "source_page_url": "https://www.amazon.co.jp/dp/" + item["products"]["asin"],
        })
        item["row"]["affiliate_url"] = short
        row, = self.run_projection(item)
        self.assertEqual(row["href"], short)
        self.assertTrue(row["ownerVerifiedShortLink"])
        self.assertEqual(row["affiliateLinkKind"], "AMAZON_OFFICIAL_SHORT")
        item["affiliate_links"]["source_page_url"] = "https://www.amazon.co.jp/dp/WRONG00000"
        with self.assertRaisesRegex(ValueError, "Special Link"):
            self.run_projection(item)

    def test_unlicensed_photo_stays_out(self):
        item = fixture()
        asset = "./assets/products/sample.webp"
        photo = self.root / asset
        photo.parent.mkdir(parents=True)
        photo.touch()
        item["products"]["image"] = {"source_kind": "LICENSED", "asset_ref": asset}
        item["row"]["image"] = item["products"]["image"].copy()
        self.assertIsNone(self.run_projection(item)[0]["approvedPhoto"])
        item["products"]["image"]["rights_evidence"] = "test-only evidence"
        self.assertEqual(self.run_projection(item)[0]["approvedPhoto"], asset)


if __name__ == "__main__":
    unittest.main()
