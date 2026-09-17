# P0 approval packet — REVISION 2 (SEC-P0-001, Gate G2) — classification authorization isolation

**Date prepared:** 2026-09-16 (UTC)
**Prepared on branch:** `claude/recoveryos-control-tower-implementation-2026-09-14`
**Status:** **PREPARED — NOT APPLIED. All live mutation gates remain closed.**
**Decision owner:** Executive Director (Thomas)
**Supersedes:** sections 1–8 of
`docs/decisions/2026-09-14-p0-classification-authorization-isolation.md`
(whose §9 decision records remain the preserved historical record) and every
pre-revision artifact pin (`f4646ea`, `2a1c2e5`, `da6ecb7`, `2f1a3df`).

## 0. Why a revision 2 exists

The Executive Director's independent read-only CQCX verification (2026-09-14)
confirmed the baseline (ledger tail `0146_ejwrh_document_activation`; neither
prepared migration applied; `intake_contact_events` and
`is_privileged_role(role_key)` absent; the affected authorization and
notification functions unguarded; seven Edge Functions active) and returned
four corrections before this package may be approved:

1. **Scope correction:** the affected population is **22 distinct
   login-linked test-fixture actors holding 22 active privileged
   assignments — coach 17, administrator 1, executive 1, navigator 1,
   residence_manager 1, residence_staff 1** — not the "at least one
   administrator, one navigator" minimum the original packet carried.
2. **Battery completeness:** the negative battery must instantiate and test
   all eight privileged role keys.
3. **Information disclosure in `grant_role_assignment`:** the original
   prepared edition returned target-dependent codes (`person_not_found`,
   `test_fixture_privilege_blocked`) before deciding caller authorization,
   letting an ordinary authenticated caller probe whether a person id exists
   and whether it is fixture-classified.
4. **Migration sequencing:** the previously proposed order applied 0148 and
   0149 while "reserving" 0147 for later out-of-order application — rejected
   without a formally ratified supersession/renumbering plan.

## 1. The migration-supersession and renumbering plan (requires ratification)

Prepared artifacts are renumbered so the ledger stays **strictly monotonic in
the ratified apply order** — no out-of-order application, no reserved numbers:

