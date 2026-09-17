# RecoveryOS Convergence Release Plan (2026-09-17) — EXECUTION PLANNING ONLY

**Objective:** ONE canonical release-candidate branch reconciling the
fragmented repository state. **Nothing in this plan applies migrations,
deploys anything, merges to `main`, changes the default branch, or mutates any
live system.** The next step after ratification is exactly one controlled
release-candidate build.

## 0. Verified inputs (fresh, 2026-09-17)

| Fact | Verified value |
|---|---|
| `main` | `4959156a507f6726cd9c2ddf3a1872358badbeb3` |
| Default branch (stale) | `claude/supabase-mcp-setup-ep29rp` |
| PR #7 head (modern app + launch migrations 0125–0146) | `825bb5c1ef80e3723725ff1a520208fff3188be7` |
| Control Tower branch head | `1a2ad406ec5f720f348c739fb92902d73a71dd7c` |
| rev-2 artifact commit (CI run 179 green on exact head) | `e651dead3ba3d642e2b392084041d5f2657d4bd5` |
| PR #8 head (Grace naming, base `main`) | `f0be9dd4b1a116c99a7483f19a0dc56affcdd6c7` |
| Live CQCX ledger tail | `0146_ejwrh_document_activation` |
| Active prepared chain (rev-2; all earlier pins SUPERSEDED) | `0147_classification_authorization_isolation` → fixture revocation (gated) → `0148_view_and_function_exposure_hardening` → `0149_shared_intake_workflow` (+ `0150` HELD, `0151` sequenced) |
| Live PostgreSQL | 17.6 (prior replays were PG16 → replay redo required) |

**Decisive topology (verified with git):**
- `main` **is an ancestor of** PR #7's head → the PR #7 lineage already
  contains all of `main`; no main-join conflict surface exists.
