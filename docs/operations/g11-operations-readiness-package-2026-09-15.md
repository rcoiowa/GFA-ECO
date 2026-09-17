# G11 operations/readiness package (2026-09-15)

**Status: PREPARATION ONLY — nothing here executes anything.** This package
wraps the already-approved change sequence in operational controls. It grants
no authority; every action below still requires its recorded approval and an
authenticated session on the relevant plane.

**Lifecycle it serves (keep these states exact):**
0148 APPROVED → fixture cleanup APPROVED → 0149 APPROVED → 0147R APPROVED →
**0150 HELD** → **0151 APPROVED BUT SEQUENCED BEHIND 0150** → receiver
deployment PENDING → residence opening CLOSED.
**The immediately executable database block ends at 0147R.** 0150/0151 are
listed only in the "later, separately triggered" section and must never be
folded into the current block.

## 1. Authority planes — "no authority by implication"

Approval on one plane NEVER opens another. Each plane has its own approver
record and its own gate:

| Plane | Currently authorized | Explicitly NOT authorized by any other plane's approval |
|---|---|---|
| **Database (CQCX SQL/migrations)** | The 0148→0147R block (decisions 1–5) under the runbook | 0150 (HELD), 0151 (sequenced), any other migration |
| **Supabase Edge Functions** | Nothing — deployment PENDING; SUPA-FN-001 provenance is a hard precondition | Any deploy/redeploy/secret change, even "to match the DB" |
| **Cloudflare (Workers/DNS/zones/routes/secrets)** | Nothing | Any mutation; even inventory reads await an authenticated session |
| **Wix (content/publish/settings)** | Read-only evidence collection only | Any edit, publish, restore, automation or form change |
| **DNS/registrar/domain cutover** | Nothing | Everything |
| **Identity/roles/data** | Fixture-role revocation only (decision 2), inside the DB sequence | Any other identity/role/data mutation |

## 2. Roles (named at execution time; the record template below captures them)

- **Operator** — runs the commands; must hold authenticated access to the one
  plane being changed; never self-approves.
- **Approver** — the Executive Director (Thomas) or an explicitly delegated
  decision-maker; owns go/no-go at each STOP checkpoint; approvals are
  written, per plane, per step.
- **Observer/scribe** — second person (or the operator's disciplined second
  pass, recorded as such if no second person exists — small-org reality,
  named honestly in the log) verifying each read-back output against the
  expected values before the next step starts.
- **Alert owner after change** — named before execution starts; owns triage of
  anything anomalous during the observation window (default: the operator for
  the window's duration, handing off to the approver-designated owner after).

## 3. Preflight checklist (database block; run top to bottom, initial each)

1. ☐ Session is authenticated against CQCX `cqcxvwoukyhxyokfwnjm` and ONLY
   that project (no YKY access anywhere in the tooling).
2. ☐ Working tree at the pinned commit; every artifact hash verified:
   - 0148 @ `f4646ea…`, SHA-256 `2778249171…d371f4`
   - 0149 @ `2a1c2e5…`, SHA-256 `512f4624…ef174`
   - 0147R @ `da6ecb7…`, SHA-256 `6af374bd…95e2c`
   Any mismatch → STOP (artifact drift).
3. ☐ Ledger tail check returns exactly `0146_ejwrh_document_activation`
   (`20260831001422`). Anything else → STOP.
4. ☐ Backup/PITR evidence recorded: restore-point timestamp ______, source
   (dashboard Backups page) ______, screenshot/reference ______. No confirmed
   restore point → STOP.
5. ☐ Approver's written go for the database block cited (decision record §9,
   decisions 1–5) and re-confirmed for THIS execution window.
6. ☐ Execution log opened (template §5) with operator/approver/observer named.
7. ☐ Quiet window: no other operator/tooling is mutating CQCX concurrently.

## 4. Execution order with STOP checkpoints (database block only)

| # | Step | Read-back / evidence required before proceeding | STOP conditions |
|---|---|---|---|
| 1 | Apply 0148 (ledger-recording path, name `0148_classification_authorization_isolation`) | `0148_live_readback_verification.sql` passes: guards present; fixture privileged actors → 0 privileged; production admins → 0 lost (expected fixture actors checked ≥ 2 per the Sep-14 baseline; 0 checked → WARN + investigate before continuing) | migration error; any read-back exception; unexpected ledger state |
| 2 | **Fixture-role revocation scope-preview checkpoint:** run the SCOPE PREVIEW section of `p0_fixture_role_revocation.gated.sql`; record the per-role counts; **Approver confirms the scope matches the approved shape before the revocation section runs** | preview output pasted into the log; approver initials | preview shape surprises (roles/counts outside the approved scope) |
| 3 | Run the revocation section | `assignments_revoked` = `audit_rows_written`; post-condition notice ("zero active privileged fixture assignments remain") | post-condition exception (transaction aborts itself); zero production admins remaining guard fires |
| 4 | Apply 0149 (@ pinned artifact) | `0149_live_readback_verification.sql` passes 6a–6f, 7, 7b | any read-back exception |
| 5 | Apply 0147R (@ pinned artifact) | `0147_live_readback_verification.sql` passes A + B/C (fixture intake-privileged = 0; production coordinators/admins lost = 0) | any read-back exception |
| 6 | Regression: re-run the 0148 read-back live; on the isolated replay/staging copy run the P0 (36), intake (25) batteries | all green; counts recorded | any assertion failure |
| 7 | Close: record ledger tail (now `…0149` + `0147_shared_intake_workflow` by version timestamps), timestamps, operator; begin observation window (§8) | log complete | — |