| New identity (rev 2)                          | Content                                                                                            | Former identity (SUPERSEDED pin)                                |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `0147_classification_authorization_isolation` | P0 classification isolation (this packet's decision A)                                             | `0148_…` @ `f4646ea`, SHA `27782491…d371f4`                     |
| `0148_view_and_function_exposure_hardening`   | G3 exposure hardening (decision 4)                                                                 | `0149_…` @ `2a1c2e5`, SHA `512f4624…def174`                     |
| `0149_shared_intake_workflow`                 | Revised shared intake (decision 5; the PR #7 pre-revision edition remains REJECTED FOR ACTIVATION) | revised `0147_…` @ `da6ecb7`, SHA `6af374bd…b95e2c`             |
| `0150_intake_consent_evidence`                | unchanged position (HELD per decision 7)                                                           | same number; pin refreshed (renumbering sweep touched comments) |
| `0151_strict_classification_semantics`        | unchanged position (sequenced behind held 0150)                                                    | same number; pin refreshed (carries the rev-2 grant ordering)   |

Live sequence after ratification: **0146 (live tail) → 0147 → 0147 read-back →
fixture-role revocation → 0148 → 0148 read-back → 0149 → 0149 read-back →
regression**; 0150+0151 execute together later under the receiver-activation
program. The superseded artifact names/pins must never be applied; the former
numbers are never reused for other content.

Content changes beyond the renumbering sweep, named plainly:

- `grant_role_assignment` check order (in 0147, and in 0151's re-definition
  and rollback so a later 0151 apply cannot regress it): caller authorization
  is decided before any target lookup; unauthorized callers receive exactly
  `not_authorized` for production, fixture, and nonexistent targets alike.
  Authorized callers keep accurate diagnostics. No grant that was previously
  refused is now permitted, and none that was permitted is now refused — only
  the refusal code seen by unauthorized callers changed.
- The gated revocation script now hard-refuses on any deviation from the
  approved 22/22 per-role scope (drift → reconcile and re-approve, never
  improvise).
- The P0 read-back expects the 22-actor baseline and verifies the new
  ordering in the applied catalog definition.

## 2. Impact analysis for the 22 affected fixture identities

- **What 0147 does to them:** all 22 actors keep their logins and rows; their
  22 privileged assignments become **inert** at every inspected predicate
  (`has_role` and derivatives, `staff_residence_ids`,
  `is_residence_manager_of`), they leave the staff notification fan-out, and
  no privileged role can be re-granted to them
  (`test_fixture_privilege_blocked`). Their participant-plane behavior
  (participant/resident roles, 0120 `same_world` fixture-world semantics) is
  preserved.
- **What the separately gated revocation then does:** sets `revoked_at` on
  exactly those 22 assignments (audited, reversible, rows preserved), with
  the scope gate proving the live population still matches 22/22 per-role at
  execution time.
- **Operational consequence (already RATIFIED as decision 3):** fixture
  staff-side E2E is inoperative until SEC-P0-002. The 17 fixture coaches are
  the bulk of that capability — coach-journey E2E coverage is the largest
  practical loss; fixture participant flows continue to work.
- **Production staff:** unchanged — proven per predicate in the battery and
  the read-back (production admin/navigator/residence-staff/system-admin all
  asserted).
- **Last-admin safety:** the revocation refuses to run if zero login-linked
  production platform administrators would remain. (The 2026-09-14
  verification counted exactly one fixture administrator among the 22; the
  production-administrator floor is checked live at execution time.)

## 3. Verification evidence (isolated Postgres 16 replay, 2026-09-16, rev-2 artifacts)

Method identical to the 2026-09-14 replay (launch migrations 0000–0146 +
seeds 0200–0202, documented harness shim: roles, `auth.users` + `auth.uid()`
from `request.jwt.claim.sub`, `extensions`/pgcrypto, storage stub, captured
live-drift `public.housing_applications` DDL; plus a stub `pg_cron` extension
because the harness host lacks it — the stub records schedules and runs
nothing). Migrations replayed clean end-to-end (the 0139 first-pass quirk of
the Sep-14 replay did not reproduce).

| Step                                                                                                                    | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Defect reproduction pre-fix (fixture admin `is_platform_admin`)                                                         | **true** (vulnerable)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Apply prepared 0147 (rev 2)                                                                                             | clean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| P0 negative battery (`p0_classification_isolation_negative_tests.sql`, expanded)                                        | **64/64 pass** — all eight privileged role keys instantiated on fixture actors and denied at every predicate; per-key grant refusal for all eight keys; ordinary production caller AND fixture caller receive byte-identical `not_authorized` for production/fixture/nonexistent targets; authorized caller keeps `person_not_found`; production staff (admin, navigator, residence staff, system administrator) unchanged; fan-out reaches production staff only (asserted per fixture role holder); participant plane + `same_world` preserved |
| 0147 read-back rehearsal on a 22-identity dataset matching the approved scope                                           | fixture checked=22, still privileged=0; production admins checked=1, lost=0; revision-2 ordering verified in the applied catalog                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Gated revocation rehearsal                                                                                              | scope preview = approved aggregates; scope gate PASS; **22 revoked, 22 audit rows**, post-condition pass; immediate re-run correctly **REFUSED** at the scope gate (0 ≠ 22)                                                                                                                                                                                                                                                                                                                                                                      |
| Apply 0148 (hardening) + read-back                                                                                      | clean; read-backs 6a–6f, 7, 7b pass; P0 battery re-passed 64/64                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Apply 0149 (shared intake) + battery + read-back                                                                        | clean; intake battery **25/25**; read-back passes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Apply 0150, 0151; strict battery                                                                                        | clean; **17/17**; 0151's re-defined `grant_role_assignment` carries the rev-2 ordering                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 0151 rollback rehearsal                                                                                                 | restores the rev-2 lenient editions; P0 battery 64/64; 0151 re-applies clean                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 0147 rollback rehearsal (fresh post-0146 copy)                                                                          | restores the vulnerable behavior exactly (fixture admin `is_platform_admin` back to true); 0147 re-applies clean; battery 64/64                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Static guards (`scripts/verify-014{7,8,9}-prepared.mjs`, `verify-015{0,1}-prepared.mjs`, incl. new ordering assertions) | all PASS (wired into CI)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

**Limitations (named plainly):** the replay proves the migrations against the
repository's 0146 lineage, not against CQCX itself — this session has no
authenticated CQCX path (Supabase connector unauthenticated). Before
applying: re-verify ledger tail 0146, capture a backup/PITR point, and
re-verify the live 22/22 scope. The battery covers the inspected
predicate/RLS/RPC/fan-out paths; the exhaustive G3 surface audit remains open
and is not claimed here.

## 4. Rollback

`0147_classification_authorization_isolation.rollback.sql` restores every
touched function byte-faithfully to its post-0146 catalog definition and
drops the helper; rehearsed 2026-09-16 (defect reproduces after rollback;
re-apply clean). Rolling back restores the vulnerability and requires the
same authority. The revocation is reversible by clearing `revoked_at` under a
future explicit authority (rows and audit trail preserved). 0148/0149/0151
keep their own rehearsed rollback files.

## 5. Artifact identity (rev 2)

Prepared-file SHA-256 pins are listed in
`docs/deployment/p0-chain-apply-runbook.md` (Artifact pins, REV 2). The exact
revised commit SHA and its green GitHub Actions run are recorded in §7 below
once CI completes on the pushed revision.

## 6. The decisions requested (each yes/no, separately answerable)

- **Decision R2-A — RATIFY / REJECT:** the migration-supersession and
  renumbering plan in §1 (monotonic 0147/0148/0149; former numbers and pins
  retired, never reused, never applied).
- **Decision R2-B — APPROVE / DENY:** apply
  `0147_classification_authorization_isolation` (rev-2 pin) to CQCX under the
  runbook's Step 1–3 conditions (ledger re-verification, restore point,
  hash pin, live read-back with the 22-actor baseline).
- **Decision R2-C — APPROVE / DENY:** execute the fixture-role revocation
  against the verified 22/22 scope (runbook Step 4; hard scope gate; audited,
  reversible; scope drift → STOP and re-approve).
- **Decision R2-D — APPROVE / DENY:** re-pin
  `0148_view_and_function_exposure_hardening` (rev-2 pin) for application
  under the previously ratified decision-4 conditions (runbook Step 5).
- **Decision R2-E — APPROVE / DENY:** re-pin `0149_shared_intake_workflow`
  (rev-2 pin) for application under the previously ratified decision-5
  conditions (runbook Step 6).
- **Decision R2-F — ACKNOWLEDGE:** 0150 remains HELD and 0151 remains
  sequenced behind it (decision 7 unchanged); their rev-2 pins replace the
  `2f1a3df` pins when that program activates.

Until R2-A and R2-B are approved, everything remains PREPARED, G2 remains
FAIL, and no live gate opens. Nothing in this packet authorizes merging
PR #7 or PR #8, deploying functions or Workers, DNS/Cloudflare/Wix changes,
or any live mutation.

## 7. CI evidence (recorded after push)

- Revised commit SHA: _recorded in the follow-up evidence commit._
- GitHub Actions run: _recorded in the follow-up evidence commit._
