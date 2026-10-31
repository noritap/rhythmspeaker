# Known gaps / approval gates

## Incomplete
- Google Calendar API authentication/read sync/cache/change/deletion/recurrence pipeline. No Calendar setup changed and no private calendar events retrieved.
- Confirmed reservation ledger/aggregation/concurrent capacity enforcement. Unknown count remains null; UI does not promise seats.
- Teacher direct-application operational policy: canonical main has studio unified booking, PR297 extends consultation. Current proposal is explicit, not silently treated as an adopted policy.
- Physical mobile devices, actual LINE app paste/send, mail-client delivery, screen-reader device testing.
- A permanent externally hosted branch website has not been configured. Internal managed preview is interactive; GitHub Actions produces a downloadable preview artifact. No main Pages or external deployment settings are modified.

## Intentional preservation / visual differences
- Six class detail pages and instructor profile pages keep the current GitHub UI and all content, instead of replacing them with the lighter Sites modal/detail view.
- Four contact-only instructor class assignments remain unknown. Their approved identity photos remain.
- Existing standard navigation destinations, founder information and trial application endpoint retained.

## Must approve before release
- Main merge / production deployment.
- Review noindex and preview badge removal, sitemap inclusion for schedule/pricing.
- Sample schedule must not be presented as live; decide whether to keep a clearly labelled demonstration or wait for validated live data.
- Confirm instructor proposals, teacher/studio reservation ownership, 30-minute prices, source Calendar IDs and access, public filtering criteria, private count-ledger ownership and update permissions.
- Any real Calendar authentication, secret setup, external system changes or reservation writes require their own approval.
