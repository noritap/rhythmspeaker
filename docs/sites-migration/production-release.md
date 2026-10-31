# Production release / 2026-11-01 JST

Owner authorized integration and production publication in the conversation.

- Source: Sites v6 / PR301; no framework migration.
- Release removes review noindex/badge, adds pricing/schedule/instructors sitemap entries.
- Runtime source strictly live public envelope; sample fixture cannot load through production config or validator. The development state selector is absent.
- Calendar list read confirmed the lesson and rental calendars exist. No settings changed. Continuous synchronization credentials/deployment are not configured; no personal event content was persisted/published.
- Real public class list is unavailable, so no sessions or guessed counts are displayed. New requests generate editable text for the studio LINE/email. Confirmation remains manual.
- Canonical instructor contact policy preserved: bookings through studio, desired instructor in message; PR297 remains unmerged.
- No booking sends, payments, calendar edits, database/auth changes.
- Future calendar synchronization requires a least-privilege server-side credential, explicit OPEN allowlist, a private event-ID map, deletion/recurrence handling and a separate confirmed-count ledger. Do not publish a one-off calendar dump as continuously synchronized data.

## Post-deploy regression fix
Sequential client-side route navigation exposed relative header/footer links resolving against the new pathname. The enhancer now freezes their initial document URL before routing; CI explicitly tests home → schedule → pricing → FAQ → portal → home. Asset version incremented to invalidate the first release cache.
