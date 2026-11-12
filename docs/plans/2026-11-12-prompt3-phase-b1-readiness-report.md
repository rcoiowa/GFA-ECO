# Prompt 3, Phase B1 — Readiness Report (2026-11-12)

**Authorization:** Executive authorization "Phase B1" of 2026-11-11 (seven numbered
activities; verification and documentation only). **Restrictions honored:** no staging or
production deployment, no database write or migration, no DNS/Worker/Wix change, no merge
into `main`, no synthetic submissions against production, no retrospective grant of
approval. All isolated testing used disposable local containers or embedded Postgres with
synthetic fixtures only.

## 1. Draft pull request and hosted CI

- **PR #52** (draft, not merged): https://github.com/rcoiowa/GFA-ECO/pull/52 —
  `integration/reconcile-2026-11` → `main`.
- **Hosted CI: SUCCESS on exactly `1bd8a834fdea44c9f9f7f5de95c51ae5c3d7ac45`**
  (run 43123129669, event `pull_request`, completed 2026-11-11 23:54 UTC). The remote
  branch head was confirmed equal to that SHA before and during the run; the branch had
  not changed since Phase A.
- One post-verification commit now exists: `3761d644` corrects a one-character hash-citation
  typo the independent review found in `docs/migration/applied-ledger-reconciliation-2026-11-11.md`
  (`9894cacd…` → `9894caca…`; the enforcing pin was always correct). Nothing else changed,
  and hosted CI re-ran on the new head `3761d6444e0a2f9046543cfac5202ae6ebdc8e99`:
  **SUCCESS** (run 43124838514, completed 2026-11-12 00:08 UTC). Both verified heads are
  CI-green.

## 2. Independent review of the reconciliation (adversarial, read-only)

An independent reviewer re-derived all 14 merge conflicts from the parents, verified every
resolution against both sides, swept all auto-merged semantic interactions, and re-ran the
full local verification suite in a separate clone.

- **Verdicts: PASS in all five areas; zero blockers.**
  1. *Conflict resolutions* — nothing live removed, nothing approved dropped; `main`'s
     inline paper-sign flow was correctly removed because the applied attestation migration
     retired its server path.
  2. *Auto-merge semantics* — all 80 auth-return destinations resolve to real routes across
     all seven shells; `/staff/document-review` is routed and navigable; zero live
     `paper_sign` code remains.
  3. *Function parity* — `lead-intake` byte-identical to the PR #33 branch (empty diff);
     `residence-intake` SHA-identical to the deployed-source captures.
  4. *Migration records* — chain-guard change is purely additive; every pre-existing
     invariant intact; new checks behave as documented and assert no approval.
  5. *Governance* — Grace/ICARE locks byte-identical to `main`; CI workflows lost nothing
     and gained one test step (the 80-check document-review suite).
- **Concerns (accepted, low):** the hash typo (fixed, above); and the two intermediate
  commits between merge and the IntakeChecklist correction are not individually green
  (bisectability), a historical note only — HEAD is green and pushed history is not
  rewritten.
- **Cleanup notes for a future change batch (not done now):** dead legacy exports
  `recordPaperSignature` (`packages/data-access/src/repositories/intakeReadiness.ts:167`)
  and `acknowledgeDocumentAssignment` (`residenceDocuments.ts:33`) — uncalled, fail safe
  server-side (`attestations_required`), but worth pruning; three main-side
  DocumentDetailPage tests have no verbatim successor (behavior covered implicitly).

## 3. Isolated database suites — determination and execution

Determination: **both suites can run safely in this environment** — the Docker daemon can
be started locally; both harnesses refuse non-local Docker endpoints and remote database
URLs by construction; containers run with `--network none`/internal-only, tmpfs storage,
synthetic fixtures, and are destroyed afterward. No production credential, URL, or record
is reachable by either. They were therefore executed against the integration tree:

- **Migration replay** (`scripts/replay-launch-local.py`, pinned postgres:17 digest):
  **PASS** — launch line + prepared 0147–0151 + the three 20261005 migrations applied in
  live order; deprecated-housing denial and default-privilege/RLS assertions green.
- **Circle PostgreSQL suite** (`tests/circle/database.mjs`, embedded PGlite — no Docker
  needed): **PASS** — all four assertion groups (persistence/authorization, county access,
  v2 preservation/eligibility, shared-notes scoping and denials).
- **Document-review workflow suite** (`scripts/test-document-review.py`, disposable
  Postgres): **PASS 80/80** — the attestation workflow carried on this branch is
  behaviorally proven, including paper-review receipts, cross-residence denial, and
  audit-failure rollback.
- Known limitation (unchanged): the replay is deliberately not live-parity — it includes
  unapplied 0150/0151 and excludes the two out-of-tree applied migrations (housing
  follow-through, attestations). Recorded in the ledger reconciliation document.

## 4. Configuration and isolation verification (read-only)

- **Supabase:** CQCX (`RecoveryOS-Launch`) is `ACTIVE_HEALTHY`, Postgres 17.6. The staging
  deploy workflow builds only against CQCX with the publishable key, injects the immutable
  release SHA, requires green CI on the exact SHA, a typed `DEPLOY_STAGING` confirmation,
  a Turnstile site key, and greps the built assets to reject the retired project ref.
  `.mcp.json` and `.env.example` reference only CQCX.
