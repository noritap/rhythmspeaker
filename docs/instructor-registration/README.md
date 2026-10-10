# Instructor Profile Registration — Phase 2 Integration Contract

Status: **frontend prototype live; authenticated submission NOT YET ENABLED**.

## 3VC implementation boundary

1. Mobile-first four-step form with validation and local draft.
2. Review/consent and explicit JSON export; **not** a network submission.
3. Server integration contract and migration prepared for a **new dedicated** instructor backend.

## Important: do not reuse existing live Supabase projects

The accessible projects are `rs-workshop-manager` and `kashima-house-os`. They belong to other systems. **Do not run this migration against either.** Provision a dedicated instructor profile backend only after reviewing plan/cost and security.

## Data and state contract

- Draft `draft`, submitted `submitted`, changes requested `changes_requested`, approved `approved`, published `published`.
- Instructor may view own record and edit only draft/changes-requested.
- Administrator reviews, returns feedback, approves; approval does not itself publish.
- Published content is generated only from approved fields; contact email, owner ID, review notes and audit details remain private.
- Require verified identity before allowing submission. Never trust a client-provided owner ID, status or admin flag.
- Add an append-only server-side audit log, administrator authorization, version conflict protection, and publish/rollback before connecting frontend.
- A separate secure storage bucket with MIME/size validation, signed upload and image rights confirmation is required for photos.
- Email invitations and admin identity provisioning must be completed before accepting personal information.

## Deployment acceptance

- Security: test owner A cannot read/write owner B, anonymous cannot access drafts, instructors cannot self-approve/publish, and admin review is logged.
- UX: mobile widths 320/375/390/430, tablet and desktop; keyboard, screen reader, errors, resume and slow network.
- QA: draft, submit, reject, edit, approve, publish, rollback, image handling, and GitHub Pages production checks.
- Keep `/workshops/` and all existing live backend projects untouched.

## Current limitations

There is no connected dedicated instructor backend or administrator identity provisioned. The form currently exports a JSON file locally; **do not present it as a completed submission or a functional approval system**.
