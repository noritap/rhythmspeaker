# Instructor intake via Google Forms — rollout and security
Status: CODE PREPARED, NOT LIVE. This repository cannot create a form in a Google account by itself.

## One-time setup by studio administrator
1. Open https://script.google.com/ using a studio-controlled Google account.
2. Create a blank Apps Script project and paste `docs/instructor-registration/google-forms/create-form.gs`.
3. Check the existing Forms list for the same purpose before creating anything. Run `createInstructorForm` **once**, review Google permission prompts, and grant access only if expected. Script creates one Google Form and one private response spreadsheet.
4. In the Apps Script execution log, copy **only** the respondent URL. Keep the edit URL and spreadsheet URL private.
5. In Google Forms, review the closed form and private sheet first, then obtain owner approval to publish/enable responses for testing and distribution; confirm the form is accepting responses and that intended instructors can open it without unintended sign-in restrictions. Test with a dummy response; verify it appears in the private spreadsheet. Delete the dummy response afterward.
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

## Creation safety and recovery
- New forms start with responses **closed**. This is preparation, not launch approval. Review the actual account, sharing, intended respondent audience and owner approval before enabling responses.
- A script lock prevents simultaneous creation within the same Apps Script project. It does not prevent duplicates made from a different script project; inspect the existing form inventory first.
- Form/sheet IDs are recorded immediately after creation. Setup state is `CREATING` until all setup finishes, then `READY_FOR_PRIVATE_QA`. This state means code completed, not privacy or browser QA passed.
- If an execution fails, do not rerun from a new project, clear properties or delete files blindly. Inspect recorded IDs in the private script properties and corresponding files. Repair the existing setup after review.
- Offline behavior tests: `node --test tools/test_instructor_form_creation.cjs`. They cover simultaneous attempts, failures while building questions/creating Sheets/linking responses, and repeat attempts. They do not verify actual Google permissions or response storage.

## Launch evidence checklist
Record results privately; do not commit respondent data or administrator URLs.
- [ ] Correct studio-controlled owner; existing-form inventory checked.
- [ ] Private response sheet: restricted general access and expected administrators only; no publish-to-web.
- [ ] Form: public response summary off; no verified-email collection, one-response sign-in restriction or file upload; respondent audience checked in current UI.
- [ ] Owner approves publishing/response acceptance before live QA/distribution.
- [ ] Anonymous respondent test: mobile, tablet and desktop, required fields and completion message checked.
- [ ] Disposable test response arrives in linked sheet; no respondent can see another response.
- [ ] Remove only the identified test response from Forms and the corresponding row from Sheets. These are separate stores; do not assume one deletion cleans both. Obtain any required confirmation before irreversible deletion.
- [ ] Only canonical respondent URL configured; CI passes; main/Pages and the actual outbound link verified.
- [ ] Retention period and periodic private access review agreed by administrator.

Current evidence remains **NOT LIVE** until the account-side and launch checks above pass.