- **Cloudflare — the critical isolation finding:** the Worker named `recoveryos-staging`
  **is the production server** (it serves all six public domains; corroborated by the
  2026-10-23 authorized Cloudflare read recorded in `PRODUCTION-IMPACT.md` showing
  `vrcc.app` attached to it, and by content identity). Therefore **dispatching the existing
  "Deploy staging" workflow changes public production, despite its name.** The genuinely
  isolated frontend target is `gfa-eco-recovery-residence-os`: runtime-verified to serve
  its own `workers.dev` hostname with a different release (`61a39346`, Oct 13) than every
  public domain, i.e. deploying there does not alter any public surface (its own gated
  workflow: `deploy-production-candidate.yml`, `DEPLOY_CANDIDATE`).
- **Database isolation does not exist:** both Workers' frontends point at the production
  database (CQCX). A frontend-isolated staging deploy still exercises production Auth and
  PostgREST. There is no DEV Supabase project (Issue #35 open decision). Any Phase B2
  acceptance plan must treat "isolated staging" as *frontend-isolated only* and keep the
  no-synthetic-submissions-against-production rule unless a DEV target or an explicitly
  authorized test method exists.

## 5. Investigations

**`document_review_attestations` apply authorization — NOT LOCATED; not presumed.**
Exhausted in-repository avenues: the ledger version string `20261023223104` appears in no
file on any of the 87 branches except this session's reconciliation records; PR #45 has
zero comments; the proposal documents (committed 21:43 UTC, 48 minutes before the 22:31 UTC
apply) all state that production approval "remains pending" at writing time; no workflow
applies SQL, so Actions holds no apply record. Timeline (verified): PR #45 opened 20:38 →
authorized Cloudflare/baseline reads 21:14–21:27 → proposal committed on the deployed line
21:43 → migration applied 22:31. Conclusion: if an authorization was given, it was given
conversationally inside that working session and never recorded. **The remaining avenue is
outside this repository: your own review of the 2026-10-23 session records** (the
GFAVRCC-operated Claude session that produced commit `1063658`), or a fresh retroactive
decision record under protocol §14 stating what you now authorize or direct. Until then the
artifact stays pinned as *applied, pending authorization review*.

**Housing follow-through lineage — record LOCATED (Class D, on an unmerged branch).**
`docs/proposals/housing-follow-through/ACTIVATION.md` on `release/housing-admin-live-2026-10-20`
(PR #42) records: applied 2026-10-20, ledger `20261020010443`, exact SQL `activation.sql`
with SHA-256 `7bd74792…a439` — **re-verified: the file on that branch hashes to exactly the
recorded value** — reviewed source PR #41 @`443ac219`, verified post-apply results
(RLS on all five tables, revoked default service_role access, zero rows, unchanged helper
fingerprints), and explicit exclusions (no bridge, no OAuth, no deployment). What it does
not record is *who* approved: PR #41 says "approved and applied 2026-10-20" without naming
the approver. Proposed for the next phase: confirm the approver attribution, then bring
`activation.sql` into the canonical tree under the same hash-pin mechanism used for the
attestations SQL.

## 6. Unresolved risks

1. The two out-of-tree applied migrations remain the top reproducibility gap (attestations
   SQL is now hash-pinned in-tree; housing follow-through SQL still lives only on PR #42's
   branch).
2. The "staging" naming hazard (§4) — any deploy instruction that says "staging" without
   naming the Worker risks changing production. Recommend renaming or at minimum a
   documented warning in the workflow description during Phase B2.
3. Attestation authorization record still open (§5) — deliberately unresolved per your
   direction.
4. No database-isolated test target; live-acceptance gates stay blocked on the Issue #35
   DEV decision or an explicitly authorized production test method.
5. Not re-verified this phase: live RLS behavior under real roles, Supabase Auth
   configuration, Wix state, screen-reader pass. DR-02 untouched and open.

## 7. Exact changes proposed for the next phase (B2 — each separately approvable)

1. **Isolated frontend acceptance:** deploy the CI-green integration head via
   `deploy-production-candidate.yml` to `gfa-eco-recovery-residence-os` (its own hostname
   only; verified non-public). Read-only browser acceptance against it: public pages,
   application forms rendering (no submission), `/my-housing` gate, consent display,
   Circle entry/return, keyboard/reduced-motion/zoom checks. No production domain changes.
2. **Merge PR #52** after your review (separate approval; merging alone deploys nothing).
3. **Housing follow-through SQL reconciliation:** hash-pinned adoption of `activation.sql`
   into the canonical tree + approver attribution (repo-only).
4. **Attestation authorization disposition:** you locate/review the 2026-10-23 session
   record, or issue a §14 decision record; then the pending-review pin converts to an
   ordinary authorized-applied record (repo-only).
5. **Cleanup batch (repo-only):** prune the two dead legacy exports; optional replay-parity
   mode (replay exactly the live ledger).
6. **Production deploy of the same SHA** remains a later, separate authorization with the
   §8 Phase A safeguards (rollback = one redeploy of `4990829e`; function rollbacks target
   captured bundle hashes).

**Stopped per the authorization. Nothing deploys, merges, or changes further without your
review.**
