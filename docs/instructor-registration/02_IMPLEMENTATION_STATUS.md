# Instructor intake: secured review RPC v1

**Status: implementation committed, NOT deployed.**

Apply `001_schema_dedicated_backend.sql` and then `002_secure_approval_rpc.sql` **only on a newly approved dedicated Supabase project**.

## 3VC

1. **Submit**: authenticated owner may save own profile JSON in draft/changes_requested and call `instructor_submit()`. The database verifies minimum required fields and locks editing on submission.
2. **Review**: a trusted operator provisions `instructor_admins` (never from browser). An authenticated administrator calls `instructor_admin_queue()` and `instructor_admin_review(profile_id, 'approve' | 'request_changes', feedback)`. State changes are audited.
3. **Publish gate**: approval does not publish. The authorized operator reviews a generated public-only profile diff, creates a PR, checks CI, merges, and verifies production before recording published state.

## Important limitations before connecting UI

- The frontend currently supports local draft and JSON export only; it must not pretend to submit.
- Need new dedicated project, auth invitation flow, image storage with consent and limits, server-side input schema validation, and admin dashboard.
- Never expose service role credentials in GitHub Pages, and never publish `email`, owner IDs or admin feedback.
- Run database tests for RLS and function permissions. In particular, test instructor attempts to change `status`, `approved_at`, and `admin_feedback`, cross-owner access, anonymous calls, invalid transitions and audit inserts.
- No production migrations or backend writes have been performed.

## Known security caveat

The initial 001 migration grants insert with status=draft. Before deploying, audit column privileges and confirm users cannot set privileged columns in INSERT (such as `approved_at` or `admin_feedback`); use column-specific INSERT grants or a restricted RPC-only insert path. Do not deploy this schema until these checks pass.
