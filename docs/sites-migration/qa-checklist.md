# QA evidence / 2026-10-31

## Executed in browser
- Live GitHub Pages home opened; actual current navigation/hero/class/teacher/service content inspected.
- Migrated /rhythmspeaker/ base path: schedule month next/previous, date select/clear, list/calendar selection sync, teacher+class combined filter, empty result, reset.
- Selected TAP/demo-02/2026-11-01 14–15/本間 retained in detail/application. Clipboard contents verified, edited mailto body verified. Internal route→back preserved edited text.
- New request date/start/class/teacher, HIIT30-minute generation, end-after-midnight rejection. Ten contact destinations checked (six canonical +four proposal); NAO studio fallback. No send performed.
- Mobile menu opens/closes; original10 global destinations and added studio links present.
- Target schedule +calendar, dialog and generated new-request form measured at320/375/390/430/768/1024/1440: no horizontal overflow. Iframe content width is15px narrower due to scrollbar; this is not physical device testing.
- Main ten pages navigated and checked around390px. Source-vs-target390px schedule h1=331x47.59375, two-choice region=331x243.96875, calendar=293x333.46875 in both. Visual screenshots inspected; no claim of exhaustive pixel identity.
- Normal migration operations: no site-origin JavaScript errors observed. Static URL/reference audit passes; eager home/logo and observed class imagery load.

## Automated local checks
- navigation strict PASS, navigation regeneration idempotent.
- trial CTA strict PASS; existing first-party LINE application preserved.
- class photo/instructor photo contracts PASS; image guard: no new issues/oversized images.
- broadcast audit PASS.
- migration static audit:10 pages, local destinations, scripts,154 protected-file hash matches.
- Python projection tests3 PASS: allowlist, private-field exclusion, unknown counts, rental/private/CLOSE/REOPEN exclusion, duplicate/cancellation.
- JavaScript syntax checks PASS. CI browser suite added, status must be checked on the PR; adding a test is not evidence of its execution.

## Unverified
Physical phones, native LINE/mail handoff/send, full screen-reader testing, live Calendar/counts/reservations, every legacy protected operation (hash preservation is not a runtime pass). Protected Workshop auth/booking/payment/DB untested and unchanged.

## Scoring (reviewer judgment, not measured conversion)
Design18/20; reservation UX19/20; discovery/form19/20; integration13/15; mobile/accessibility9/10; data/security8/10; handoff5/5 =91/100.
No production approval implied; Calendar and count systems remain incomplete.

## PR CI follow-up
First CI browser run passed 10 routes ×6 widths, discovery/forms and trial handoff. Old portal nine-card selectors updated to seven categories +two utilities with safe destinations; source shell stored as text to avoid treating documentation as a deployed page. Migration FAQ/pricing accordions and class/instructor filters also manually verified.
