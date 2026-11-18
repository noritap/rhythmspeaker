"""Unit tests for the approved-only Shoten projection."""
import json
import tempfile
import unittest
from pathlib import Path

from build_shoten_catalog import SURFACE_ID, SURFACE_URL, preserve_enrichment, project, verified_special_link

SHA = "a" * 40


def fixture(index=1):
    asin = f"TEST{index:06}"
    pid, lid, placement = f"RS-P{index:04}", f"test-link-{index}", f"test-place-{index}"
    href = f"https://www.amazon.co.jp/dp/{asin}?tag=fixture-only-22"
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
            "special_link": href, "tracking_id": "fixture-only-22",
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


def setup_snapshot(root, *items, surface_url=SURFACE_URL, surface_tracking_id="fixture-only-22"):
    data = root / "data"
    data.mkdir(exist_ok=True)
    surface = {
        "surface_id": SURFACE_ID, "url": surface_url, "amazon_registered_status": "CONFIRMED",
        "publication_authorized": True, "disclosure_verified": True, "tracking_id": surface_tracking_id,
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

    def run_projection(self, *items, limit=1, surface_url=SURFACE_URL, surface_tracking_id="fixture-only-22"):
        rows = setup_snapshot(self.root, *items, surface_url=surface_url, surface_tracking_id=surface_tracking_id)
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
                self.assertFalse(verified_special_link(link, asin, "fixture-only-22"))

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

    def test_owner_short_links_keep_per_product_tracking_ids(self):
        first, second = fixture(1), fixture(2)
        for item, tracking_id in ((first, "noritap0a1-22"), (second, "rsshop-hatenablg-22")):
            short = "https://link.amazon/" + ("B01BvACr5" if item is first else "B04tr6V2F")
            item["affiliate_links"].update({
                "special_link": short,
                "generated_by": "SITESTRIPE",
                "verification_method": (
                    "OWNER_PROVIDED_SITESTRIPE_SHORT_LINK_AND_OWNER_CONFIRMED_PRODUCT_DESTINATION; "
                    "TRACKING_ID_CONFIRMED_FROM_SITESTRIPE_SCREENSHOT"
                ),
                "source_page_url": None,
                "tracking_id": tracking_id,
            })
            item["row"]["affiliate_url"] = short
        rows = self.run_projection(first, second, limit=2, surface_tracking_id=None)
        self.assertEqual([row["trackingId"] for row in rows], ["noritap0a1-22", "rsshop-hatenablg-22"])
        self.assertTrue(all(row["ownerVerifiedShortLink"] for row in rows))
        self.assertTrue(all(row["affiliateLinkKind"] == "AMAZON_OFFICIAL_SHORT" for row in rows))

    def test_owner_provided_short_link_does_not_require_tracking_reverification(self):
        item = fixture()
        short = "https://link.amazon/B0fvPIBGJ"
        item["affiliate_links"].update({
            "status": "OWNER_PROVIDED",
            "special_link": short,
            "tracking_id": None,
            "generated_by": None,
            "verified_at": None,
            "source_page_url": None,
            "verification_method": "OWNER_SUPPLIED_OFFICIAL_AFFILIATE_SHORT_LINK_IN_CHAT; OWNER_ATTESTED_DESTINATION",
        })
        item["row"]["affiliate_url"] = short
        rows = self.run_projection(item, surface_tracking_id=None)
        self.assertEqual(rows[0]["href"], short)
        self.assertEqual(rows[0]["affiliateLinkKind"], "AMAZON_OFFICIAL_SHORT")
        self.assertTrue(rows[0]["ownerVerifiedShortLink"])
        self.assertIsNone(rows[0]["trackingId"])
        item["affiliate_links"]["special_link"] = "https://other.example.com/evil"
        with self.assertRaisesRegex(ValueError, "Special Link"):
            self.run_projection(item, surface_tracking_id=None)

    def test_publication_categories_cover_release_first_daily_products(self):
        cases = [
            (14, ["outdoor", "disaster-prep"], "outdoor", "ac-power"),
            (15, ["life"], "home", "daily-goods"),
            (16, ["work"], "sound", "work-tools"),
            (50, ["life", "consumables", "hygiene"], "home", "hygiene"),
        ]
        for number, tags, expected_category, expected_subcategory in cases:
            with self.subTest(number=number):
                item = fixture(number)
                item["products"]["category_ids"] = tags
                item["row"]["category_ids"] = tags
                result, = self.run_projection(item)
                self.assertEqual((result["category"], result["subcategory"]),
                                 (expected_category, expected_subcategory))

    def test_openrun_pro2_photo_style_art_is_local_and_disclosed(self):
        root = Path(__file__).resolve().parents[1]
        catalog = json.loads((root / "shoten/catalog.json").read_text(encoding="utf-8"))
        row = next(p for p in catalog["products"] if p["product_id"] == "RS-P0046")
        asset = "./assets/products/rs-p0046-shokz-openrun-pro2-black-editorial.svg"
        self.assertEqual(row["approvedPhoto"], asset)
        svg = (root / "shoten" / asset).read_text(encoding="utf-8")
        self.assertIn('data:image/jpeg;base64,', svg)
        self.assertTrue(row["gallery"])
        self.assertIn("実物写真ではありません", row["gallery"][0]["alt"])
        self.assertIs(row["imageSource"]["product_photo"], False)
        self.assertEqual(row["href"], "https://link.amazon/B0hcXfgcs")

    def test_tissue_pack_visuals_are_separate_and_disclosed(self):
        root = Path(__file__).resolve().parents[1]
        rows = json.loads((root / "shoten/catalog.json").read_text(encoding="utf-8"))["products"]
        targets = {p["product_id"]: p for p in rows if p["product_id"] in {"RS-P0051", "RS-P0052"}}
        self.assertEqual(len(targets), 2)
        self.assertNotEqual(targets["RS-P0051"]["approvedPhoto"], targets["RS-P0052"]["approvedPhoto"])
        for product in targets.values():
            local = root / "shoten" / product["approvedPhoto"]
            self.assertTrue(local.is_file())
            self.assertIn("実物写真", product["gallery"][0]["alt"])
            self.assertFalse(product["imageSource"]["product_photo"])
            self.assertEqual(product["imageSource"]["image_type"], "AI_GENERATED_EDITORIAL_ILLUSTRATION")

    def test_candy_category_maps_to_food(self):
        item = fixture(42)
        item["products"]["category_ids"] = ["food", "candy"]
        item["row"]["category_ids"] = ["food", "candy"]
        row, = self.run_projection(item)
        self.assertEqual((row["category"], row["subcategory"]), ("food", "candy"))

    def test_smart_home_category_preferred_to_generic_life(self):
        item = fixture(44)
        item["products"]["category_ids"] = ["life", "smart-home"]
        item["row"]["category_ids"] = ["life", "smart-home"]
        row, = self.run_projection(item)
        self.assertEqual((row["category"], row["subcategory"]), ("home", "smart-home"))

    def test_existing_openfit_illustration_preserved_in_live_catalog(self):
        root = Path(__file__).resolve().parents[1]
        catalog = json.loads((root / "shoten/catalog.json").read_text(encoding="utf-8"))
        row = next(p for p in catalog["products"] if p["product_id"] == "RS-P0013")
        asset = "./assets/products/rs-p0013-shokz-openfit-pro-white-editorial.svg"
        self.assertEqual(row["approvedPhoto"], asset)
        self.assertTrue((root / "shoten" / asset).is_file())
        self.assertTrue(any(item["src"] == asset for item in row["gallery"]))
        self.assertEqual(row["imageSource"]["image_type"], "AI_GENERATED_EDITORIAL_ILLUSTRATION")

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


class TestPreserveEnrichment(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.output = Path(directory.name) / "catalog.json"

    def write_existing(self, rows):
        self.output.write_text(json.dumps({"products": rows}), encoding="utf-8")

    def test_carries_enrichment_and_photo_for_same_identity(self):
        self.write_existing([{
            "product_id": "RS-P0001", "asin": "TEST000001",
            "approvedPhoto": "./assets/products/sample.webp",
            "gallery": [{"src": "./assets/products/sample.webp", "alt": "sample"}],
            "curationLabel": "古庄おすすめ", "studioIntro": "studio",
            "summary": "公開済みの校正済み紹介文", "tags": ["古庄おすすめ"],
        }])
        snapshot = {"products": [{
            "product_id": "RS-P0001", "asin": "TEST000001", "approvedPhoto": None,
            "summary": "上流の未校正テキスト", "tags": ["用途タグ"],
            "href": "https://link.amazon/AbC123", "trackingId": "fixture-only-22",
        }]}
        preserve_enrichment(snapshot, self.output)
        row = snapshot["products"][0]
        self.assertEqual(row["approvedPhoto"], "./assets/products/sample.webp")
        self.assertEqual(row["gallery"][0]["alt"], "sample")
        self.assertEqual(row["curationLabel"], "古庄おすすめ")
        self.assertEqual(row["studioIntro"], "studio")
        self.assertEqual(row["summary"], "公開済みの校正済み紹介文")
        self.assertEqual(row["tags"], ["古庄おすすめ"])
        # Functional fields always come from the fresh projection.
        self.assertEqual(row["href"], "https://link.amazon/AbC123")
        self.assertEqual(row["trackingId"], "fixture-only-22")

    def test_does_not_carry_across_identity_change(self):
        self.write_existing([{
            "product_id": "RS-P0001", "asin": "TEST000001",
            "approvedPhoto": "./assets/products/sample.webp",
            "gallery": [{"src": "./assets/products/sample.webp", "alt": "sample"}],
        }])
        snapshot = {"products": [{"product_id": "RS-P0001", "asin": "TEST000099", "approvedPhoto": None}]}
        preserve_enrichment(snapshot, self.output)
        row = snapshot["products"][0]
        self.assertIsNone(row["approvedPhoto"])
        self.assertNotIn("gallery", row)


if __name__ == "__main__":
    unittest.main()
