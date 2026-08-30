#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from pathlib import Path

EXPECTED_COLUMNS = [
    "date",
    "page_path",
    "page_views",
    "line_cta_clicks",
    "line_inquiries",
    "trial_bookings",
    "trial_visits",
    "notes",
]
NUMERIC_COLUMNS = [
    "page_views",
    "line_cta_clicks",
    "line_inquiries",
    "trial_bookings",
    "trial_visits",
]
FORBIDDEN_COLUMNS = {
    "name",
    "full_name",
    "line_name",
    "display_name",
    "phone",
    "phone_number",
    "email",
    "message",
    "message_body",
}


def rate(numerator: int, denominator: int) -> str:
    if denominator <= 0:
        return "N/A"
    return f"{numerator / denominator * 100:.1f}%"


def parse_nonnegative_int(value: str, *, row_number: int, column: str) -> int:
    text = value.strip()
    if not text:
        return 0
    try:
        number = int(text)
    except ValueError as exc:
        raise ValueError(f"row {row_number}: {column} must be an integer") from exc
    if number < 0:
        raise ValueError(f"row {row_number}: {column} must be non-negative")
    return number


def load(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        fieldnames = reader.fieldnames or []
        normalized = {name.strip().lower() for name in fieldnames}
        forbidden = sorted(normalized & FORBIDDEN_COLUMNS)
        if forbidden:
            raise ValueError(f"PII-like columns are forbidden: {', '.join(forbidden)}")
        if fieldnames != EXPECTED_COLUMNS:
            raise ValueError(
                "unexpected CSV header; expected: " + ",".join(EXPECTED_COLUMNS)
            )
        rows = list(reader)
    return rows, fieldnames


def aggregate(rows: list[dict[str, str]]) -> tuple[dict[str, int], dict[str, dict[str, int]]]:
    total = defaultdict(int)
    by_page: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for index, row in enumerate(rows, start=2):
        page = row["page_path"].strip() or "(unknown)"
        for column in NUMERIC_COLUMNS:
            value = parse_nonnegative_int(row[column], row_number=index, column=column)
            total[column] += value
            by_page[page][column] += value

    return dict(total), {page: dict(values) for page, values in by_page.items()}


def print_metrics(label: str, values: dict[str, int]) -> None:
    page_views = values.get("page_views", 0)
    clicks = values.get("line_cta_clicks", 0)
    inquiries = values.get("line_inquiries", 0)
    bookings = values.get("trial_bookings", 0)
    visits = values.get("trial_visits", 0)

    print(label)
    print(f"  page_views={page_views}")
    print(f"  line_cta_clicks={clicks} | line_ctr={rate(clicks, page_views)}")
    print(f"  line_inquiries={inquiries} | inquiry_rate={rate(inquiries, clicks)}")
    print(f"  trial_bookings={bookings} | booking_rate={rate(bookings, inquiries)}")
    print(f"  trial_visits={visits} | visit_rate={rate(visits, bookings)}")
    print(f"  visit_conversion={rate(visits, page_views)}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Summarize trial conversion baseline without PII")
    parser.add_argument(
        "csv_path",
        nargs="?",
        type=Path,
        default=Path("data/trial_conversion_baseline.csv"),
    )
    args = parser.parse_args()

    try:
        rows, _ = load(args.csv_path)
        total, by_page = aggregate(rows)
    except (OSError, ValueError) as exc:
        print(f"TRIAL CONVERSION REPORT: ERROR: {exc}")
        return 1

    if not rows:
        print("TRIAL CONVERSION REPORT: READY / NO OBSERVATION ROWS")
        print("Add aggregate daily/page rows only; do not store personal data.")
        return 0

    print("TRIAL CONVERSION REPORT: OK")
    print_metrics("ALL PAGES", total)
    for page in sorted(by_page):
        print_metrics(f"PAGE {page}", by_page[page])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
