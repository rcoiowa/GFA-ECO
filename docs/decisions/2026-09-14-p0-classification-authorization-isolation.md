# P0 remediation approval packet — classification authorization isolation (SEC-P0-001, Gate G2)

**Date prepared:** 2026-09-14 (UTC)
**Prepared on branch:** `claude/recoveryos-control-tower-implementation-2026-09-14`
**Status:** **PREPARED — NOT APPLIED.** This packet requests apply authority; it does not grant it.
**Decision owner:** Executive Director (Thomas)

## 1. The exact action requested

Apply `supabase/launch/prepared/0148_classification_authorization_isolation.prepared.sql`
to CQCX (`cqcxvwoukyhxyokfwnjm`, `recoveryos` schema), recording it in the
migration ledger as the next entry after `0146_ejwrh_document_activation`.
(0147 remains reserved for the separate, still-unapplied shared-intake
workflow migration; this P0 change deliberately does not fold in 0147, R1,
domain migration, or any PR #7 content.)

## 2. Why it is required

The 2026-09-14T07:43:56Z Control Tower baseline live-verified (LIVE-DB-004/005/006)
that CQCX contains login-linked `test_fixture` actors holding active privileged
roles (at least one administrator, one navigator) while every privileged
authorization predicate is role-only. A test-classified login can therefore
satisfy production privileged predicates guarding real intake and operational
data. This is the release-blocking P0 structural authorization defect (Gate G2
FAIL). No breach is claimed; unauthorized access has not been established.

## 3. Affected authorization paths (inventory, 0146 lineage)

**Root predicates fixed directly:**

| Function | Defined | Defect | Fix |
|---|---|---|---|
| `recoveryos.has_role(role_key)` | 0009 | role-only | privileged role keys return false for `test_fixture` actors |
| `recoveryos.staff_residence_ids()` | 0009 | reads `role_assignments` directly | returns empty for `test_fixture` actors |
| `recoveryos.is_residence_manager_of(bigint)` | 0115 | reads `role_assignments` directly | false for `test_fixture` actors |

**Derived predicates closed automatically through `has_role` (no text change needed):**
`is_platform_admin` (0113), `is_admin_staff` (0117 alias), `is_care_operations_staff` (0117),
`is_support_staff` (0026), `is_coach_staff` / `is_navigator_staff` (0112), plus every
policy/RPC calling `has_role('<staff role>')` directly (0009, 0026, 0027, 0112,
0117, 0127, 0132, 0136). Call-site counts across the launch lineage:
`is_platform_admin` ≈70, `is_admin_staff` ≈50 (alias), `staff_residence_ids` ≈80,
`is_care_operations_staff` 14, `is_support_staff` 14 — all inherit the guard.

**Data-exposure side channels fixed:** the three staff notification fan-outs
(`trg_lead_notify` 0102; `trg_listing_submission_notify`,
`trg_application_intake_notify` 0122) currently deliver real lead/applicant
names to fixture staff; recipients are now filtered to production-classified
persons.

**Forward prevention:** `grant_role_assignment` (0117) now refuses privileged
grants to `test_fixture` identities (`test_fixture_privilege_blocked`).

**Not covered here (tracked separately):** service-role paths, views,
`SECURITY DEFINER` inventory beyond the touched functions, and Storage — the
full G3 audit (SEC-DB-001). Signup provisioning (0103) is unaffected: new
signups default to production classification and receive only `participant`.

## 4. The invariant

A `test_fixture`-classified actor can never satisfy a privileged authorization
predicate (privileged = coach, navigator, residence_staff, residence_manager,
program_manager, administrator, executive, system_administrator), never holds
residence staff scope, never receives staff fan-out for production events, and
can never be granted a privileged role while classified. `participant` and
`resident` stay non-privileged, so fixture participants keep self-access and
0120 `same_world` participant semantics.

**Supersession:** the 0030 note "fixture status is a metrics/operations
boundary, not a security boundary" is superseded by the 2026-09-14 P0
determination; classification is now part of the authorization boundary.

## 5. Risk of acting / risk of not acting

**Not acting:** test credentials continue to satisfy production privileged
predicates on live intake data; every downstream gate (G3–G15) stays blocked;
any credential compromise of a fixture login is a privileged compromise.

**Acting:**
- *Real staff impact:* none expected — every production-staff predicate is
  proven unchanged by the battery (assertions 22–36).
- *Accepted consequence (needs ratification with this approval):* fixture-driven
  **staff-side** E2E (the 0120 classification-symmetry capability) becomes
  inoperative: a fixture coach/navigator no longer satisfies `is_support_staff()`.
  Restoring world-scoped staff testing is proposed follow-up SEC-P0-002.
  Fixture **participant** flows are unaffected.
- *Performance:* each privileged predicate call adds one PK lookup on
  `person_classification`; negligible at current scale.

## 6. Prerequisites and rollback

- Prerequisite: CQCX ledger tail is still `0146_ejwrh_document_activation`
  at apply time (re-verify immediately before applying; this packet's replay
  target was 0146).
- Rollback: `supabase/launch/prepared/0148_classification_authorization_isolation.rollback.sql`
  restores every touched function byte-faithfully to its post-0146 catalog
  definition (captured via `pg_get_functiondef`) and drops the new helper.
  Rollback was rehearsed on the isolated replay: after rollback the defect
  reproduction returned to its vulnerable pre-fix result, and 0148 re-applied
  cleanly. Rolling back restores the vulnerability and requires the same
  authority.
- No table-structure changes and no row-data mutations; authorization-function
  DDL only. `create or replace` is transactional (single `begin…commit`), and
  PostgREST is notified.

## 7. Verification evidence (isolated Postgres 16 replay, 2026-09-14)

Method: full replay of `supabase/launch/migrations` 0001–0146 (files taken
read-only from the PR #7 lineage, which matches the CQCX applied ledger tail)
plus seeds 0200–0202, with a documented harness shim (roles
`anon`/`authenticated`/`service_role`/`authenticator`, `auth.users` +
`auth.uid()` reading `request.jwt.claim.sub`, `extensions` schema with
pgcrypto, `storage.buckets` stub, and the captured live-drift
`public.housing_applications` DDL from `supabase/live-drift/cqcx/`). Seed 0203
was skipped (it targets the pre-0117 unique constraint; staff-invitation
bootstrap, irrelevant to this battery). One harness repair: a partial first
pass of 0139 left its trigger behind; the trigger was dropped and 0139 re-run
cleanly in a single transaction.

| Step | Result |
|---|---|
| Defect reproduction pre-fix | fixture admin: `is_platform_admin`, `is_care_operations_staff`, `is_support_staff`, `has_role('administrator')` all **true** |
| Apply prepared 0148 | clean |
| Negative battery (`supabase/launch/tests/p0_classification_isolation_negative_tests.sql`, 36 assertions) | **36/36 pass** — fixture admin/navigator fail every privileged predicate and read 0 sensitive rows; production admin/navigator/residence staff unchanged; fan-out reaches production staff only; privileged grant to fixture refused; participant plane and `same_world` preserved |
| Rollback rehearsal | restores vulnerable behavior exactly; 0148 re-applies cleanly |
| Static guard | `node scripts/verify-0148-prepared.mjs` PASS (wired into CI) |

**Limitations (named plainly):** the replay proves the migration against the
repository's 0146 lineage, not against CQCX itself — CQCX could not be queried
from this session (Supabase connector unauthenticated). Before applying:
re-verify ledger tail 0146, capture a backup/PITR point, and re-run the
battery on a disposable Supabase branch/staging project if available. The
battery covers the inspected predicate/RLS/RPC/fan-out paths; the exhaustive
G3 surface audit remains open and is not claimed here.

## 8. The decisions requested (each yes/no, separately answerable)

1. **APPROVE / DENY:** apply prepared migration 0148 to CQCX (with pre-apply
   ledger re-verification and backup point), then run the battery read-back
   checks live (fixture actors' predicates false, staff unchanged).
2. **APPROVE / DENY (separate, identity/role gate):** after 0148 is live-verified,
   revoke the existing privileged `role_assignments` rows held by
   `test_fixture`-classified persons in CQCX (set `revoked_at`, audited), so the
   defect's data residue is retired rather than merely inert. Exact statement
   prepared on request; it is deliberately not bundled into 0148.
3. **RATIFY / REJECT:** the accepted consequence in §5 (fixture staff-side E2E
   inoperative pending SEC-P0-002).

Until decision 1 is approved, 0148 remains PREPARED and G2 remains FAIL.

---

## 9. Decision record (2026-09-14)

**Decision-maker:** Thomas (Executive Director), explicit written authorization
in the Control Tower implementation session, 2026-09-14 (UTC).

| # | Decision | Outcome | Conditions |
|---|---|---|---|
| 1 | Apply 0148 to CQCX | **APPROVED** | Apply only the reviewed `f4646ea` artifact (prepared-file SHA-256 `277824917102dcb74427a66b413c9232f69a39fc169f2fa8404ce326c1d371f4`); immediately-before re-verification that the live ledger tail is still `0146_ejwrh_document_activation`; confirmed backup/PITR restore point before mutation; no 0147/R1/PR #7/domain/unrelated content; post-apply live read-back proving fixture privileged predicates fail and production-staff predicates are unchanged; stop and report on any prerequisite or verification failure. |
| 2 | Revoke existing privileged fixture role assignments | **APPROVED — sequenced after decision 1 is live-verified** | Audited, reversible/traceable revocation only (`revoked_at`, rows preserved); exact aggregate scope + SQL shown before execution, without unnecessary PII; execute only if it matches the approved scope. |
| 3 | Fixture staff-side E2E consequence | **RATIFIED** | Production/test isolation takes precedence; fixture participant flows may remain operational; restoration is SEC-P0-002, separately designed with world-scoped authorization, and must not weaken the production boundary. |

Not authorized by this record: merging PR #7 or PR #8, applying 0147,
deploying functions or Workers, DNS/Cloudflare/Wix changes, unrelated
identity/role changes, or unrelated production-data writes. All other
STOP/HOLD gates remain closed.

### Decision 4 (added later on 2026-09-14): G3 remediation 0149

**APPROVED** by the same decision-maker: apply
`0149_view_and_function_exposure_hardening` to CQCX, **sequenced after 0148 and
its passing read-back**, based on the G3 replay evidence and the
decision-maker's independent live verification that CQCX carries the exposure
conditions. Conditions: pre-apply ledger re-check expecting the post-0148
state (any drift → STOP); confirmed restore point; exact-artifact pin (see
runbook); apply 0149 alone; the six post-apply verifications of condition 6
plus the condition-7 default-privilege verification (both implemented in
`supabase/launch/prepared/0149_live_readback_verification.sql`); re-run the P0
regression battery after 0149; stop on any failure. This decision does NOT
close G3 (live catalog diff, Storage review, Edge Function/service-role review,
`public.housing_applications` confirmation remain), and does not open any other
gate.

**Condition-7 artifact amendments (deliberate, reviewed, not silent):**
1. The default-privilege statement is explicitly bound `FOR ROLE postgres`
   (the role that owns/creates RecoveryOS functions).
2. It uses the **global** form (no `IN SCHEMA`): Postgres per-schema
   default-ACL entries can only add to built-in defaults and cannot remove the
   built-in PUBLIC EXECUTE — verified empirically on the replay, where the
   schema-scoped form was a no-op and the read-back's new-function probe
   failed. The global form covers functions created by role postgres in any
   schema of the database — exactly the RecoveryOS migration surface; explicit
   client grants in migrations are unaffected.

**Rehearsal of the final artifact (isolated replay):** applied clean from the
pre-0149 state; both exploits refuted; read-back 6a–6f, 7 and 7b (new-function
probe) all pass; P0 battery re-passed 36/36 (the battery's temp helper now
carries an explicit grant — the hardening removed its implicit PUBLIC execute,
which is the intended new default posture).

**Execution status:** BLOCKED ON ENVIRONMENT ACCESS at recording time — the
implementation session holds no authenticated CQCX access path (Supabase
connector unauthenticated; no CLI/credentials). Lifecycle: 0148 =
**RATIFIED + PREPARED**, not APPLIED. Execution assets:
`docs/deployment/0148-apply-runbook.md` (exact gated sequence + live read-back
script) and `supabase/launch/prepared/p0_fixture_role_revocation.gated.sql`
(decision 2). The stop rule was honored rather than improvised around.
