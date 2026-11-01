# RS Calendar Watchdog — independent G1 monitor

**Status: SOURCE READY / NOT DEPLOYED.** Adding these files to GitHub does not
create a Cloudflare Worker, add GitHub App permissions, or activate monitoring.
Do not mark G1 DONE until scheduled runtime behavior and alert delivery are
verified on a real external account.

## Purpose

The Google Calendar → public JSON sync runs on GitHub Actions. GitHub's own
cron can be delayed or dropped. This Cloudflare Worker runs every 15 minutes
and checks **two independent public copies**:

- GitHub main: `data/class-sessions.public.json` (source)
- GitHub Pages: `https://noritap.github.io/rhythmspeaker/data/class-sessions.public.json`
- GitHub's latest workflow runs (queued, in progress, recent completed)

It never requests private Google Calendar data and never modifies events,
reservations, student information, payment, or UI.

If the source data exceeds 90 minutes without a successful sync and there
is no active/recent job (60-minute cooldown), the Worker uses a short-lived
GitHub App **installation token** to invoke exactly
`class-calendar-sync.yml` on `main`. It sends an optional alert webhook.
If Pages is stale but main is fresh, it alerts instead of dispatching again.

The 3-hour front-end stale-data safety cutoff is unchanged. Old OPEN data
never becomes a booking guarantee. User-facing LINE/email fallback remains
the same.

## Offline checks

```bash
node --test tools/calendar-watchdog/worker.test.mjs
node tools/test_calendar_stale_contract.js
node --check tools/calendar-watchdog/worker.mjs
```

The GitHub workflow `calendar-watchdog-contract.yml` executes these offline.
No secrets are needed for tests.

## Required OWNER approval / account connection (not automated)

1. Create or choose a Cloudflare account, verify its Workers plan / costs,
   and create Worker named `rs-calendar-watchdog`. Obtain permission to deploy.
2. Register a GitHub App restricted to `noritap/rhythmspeaker`, with only
   **Repository Actions: Read and Write**, and install it on that repo.
   Do not grant organization-wide installation access.
3. Download the GitHub App private key to a trusted local machine. **Do not
   paste it into chat or commit it to any repo.** Convert it locally from
   downloaded RSA PKCS#1 PEM to unencrypted PKCS#8 PEM for WebCrypto:

   ```bash
   openssl pkcs8 -topk8 -nocrypt -in downloaded-app-key.pem -out github-app-pkcs8.pem
   ```

   Immediately protect the converted file with local file permissions and
   remove it when no longer needed.
4. Set Cloudflare Worker **Secrets** (never plain GitHub-tracked variables):
   - `GH_APP_ID`: official GitHub App ID
   - `GH_APP_INSTALLATION_ID`: installation ID on the target repository
   - `GH_APP_PKCS8_PRIVATE_KEY`: the complete converted PEM
   - `ALERT_WEBHOOK_URL`: optional approved webhook endpoint (e.g. private
     studio incident channel), but **required for G1 alerting acceptance**.
5. Deploy from directory `tools/calendar-watchdog` with Wrangler and the
   provided `wrangler.jsonc`, after approval. The Worker contains
   `scheduled()` only and returns HTTP 404 on requests; it does not expose
   a public dispatch URL. The cron is UTC `*/15 * * * *`.
6. Confirm in Cloudflare execution logs that multiple **scheduled** ticks run.
   Run a controlled, non-production fixture first for failure cases.
   Then verify real stale-source warning and a one-time recovery safely in a
   scoped manual test; do not disable production calendar or tamper with live
   JSON to create an outage.
7. Ensure the notification is received; confirm the resulting GitHub workflow
   has `test` and `publish` success, then the Pages deployment and public
   `lastSuccessfulSyncAt` have actually advanced. Log evidence into Issue #328.

## Alert and failure policy

| Kind | Meaning | Action |
|---|---|---|
| `healthy` | both sources newer than 90 minutes | no action |
| `pages_lagging` | repo fresh, Pages stale | alert, no duplicate calendar sync |
| `source_invalid`, `pages_invalid` | source malformed/unavailable | alert, no unsafe dispatch |
| `existing_job_active` | workflow queued/running | alert, do not double-submit |
| `recent_job_cooldown` | some workflow started in last 60 min | alert, do not double-submit |
| `recovery_dispatched` | GitHub App dispatched workflow | alert and verify outcome |
| `monitor_failed` | network, auth, or API failure | alert and escalate to operator |

The webhook is optional for preview, but production G1 **cannot be accepted**
without an alert route. If the webhook is itself unavailable, check Cloudflare
execution error logs manually and mark the monitor impaired. Do not claim the
system provides 100% availability or durable exactly-once scheduling.

No sensitive student data, private calendar payload, GitHub tokens, JWT,
webhook secrets, or query parameters are logged or copied into GitHub issues.

## Rollback

Disable only the **Cloudflare Cron Trigger** or remove its Worker deployment.
The existing GitHub Actions schedule and all visitor-facing pages remain
unchanged. If the Worker over-dispatches, disable the cron and revoke the
GitHub App installation token permissions; verify current GitHub workflow
runs. Never delete public class JSON or change the Calendar source to "fix"
watchdog behavior.

## Release gate

- [x] Source scaffold and offline behavior tests in GitHub
- [ ] Owner Cloudflare account + GitHub App + alert channel approval
- [ ] Live cron deployed (not only committed)
- [ ] Live scheduled ticks and alert receipt confirmed
- [ ] Controlled recovery/duplicate job test performed without changing
      any booking, live class, or customer data
- [ ] Issue #328 evidence; G1 exit criteria reviewed
