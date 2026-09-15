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

**Pin re-confirmation (2026-09-14, same decision-maker):** the amended
artifact was re-reviewed and the new pin APPROVED — commit
`2a1c2e5a57c5e9a766b6a8bc81502d9abbb3b71f`, SHA-256
`512f4624ee7c6e13b8fe08c5cc5b27d76b44f9b8e51d5bc017637db91edef174`
(pin recorded in `554cadda8a741b448682b596aa26afe12f44056a`). The prior
`8e287b5` artifact is SUPERSEDED and must not be applied. Boundary restated:
this authorizes the global default-function ACL change **for role postgres in
CQCX only, as part of 0149** — no other default-privilege changes, role
alterations, schema changes, or unrelated grants. Execution order:
0148 → live read-back → fixture-role revocation → 0149 (@ `2a1c2e5`) →
0149 read-back → regression verification. No live execution from a session
whose CQCX connector is unauthenticated.

**Rehearsal of the final artifact (isolated replay):** applied clean from the
pre-0149 state; both exploits refuted; read-back 6a–6f, 7 and 7b (new-function
probe) all pass; P0 battery re-passed 36/36 (the battery's temp helper now
carries an explicit grant — the hardening removed its implicit PUBLIC execute,
which is the intended new default posture).

### Status note (2026-09-15): revised 0147 prepared; original rejected for activation

Per executive direction 2026-09-15: the pre-revision 0147 (PR #7 lineage @
`825bb5c1`) is **REJECTED FOR ACTIVATION AS WRITTEN** (its intake predicates
bypass the 0148 guard); the shared-intake design remains governing. A
classification-aligned revised 0147 is **PREPARED / PENDING AUTHORITY** on this
branch (revision record R1–R8 in the artifact header; canonical-boundary
refactor, not point guards), replay-proven against the post-0149 catalog:
applied clean; 25/25 intake negative battery (fixture admin, fixture with
direct intake roles, and fixture directly assigned a lead all locked out;
production coordinator/worker/admin fully functional; fixture assignees and
fixture intake-role grants refused; picker excludes fixtures); read-back
passes; P0 battery 36/36 both post-0147R and post-rollback; rollback restores
the 0102 policies exactly (enum values are unremovable and stay covered by
is_privileged_role — fail closed). Lifecycle: 0148 APPROVED → fixture-role
cleanup APPROVED → 0149 APPROVED → revised 0147 PREPARED/PENDING AUTHORITY →
receiver redeploys PENDING → R1 PENDING. Revised 0147 activates only under a
new approval checkpoint.

### Decision 5 (2026-09-15): revised 0147 APPROVED

**APPROVED** by the same decision-maker after verifying the pinned artifact:
apply the revised `0147_shared_intake_workflow` to CQCX.

- **Artifact:** commit `da6ecb711f7e59cdb9b29f4daf943dbffb7c1c21`,
  `supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql`,
  SHA-256 `6af374bd597b58637159f1dfa623812a54c616d752a5f5d6c095336052b95e2c`.
  The pre-revision PR #7 version remains REJECTED FOR ACTIVATION AS WRITTEN and
  must never be substituted.
- **Sequence (strict):** 0148 → 0148 live read-back → fixture-role revocation →
  0149 (@ `2a1c2e5`) → 0149 live read-back → revised 0147 → 0147 live
  read-back → regression verification. 0147 must not be applied if either 0148
  or 0149 has not passed its verification.
- **Per-apply conditions:** ledger re-check expecting the exact post-0149 state
  (drift → STOP); confirmed restore/PITR point; exact artifact-hash match;
  apply 0147 alone; run its prepared live read-back; verify fixture admins,
  fixture intake-role holders, and fixture actors directly assigned to leads
  cannot exercise intake privileges; verify production coordinators, workers,
  and platform admins retain access; verify fixture assignees are rejected and
  absent from the picker; re-run the P0 classification-isolation suite AND the
  revised-0147 intake suite; STOP on any failure — never improvise around a
  failed gate.
