# Main unrelated-history join — execution plan (Gate L3; STOPPED)

Status: **prepared and locally rehearsed; execution requires explicit approval.**
Nothing in this plan authorizes touching `main`, the default branch, or any
remote ref.

## Problem

`main` (tip `4959156`) and the canonical application line (root `990f038`)
share **no git ancestor** — the application line was re-rooted 2026-08-23 as a
disconnected history. A normal merge is refused ("refusing to merge unrelated
histories"), and a conflict-resolved `--allow-unrelated-histories` merge would
require hand-resolving every common path (add/add conflicts). The deterministic
alternative below has no conflict-resolution step at all.

## Mechanism

Create one two-parent merge commit whose **tree is byte-for-byte the
application line's tree**, with `main`'s tip and the application tip as
parents:

```bash
APP_TIP=<the reviewed application-line tip at execution time>
MAIN=$(git rev-parse origin/main)
JOIN=$(git commit-tree "$APP_TIP^{tree}" -p "$MAIN" -p "$APP_TIP" \
  -m "Join main to the canonical application line (Gate L3)")
```

Both histories remain fully reachable; nothing is rewritten or force-pushed;
`main` fast-forwards to `$JOIN`.

## Pre-execution checklist (in order)

1. **Freeze the input**: `$APP_TIP` must be a CI-green commit named in the
   approval (after PR #7 merges, the resume-branch tip).
2. **Backup ref (before anything else)**:
   `git push origin origin/main:refs/heads/backup/main-pre-join-2026-09-08`
   — an immutable pointer to pre-join `main`, restorable at any time.
3. **Regenerate and review the complete file manifest** (what changes on
   `main`, path by path):
   `git diff --name-status origin/main "$APP_TIP" > docs/plans/main-join-manifest-<date>.txt`
   The 2026-09-08 snapshot (173 paths against head `ca80e35`) is committed as
   `docs/plans/main-join-manifest-2026-09-08.txt`; it MUST be regenerated
   against the frozen `$APP_TIP` and attached to the approval.
4. **Exact-tree proof (mandatory, before push)**:
   `[ "$(git rev-parse "$JOIN^{tree}")" = "$(git rev-parse "$APP_TIP^{tree}")" ]`
   and `git diff --quiet "$JOIN" "$APP_TIP"` — both must hold.
5. **Push**: `git push origin "$JOIN":refs/heads/main` (a fast-forward; no
   force flag is ever needed or permitted).
6. **Post-push verification**: `git fetch origin main` and repeat the tree
   check against `origin/main`.

## Rollback (two independent paths, both rehearsed locally 2026-09-08)

- **Revert**: `git revert -m 1 <join-commit>` on `main`. Rehearsed in an
  isolated worktree against rehearsal join `f84ed8f`: the revert commit's tree
  hash equaled pre-join `main`'s tree hash exactly
  (`7558ddd8b813828594dc49b09b84ed352b0bd02a`). History-preserving; preferred.
- **Backup ref**: `backup/main-pre-join-2026-09-08` still points at the
  pre-join tip; a PR restoring from it (or, under its own explicit approval, a
  reset) recovers the exact previous state.

## Rehearsal evidence (local only, nothing pushed)

- Join commit built from head `ca80e35` + `origin/main` `4959156`: tree hash
  `76637d53…` identical to the application tip's tree; `git diff` between join
  and tip empty.
- Revert of the join in a clean worktree reproduced `main`'s tree
  `7558ddd8…` exactly.

## Ordering with the other lineage gates

Gate L2 (merge PR #7 into the resume branch) precedes this; Gate L4 (default
branch → `main`) and Gate L5 (branch protection) follow it. Each is a separate
approval; no branch is deleted or archived at any step.