**Rollback decision criteria (rollback vs forward-fix):**
- **Roll back the step** (using its paired rollback file, same-authority,
  reason recorded) when: a read-back fails in a way that leaves privileged
  access WIDER than before, or real staff access is broken and the cause is
  not understood within the window the approver sets. Fail-closed breakage
  with understood cause prefers forward-fix.
- **Forward-fix** (a new prepared+approved artifact) when: the defect is
  narrower-than-intended access, cosmetic, or fully understood — never edit
  an applied migration in place, never improvise SQL in production.
- A rollback of 0148/0149 REOPENS the vulnerability it fixed: it requires the
  approver's explicit instruction, and G2/G3 revert to FAIL/BLOCKED in the
  gate register the moment it runs.
- The revocation step is data, not DDL: its reversal (clearing `revoked_at`
  on the audited rows) is its own approver decision, never automatic.

## 5. Execution log template (one per execution window)

```
Window ID / date (UTC):
Operator:                Approver:               Observer:
Plane: DATABASE (CQCX)   Authority: decision record §9, decisions 1–5
Preflight items 1–7: initials + timestamps
Step 1  0148 apply       start/end:   ledger version recorded:
        read-back:       fixture checked=__ privileged=__  prod lost=__
Step 2  scope preview:   role/counts: __________   approver confirm: ____
Step 3  revocation:      revoked=__ audit rows=__ post-condition: PASS/FAIL
Step 4  0149 apply       read-back: 6a–6f/7/7b PASS/FAIL
Step 5  0147R apply      read-back: A/B/C  fixture=__/0  prod lost=__/0
Step 6  regressions:     0148 live re-readback PASS/FAIL; replay P0 __/36; intake __/25
Anomalies / deviations (every one, however small):
Rollbacks invoked (file, reason, approver):
Close: ledger tail:            end time:            alert owner after change:
```

## 6. Incident / escalation path

1. Any STOP condition → freeze the plane (no further statements), capture the
   exact failing output verbatim, notify the Approver with step number +
   output + the rollback options from §4. **Never improvise around a failed
   gate** (standing rule, decisions 1–7).
2. Suspected data exposure (not just a failed check) → treat as a potential
   incident: preserve evidence, no cleanup writes, Approver decides on the
   containment step; the P0 history (no-breach-claimed discipline) governs
   how it is described.
3. Restore-from-backup is a LAST resort and its own approval — a failed
   function migration never justifies a data restore by itself.

## 7. Post-change observation window

- **Duration:** minimum 24h calendar (or the approver's stated window) after
  the database block completes.
- **Evidence to capture:** Supabase logs for the seven active functions
  (error-rate eyeball vs prior day); Postgres logs for permission-denied
  spikes (expected: fixture actors now denied — that pattern is SUCCESS, log
  it as such); one staff smoke confirmation from a real production admin and
  a real coordinator/navigator (they can see their queues); zero anon
  regressions on the public directory read.
- **Who watches:** the named alert owner (§2). Anything anomalous → §6.

## 8. Later, separately triggered steps (NOT part of this block)

- **0150 (HELD)** + **0151 (sequenced)** — runbook Steps 7–8, only under the
  decision-7 reconsideration and its receiver conditions.
- **Edge Function deployment (any function)** — hard preconditions: its
  SUPA-FN-001 row PROVEN (or the deploy itself is the pinned-SHA proving act
  under the deployment gate); apply-order rules honored (0147R before the new
  `lead-intake`; `residence-intake` before `ejwrh`); Turnstile secrets set
  and `INTAKE_TURNSTILE_OPTIONAL` unset for production; deploy recorded as
  slug/version/SHA/operator/gate in the provenance package.
- **Cloudflare / DNS / Wix / registrar** — each its own plane, own approval,
  own runbook section when authorized; none is opened by anything above.

## 9. Standing references

Decision record: `docs/decisions/2026-09-14-p0-classification-authorization-isolation.md`
Runbook (steps + pins + SQL): `docs/deployment/0148-apply-runbook.md`
Provenance package: `docs/deployment/supa-fn-001-provenance-package-2026-09-15.md`
Batteries: `supabase/launch/tests/p0_*_negative_tests.sql`
