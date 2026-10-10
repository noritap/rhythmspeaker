# Instructor intake via Google Forms — rollout and security
Status: CODE PREPARED, NOT LIVE. This repository cannot create a form in a Google account by itself.

## One-time setup by studio administrator
1. Open https://script.google.com/ using a studio-controlled Google account.
2. Create a blank Apps Script project and paste `docs/instructor-registration/google-forms/create-form.gs`.
3. Run `createInstructorForm` **once**, review Google permission prompts, and grant access only if expected. Script creates one Google Form and one private response spreadsheet.
4. In the Apps Script execution log, copy **only** the respondent URL. Keep the edit URL and spreadsheet URL private.
5. In Google Forms, confirm the form is accepting responses and that intended instructors can open it without unintended sign-in restrictions. Test with a dummy response; verify it appears in the private spreadsheet. Delete the dummy response afterward.
6. Review account sharing and response access permissions. Do not enable public response summaries. Google Forms' file upload is deliberately not used, so photo delivery is handled separately.
7. Put only the verified respondent URL in `instructor-submit/form-config.js`, submit a PR, run link/mobile checks, and deploy.
8. Share `https://noritap.github.io/rhythmspeaker/instructor-submit/` with instructors **only after** the respondent link is live and verified.

## Approval workflow
- New response → administrator reviews spreadsheet privately → ask for corrections as needed → separately receive/verify photo → approve public fields → update official instructor page through existing GitHub PR/review flow.
- Do not publish private email, spreadsheet responses, or unapproved material. This is manual approval, not automatic publication.
- Google Forms and Sheets free usage depends on Google account storage and service quotas. Do not promise unlimited free storage.
- Google Forms file upload often requires a respondent Google sign-in; excluded by design.
- This setup does not modify Workshop Manager, Supabase, payment systems, or customer booking CTA.

## Rollback
- If URL is incorrect, set `RS_INSTRUCTOR_FORM_URL` to empty string and deploy; the public page will show '受付準備中'.
- To close intake, disable accepting responses in Google Forms; keep private records per retention policy.
- Do not delete existing instructor-registration page or its local drafts.
