"""Regression tests for unknown versus observed zero in trial conversion data."""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import trial_conversion_report as report

HEADER = ",".join(report.EXPECTED_COLUMNS) + "\n"


class ConversionReportTests(unittest.TestCase):
    def test_no_rows(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "baseline.csv"
            path.write_text(HEADER, encoding="utf-8")
            self.assertEqual(report.load(path)[0], [])

    def test_observed_zero(self):
        self.assertEqual(report.parse_nonnegative_int("0", row_number=2, column="trial_visits"), 0)

    def test_blank_is_unknown(self):
        self.assertIsNone(report.parse_nonnegative_int("", row_number=2, column="trial_visits"))

    def test_missing_column_rejected(self):
        with self.assertRaises(ValueError):
            report.parse_nonnegative_int(None, row_number=2, column="trial_visits")

    def test_negative_rejected(self):
        with self.assertRaises(ValueError):
            report.parse_nonnegative_int("-1", row_number=2, column="trial_visits")

    def test_unknown_denominator_rate(self):
        self.assertEqual(report.rate(1, None), "N/A")

    def test_known_rate(self):
        self.assertEqual(report.rate(1, 2), "50.0%")

    def test_unknown_propagates_across_rows(self):
        rows = [
            dict(zip(report.EXPECTED_COLUMNS, ["2026-11-01", "/trial/", "10", "2", "", "1", "1", ""])),
            dict(zip(report.EXPECTED_COLUMNS, ["2026-11-02", "/trial/", "20", "3", "2", "1", "1", ""])),
        ]
        total, pages = report.aggregate(rows)
        self.assertIsNone(total["line_inquiries"])
        self.assertIsNone(pages["/trial/"]["line_inquiries"])
        self.assertEqual(total["page_views"], 30)

    def test_invalid_header_and_pii_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "baseline.csv"
            path.write_text(HEADER.rstrip() + ",email\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "PII-like"):
                report.load(path)

    def test_unknown_and_zero_are_distinct(self):
        self.assertEqual(report.show(None), "UNKNOWN")
        self.assertEqual(report.show(0), "0")


if __name__ == "__main__":
    unittest.main()
