"""Offline tests for the read-only Calendar preflight. No Google credentials."""
import copy
import sys
import unittest
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preflight_calendar_sync import PreflightFailure, ensure_safe_projection
from sync_public_classes import build

NOW = datetime(2026, 11, 1, 9, tzinfo=ZoneInfo("Asia/Tokyo"))
KEY = b"0123456789abcdef0123456789abcdef"
EVENT = {
    "id": "private-google-event-123",
    "status": "confirmed",
    "summary": "STRETCH | 30m | 古庄 | OPEN",
    "start": {"dateTime": "2026-11-05T10:00:00+09:00"},
    "end": {"dateTime": "2026-11-05T10:30:00+09:00"},
    "description": "PRIVATE_LESSON_NOTES_TOKEN",
    "attendees": [{"email": "person-private@example.org"}],
}
CATALOG = {"instructors": [{
    "id": "furusho", "name": "古庄里好", "classes": ["STRETCH"],
    "contact": {"line": "https://lin.ee/zC5YLe7", "type": "studio_official"}
}]}


def output():
    return build([EVENT], "private-calendar", KEY, CATALOG, {}, NOW)[0]


class PreflightContract(unittest.TestCase):
    def test_valid_output_is_accepted(self):
        ensure_safe_projection(output(), [EVENT])

    def test_close_and_missing_marker_are_safe_public_projection_states(self):
        for title, expected in [
            ("STRETCH | 30m | 古庄 | CLOSE", "CLOSE"),
            ("STRETCH | 30m | 古庄 | REVIEW", "OPEN"),
            ("STRETCH | 30m | 古庄", "OPEN"),
        ]:
            event = dict(EVENT, summary=title)
            result, count = build([event], "private-calendar", KEY, CATALOG, {}, NOW)
            self.assertEqual(count, 1)
            self.assertEqual(result["sessions"][0]["publicStatus"], expected)
            ensure_safe_projection(result, [event])

    def test_denies_attendee_leak(self):
        result = output()
        result["sessions"][0]["instructorName"] = "person-private@example.org"
        with self.assertRaises(PreflightFailure):
            ensure_safe_projection(result, [EVENT])

    def test_denies_private_event_id(self):
        result = output()
        result["sessions"][0]["id"] = EVENT["id"]
        with self.assertRaises(PreflightFailure):
            ensure_safe_projection(result, [EVENT])

    def test_denies_unapproved_capacity(self):
        result = output()
        result["sessions"][0]["capacity"] = 10
        with self.assertRaises(PreflightFailure):
            ensure_safe_projection(result, [EVENT])

    def test_denies_fake_confirmed_booking_count(self):
        result = output()
        result["sessions"][0]["confirmedBookingCount"] = 0
        with self.assertRaises(PreflightFailure):
            ensure_safe_projection(result, [EVENT])

    def test_denies_private_metadata_field(self):
        result = output()
        result["sessions"][0]["attendees"] = EVENT["attendees"]
        with self.assertRaises(PreflightFailure):
            ensure_safe_projection(result, [EVENT])

    def test_denies_unavailable_state(self):
        result = output()
        result["dataState"] = "unavailable"
        with self.assertRaises(PreflightFailure):
            ensure_safe_projection(result, [EVENT])


if __name__ == "__main__":
    unittest.main()
