# Decision: Phase 1 Intake Identity, Roles & Access (Track A)

Recorded per §14 (Decision Logging) of the GFA Project Knowledge Authority & Conflict
Resolution Protocol. Resolves the identity and functional-access questions returned by the
Phase 1 decision gate for canonical Migration 0147.

**Scope:** Track A (executive-decision sections 1–9). This record documents the executive
decisions and returns the pre-mutation analysis. **No account, role grant, migration
apply, RLS change, or deploy is performed by this record** (the executive STOP is
preserved). It establishes RecoveryOS operational assignments only, and **does not**
establish employment classification, contractor/volunteer legal status, insurance,
credential, mandatory-reporter status, EJWRH or Grace House housing authority, or corporate
signing authority (§8) — those remain separate authority/evidence questions.

- **Date:** September 5, 2026
- **Decision-maker:** Executive Director, Grace For Addictions (Thomas DeGarmeaux),
  recorded through an authenticated, executive-directed working session.

## Decisions (as directed)

1. **Canonical operational identities.** thomas@graceforaddictions.org,
   jill@graceforaddictions.org, tara@graceforaddictions.org,
   archaletta@graceforaddictions.org, ashlee@graceforaddictions.org.
   `thomas@graceforaddictions.org` is Thomas's designated operational RecoveryOS identity
   for this workflow. Thomas's other existing person/account record is **not** merged or
   deleted here; the duplicate/distinct-record question is deferred to a separate
   **identity-hygiene gate**.
2. **Intake authority.** Thomas → `intake_coordinator`; Jill → `intake_coordinator`;
   Tara → `intake_worker`; Archaletta → `intake_worker`; Ashlee → preserve existing
   authorized roles, add intake access only to the extent her actual intake
   responsibilities require. Coordinators (Thomas, Jill) view the full queue and
   assign/reassign; workers (Tara, Archaletta) act only on assigned inquiries, plus the
   house-meeting/check-in/coaching functions §4–5 assign — **without** automatic executive,
   housing-admission, discharge, financial, or org-wide administrative authority.
