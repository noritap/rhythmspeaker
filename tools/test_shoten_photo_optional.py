"""Regression tests for publishing approved products without photographs."""
import copy
import json
import unittest
from pathlib import Path

from validate_shoten_product_ops import validate

ROOT = Path(__file__).resolve().parents[1]


class TestShotenPhotoOptional(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads((ROOT / "shoten/catalog.json").read_text(encoding="utf-8"))
        cls.sample = cls.catalog["products"][0]

    def check(self, row):
        return validate({"products": [row]}, root=ROOT / "shoten")

    def test_no_photo_uses_text_fallback(self):
        row = copy.deepcopy(self.sample)
        row["approvedPhoto"] = None
        row["gallery"] = []
        self.assertEqual(self.check(row), [])

    def test_no_photo_omitted_gallery(self):
        row = copy.deepcopy(self.sample)
        row["approvedPhoto"] = None
        row.pop("gallery", None)
        self.assertEqual(self.check(row), [])

    def test_reject_empty_photo_string(self):
        row = copy.deepcopy(self.sample)
        row["approvedPhoto"] = ""
        self.assertTrue(any("invalid approved product photo" in x for x in self.check(row)))

    def test_reject_invalid_or_missing_photo(self):
        row = copy.deepcopy(self.sample)
        row["gallery"] = []
        for photo in ("javascript:alert(1)", "./assets/products/nonexistent-approved-photo.webp"):
            with self.subTest(photo=photo):
                row["approvedPhoto"] = photo
                self.assertTrue(self.check(row))

    def test_photo_optional_does_not_waive_affiliate_gate(self):
        row = copy.deepcopy(self.sample)
        row["approvedPhoto"] = None
        row["gallery"] = []
        row["href"] = "https://www.amazon.co.jp/dp/TEST000001"
        self.assertTrue(any("unverified affiliate URL" in x for x in self.check(row)))


if __name__ == "__main__":
    unittest.main()
