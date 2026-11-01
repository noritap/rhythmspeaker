"""Offline regression tests for the class-calendar GitHub Actions publisher.

All Git operations use temporary local repositories. No Google API, network
connection, GitHub token, or actual production data is accessed.
"""
import os
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
WORKFLOW = ROOT / ".github/workflows/class-calendar-sync.yml"
PUBLISH = ROOT / "tools/publish_public_classes.sh"
PUBLIC = Path("data/class-sessions.public.json")


class WorkflowContract(unittest.TestCase):
    def test_scheduling_gate_and_privileges(self):
        source = WORKFLOW.read_text(encoding="utf-8")
        self.assertRegex(source, r'cron:\s*"17,47 \* \* \* \*"')
        self.assertIn("workflow_dispatch:", source)
        self.assertIn("github.ref == 'refs/heads/main'", source)
        self.assertIn("github.event_name == 'schedule'", source)
        self.assertIn("github.event_name == 'workflow_dispatch'", source)
        self.assertIn("vars.RS_CALENDAR_SYNC_ENABLED == 'true'", source)
        self.assertIn("vars.RS_OPEN_CLASSES_APPROVED == 'true'", source)
        self.assertIn("group: publish-public-classes", source)
        self.assertIn("cancel-in-progress: false", source)
        self.assertRegex(source, r"permissions:\s*\n\s*contents: read")
        self.assertIsNotNone(re.search(r"publish:.*?permissions:\s*\n\s*contents: write", source, re.S))
        for secret in ("RS_GOOGLE_SERVICE_ACCOUNT_JSON", "RS_LESSON_CALENDAR_ID",
                       "RS_SESSION_ID_KEY"):
            self.assertIn("secrets." + secret, source)
        self.assertIn("bash tools/publish_public_classes.sh", source)
        self.assertIn("python tools/test_calendar_workflow_reliability.py", source)
        self.assertIn("python tools/sites_migration_audit.py", source)
        self.assertNotIn("git push --force", source)

    def test_publish_restricts_generated_file(self):
        source = PUBLISH.read_text(encoding="utf-8")
        self.assertIn('PUBLIC_FILE="data/class-sessions.public.json"', source)
        self.assertIn('TARGET_REF="refs/heads/main"', source)
        self.assertIn("git diff --quiet", source)
        self.assertIn("git merge-base --is-ancestor", source)
        self.assertIn("git rebase", source)
        self.assertNotIn("git push --force", source)
        self.assertNotIn("git push -f", source)


