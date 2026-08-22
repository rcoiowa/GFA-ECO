# Service Event Provenance & Evidence Integrity — Canonical Record v1.0

**Status: RATIFIED.** Executive ratification 2026-08-22 + Final Reconciliation Gate
(commit `53581bf`). Full analysis and rationale:
`docs/plans/p2-service-event-provenance-proposal.md`; execution detail:
`docs/plans/p2-implementation-plan.md`. This file is the compact canonical record the code
and CI guard (`scripts/verify-service-provenance.mjs`) are pinned against.

## 1. The spine

`recoveryos.service_events` is the single canonical event spine. No parallel generic events
table. Append-only: no client UPDATE/DELETE path exists; corrections happen by future
amendment flows, never by edit. Historical rows are never rewritten.

## 2. Provenance vocabulary (closed, exactly four values)

`source text NOT NULL` — how the event entered institutional record. Immutable after
creation.

| key | meaning |
|---|---|
| `participant_self_reported` | the person recorded what THEY did (engagement, never org delivery) |
| `staff_attested` | a human staff member claimed delivery occurred (identity in `provider_person_id`; attestation lag visible as `created_at` − `started_at`) |
| `partner_confirmed` | RESERVED — no writer exists or may be created until an approved partner-confirmation workflow exists |
| `system_derived` | generated deterministically from another confirmed, linked system fact |

**`imported` is NOT a provenance value** — ingestion/transport is not attestation authority.
If ingestion is ever needed, it is modeled through separately governed ingestion metadata,
and each row still receives a real attestation source from the source system's evidence, or
the import is refused. There is **no `unknown`/`unclassified` value and no NULL state**:
historical rows were verified deterministically classifiable by writer fingerprint (census
2026-08-21: 15 rows), and the backfill migration ABORTS rather than guess if an
unclassifiable row ever appears.

Writer fingerprints (the only lawful historical classification rules):
`appointment_id` set → `complete_session` → staff_attested;
`navigation_relationship_id` set + type `resource_navigation` → navigation RPC →
staff_attested; `residency_id` set + type `residence_recovery_support` → residence RPC →
staff_attested; provider NULL + self-recordable type + modality `self_directed` →
participant direct path → participant_self_reported. Anything else → abort and report.

## 3. Reporting authority (separate layer — never "Class A/B/C")

| authority key | mapped sources | may support |
|---|---|---|
| `organizationally_attested` | `staff_attested` | external "GFA delivered" claims, Exhibit E, funder reports (fixture-filtered) |
| `participant_reported` | `participant_self_reported` | engagement signals; every external artifact says "participant-reported" |
| `system_derived` | `system_derived` | external claims ONLY when: (1) the generating fact is authoritative, (2) the derivation is deterministic and traceable, (3) the operational definition permits the claim |

`partner_confirmed` has NO auto-mapped authority — defined by the future governed workflow,
never automatically GFA-delivered service. No report silently combines authorities into
"services delivered." Every externally usable metric carries: operational definition, period,
source/provenance, fixture exclusion, method, evidence-ladder rung, generated-at/version.

**Three-layer rule (O-G):** event provenance/`source` ≠ reporting semantics/authority ≠
Institutional Evidence Ledger A–F classification. Neither vocabulary impersonates another;
RecoveryOS never emits A/B/C reporting-class language.

Evidence ladder: `organizationally_attested` events = ACTIVITY; `participant_reported` =
ENGAGEMENT; CONNECTION and above never come from this table.

## 4. Participant self-recording (closed list)

Exactly: `daily_check_in`, `recovery_capital_assessment`, `recovery_practice`.
Self-recording means the participant records what THEY did; it never silently becomes "GFA
delivered this service." No self-reported meeting/community participation in P2. All other
service types are staff/system-only delivery types.

## 5. Idempotency

Appointment completion: structural uniqueness (unique partial index on `appointment_id`).
Ad-hoc writers: caller-supplied `dedupe_key uuid` — **ONE HUMAN ACTION → ONE DEDUPE KEY**; a
retry of the same action reuses the key; a new real interaction gets a new key; keys are
never regenerated on network retry. Participant feature-derived events use deterministic
feature-row keys. No same-day composite uniqueness — repeated legitimate contacts stay
recordable.

## 6. Setting vs channel; attribution

`modality` = HOW (channel). `delivery_context` = WHERE / program setting. Neither is derived
from the other. Historical `delivery_context='virtual'` rows are never rewritten; new writes
stop producing `virtual`; normalization happens only in labeled read lenses. No enum surgery.

`residence_id` = delivered under residence programming — never derived from where the
participant lives; NULL is preferable to fabricated attribution. Two residence reporting
lenses, separately defined and never summed: (A) services delivered under residence
programming; (B) GFA services received during an enrolled residency period.
`organization_id` is resolved explicitly (no `coalesce(...,1)` fallback — fail safely if
organizational attribution cannot be established). `funding_source_id` stays NULL until a
genuine approved attribution workflow exists. `outcome_status` is DEPRECATED: never written,
never wired; physical drop only under a later separately reviewed cleanup.

## 7. Writer architecture

One internal SECURITY DEFINER writer (`record_service_event_internal`) owns canonical
validation (source, dedupe, attribution, service type, linkages, timestamps); it is
**never executable by client roles**. Ordinary clients enter only through the approved
role-specific wrappers: `complete_session`, `record_navigation_service_event`,
`record_residence_support_service_event`, `record_my_activity`. Linkage rule: link the
canonical relationship/appointment/referral that materially generated the event; never
require a formal relationship. Referral doctrine: REFERRAL = activity; CONNECTION =
evidence-gated state; SERVICE EVENT = support delivered. Completed appointment → exactly one
service event; cancelled/no-show → status only, never an event.

## 8. Timeline join contract (P7 preparation — the timeline is NOT built in P2)

A future participant/role-aware relational timeline reads `service_events` joined outward;
it never duplicates state. The contract each event now preserves:
who (`person_id`, `provider_person_id`), what (`service_type_id`), when (`started_at` =
occurrence, `created_at` = attestation; the lag is meaningful and immutable), how
(`modality`), where (`delivery_context`, `residence_id`/`residency_id`), source (`source`),
linked appointment (`appointment_id` → scheduling chain), linked relationship
(`coaching_relationship_id` / `navigation_relationship_id`), linked loop
(`navigation_referral_id` → `navigation_needs` via the referral's need), and resulting state
movement — read from the state tables the event links to (referral status walks, need
resolution, goal status), never stored on the event. Visibility in the timeline follows the
reader's existing RLS posture; the timeline adds no new read grants.

## 9. What is never captured

No psychotherapy/case notes, trauma narratives, character judgments, or free-text event
columns; no emotion inference or surveillance-derived events; no staff-productivity
rankings; no events from message activity or page views (Grace interactions are never
service events — locked); no mandatory capture fields; no timeline UI before P7.