- **Not authorized:** redeploying `lead-intake` / `residence-intake` / `ejwrh`
  (separately gated; SUPA-FN-001 provenance first), merging PR #7/#8, R1
  implementation or topology changes, Cloudflare/DNS/Wix changes, domain
  cutover, unrelated identity/role changes, unrelated production-data writes.
- **Standing control (post-0149 grant discipline):** because 0149 removes the
  default PUBLIC execute on new functions, every client-callable function in
  0147 and later migrations must carry an intentional `GRANT EXECUTE`;
  trigger/internal-only functions stay without client grants. This is part of
  the static migration review going forward (encoded in
  `scripts/verify-0147-prepared.mjs` as a generic sweep).

**Lifecycle:** 0148 APPROVED → fixture cleanup APPROVED → 0149 APPROVED →
**revised 0147 APPROVED** → receiver redeploys PENDING → R1 PENDING.

### Decision 6 (2026-09-15): R1 topology packet RATIFIED — D1, D2, D3, D5 as
### recommended; D4 = OPTION (b) STRICT FAIL-CLOSED

R1 is **RATIFIED / IMPLEMENTATION PREPARATION AUTHORIZED — not
production-authorized**. Design authority only: no implementation deploy, no
migration apply, no receiver redeploy, no Cloudflare/DNS/Wix change, no PR
merge.

- **D1 RATIFIED:** hardened direct Supabase receiver; no new Cloudflare
  gateway Worker or DB rate-limit ledger in R1; escape clause retained (if
  Turnstile + platform controls prove insufficient at public-activation
  review → STOP, separate architecture decision).
- **D2 RATIFIED:** closed server-authoritative slug→residence map (forms send
  slugs, never ids; unknown slug fails closed); independent
  accepting-applications gate starting EMPTY; never inferred from `is_active`,
  directory publication, or any other lifecycle state.
- **D3 RATIFIED WITH EVIDENCE-PRESERVATION CONDITION:** future public housing
  intake requires `consent_to_contact === true`, with a receiver-pinned
  `consent_notice_version` and server-side `consent_at` stamped atomically.
  **Never fabricate historical consent evidence:** live CQCX has three intake
  rows, all `consent_to_contact = true`, but no evidence columns — the boolean
  is retained, and evidence fields stay null/legacy-unknown unless authentic
  source evidence exists; never inferred from record creation time. Prepared
  as `0150_intake_consent_evidence` (preparation authorized; application not).
