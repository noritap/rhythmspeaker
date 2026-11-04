# Workshop Draft Review System v1 — implementation plan

## Purpose
Allow studio administrators and workshop instructors to review a mobile-first event detail page before publication. Nene's 2026-11-03 beginner workshop is the initial sample; all future workshops should reuse the workflow.

## Verified current architecture
- `workshops/index.html` lists published events from `RSStore.listEvents({publishedOnly:true})`.
- `workshops/event.html` loads events by slug and includes live reservation controls.
- `workshops/admin/manager.js` supports draft/published status and event editing.
- `workshops/assets/store-v2-adapter.js` reads Supabase `workshop_events` and `workshop_sessions`.
- Instructor-specific links exist but must not be assumed to authorize public draft previews.

## Safety requirements before production
1. Use a server-validated, random, revocable, time-limited preview token scoped to one event; store only its hash. Do not expose draft event data through unrestricted public database queries.
2. Preview read endpoint must return a whitelisted subset of event fields, never attendee details, instructor access tokens, or admin credentials.
3. Preview page must be read-only: no reservation, payment, mutation, waitlist, or check-in actions. Render prominent `確認用・予約不可` banner and `noindex`.
4. Validate expiration/revocation on each request; rate-limit token lookups. Do not place tokens in analytics or third-party embeds; apply Referrer-Policy: no-referrer.
5. Admin can issue/revoke a link; instructor can request edits through existing contact channel. Publishing requires explicit admin action.
6. Existing published event and reservation flows must remain unchanged. Validate mobile, accessibility, auth, data isolation, and regression tests before merge.

## Proposed workflow
Admin creates draft -> admin checks preview -> admin issues instructor review link -> instructor reviews on phone -> admin revises -> admin approves publication -> published detail page opens reservations.

## Sample
`workshops/preview-demo.html` is an intentionally non-functional sample, committed only to this feature branch. It contains no token and no production database access. It is not a private draft-sharing solution.

## Nene sample details (verify before publication)
- 2026-11-03 (Tue holiday), 16:00–17:20; workshop 80 min, floor use 90 min (confirm how buffer is scheduled).
- Price JPY 2,000; capacity 5; beginner audience.
- Instructor display name `冴音（ねね）` requires confirmation.
- Reservation channel, cancellation policy, image rights and publication consent remain to be confirmed.

## Release gates
Do not merge or publish sample as live event until security implementation, tests, instructor review, and admin approval are complete.