- merge-base(Control Tower, PR #7) = `main` exactly → one clean three-way.
- `git merge-tree` (CT × PR7) predicts **exactly two conflicts**:
  `.github/workflows/ci.yml` (content) and `scripts/verify-0147-prepared.mjs`
  (add/add — PR #7's guard for its OLD 0147 vs rev-2's guard for the new
  0147).
- PR #8 × PR #7 changed-path intersection: **one file**,
  `supabase/functions/README.md`. PR #8 × Control Tower: **zero**.

## 1. The RC recipe — exact commits, order, and conflict resolutions

Branch: `release/convergence-rc1`, created from **`825bb5c1`** (PR #7 head —
it already contains `main` + 0125–0146 + the modern app + hardened receivers).

| Step | Action | Conflicts & resolution rule |
|---|---|---|
| S1 | `git checkout -b release/convergence-rc1 825bb5c1` | — |
| S2 | `git merge --no-ff 1a2ad406` (whole Control Tower branch — brings rev-2 prepared chain, batteries, readbacks, runbook, decision record, registers, G11/G4/F-3/DOMAIN-003/SUPA-FN-001 packages) | (a) `ci.yml`: keep the union of steps, with **rev-2's five prepared-guards replacing PR #7's "Prepared 0147 migration invariants" step** (that step guards the superseded artifact); keep PR #7's deno-check/receiver-tests/cloudflare-boundaries steps. (b) `verify-0147-prepared.mjs`: **take the rev-2 side wholesale** (it guards the active 0147); PR #7's old script content is preserved by history, not by the working tree. |
| S3 | Retirement commit (see §2): move PR #7's `supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql` to `docs/superseded/0147_shared_intake_workflow.prepared.sql.superseded` with a tombstone header; add `scripts/verify-prepared-chain.mjs` + its CI step (see §3). | — |
| S4 | `git merge --no-ff f0be9dd4` (PR #8 — Grace naming/disclosure; base is `main`, which the RC contains) | `supabase/functions/README.md`: union merge (PR #7's boundary notes + PR #8's naming notes; both are additive documentation). Nothing else overlaps. |
| S5 | Evidence commit: PG17 replay results (§6), proofs P1–P7 (§7), and the frozen prepared-chain manifest. | — |

**Explicitly excluded from the RC (never parents of it):**
`claude/contact-connect-intake-foundation` (superseded 0147 foundation — its
`supabase/launch/migrations/0147_intake_workflow_foundation.sql` is the
numbering foot-gun; the branch stays preserved, unmerged), every
`grace-eval/*`, `grace-compare/*`, `live-gate/*`, `deploy-candidate/*`,
`claude/recoveryos-greenfield-*` and other historical branches, and the stale
default branch. No new long-lived parallel line is created: the RC's only
purpose is one merge to `main` under a later, separate approval.

## 2. Retire / move to historical-superseded

| Artifact | Disposition in RC |
|---|---|
| PR #7's `supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql` | **RETIRE from active tree** → `docs/superseded/…superseded` with a tombstone naming the superseding rev-2 `0149_shared_intake_workflow.prepared.sql` (its design-review content lives on inside the rev-2 file). |
| PR #7's `scripts/verify-0147-prepared.mjs` (old edition) | Replaced by the rev-2 script at the same path (S2 resolution); old content preserved in history only. |
| Contact-connect `0147_intake_workflow_foundation.sql` | Already excluded (branch never merged); the §3 guard makes any future reappearance a CI failure. |
| Pre-rev-2 pins in docs (0148/0149/0147R numbering) | Already superseded in-place by the rev-2 supersession banners (kept verbatim as history — never rewritten). |
| PR #7's `docs/plans/main-join-plan-2026-09-08.md` | KEEP as history, marked overtaken-by-events in the RC evidence commit: the verified ancestry (main ⊂ PR #7) plus this plan's §7 proofs replace its 173-path manifest procedure. |
| `workers/api` | Stays quarantined exactly as PR #7 ships it. |

## 3. How the obsolete 0147 is prevented from becoming active, and rev-2 becomes the only chain

Three independent locks, all in the RC tree:

1. **Absence:** no file named `0147_shared_intake_workflow*` exists anywhere
   active; no `supabase/launch/migrations/0147_*` exists at all (ledger tail
   in-tree stays 0146; everything ≥0147 lives only in `prepared/`).
2. **Manifest guard (new `scripts/verify-prepared-chain.mjs`, wired into CI):**
   pins the exact allowed contents of `supabase/launch/prepared/` — the five
   rev-2 artifacts + rollbacks + readbacks + the gated revocation script — by
   filename AND SHA-256; fails on any extra, missing, or drifted file; fails
   if any `supabase/launch/migrations/` file ≥ 0147 appears; fails on any
   occurrence of `0147_shared_intake_workflow` or
   `0147_intake_workflow_foundation` outside `docs/superseded/` and history
   docs.
3. **Runbook/pins:** `docs/deployment/p0-chain-apply-runbook.md` (rev-2) is
   the only apply procedure; its artifact pins are the rev-2 SHA-256s; the
   G11 package's preflight rejects hash drift.

## 4. Migrations 0125–0146 → canonical main tree

They arrive in the RC by construction (S1 takes PR #7's tree; proof P2 pins
blob-for-blob equality). They reach `main` when the RC merges to `main` under
its own later approval — a **single no-ff merge** (`main` is an ancestor, so
the merge is conflict-free by definition; no-ff is chosen over fast-forward to
keep one auditable integration commit with a rehearsed revert). No re-apply to
CQCX is implied: 0125–0146 are already the live ledger; the tree merely
catches up to reality.

## 5. Edge Function source provenance (all seven live functions)

The RC declares one candidate source per live function; SUPA-FN-001's PROVE
step (live-body diff, deploy-records rule) remains the deployment gate.

| Function (live ver) | RC candidate source | Lineage |
|---|---|---|
| `lead-intake` v11 | `supabase/functions/lead-intake/{index,handler}.ts` | PR #7 (refactored; **deploy only after 0149 applies** — apply-order rule) |
| `residence-intake` v2 | `supabase/functions/residence-intake/{index,handler}.ts` | PR #7 (hardened) |
| `ejwrh` v2 | `supabase/functions/ejwrh/index.ts` | PR #7 (the ONLY in-repo source; UNKNOWN provenance / **NO REDEPLOY** until PROVEN) |
| `grace` v14 | `supabase/functions/grace/index.ts` | main-line (byte-identical in PR #7 head — 825bb5c1 itself is the revert restoring these byte-for-byte) |
| `grace-judge` v7 | `supabase/functions/grace-judge/index.ts` | main-line (same) |
| `grace-coaching-canary` v11 | `supabase/functions/grace-coaching-canary/index.ts` | main-line (same) |
| `create-meeting` v11 | `supabase/functions/create-meeting/index.ts` | main-line (legacy v2 target — F-EF4 convergence decision precedes redeploy) |

The RC evidence commit records each candidate path + blob SHA so the future
PROVE step diffs live bytes against pinned blobs.

## 6. PostgreSQL 17 replay plan (matching CQCX 17.6)

Prior replay evidence (PG16) is **downgraded to historical**; the RC is not
declared until the full battery passes on PG17.

1. **Engine:** PGDG apt `postgresql-17` (+ `postgresql-17-cron`), or the
   `postgres:17` container (docker is available in the build environment) —
   whichever resolves first; record the exact server version string.
2. **Replay:** the proven harness (roles/auth/extensions/storage shims +
   captured `housing_applications` drift DDL) over launch `0000–0146` + seeds
   0200–0202, from the RC's own tree.
3. **Chain:** apply rev-2 `0147` → run its readback (22-identity rehearsal
   dataset) → revocation rehearsal (scope gate: 22/22, drift-abort test) →
   `0148` + readbacks 6a–7b → `0149` + intake battery 25/25 + readback →
   `0150`/`0151` rehearsal + strict battery 17/17 + both rollback rehearsals.
4. **Batteries:** 64/64 P0, 25/25 intake, 17/17 strict — all green on PG17 or
   the RC is not declared. Any PG16→17 behavioral difference found is a
   release blocker to resolve in the RC, not a footnote.
5. Evidence recorded against the exact RC SHA in the evidence commit (S5).

## 7. Tree/SHA proofs required BEFORE any main integration

| # | Proof | Command basis |
|---|---|---|
| P1 | `main` is an ancestor of RC | `git merge-base --is-ancestor 4959156a RC` |
| P2 | Launch migrations 0001–0146 blob-identical to PR #7 head | `git diff 825bb5c1 RC -- supabase/launch/migrations` → empty |
| P3 | Active prepared chain = rev-2 pins exactly | `sha256sum supabase/launch/prepared/*` = the e651dead-era pins recorded in the rev-2 packet |
| P4 | PR #8 payload intact | `git diff f0be9dd4 RC -- <PR #8's 30 paths>` → empty except `supabase/functions/README.md` (union resolution shown in full) |
| P5 | Modern app intact | `git diff 825bb5c1 RC -- apps packages workers sites supabase/functions` → empty except the enumerated resolutions/retirements |
| P6 | Full-tree manifest | `git ls-tree -r RC` hashed and recorded; the complete list of files that differ from BOTH parents is enumerated (expected: the 2 conflict resolutions + §2 retirements + §3 guard + §6/§7 evidence docs — nothing else) |
| P7 | Revert rehearsal | locally, `git merge --no-ff RC` into a main copy, then `git revert -m1` → resulting tree hash **equals main's tree hash exactly**; both hashes recorded |

## 8. Rollback plan for the repository integration itself

- **Before main merges anything:** push `backup/main-pre-convergence` at
  `4959156a` (a ref, not a branch anyone builds on).
- **The RC branch is disposable pre-ratification:** any defect → delete and
  rebuild from the same pinned parents; never patched-in-place silently
  (every rebuild re-runs §6–§7).
- **After the (separately approved) main merge:** rollback = the rehearsed P7
  revert commit — one revert restores main's exact prior tree; the backup ref
  is the belt-and-suspenders. History is never rewritten; no force-push.
- **Default branch correction** (`claude/supabase-mcp-setup-ep29rp` → `main`)
  is its own REPO-001 governance action, proposed as a companion decision to
  the main merge — the RC never depends on it, and it never happens implicitly.

## 9. Exact CI gates on the RC (all must be green on the exact RC SHA)

1. `pnpm install --frozen-lockfile`
2. `check-no-retired-ref.mjs` (no YKY in deployable source)
3. `icare-lock-verify.mjs` + `check-icare-governance.mjs`
4. `verify-intake-boundary.mjs` (0122) + `verify-booking-integrity.mjs` (0100/0124)
5. rev-2 prepared guards: `verify-0147/0148/0149/0150/0151-prepared.mjs`
6. **new** `verify-prepared-chain.mjs` (§3 manifest lock)
7. PR #7's Deno gates: `deno check` on the three intake entrypoints + the
   receiver test suite (`supabase/functions/tests/`)
8. `actionlint` on all workflow files
9. `pnpm typecheck` → full workspace test suite → `pnpm build` → canonical
   CQCX asset check (no retired ref in `dist`)
10. Deploy workflows remain manual-only / typed-confirmation / exact-`release_ref`
    + CI-green-for-that-SHA (PR #7's controls, untouched)

The PG17 replay (§6) is executed in the controlled build session and recorded
as evidence; wiring a containerized replay INTO CI is a post-RC improvement,
not a gate for this candidate.

## 10. The CANONICAL_RELEASE_CANDIDATE_SHA process (the one proposed process)

1. **Ratify this plan** (one yes/no; it authorizes the RC branch build only —
   no main merge, no default-branch change, no deploy, no apply).
2. Build `release/convergence-rc1` per §1 (S1→S5), resolving exactly the
   predicted conflicts by the stated rules; push the branch.
3. CI green on the exact head (§9), PG17 replay evidence recorded (§6),
   proofs P1–P7 recorded (§7).
4. **Freeze:** tag `convergence-rc1` at that commit. That commit hash is the
   **CANONICAL_RELEASE_CANDIDATE_SHA** — published with its `sha256sum`
   manifest of the prepared chain and the per-function candidate-source blob
   list (§5).
5. Submit ONE integration decision to the Executive Director: merge
   `CANONICAL_RELEASE_CANDIDATE_SHA` into `main` (single no-ff merge,
   conflict-free by P1, revert rehearsed by P7) + the companion REPO-001
   default-branch correction. PRs #7 and #8 are then closed as
   "integrated via convergence-rc1" — never separately merged — with the RC
   evidence linked from each.
6. Everything else keeps its own gate, unchanged: rev-2 database chain apply
   authority (R2-A…R2-F packet), 0150 HELD, 0151 sequenced, receiver deploys
   behind SUPA-FN-001, R1/Wix/Cloudflare/DNS closed.
