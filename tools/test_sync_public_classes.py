"""Offline contract tests for Google Calendar -> public class sessions. No credentials needed."""
import copy
import sys
import unittest
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sync_public_classes import build, identity, normalize

PEOPLE = {"instructors": [
    {"id": "homma", "name": "本間茂樹", "classes": ["STEP", "TAP"],
     "contact": {"line": "https://lin.ee/7Dk4s8o", "type": "instructor_official"}}
]}
NOW = datetime(2026, 11, 1, 9, 0, tzinfo=ZoneInfo("Asia/Tokyo"))
KEY = b"0123456789abcdef0123456789abcdef"


def fixture(**changes):
    item = {"id": "google-private-event-id", "status": "confirmed",
            "summary": "STEP🔰| 本間 |60m | OPEN",
            "start": {"dateTime": "2026-11-05T10:00:00+09:00"},
            "end": {"dateTime": "2026-11-05T11:00:00+09:00"},
            "description": "SECRET_PRIVATE_DESCRIPTION", "attendees": [{"email": "hidden@example.com"}]}
    item.update(changes)
    return item


class CalendarSyncContract(unittest.TestCase):
    def test_class_specific_capacity(self):
        catalog = {"instructors": [{"id": "furusho", "name": "古庄里好",
            "classes": ["STEP", "TAP", "STRETCH", "ISOLATION", "BAR METHOD", "HIIT"],
            "contact": {"line": "https://lin.ee/zC5YLe7", "type": "studio_official"}}]}
        expected = {"STEP": 10, "TAP": 10, "STRETCH": 5,
                    "ISOLATION": 5, "BAR METHOD": 10, "HIIT": 10}
        for class_name, capacity in expected.items():
            duration = 30 if class_name in {"BAR METHOD", "HIIT"} else 60
            end = "10:30:00" if duration == 30 else "11:00:00"
            event = fixture(id="occurrence-" + class_name,
                summary=f"{class_name} | 古庄 |{duration}m | OPEN",
                end={"dateTime": "2026-11-05T" + end + "+09:00"})
            result, count = build([event], "calendar", KEY, catalog, {}, NOW)
            self.assertEqual(count, 1, class_name)
            self.assertEqual(result["sessions"][0]["capacity"], capacity, class_name)
            self.assertIsNone(result["sessions"][0]["confirmedBookingCount"])

    def test_only_strict_open_classes_are_public(self):
        out, count = build([fixture()], "private-calendar-id", KEY, PEOPLE, {}, NOW)
        self.assertEqual(count, 1)
        self.assertEqual(len(out["sessions"]), 1)
        row = out["sessions"][0]
        self.assertEqual(row["className"], "STEP 超初級")
        self.assertEqual(row["capacity"], 10)
        self.assertIsNone(row["confirmedBookingCount"])
        self.assertTrue(row["id"].startswith("session-"))
        public = str(out)
        for secret in ["google-private-event-id", "private-calendar-id",
                       "SECRET_PRIVATE_DESCRIPTION", "hidden@example.com", "本間 |"]:
            self.assertNotIn(secret, public)

    def test_deny_private_closed_unlisted_and_mismatch(self):
        for change in [
            {"summary": "STEP🔰| 本間 |60m | CLOSE"},
            {"summary": "STEP🔰| 本間 |60m | REOPEN"},
            {"summary": "STEP🔰| 不明講師 |60m | OPEN"},
            {"summary": "ISOLATION| 本間 |60m | OPEN"},
            {"summary": "STEP🔰| 本間 |30m | OPEN"},
            {"visibility": "private"},
            {"status": "tentative"},
            {"end": {"dateTime": "2026-11-05T11:30:00+09:00"}},
        ]:
            _, count = build([fixture(**change)], "private-calendar", KEY, PEOPLE, {}, NOW)
            self.assertEqual(count, 0, str(change))

    def test_stable_id_and_cancellation_tombstone(self):
        first, _ = build([fixture()], "private-calendar", KEY, PEOPLE, {}, NOW)
        moved = fixture(start={"dateTime": "2026-11-06T12:00:00+09:00"},
                        end={"dateTime": "2026-11-06T13:00:00+09:00"})
        second, _ = build([moved], "private-calendar", KEY, PEOPLE, first, NOW)
        self.assertEqual(first["sessions"][0]["id"], second["sessions"][0]["id"])
        third, _ = build([], "private-calendar", KEY, PEOPLE, second, NOW)
        self.assertEqual(third["sessions"][0]["publicStatus"], "CANCELLED")

    def test_other_calendar_or_key_changes_id(self):
        event = fixture()
        self.assertNotEqual(identity(event, "calendar-a", KEY), identity(event, "calendar-b", KEY))
        self.assertNotEqual(identity(event, "calendar-a", KEY), identity(event, "calendar-a", b"X"*32))

    def test_recurrence_occurrences_are_distinct(self):
        a = fixture(recurringEventId="parent", originalStartTime={"dateTime": "2026-11-05T10:00:00+09:00"})
        b = fixture(recurringEventId="parent", originalStartTime={"dateTime": "2026-11-12T10:00:00+09:00"})
        self.assertNotEqual(identity(a, "cal", KEY), identity(b, "cal", KEY))


if __name__ == "__main__":
    unittest.main()
