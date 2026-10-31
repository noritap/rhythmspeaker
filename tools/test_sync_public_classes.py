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

    def test_all_calendar_title_variants_are_published(self):
        catalog = {"instructors": [{"id": "furusho", "name": "古庄里好",
            "classes": ["STEP", "TAP", "STRETCH"],
            "contact": {"line": "https://lin.ee/zC5YLe7", "type": "studio_official"}}]}
        cases = [
            ("STEP🔰 | 古庄 | 60m | OPEN", "11:00:00", "STEP", 10, "古庄里好"),
            ("STEP🔰 | 60m | 古庄 | OPEN", "11:00:00", "STEP", 10, "古庄里好"),
            ("STRETCH | 30m | 古庄 | OPEN", "10:30:00", "STRETCH", 5, "古庄里好"),
            ("TAP | 90m | 古庄 | OPEN", "11:30:00", "TAP", 10, "古庄里好"),
            ("TAP初級 | 60m | 本間 | OPEN", "11:00:00", "TAP初級", 10, "本間"),
            ("STEP & 振付 | 60m | かっつん | OPEN", "11:00:00", "STEP & 振付", 10, "かっつん"),
            ("BAR メソッド | 60m | 古庄里好・丹生 | OPEN", "11:00:00", "BAR メソッド", 10, "古庄里好・丹生"),
            ("STEP🟡 | 60m | 古庄 | OPEN", "11:00:00", "STEP🟡", 10, "古庄里好"),
            ("TAP応用🔵 | 60m | 古庄/MiFa-san | OPEN", "11:00:00", "TAP応用🔵", 10, "古庄/MiFa-san"),
            ("TAP | 60m | 古庄 | CLOSE", "11:00:00", "TAP", 10, "古庄里好"),
        ]
        events = []
        for i, (title, stop, class_type, capacity, teacher) in enumerate(cases):
            events.append(fixture(id="real-calendar-id-" + str(i), summary=title,
                end={"dateTime": "2026-11-05T" + stop + "+09:00"}))
        out, count = build(events, "calendar", KEY, catalog, {}, NOW)
        self.assertEqual(count, len(events))
        self.assertEqual(len(out["sessions"]), len(events))
        self.assertEqual(
            [x["publicStatus"] for x in out["sessions"]].count("CLOSE"), 1)
        self.assertEqual(
            [x["publicStatus"] for x in out["sessions"]].count("OPEN"), len(cases)-1)
        for title, _, class_type, capacity, teacher in cases:
            # Find by class/name where possible, without exposing event source IDs.
            self.assertTrue(any(
                row["classType"] == class_type and row["capacity"] == capacity
                for row in out["sessions"]
            ), title)
        self.assertTrue(all(s["confirmedBookingCount"] is None for s in out["sessions"]))
        self.assertNotIn("hidden@example.com", str(out))

    def test_unformatted_but_valid_event_is_never_dropped(self):
        out, count = build([fixture(summary="特別ワークショップ・発展クラス")],
                           "calendar", KEY, PEOPLE, {}, NOW)
        self.assertEqual(count, 1)
        self.assertEqual(out["sessions"][0]["className"], "特別ワークショップ・発展クラス")
        self.assertEqual(out["sessions"][0]["instructorName"], "スタジオに確認")
        self.assertEqual(out["sessions"][0]["publicStatus"], "INQUIRY_ONLY")

    def test_case_insensitive_close_marker_is_not_open(self):
        event = fixture(id="close-event", summary="STEP🔰 | 60m | 本間 | close")
        result, count = build([event], "private-calendar", KEY, PEOPLE, {}, NOW)
        self.assertEqual(count, 1)
        self.assertEqual(result["sessions"][0]["publicStatus"], "CLOSE")
        self.assertEqual(result["sessions"][0]["bookingCountStatus"], "unknown")
        self.assertIsNone(result["sessions"][0]["confirmedBookingCount"])

    def test_unrecognized_admission_marker_is_not_open(self):
        event = fixture(id="unrecognized-event", summary="STEP🔰 | 60m | 本間 | REVIEW")
        result, count = build([event], "private-calendar", KEY, PEOPLE, {}, NOW)
        self.assertEqual(count, 1)
        self.assertEqual(result["sessions"][0]["publicStatus"], "INQUIRY_ONLY")

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

    def test_entire_sync_fails_closed_on_unsafe_event_metadata(self):
        for change in [
            {"visibility": "private"},
            {"status": "tentative"},
            {"start": {"date": "2026-11-05"}},
            {"summary": "private.user@example.org"},
            {"summary": ""},
            {"end": {"dateTime": "2026-11-05T09:30:00+09:00"}},
        ]:
            with self.assertRaises(ValueError, msg=str(list(change))):
                build([fixture(), fixture(id="bad-event", **change)],
                      "private-calendar", KEY, PEOPLE, {}, NOW)

    def test_dynamic_teacher_and_class_visibility(self):
        out, count = build([fixture(
            summary="STEP & 振付 | 60m | 古庄里好・MiFa-san | OPEN"
        )], "calendar", KEY, PEOPLE, {}, NOW)
        self.assertEqual(count, 1)
        row = out["sessions"][0]
        self.assertEqual(row["className"], "STEP & 振付")
        self.assertEqual(row["instructorName"], "古庄里好・MiFa-san")
        self.assertTrue(row["instructorId"].startswith("calendar-teacher-"))
        self.assertEqual(row["capacity"], 10)
        self.assertTrue(row["id"].startswith("session-"))

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
