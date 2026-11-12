"""Regression tests for text-first Shoten catalog rows.

This test intentionally creates fictional, nonpublishable product data and no external URLs
except a synthetic verified-link-shaped fixture. It does not write to catalog.json.
"""
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from validate_shoten_product_ops import validate


def row():
    return {
        "product_id": "RS-P9090",
        "asin": "TEST000001",
        "brand": "Example",
        "model": "Example model",
        "formal_name": "Example test-only product",
        "summary": "Text first listing for isolated QA",
        "caution": "Synthetic fixture only",
        "href": "https://link.amazon/Fixture123",
        "affiliateLinkKind": "AMAZON_OFFICIAL_SHORT",
        "ownerVerifiedShortLink": True,
        "trackingId": "fixture-only-22",
        "approvedPhoto": None,
        "gallery": [],
    }


class TestShotenTextFirst(unittest.TestCase):
    def test_approved_text_only_row_without_image(self):
        with TemporaryDirectory() as directory:
            self.assertEqual(validate({"products": [row()]}, Path(directory)), [])

    def test_unverified_affiliate_rejected_even_without_photo(self):
        item = row()
        item["ownerVerifiedShortLink"] = False
        with TemporaryDirectory() as directory:
            errors = validate({"products": [item]}, Path(directory))
        self.assertTrue(any("unverified affiliate URL" in e for e in errors), errors)

    def test_bogus_photo_url_rejected_when_provided(self):
        item = row()
        item["approvedPhoto"] = "https://example.invalid/image.jpg"
        with TemporaryDirectory() as directory:
            errors = validate({"products": [item]}, Path(directory))
        self.assertTrue(any("approvedPhoto missing from gallery" in e for e in errors), errors)

    def test_nonempty_invalid_image_field_rejected(self):
        item = row()
        item["approvedPhoto"] = ""
        with TemporaryDirectory() as directory:
            errors = validate({"products": [item]}, Path(directory))
        self.assertTrue(any("invalid approved product photo" in e for e in errors), errors)


if __name__ == "__main__":
    unittest.main()