class PublisherSandbox(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="rs-calendar-vc1-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.origin = self.root / "remote.git"
        self.seed = self.root / "seed"
        self.writer = self.root / "writer"
        self.racer = self.root / "racer"
        self.git_exe = shutil.which("git")
        if not self.git_exe:
            self.skipTest("git is not installed")
        self.call("git", "init", "--bare", "--initial-branch=main", str(self.origin))
        self.call("git", "clone", str(self.origin), str(self.seed))
        self.configure(self.seed)
        (self.seed / "data").mkdir()
        (self.seed / PUBLIC).write_text('{"generatedAt":"initial"}\n', encoding="utf-8")
        (self.seed / "notes.txt").write_text("baseline\n", encoding="utf-8")
        self.git(self.seed, "add", ".")
        self.git(self.seed, "commit", "-m", "initial")
        self.git(self.seed, "push", "origin", "HEAD:refs/heads/main")
        self.call("git", "clone", str(self.origin), str(self.writer))
        self.call("git", "clone", str(self.origin), str(self.racer))
        self.configure(self.writer)
        self.configure(self.racer)

    def call(self, *args, cwd=None, env=None, check=True):
        proc = subprocess.run(args, cwd=cwd, env=env, text=True,
                              capture_output=True, check=False)
        if check and proc.returncode:
            raise AssertionError(f"command failed: {args}\n{proc.stdout}\n{proc.stderr}")
        return proc

    def git(self, repo, *args):
        return self.call("git", "-C", str(repo), *args).stdout.strip()

    def configure(self, repo):
        self.git(repo, "config", "user.name", "Offline Test")
        self.git(repo, "config", "user.email", "offline@example.invalid")

    def edit_writer(self):
        (self.writer / PUBLIC).write_text('{"generatedAt":"writer"}\n', encoding="utf-8")

    def published(self):
        return self.call("git", "--git-dir", str(self.origin),
                         "show", "main:data/class-sessions.public.json").stdout

    def run_publisher(self, env=None):
        settings = os.environ.copy()
        # Avoid inheriting any CI credentials or GitHub Actions ref.
        for name in ("GITHUB_ACTIONS", "GITHUB_REF", "GITHUB_TOKEN"):
            settings.pop(name, None)
        if env:
            settings.update(env)
        return self.call("bash", str(PUBLISH), cwd=self.writer, env=settings, check=False)

    def make_race_wrapper(self, mode):
        shim = self.root / "shim"
        shim.mkdir()
        runner = shim / "git"
        runner.write_text("""#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == "push" && "${2:-}" == "origin" && "${3:-}" == "HEAD:refs/heads/main" && ! -e "$RACE_FLAG" ]]; then
  touch "$RACE_FLAG"
  if [[ "$RACE_MODE" == "schedule" ]]; then
    printf '{"generatedAt":"newer"}\\n' > "$RACE_REPO/data/class-sessions.public.json"
    "$REAL_GIT" -C "$RACE_REPO" add -- data/class-sessions.public.json
  else
    printf 'concurrent note\\n' >> "$RACE_REPO/notes.txt"
    "$REAL_GIT" -C "$RACE_REPO" add -- notes.txt
  fi
  "$REAL_GIT" -C "$RACE_REPO" commit -m "concurrent remote update" >/dev/null
  "$REAL_GIT" -C "$RACE_REPO" push origin HEAD:refs/heads/main >/dev/null
fi
exec "$REAL_GIT" "$@"
""", encoding="utf-8")
        runner.chmod(0o755)
        return {
            "PATH": str(shim) + os.pathsep + os.environ["PATH"],
            "RACE_REPO": str(self.racer),
            "RACE_FLAG": str(self.root / "once"),
            "RACE_MODE": mode,
            "REAL_GIT": self.git_exe,
        }

    def test_no_changed_data_does_not_publish(self):
        result = self.run_publisher()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("No public-data changes", result.stdout)
        self.assertEqual(self.published(), '{"generatedAt":"initial"}\n')

    def test_normal_publish_only_updates_json(self):
        self.edit_writer()
        result = self.run_publisher()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.published(), '{"generatedAt":"writer"}\n')
        self.assertEqual(self.call("git", "--git-dir", str(self.origin),
                                   "show", "main:notes.txt").stdout, "baseline\n")

    def test_unrelated_remote_commit_is_rebased_safely(self):
        self.edit_writer()
        result = self.run_publisher(self.make_race_wrapper("unrelated"))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("retrying safely", result.stderr)
        self.assertEqual(self.published(), '{"generatedAt":"writer"}\n')
        note = self.call("git", "--git-dir", str(self.origin),
                         "show", "main:notes.txt").stdout
        self.assertIn("concurrent note", note)

    def test_newer_remote_schedule_cannot_be_overwritten(self):
        self.edit_writer()
        result = self.run_publisher(self.make_race_wrapper("schedule"))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Remote public schedule changed", result.stderr)
        self.assertEqual(self.published(), '{"generatedAt":"newer"}\n')

    def test_non_main_actions_ref_is_rejected(self):
        self.edit_writer()
        result = self.run_publisher({"GITHUB_ACTIONS": "true",
                                     "GITHUB_REF": "refs/heads/test-feature"})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Refusing to publish outside main", result.stderr)
        self.assertEqual(self.published(), '{"generatedAt":"initial"}\n')


if __name__ == "__main__":
    unittest.main()
