# FREE FORM INTAKE STANDARD — Rhythm Speaker
Status: LOCAL OPERATING STANDARD / no new paid subscriptions
Owner: Studio management
Applies to: instructor profiles, staff reports, event applications, surveys and similar low-risk information collection.

## Decision / boundaries
- Default: Google Forms for respondent input and Google Sheets for private response storage. Reuse the studio-controlled Google account; avoid adding a separate form SaaS, paid tier, new Supabase project, or custom backend for simple intake.
- Free does **not** mean unlimited: Google account storage, Forms/Sheets limits, Apps Script quotas and service terms apply and may change. Track constraints before scaling. Never auto-upgrade or authorize billing.
- Each form requires a named owner, explicit purpose, minimal fields, privacy review, retention decision, and access-control check before distribution.
- Form respondent links may be shared after verification; **never** commit edit URLs, response spreadsheet links, response data, secrets, or private contact details to this public repository.
- Keep instructor photo collection outside Google Forms file-upload when avoiding Google sign-in is important. Do not request unnecessary sensitive information.
- For any payment, account authentication, workshop reservation, regulated/sensitive data, or business-critical real-time operation, reassess separately; Google Forms is not a universal secure backend.
- Preserve existing customer-facing LINE conversion CTA and Workshop Manager production environment.

## Three-stage delivery gate
1. **Prepare:** define data owner, minimum questions, publication consent, access permissions, and draft using Google Forms or reviewed Apps Script. Use existing `docs/instructor-registration/google-forms/create-form.gs` for instructor intake. No new form should be described as live before creation.
2. **Verify:** test respondent URL on smartphone and without unintended login, submit dummy data, confirm response in the private sheet, test response restrictions, then remove test data. Check that edit/sheet URLs are private.
3. **Activate and review:** add only verified respondent URL to the intended official website page, run PR/CI and production link checks, distribute to instructors, manually approve publication, periodically review quota and delete unnecessary data.

## Scale decision
If repeated forms grow, first inventory existing forms, duplicate an approved template and organize private Sheets by purpose. Track response counts, storage and quota use. When free limits become binding, prefer archiving or simplifying data, not automatic purchase. Any paid option requires owner approval and evidence of incremental margin or reliability need per `docs/infrastructure/REVENUE_FIRST_INFRASTRUCTURE_POLICY.md`.

## Current instructor intake status
- `instructor-submit/` exists but remains in **受付準備中** state until `instructor-submit/form-config.js` receives the verified Google respondent URL.
- Form and response spreadsheet **not created** by the GitHub implementation. Administrator must run the Google Apps Script in their own Google account or complete the equivalent in Work mode.
- Never redirect instructors to a placeholder form. The older offline `instructor-registration/` remains unchanged and is not connected to Google Forms.
