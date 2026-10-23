# Workshop detail and past-event archive proposal

Status: DRAFT / NOT PUBLISHED / NO PRODUCTION DB WRITE

## 坂井田コージ 2026-11-22
- 2026-11-22 (Sun), 15:00–16:30, 90 min
- All levels / JPY 3,000 / capacity 10 / opens with >=2 reservations
- Rhythm Speaker Ikebukuro
- Speaker portrait, official bio, content outline, reservation method, payment method, cancellation policy: pending organizer confirmation
- Revenue share 70/30 is internal and must not appear on public pages
- Static draft: `workshops/sakaida-koji-20261122.html`
- Public event listing and live booking are Supabase-backed; static draft alone does NOT create an event, session, or reservation.

## Production publication gate
1. Organizer approves photo, profile, description, cancellation policy, reservation cutoff and payment URL.
2. Admin creates event + 1 session in /workshops/admin using existing authenticated workflow, with 2-person minimum clearly noted.
3. Verify published event appears in /workshops/, detail loads via event.html?slug=..., and reservation flow respects capacity.
4. Do not expose 70/30 internal settlement in public copy.
5. No production Supabase mutation from repository change alone.

## Completed workshop UX proposal
- Upcoming section: future published workshops only, sorted by start date.
- Past workshops section: ended events sorted newest first, compact cards (date, teacher, title, photo if approved), initially 6 and expandable.
- On past event detail: prominent "開催終了" state; no active booking CTA/form; preserve public descriptive information and approved photos/recap.
- Separate statuses: upcoming / registration closed / completed / canceled; never classify a canceled workshop as a successful past event.
- Never delete event or booking records merely to hide from upcoming; protect PII in archive.
- Optional after-event recap: summary, instructor comment, approved photos/video, link to future workshop/LINE. No participant names or photos without consent.
- Implementation should use the existing live Supabase event model; inspect published filtering and RLS before any schema or query change.
- QA: timezone Asia/Tokyo date boundary, no expired booking CTA, 320/375/390/430px mobile, empty states, canceled cases, accessibility, existing reservations unchanged.

## Current limitations
- Draft standalone HTML is not linked from the live workshop index.
- No live event has been created, no booking enabled.
- Archive behavior is proposed only, not yet implemented.