- **D4 — OPTION (b) SELECTED: STRICT FAIL-CLOSED.** Missing
  `person_classification` DENIES privileged authorization (supersedes the
  packet's (a) recommendation). Basis — fresh live CQCX verification by the
  decision-maker: zero login-linked privileged people lack classification;
  zero login-linked people overall lack classification; live
  `handle_new_auth_user()` already provisions an explicit production row
  (implementation-environment note: the 0146 repo lineage's version does the
  same — verified in the replay catalog; no live↔repo drift on this point).
  Durable invariant: explicit production classification permits the
  production authorization plane; test_fixture denies privileged access;
  **missing classification also denies privileged access**. Pre-apply
  condition for the strict-deny migration: repeat the zero-missing checks;
  any missing login-linked staff classification → STOP AND INVESTIGATE, never
  silently classify or backfill to make the migration pass. Prepared as
  `0151_strict_classification_semantics`.
- **D5 RATIFIED:** R1 migration numbering starts at 0150; 0147/0148/0149 are
  never reused; the former R1 §8 migration is reduced to the D4 work (the
  approved 0148/0147R chain delivers the rest).

Continuing boundaries: R1 implementation stays PREPARED/NOT APPLIED until
separately reviewed and authorized; receiver redeploys stay gated by
SUPA-FN-001 + deployment authorization; the accepting-applications gate stays
closed at the end of R1 until per-residence opening authority; Turnstile
provisioning is an ops/deployment gate; verification uses isolated/ephemeral
environments, never synthetic CQCX rows. All other STOP/HOLD gates closed.

### Decision 7 (2026-09-15): 0151 APPROVED (sequenced); 0150 accepted, APPLICATION HELD

**0151_strict_classification_semantics — APPROVED**, execution sequenced
behind 0150 and all preceding approved migrations. Artifact: commit
`2f1a3df5999e3f3090d1a885ce27cc4f8548f116`, SHA-256
`6109e4658b43c67fd6a1bf3109e182b1934e137d86ac0c4685a23ea9180a442d`.
Conditions (verbatim intent):
1. Immediately before apply, repeat BOTH zero-missing-classification checks
   (all login-linked people; login-linked people with active privileged
   roles). Any nonzero → STOP AND INVESTIGATE; never silently backfill or
   classify to satisfy the migration. Exact queries: runbook Step 8.
2. Verify signup provisioning still creates an explicit production
   classification row.
3. Audit every consumer of `recoveryos.same_world()`: it may never operate as
   a standalone authorization boundary — every use pairs with an independent
   production-privileged predicate, self-scope, or explicit guard; any
   unguarded cross-person path → STOP.
   **Pre-satisfied on the prepared lineage (2026-09-15 replay-catalog audit):**
   exactly two consumers exist and no policies —
   `list_open_support_requests` (paired with `is_support_staff()`) and
   `claim_support_request` (per-domain `is_coach_staff()` /
   `is_navigator_staff()` gates); all pair predicates flow through the
   strict-guarded `has_role`. The audit query is recorded in the runbook and
   MUST be re-run live at apply time (live drift could add consumers).
4. Post-apply: the 17-assertion strict battery + P0 36/36 + intake 25/25
   regressions.
5. Verify production staff retain access; unclassified privileged actors fail
   closed; unclassified actors receive no staff fan-out; participant
   self-service stays in scope.
6. STOP on any prerequisite or regression failure.

**0150_intake_consent_evidence — PREPARED ARTIFACT ACCEPTED; APPLICATION
AUTHORITY HELD.** (Artifact as prepared at `2f1a3df`, SHA-256
`8bf8159f1d98e81adce9ab29c143350412172016427b135495dea72a2516ca6c`.)
Rationale: 0150 alone does not enforce the future consent boundary — that
lives in the hardened receiver; applying 0150 while the current receiver can
still accept submissions would mint new null-evidence rows. Reconsideration
conditions: SUPA-FN-001 proves the exact hardened receiver source; the
receiver is pinned and reviewed; `consent_to_contact !== true` proven to fail
closed; `consent_notice_version` receiver-controlled; `consent_at`
server-generated; server-authoritative residence binding + closed
accepting-applications gate present; and the deployment runbook guarantees no
uncontrolled window in which the old receiver can create new null-evidence
submissions after 0150. Activation sequence at that time: 0150 schema →
verify legacy evidence remains NULL/LEGACY-UNKNOWN → hardened receiver
activation with the accepting gate closed → HTTP/E2E proof of consent
enforcement and atomic evidence stamping → separate per-residence opening
authority later.

**Sequencing rule:** because 0151 follows 0150 in the ratified lineage, 0151
is NOT applied ahead of the held 0150 without a separate
sequencing/renumbering decision. Practical effect: the immediately executable
live sequence remains 0148 → read-back → fixture revocation → 0149 →
read-back → 0147R → read-back → regression; 0150+0151 execute together later
under the receiver-activation program (or under a future resequencing
decision).

Not authorized by decision 7: receiver deployment, residence opening,
Cloudflare/DNS/Wix changes, PR merges, unrelated production mutations. All
other STOP/HOLD gates remain closed.

**Execution status:** BLOCKED ON ENVIRONMENT ACCESS at recording time — the
implementation session holds no authenticated CQCX access path (Supabase
connector unauthenticated; no CLI/credentials). Lifecycle: 0148 =
**RATIFIED + PREPARED**, not APPLIED. Execution assets:
`docs/deployment/0148-apply-runbook.md` (exact gated sequence + live read-back
script) and `supabase/launch/prepared/p0_fixture_role_revocation.gated.sql`
(decision 2). The stop rule was honored rather than improvised around.
