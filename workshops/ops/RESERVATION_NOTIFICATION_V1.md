# Workshop reservation notification v1.0 — deployment hold

Status: **CODE STAGED / NOT DEPLOYED / NOT ENABLED** (2026-11-15)

## Goal / scope
- Send operator-only notification **to rhythmspeaker296@gmail.com** for every new `public.workshop_reservations` INSERT.
- Include all application fields held in the reservations row, event name/date/venue, session name/time, fee, status, source, and admin URL.
- Existing booking form, `create_workshop_reservation`, status updates, payment, capacity and RLS remain unchanged.
- Historical reservations are **not** notified retroactively. No customer email in v1.0.

## Files staged
- `workshops/supabase/005_reservation_notification_log.sql`: **not applied**.
- `workshops/supabase/functions/workshop-reservation-notify/index.ts`: **not deployed**.
- This document: manual configuration and gate.

## Required operator setup after separate production approval
1. Confirm a Resend account and **verified sender domain**. Register sender such as `Workshop Manager <notify@verified-domain.example>` (placeholder only). Determine ownership/DNS before proceeding.
2. Create a sending-only Resend API key and a long random webhook secret. **Never commit either to GitHub.**
3. Set Supabase Edge Function secrets: `RESEND_API_KEY`, `WORKSHOP_NOTIFICATION_FROM`, `WORKSHOP_WEBHOOK_SECRET`. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be available server-side. Secret key MUST NOT be exposed to GitHub Pages.
4. Review and apply `005_reservation_notification_log.sql` through the approved production migration process. Verify only backend service access to the table; check security advisors.
5. Deploy the new Edge Function with `verify_jwt=false` **and** require the custom `x-workshop-webhook-secret` request header. Do not use unauthenticated public invocation. Function deployment config must scope JWT setting to this function only.
6. Configure a Supabase Database Webhook:
   - table `public.workshop_reservations`, event `INSERT` ONLY
   - HTTPS URL: the deployed `workshop-reservation-notify` function
   - HTTP header `x-workshop-webhook-secret: <secret>`
   - ensure Webhook starts only **after** steps 1–5 are verified.
7. Generate a controlled test reservation through the normal form only with approved test identity; verify mail received at the recipient and the notification log status. Do not send customer data through external test services until authorized.
8. Confirm normal booking, fees, capacity, payment state, and cancellations are unchanged.

## Failure semantics and recovery
- Database booking commit is independent of notification mail sending.
- `processing`: worker claimed the reservation, but outcome is not yet confirmed. An old processing row needs manual investigation; do not blindly retry.
- `sent`: Resend API accepted the message and returned an ID. This is **not proof of Gmail delivery**.
- `failed`: failure recorded; a replay of the same authenticated webhook attempts a resend up to 3 total attempts. No automatic scheduler is included in v1.
- If webhook delivery itself fails, there can be **no notification-log row**. Manually compare recent reservations against log rows until a monitoring job is approved.
- Ambiguous send success + log-update failure may be rescued by Resend idempotency only within its retention window. **Do not automatically replay after 24h**; inspect the provider send history first.
- Do not reset logs or manually resend until matching booking, provider history and message-id have been checked.
- For deployment rollback: disable the database webhook first, then disable the function. Leave existing bookings intact.

## Acceptance checks
- 1 new booking → one message sent to operator, including all fields.
- Repeated webhook payload → no second email.
- Sender rejected, invalid secret or missing secret → controlled failure; booking stays saved.
- Failed notification visible through log; manual recovery procedure documented.
- Empty optional fields shown as 未入力; timestamps in Asia/Tokyo.
- No API keys, recipient application data, or service-role key printed to CI/PR logs.
- Existing payment, cancel, instructor special and capacity flows unaffected.

## Known boundaries / follow-up
- Email recipient is currently fixed in code per approved requirement.
- Resend sender domain, account and key **not verified**.
- No production webhook, table, function or secrets have been configured.
- No runnable test/CI execution yet; code needs syntax, type, mocking and replay tests before deployment.
- This feature handles booking mail, not payment follow-up / customer confirmation / monitoring.
