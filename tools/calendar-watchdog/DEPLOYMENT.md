# RS Calendar Watchdog | Cloudflare production deployment via GitHub Actions

Status: DEPLOYMENT WORKFLOW READY. Production G1 is NOT DONE until the correct Cloudflare Worker code, scheduled ticks, alerts, and recovery are verified.

## What is implemented

The production monitor source is at tools/calendar-watchdog/worker.mjs. The Wrangler configuration at tools/calendar-watchdog/wrangler.jsonc deploys an existing Worker called rs-calendar-watchdog with a fifteen-minute UTC cron (*/15 * * * *), no public HTTP route, and observations enabled. The source monitor checks GitHub main, GitHub Pages, and the latest GitHub Actions runs. It dispatches only the existing class-calendar-sync.yml workflow on main after confirming staleness and cooldown.

Cloudflare browser evidence from 2026-11-02 showed an existing Worker with Ready status, but the execution log said "Hello World Worker received a request!" It was not the intended watchdog. Cloudflare code and secrets still require a separate, authorized release.

## Once-only owner configuration (do not paste or commit credentials)

1. Create a private GitHub App with Repository Actions Read and Write and Metadata Read; install only on noritap/rhythmspeaker. The broad "Cloudflare Workers and Pages" GitHub App is not required and requests unrelated permissions.
2. Download the App's RSA private key to a trusted local workstation. Convert from the GitHub-downloaded key to unencrypted PKCS#8 PEM using: openssl pkcs8 -topk8 -nocrypt -in downloaded-app-key.pem -out github-app-pkcs8.pem. Protect and delete the temporary file after secret registration. Do not share it in chat.
3. In Cloudflare, open the existing Worker rs-calendar-watchdog → Settings → Variables and Secrets. Add the following as Worker SECRETS (not public plaintext variables):
   - GH_APP_ID: the GitHub App ID.
   - GH_APP_INSTALLATION_ID: the installation ID restricted to the target repository.
   - GH_APP_PKCS8_PRIVATE_KEY: the complete PKCS#8 PEM.
   - ALERT_WEBHOOK_URL: the approved incident-notification webhook that accepts JSON with text and dashboard properties. Delivery must be confirmed for G1.
4. In Cloudflare Account API tokens, create a custom token for only the correct Cloudflare account, with the official "Edit Cloudflare Workers" permission template. Do not use a Global API Key.
5. In the noritap/rhythmspeaker GitHub repository → Settings → Secrets and variables → Actions, add TWO repository Actions secrets:
   - CLOUDFLARE_API_TOKEN: the restricted Cloudflare token.
   - CLOUDFLARE_ACCOUNT_ID: the Cloudflare account ID owning rs-calendar-watchdog. Verify the account ID matches the Worker before release.

The GitHub App private key and notification webhook belong ONLY to Cloudflare Worker Secrets, not to GitHub secrets. The Cloudflare API deploy token belongs ONLY in the GitHub Actions secret store, not in the repository or in this document.

## Production release

1. Confirm the four Worker secrets and two repository Actions secrets are configured. Do NOT enable the scheduled monitor before private recovery/alert bindings are present.
2. Open GitHub Actions → "Calendar watchdog production deployment" → Run workflow, choose main and enter exactly DEPLOY_RS_CALENDAR_WATCHDOG in confirmation.
3. The manual-only workflow checks repository/branch/confirmation, runs the existing Node security tests and validates the Worker name, entrypoint, disabled public route, and Cron contract.
4. It uses the official cloudflare/wrangler-action@v4 to deploy only tools/calendar-watchdog to Cloudflare with the supplied account-scoped credentials. A missing credential aborts with a clear error, without printing secrets.
5. Check the workflow run is green and inspect the Cloudflare Worker → Deployments for a new version. Verify the deployed code is not Hello World, and Settings → Triggers reports */15 * * * * UTC. Because workers_dev is false, the old public URL may disappear by design.
6. In Cloudflare Observability, verify multiple SCHEDULED event invocations and accurate calendar watchdog status logs (healthy, stale, etc.). GET requests are not scheduled executions.
7. Test alert receipt through a safe non-production fixture/test channel; never edit the live Google Calendar or corrupt public JSON to simulate an outage.
8. Observe a genuine stale incident or use a controlled test harness to verify the bounded GitHub App workflow_dispatch on main, job completion, the subsequent GitHub Pages deployment, and advancing public lastSuccessfulSyncAt. Verify /schedule/ in a fresh browser session.
9. Record links/screenshots without any private secrets in GitHub Issue #328. Mark G1 production verified only with the above evidence.

## Safety and rollback

- Deployment workflow is manual only, and has GitHub contents:read. Invalid confirmations or non-main refs abort rather than deploying.
- Do not modify Workshop Supabase/Auth/RLS, individual bookings, lesson Google Calendar source, existing LINE CTA, or GA4 PR #274.
- If the monitor over-dispatches or alerts fail, disable only its Cloudflare Cron Trigger and optionally revoke the GitHub App installation; existing GitHub scheduled sync and visitor-facing fallback remain independent.
- Owner-authenticated Cloudflare/ GitHub account setup and credential registration cannot be inferred from a green CI run. Never mark production complete on source-code merge alone.

## G1 release checklist

- [ ] Restricted Cloudflare deployment token and Account ID confirmed in GitHub Actions Secrets
- [ ] Repo-specific GitHub App and private Cloudflare Worker secrets confirmed
- [ ] Alert webhook verified at its receiver
- [ ] Authorized main-branch GitHub deployment workflow succeeded
- [ ] Cloudflare Worker is the intended monitor, not Hello World
- [ ] Cron trigger every 15 minutes and multiple scheduled executions recorded
- [ ] Recovery duplicate-prevention, dispatch and subsequent publication tested
- [ ] Main GitHub issue #328 updated with verifiable non-sensitive evidence
