# Phase 1 intake activation — §9 verification return and exact mutation proposal (2026-09-05)

**Status: PROPOSAL ONLY. Nothing here has been executed.** This answers §9 ("Before
mutation") of the 2026-09-05 executive decision
(`docs/decisions/2026-09-05-phase1-executive-identity-intake-decisions.md`). The STOP
boundary holds: no account created, no role granted, no migration applied, no RLS
changed, no deploy, no CQCX mutation.

**Evidence basis.** Repository evidence is from the canonical line (this branch;
prepared 0147 at `supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql`,
access machinery at `supabase/launch/migrations/0117_access_governance.sql`). Live-CQCX
facts (accounts, person records, queue contents) were verified in the 2026-09-05 Phase 1
gate session and are carried forward here as prior-session-verified — the Supabase
connector is not authorized in the recording session, so they could not be re-verified
today and **must be re-verified immediately before mutation** (each mutation step below
begins with its own verification).

**Operational observation (last verified 2026-09-05, not re-verified since):** at the
Phase 1 gate's CQCX check, 2 real inquiries sat in `recoveryos.leads`, both `new` and
unassigned, submitted 2026-09-01. That evidence establishes their status **at that
observation only** — whether contact has since occurred outside the system, the current
schema cannot record, and this document does not assert their present state. The next
authorized CQCX session should re-verify them first and, only if still unworked,
recommend manual outreach via the existing staff surface. (Framing corrected 2026-09-07
by executive direction: do not carry these as "still needing outreach" without fresh
verification.)

## 1. Accounts / person records that must actually be created

Three. No matching person records exist under any identity (searched by name patterns
across `recoveryos.people`; all 8 real-domain auth accounts enumerated — gate-verified):

| Person          | Email                             | Account today | Person record today |
| --------------- | --------------------------------- | ------------- | ------------------- |
| Jill DeGarmeaux | jill@graceforaddictions.org       | none          | none                |
| Tara            | tara@graceforaddictions.org       | none          | none                |
| Archaletta      | archaletta@graceforaddictions.org | none          | none                |

**Creation mechanism — existing, no new machinery:** `recoveryos.create_staff_invitation`
(0117) writes a scoped, expiring, revocable `staff_preauthorizations` row; when the
person signs up with that email, the `handle_new_auth_user` trigger creates their person
record, classifies it `production`, grants baseline `participant`, consumes the
invitation, and grants its `role_keys` — all audited. Each person sets their own
credentials; nobody's account is created for them. This also gives the human-authority
confirmation a natural form: an invitation accepted is the person accepting the
responsibility.

Constraint: invitations carry `role_keys recoveryos.role_key[]`, so invitations naming
`intake_coordinator`/`intake_worker` can only be created **after** 0147 is applied
(it adds the enum values). Order matters (step E below).

## 2. Existing accounts that can be reused

| Person         | Identity                                                                                    | Reuse                                                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thomas         | thomas@graceforaddictions.org — person 202, roles today: participant only                   | Yes — designated operational intake identity; needs the coordinator grant                                                                                                                                                                                                                      |
| Thomas (admin) | degarmeaux@icloud.com — person 234, all nine roles incl. administrator/system_administrator | Yes — this is the identity that **executes** invitations and grants (`create_staff_invitation`/`grant_role_assignment` require `is_platform_admin()`, which person 202 does not satisfy). Not merged, not modified; least-privilege review stays queued for the separate identity-hygiene gate |
| Ashlee         | ashlee@graceforaddictions.org — account exists, no intake role                              | Yes — grant only `intake_worker`; all existing roles untouched                                                                                                                                                                                                                                 |

## 3. Exact role grants proposed

Per the ratified decision (§2), all effective only after 0147 adds the two enum values:

| Person                       | Grant                | Mechanism                                              | Scope notes                                                                                                                                                                                                                    |
| ---------------------------- | -------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Thomas (person 202, thomas@) | `intake_coordinator` | `grant_role_assignment` executed by the admin identity | Full queue, assign/reassign. Also holds (pending decision-2 ratification) the partnership-responder and men's-housing routing functions — held by function designation in the ratified decision record, not by any schema flag |
| Jill                         | `intake_coordinator` | staff invitation → consumed at signup                  | Full queue, assign/reassign                                                                                                                                                                                                    |
| Tara                         | `intake_worker`      | staff invitation → consumed at signup                  | Assigned inquiries only                                                                                                                                                                                                        |
| Archaletta                   | `intake_worker`      | staff invitation → consumed at signup                  | Assigned inquiries only. **No women's-pathway recipient authority is encoded** (ratified §3)                                                                                                                                   |
| Ashlee                       | `intake_worker`      | `grant_role_assignment`                                | Existing roles preserved unchanged                                                                                                                                                                                             |

What these grants do and do not do (verified against prepared 0147 + current RLS):

- `intake_worker` grants visibility of **assigned leads only** (`leads_intake_select`)
  and contact-logging on leads the person can work. It grants nothing else: no
  participant records, no residence data, no housing actions, no finances. Tara's and
  Archaletta's house-meeting/check-in/coaching functions are **not** carried by this key
  — they are Track B function grants (see the architecture review), so nothing here
  over-grants toward §2's boundary.
- `intake_coordinator` grants full queue visibility, assignment, routing, status.
- 0147 simultaneously **narrows** access: coaches/navigators lose the generic lead
  visibility they have under 0102 today. This deliberate change ships with the
  authorized apply (activation-plan item; reconfirmed here).
- Founder-as-schema is retired: no `founder_response_due_at`, no founder routing flag.
  A second deadline field (acknowledgment vs substantive) exists only if decision 2
  ratifies it, function-named.

## 4. Current documentation mechanisms (§9 items 4–6 — verified in-repo)

- **GFARC / group meetings:** no dedicated mechanism. Nearest primitives:
  `meetings` + `meeting_attendance` (0006; residence-scoped; written today only by
  residence staff via `staff_residence_ids()`), and `service_types` already seeds
  `recovery_circle`. `service_events` is strictly per-person (`person_id not null`) —
  no aggregate-attendance group record exists. **Gap confirmed**; minimum-change design
  is in the Track B review (extend `meetings`, not a new subsystem).
- **House meetings:** `meetings`/`meeting_attendance` covers residence house meetings
  for residence staff. Coaches (Tara, Archaletta, Ashlee) cannot write them today, and
  the tables lack type/facilitator/topic/held-vs-scheduled. Gap and least-privilege
  design in the Track B review.
- **Generic service/activity documentation:** the ratified provenance canon (0133/0134/ 0137) allows exactly four writers: `complete_session` (appointment-keyed, coach-
  attested), `record_navigation_service_event`, `record_residence_support_service_event`,
  and `record_my_activity` (participant self-report, closed 3-type list). There is no
  writer for an ad-hoc staff-attested interaction or a group occurrence. That is a
  deliberate integrity boundary, not an accident; Track B extends it with new authorized
  writers rather than loosening it.

## 5. Whether coaches/volunteers can currently record activity without excessive access

**Access is correctly narrow; capability is the gap.** A coach's visibility is
relationship-scoped (`my_active_participant_ids`, `get_my_participants`); they can
document only their own confirmed appointments (`complete_session` checks
`provider_person_id`), and claiming a support request is the only path that creates a
relationship. Nothing lets a coach browse unrelated participants. But equally, nothing
lets an authorized facilitator document a GFARC occurrence or a peer interaction outside
an appointment. Track B closes the capability gap while keeping this boundary.

## 6. Conflicts with the canonical relational/service model

None that block Phase 1. Two design constraints to respect downstream (both handled in
the Track B review): (a) aggregate-only attendance cannot be represented in
`service_events` (person-required) — group occurrences must live on the meeting/occurrence
record, with identified attendance joining per-person only where authorized; (b) new
writers must carry the ratified provenance vocabulary (`staff_attested`, dedupe keys)
rather than bypassing it.

## 7. Minimum schema/RLS changes required for Phase 1 (Track A only)

**Zero beyond 0147 itself.** _(Updated 2026-09-05, same day: the six decisions were
ratified — see `docs/decisions/2026-09-05-phase1-six-deadline-routing-decisions.md`.
The ratified outcome removed `lead_default_due()` entirely: business-time governs but
automation is deferred pending the operating-calendar ratification, so no writer
computes deadlines; `response_due_at` ships dormant. The pre-apply edits are done —
that decision log records the exact delta.)_ Track B requires nothing from 0147
(dependency table in the architecture review: all rows "no dependency").

## 8. Exact mutations proposed (ordered; each separately gated; none executed)

Blocking precondition for step B onward: **ratification of the six deadline/routing
decisions** (restated below). Steps A–C are repository-only; D onward touch live systems.

- **A. [REPO-ONLY]** Update prepared 0147 with the ratified decision values (deadline
  basis and amounts; second deadline field if ratified; retire the superseded branch's
  `eligible_for_round_robin` concept if manual assignment is ratified). Record the
  ratification as a decision log.
- **B. [REPO-ONLY]** Move `0147_shared_intake_workflow.prepared.sql` →
  `supabase/launch/migrations/0147_shared_intake_workflow.sql`; PR "Shared intake
  workflow (leads v2)" on the canonical line; CI green at exact SHA.
- **C. [REPO-ONLY]** Confirm lead-intake receiver v3 in-repo matches the final 0147
  (idempotency, residence_interest mapping) — already built at 39c4208; re-verify only.
- **D. [STAGING-AUTH — explicit authorization required]** Verify current CQCX state
  (ledger tail 0146; leads intact), then apply 0147 to CQCX. Rollback documented in the
  activation plan (additive migration; restore prior status check; drop new grants).
- **E. [GATED]** Identity mutations, executed as the admin identity (person 234):
  1. `create_staff_invitation('jill@graceforaddictions.org', '{intake_coordinator}')`
  2. `create_staff_invitation('tara@graceforaddictions.org', '{intake_worker}')`
  3. `create_staff_invitation('archaletta@graceforaddictions.org', '{intake_worker}')`
  4. `grant_role_assignment(202, 'intake_coordinator')` (thomas@)
  5. `grant_role_assignment(<ashlee person id — re-verify>, 'intake_worker')`
     Then Jill/Tara/Archaletta sign up with those emails (their acceptance completes the
     human-authority loop); invitations expire in 30 days and are revocable.
- **F. [STAGING-AUTH]** Redeploy `lead-intake` v3 — strictly **after** D (the receiver
  writes 0147 columns).
- **G. [STAGING-AUTH]** Staging deploy (`recoveryos-staging` is an ACTIVE PILOT — its
  own authorization), then the synthetic staging battery from the activation plan §8
  (secret handling, idempotency, RLS matrix coordinator vs worker, append-only log,
  deadline derivation, confirm-route, partnership path, privacy boundaries).
- **H. [THOMAS/WIX]** Wix payload edit: add `submission_id`, `submitted_at`,
  `organization_inquiry`, `residence_interest`; keep the shared secret.
- **I. [REPO-ONLY]** Close reconciliation-queue items Q1/Q3a/Q4/Q5 with evidence from
  D–G; Q2/Q3b/Q3c stay open per their deferrals.

## 9. The six open decisions — RESOLVED 2026-09-05

_(Ratified same day with modifications — the governing record is
`docs/decisions/2026-09-05-phase1-six-deadline-routing-decisions.md`, which supersedes
the proposed defaults below. Material changes from the proposals: business-time governs
but automated deadline computation is deferred pending the operating-calendar
ratification; decision 1 adds the attempted-vs-connected evidence distinction;
decision 6 adds the close-time triage classification. Step A of §8 is complete; steps
B onward remain gated.)_

Original restatement as proposed (historical):

1. Standard first-response deadline (proposed default for ratification: 1 business day
   to first human contact attempt).
2. Partnership/priority deadlines + designated responder, function-named (proposed:
   4-business-hour acknowledgment, 2-business-day substantive, responder = designated
   partnership responder, currently Thomas).
3. Calendar vs GFA business time — if business time, ratify the operating calendar
   (this is the one decision that changes 0147 SQL).
4. Overdue reminder cadence + escalation recipient (proposed: 2-business-day cadence,
   escalate to the coordinator group at deadline+1 day).
5. Manual coordinator assignment vs round-robin (proposed: manual for v1; retire the
   superseded flag; revisit with volume data).
6. Verified-submission definition (proposed: shared secret admits to queue; the
   coordinator's first triage act is the human quality gate).

A "KEEP" per line ratifies the proposed default; any "MODIFY" replaces it. Decisions are
recorded as a decision log before step A executes.

## 10. CI / formatting gate analysis before step B (read-only, 2026-09-07)

Question: would the intended activation PR fail CI because of the reported prettier
drift? **No.** Evidence:

1. **Why the failures exist:** running `prettier --check "**/*.{ts,tsx,css,md,json}"`
   on the canonical merge target itself (`claude/recoveryos-canonical-audit-1pvcwr` @
   `08b979f`, clean worktree, same lockfile-pinned prettier) reports **180 files**
   failing. The canonical line was never kept prettier-clean; the repo's CI has never
   enforced it. (The earlier "182" on this branch was those 180 plus two then-unformatted
   new decision docs, since formatted.)
2. **Merge target status:** fails `format:check` (180 files) on its own, before any
   work from this branch.
3. **Origin of the failures:** entirely pre-existing on the merge target. File-list
   comparison: **zero** failures exist only on this branch; this branch's list (177) is
   a strict subset of the target's — three files (`InquiriesPage.tsx`, its test,
   `leadsQueue.ts`) fail on the target but pass here because this branch formatted
   them. The receiver (`supabase/functions/lead-intake/index.ts`) fails on both sides
   — its drift predates the delta (verified against the pre-delta blob). Prettier has
   no SQL parser, so the prepared migration is outside `format:check` scope entirely.
4. **Would the PR fail CI?** `.github/workflows/ci.yml` contains **no format/prettier
   step**. Its actual steps were all run locally on this branch, post-delta, and pass:
   all 12 governance/guard scripts (canonical-backend, ICARE lock + regression,
   intake boundary, booking integrity, Grace model lock + safety floor + disclosure
   sync, view privileges, domain vocabulary, service provenance, intake minimization),
   `pnpm typecheck` (10/10 projects), `pnpm test` (277 tests: platform 164, domain 92,
   recovery-content 21), `pnpm build`, and the production-bundle backend guard
   (canonical CQCX ref present, retired ref absent).
5. **No mass formatting performed** — a 180-file reformat would bury the activation
   diff and belongs, if ever, to a separate dedicated commit under its own review.
6. **Minimum corrective action: none required for CI.** Optional hygiene (not a
   blocker, separate from the activation PR): add `format:check` to CI only after a
   one-time dedicated formatting commit on the canonical line, or scope it to changed
   files; decision deferred — nothing in this workflow depends on it.

Conclusion: step B is CI-safe on formatting grounds. Step B remains **not authorized**
by this analysis; it awaits its own explicit instruction.
