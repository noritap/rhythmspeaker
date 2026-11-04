# Rhythm Speaker | Class schedule reliability and alternative architecture (2026-11-04)

Status: **incremental production UX/cadence candidate; independent recovery G1 NOT DONE**. Tracking: [Issue #328](https://github.com/noritap/rhythmspeaker/issues/328).

## Product contract
- Google Calendar ("レッスン296") is the editable operational source for lesson dates, titles, teachers and cancellation markers. "296レンタル" and other calendars must never be mixed in.
- Website displays only approved, sanitized class/teacher/time/status fields. Do **not** publish the private primary Google Calendar, raw notes, attendee lists, service account keys, or private ICS URL.
- Website does not confirm bookings. Contact is via official LINE/email; studio reply confirms the reservation.
- Unverified/stale OPEN data is never shown as current bookable availability.

## Recommended UI (low-risk first release)
- Show the upcoming **list** by default, in chronological order, initially 12 classes. "さらに表示" progressively reveals more.
- Retain the existing calendar toggle, class filter, teacher filter, class detail and request composer. No changes to URL, prices, form content, LINE destinations, or confirmation semantics.
- On stale or invalid data, preserve the existing safe fail-closed LINE/email path, not historical cards.
- Initial UI changes are **not** a remedy for the Google Calendar publication pipeline. Measure real bookings/entry behavior later.

## Publication cadence
- Move best-effort GitHub Actions cron from twice per hour to quarter-hour opportunities (7, 22, 37 and 52 minutes UTC).
- **This does not guarantee a 15-minute update.** GitHub can delay or drop scheduled runs. Independent Cloudflare watchdog, App authentication, alert delivery, guarded workflow_dispatch and end-to-end recovery verification still need completion.
- Keep publish job's explicit owner approval variables, main-only ref gate, publish concurrency group, no-force-push behavior and read-only Google Calendar scope.

## Alternative architecture to trial separately (do not switch production until validated)
1. Keep Google Calendar as the single editing source, and reuse the **existing allowlist and normalization policy** from `tools/sync_public_classes.py` / `tools/public_class_projection.py`.
2. Compare a read-only API adapter (private Google Calendar -> sanitized JSON through Cloudflare Worker or other trusted server) with Apps Script and the current GitHub publication pipeline.
3. The browser must **never** carry service-account credentials, private Calendar ID/ICS URL, attendee details or privileged keys.
4. Prototype endpoint must preserve `class-reservation-v1.3`, stable opaque IDs, cancellation tombstones, strict metadata validation, status meanings, Asia/Tokyo time and all existing reservation safety checks.
5. Consider short-lived server-side caching, explicit observation timestamps, non-PII logging, rate limits and an independent external monitor. Do not call the Google API from every browser session.
6. Prove recurring event expansion, changes/CLOSE/CANCELLED, private events filtering, request limits, failures, security and mobile usability against non-production fixtures and an approved read-only calendar.
7. Migrate only after privacy review, owner approval and a parallel comparison of class-counts / individual session signatures / update latency / error rate, then maintain rollback to the current safe JSON source.
8. Do not create an additional public calendar or Cloudflare product without explicit approval of the required sharing/plan; avoid double-entry of lessons.

## Release and evidence gate
- Unit tests + browser 320/375/390/430/768/1440 widths PASS.
- GitHub PR CI PASS and no unrelated files changed.
- GitHub Pages build/deploy success and production `/schedule/` visual/functional verification. A green code CI alone is **not** production verification.
- G1 remains BLOCKED until actual 15-minute Worker ticks, alerts, new auto-dispatch, updated Pages JSON and browser recovery are all verified.