3. **No gender-based "women's-pathway recipient."** The Archuleta/Archaletta ambiguity is
   resolved as **Archaletta — archaletta@graceforaddictions.org**. RecoveryOS routes on the
   **selected residence/service and authorized function**, never on inferred gender. (See
   the reconciliation note below: the canonical prepared 0147 already routes this way; the
   superseded branch's gendered `intake_routing_rules` route keys are retired.)
4–8. Recorded as directed (GFARC/meeting documentation, house meetings, generic activity
   documentation, function-based access, and the evidence distinction). Track B analysis of
   4–7's product requirements is in
   `docs/product/relational-operations-architecture-analysis-2026-09-05.md`.

## §9 — Pre-mutation return (analysis; nothing executed)

Evidence basis: full read of prepared 0147
(`supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql`), the activation plan,
and the canonical schema/migrations. CQCX account existence was verified read-only in the
prior gate (66 auth users; the two live inquiries; role-key enum).

### 1. Accounts / person records that must actually be created (3)

| Person | Email | Reason |
|---|---|---|
| Jill DeGarmeaux | jill@graceforaddictions.org | No auth account, no person record (verified) |
| Tara | tara@graceforaddictions.org | No auth account, no person record |
| Archaletta | archaletta@graceforaddictions.org | No auth account, no person record |

Each creation is auth user + 1:1 `people` row. **Not** created in this pass.

### 2. Existing accounts that can be reused (2)

| Person | Email | CQCX identity | Current roles |
|---|---|---|---|
| Thomas | thomas@graceforaddictions.org | person 202 | participant (designated operational identity for the coordinator grant) |
| Ashlee | ashlee@graceforaddictions.org | person 238 | participant, coach (preserve; add intake worker access) |

Not reused here: person 234 (degarmeaux@icloud.com, all 9 roles) — left untouched, flagged
to the identity-hygiene gate; a least-privilege review of its 9-role grant is queued there.

### 3. Exact role grants proposed (to be applied only under a later authorization)

| Person id | Grant | Lane |
|---|---|---|
| Thomas (202) | `intake_coordinator` | full queue, assign/reassign |
| Jill (new) | `intake_coordinator` | full queue, assign/reassign |
| Tara (new) | `intake_worker` | assigned inquiries only |
| Archaletta (new) | `intake_worker` | assigned inquiries only |
| Ashlee (238) | `intake_worker` (added; coach + participant preserved) | assigned inquiries only |

**One item needing explicit confirmation** (no silent choice): §2 phrases Ashlee's intake
access as "to the extent required." The narrowest intake grant available is `intake_worker`
(assigned-only); there is no finer-grained intake role. Proposed: `intake_worker`. If
Ashlee's intake involvement is only occasional, confirm whether even that standing grant is
intended, or whether she should be assigned inquiries case-by-case under a coordinator
without a standing worker role.

### 4. Current GFARC / group-meeting documentation mechanism

**Partial — exists as composable primitives, no dedicated GFARC object.**
`service_types.category` includes `recovery_circle` and `event`; `service_modality`
includes `group`; `service_events` is the delivered-service attribution spine;
`meetings` + `meeting_attendance` (0006) + `record_meeting` / `record_meeting_attendance`
RPCs (0128) record a meeting and per-person attendance. Gaps for the §4/§10 GFARC model
(type, facilitators, topic, aggregate-only attendance, virtual/hybrid location, Held/Cancelled
lifecycle, series/recurrence) and the residence-staff-only gate are analyzed in the Track B
document. **No new GFARC table is warranted.**

### 5. Current house-meeting documentation mechanism

**Exists.** `record_meeting` / `record_meeting_attendance` (0128), authorized to residence
managers/staff of the meeting's residence (+ platform admin), writing `meetings` /
`meeting_attendance`. Reusable as-is for residence house meetings; the §5 least-privilege
requirement (record a meeting ≠ read the full participant record) is already met — these are
SECURITY DEFINER RPCs, not table-wide grants. Extension needs (facilitators, non-residence
facilitators, lifecycle) are in Track B.

### 6. Current generic service/activity documentation mechanism

**Exists.** `service_events` + `service_types` written through the canonical writer
(`record_service_event_internal` + typed wrappers `record_my_activity` [participant self,
closed whitelist], `record_navigation_service_event`, `record_residence_support_service_event`).
The gap is a **general authorized-facilitator write path** (a coach/peer/volunteer
documenting a group or 1:1 recovery-support activity they facilitated) — the existing
wrappers cover participant-self, navigation, and residence-support, not general facilitation.
Track B proposes one additive wrapper rather than per-program tables.

### 7. Minimum schema/RLS changes required for Track A (0147 activation)

**None beyond prepared 0147 itself.** The identities and grants above use existing
mechanisms: `auth.users` + `people` (creation), `role_assignments` + the two new enum values
`intake_coordinator`/`intake_worker` that prepared 0147 adds, and the RLS/RPCs already in
prepared 0147. No additional schema object is required to enact §1–3. (Track B changes are
separate and are **not** 0147 preconditions — see the dependency analysis in the Track B doc.)

### 8. Can coaches/volunteers record an activity without gaining excessive participant access?

**Yes — and this pattern must be preserved.** All canonical service/meeting writes go
through SECURITY DEFINER RPCs that check authorization (relationship, residence assignment,
or facilitation) inside the function. The writer therefore never needs table-wide SELECT on
participant records to document a service. Access to *read* a participant record remains a
separate RLS decision keyed on relationship. Documentation permission ≠ participant-record
read ≠ intake authority ≠ housing authority (§5/§7 satisfied by construction).

### 9. Any conflict with the canonical relational/service model

No material conflict. Two reconciliations to record:
- **Gendered routing retired (§3).** The canonical prepared 0147 routes on explicit,
  self-selected `residence_interest` (`grace_house`/`ejwrh`/`confirm_route`/`unspecified`) +
  coordinator action — no gender inference. The superseded
  `contact-connect-intake-foundation` branch's `intake_routing_rules` with
  `womens_recovery_housing`/`mens_recovery_housing` route keys is superseded and its gendered
  keys **must not be reintroduced**. This sharpens reconciliation-queue item Q2 in
  `docs/decisions/2026-09-03-intake-0147-supersession.md`.
- **Ashlee dual role.** Adding `intake_worker` alongside `coach`/`participant` is consistent
  with the function-based role model (§7); no conflict.

### 10. Exact mutations proposed (to follow a later, separate authorization — none now)

In order, each separately gated:
1. Create 3 auth users + 3 `people` rows (Jill, Tara, Archaletta) — identity confirmed above.
2. Apply prepared 0147 to CQCX (move prepared → migrations ledger; preflight PASS).
3. Redeploy `lead-intake` v3 (strictly after step 2).
4. Grant intake roles (audited): Thomas + Jill `intake_coordinator`; Tara + Archaletta +
   Ashlee `intake_worker` (Ashlee's coach/participant preserved).
5. Confirm the deliberate access narrowing (coaches/navigators lose generic lead visibility)
   ships with 0147.
6. Staging deploy (`recoveryos-staging`, ACTIVE PILOT — its own authorization) + synthetic
   rolled-back battery.
7. Thomas's Wix payload edit.

Also outstanding, independent of the build (from the activation plan): the **2 real
unassigned inquiries** in the live queue (status `new`, submitted 2026-09-01) should be
worked manually now via the existing staff surface — they should not wait for activation.

## Track A blocker still open: the six deadline/routing decisions (§17)

This record does **not** resolve them; they are not inferred from Track B product
requirements. They remain explicit executive decision items and are the only substantive
work outstanding before Phase 1 can close. Recommended as a tiny six-line ratification next:

1. standard first-response deadline;
2. partnership/priority acknowledgment + substantive-response deadlines and designated
   responder (encoded as a **function**, not "founder");
3. calendar-time vs business-time (and, if business time, the authoritative GFA operating
   calendar);
4. overdue reminder cadence and escalation recipient;
5. manual assignment vs round-robin participation;
6. definition of a verified submission and the human quality/spam-review point.

Full decision-grid form is in the prior gate return; the canonical prepared 0147 currently
encodes clock-hour proposals (24h/4h) while the activation plan proposes business-time —
decision 3 resolves the conflict.
