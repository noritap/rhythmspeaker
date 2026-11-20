#!/usr/bin/env bash
# Publish only the rebuilt public Shoten catalog (run from the site
# repository root). Never force-push, overwrite a newer catalog from
# another run, or print credentials. Mirrors the fail-closed procedure of
# publish_public_classes.sh.
set -euo pipefail

PUBLIC_FILE="shoten/catalog.json"
TARGET_REF="refs/heads/main"
MAX_PUSH_ATTEMPTS=3

# The workflow already gates on main; retain a second guard for accidental
# invocation on other Actions event refs.
if [[ "${GITHUB_ACTIONS:-}" == "true" && "${GITHUB_REF:-}" != "$TARGET_REF" ]]; then
  echo "Refusing to publish outside main." >&2
  exit 1
fi

if git diff --quiet HEAD -- "$PUBLIC_FILE"; then
  echo "No catalog changes."
  exit 0
fi

# Preserve the exact checked-out commit for remote-change comparisons. The
# catalog was generated and validated against this snapshot.
BASE_COMMIT="$(git rev-parse HEAD)"
git config user.name "rhythm-speaker-shoten-bot"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -- "$PUBLIC_FILE"
git commit -m "data(shoten): publish approved products (auto publish)"

for ((attempt=1; attempt<=MAX_PUSH_ATTEMPTS; attempt++)); do
  if git push origin "HEAD:$TARGET_REF"; then
    echo "Published the rebuilt catalog."
    exit 0
  fi

  echo "Push failed (attempt $attempt/$MAX_PUSH_ATTEMPTS)." >&2
  if ((attempt == MAX_PUSH_ATTEMPTS)); then
    echo "Stopping after bounded attempts; the next scheduled run may retry." >&2
    exit 1
  fi

  git fetch --no-tags origin "$TARGET_REF"
  remote_commit="$(git rev-parse FETCH_HEAD)"

  # Do not accept history rewrites or retry authentication/network failures
  # where remote main has not advanced.
  if ! git merge-base --is-ancestor "$BASE_COMMIT" "$remote_commit"; then
    echo "Remote main no longer descends from checkout; refusing publish." >&2
    exit 1
  fi
  if [[ "$remote_commit" == "$BASE_COMMIT" ]]; then
    echo "Remote main did not advance; cannot safely retry this push." >&2
    exit 1
  fi

  # If any other run modified the catalog, fail closed. Never rebase a
  # stale generated catalog on top of a newer one and silently overwrite it.
  if ! git diff --quiet "$BASE_COMMIT" "$remote_commit" -- "$PUBLIC_FILE"; then
    echo "Remote catalog changed; refusing stale overwrite." >&2
    exit 1
  fi

  # A concurrent, unrelated main commit is safe to replay onto. No --force.
  if ! git rebase "$remote_commit"; then
    git rebase --abort || true
    echo "Rebase conflict; refusing to overwrite remote changes." >&2
    exit 1
  fi
  echo "Remote main advanced with unrelated files; retrying safely." >&2
done

exit 1
