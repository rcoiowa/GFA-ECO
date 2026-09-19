# RecoveryOS Cognitive Data Architecture — Phase 1

**Status:** Architecture mapping only. **No schema change, migration, or policy is proposed or authorized by this document.** It maps the *existing* canonical database into the Brain model so that any later migration is driven by a demonstrated human/operational requirement, not by a linter warning. Principle: **extend before creating, wire before rebuilding.**

## Established baseline (evidence, 2026-09-19)

- Canonical backend: **CQCX `cqcxvwoukyhxyokfwnjm`** (RecoveryOS-Launch), PostgreSQL 17.6.
- Migration tail: **`0149_shared_intake_workflow`**.
- `recoveryos`: **84 tables**, 6 views, 138 functions, 129 RLS policies, 40 triggers.
- **RLS: 84 / 84 enabled.** P0 authorization isolation (0147/0148) intact; 0149 intake additions live.
- No critical/high database exposure. Three tables carry RLS-with-no-policy (deny-all): `funding_sources`, `locations`, `organization_relationships` — held for a semantic/access decision, not opened.

This document treats the live database as the **Canonical Record Plane — established.** The Brain is built *above* it:

```
Canonical Record Plane (84 tables, live)
   → Capture semantics (what warrants a record)
   → Canonical record (where it belongs)
   → Memory projections (relationship / state / episode / evidence / adaptive)
   → Authorized context (role + relationship + consent + purpose + minimum necessary)
   → Orchestration (what matters now)
   → Grace
```

Not every projection persists. Some memory is a **read model** built from canonical records on demand, not a stored copy.

---

## Artifact A — Canonical Memory Map

All 84 live `recoveryos` tables classified into the nine Brain memory categories. A table may participate in several categories; its **primary** category is marked ★ and secondary participations are listed under the other categories. Row counts are the live approximate figures where known (populated vs. empty is a *wiring* signal for the Gap Register, not part of the classification).

### 1. Relational Memory — who is connected to whom, in what capacity, for what period
- ★ `people` — the person record (56).
- ★ `coaching_relationships` — participant ↔ coach, with type/primary/status/period.
- ★ `navigation_relationships` — participant ↔ navigator, with status/primary/period.
- ★ `support_team_memberships` — a person's circle of support (member + role + period).
- ★ `emergency_contacts` — off-platform relational ties (notify-authorized flag).
- ★ `contact_methods` — how to reach a person.
- ★ `organizations` — org entities and hierarchy (`parent_organization_id`).
- ★ `organization_relationships` — **institutional** ties org↔org (referral/collab/funder/etc.), typed + period. *(zero-policy; semantic decision pending — see §Decisions.)*
- ★ `conversation_members` / `conversations` — who is in a messaging thread (also Episodic for the messages themselves).
- Secondary: `program_enrollments`, `residencies`, `role_assignments` (these are relational *and* state/authorization).

### 2. State Memory — the current status/phase of an ongoing thing
- ★ `residencies` — admission → phase → discharge lifecycle (status, phase, dates).
- ★ `residency_phases` — phase history rows (also Episodic).
- ★ `program_enrollments` — enrollment status/period.
- ★ `support_requests` — request lifecycle (status/urgency/claimed/resolved/closed).
- ★ `recovery_plans` — plan status.
- ★ `goals` / `action_steps` — goal status, step done/not (also Adaptive).
- ★ `bed_assignments` — current bed occupancy (assigned/released).
- ★ `appointments` — scheduled/confirmed/cancelled state (also Episodic once occurred).
- ★ `booking_requests` / `booking_proposals` — negotiation state for scheduling.
- ★ `navigation_needs` — open/resolved need state.
- ★ `residence_applications` / `residence_application_intake` — application pipeline status.
- ★ `leads` — six-stage inquiry lifecycle (status + triage_classification) (2 rows).
- ★ `follow_ups` — due/complete state.
- Secondary: `role_assignments` (active vs. revoked is state), `residence_listing_submissions`.

### 3. Episodic Memory — a discrete thing that happened at a time
- ★ `check_ins` — participant self-report episodes (mood/craving/hope/connection/reflection).
- ★ `service_events` — the canonical unit of service delivery (15).
- ★ `lead_contact_events` — attempted vs. connected contact on an inquiry (append-only).
- ★ `messages` — conversation messages (29).
- ★ `notifications` / `notification_deliveries` — emitted notices and their delivery (134).
- ★ `incidents` — house incidents.
- ★ `meeting_attendance` / `meetings` — attendance episodes.
- ★ `passes` — leave/return episodes.
- ★ `screenings` — screening episodes.
- ★ `support_request_events` — the event log of a support request.
- ★ `grievances` — filed/resolved episodes.
- ★ `house_posts` — house-board posts.
- ★ `medication_status_reviews` — review episodes.
- ★ `curfew_exceptions` — dated exceptions.
- ★ `navigation_referrals` — referral episodes (attempted/connected/closed) (also Evidence for connection).
- Secondary: `fee_ledger` (financial episodes; also Evidence), `backfill_log` (system episodes).

### 4. Semantic Knowledge — general facts / the world model, not tied to one person
- ★ `resources` — the community resource directory (rich attributes; crisis flags).
- ★ `resource_domains` / `domains` / `domain_subcategories` / `domain_external_mappings` — the domain vocabulary.
- ★ `service_types` — service taxonomy.
- ★ `consent_types` — consent taxonomy (also Procedural).
- ★ `narr_standards` — NARR standard catalog (82).
- ★ `iowa_checklist_items` — the Iowa checklist catalog.
- ★ `slogans` — the recovering-the-mind slogan corpus with factor scoring (59) (also Collective Learning).
- ★ `locations` — organizational/service locations. *(zero-policy; sensitivity decision pending — see §Decisions.)*
- ★ `residences` — the residence catalog (structural facts: capacity, NARR level, fees, directory flag) (2) (also State for occupancy-derived views).
- ★ `residence_units` / `residence_rooms` / `residence_beds` — physical structure of a residence.
- ★ `programs` — program catalog.
- ★ `funding_sources` — funder catalog. *(zero-policy; institutional/reporting-access decision pending — see §Decisions.)*
- ★ `residence_chores` / `curfew_schedules` — residence operating parameters (also Procedural).

### 5. Procedural Knowledge — how things are done; templates and rules that drive workflow
- ★ `document_templates` / `document_versions` — the versioned document/policy corpus (signature/ack requirements) (20 / 21) (also Evidence via assignments).
- ★ `consent_types` (secondary) — defines what consent is required for service.
- ★ `curfew_schedules`, `residence_chores` (secondary) — operating procedure encoded as data.
- ★ `iowa_checklist_items`, `narr_standards` (secondary) — the procedure/standard against which compliance is measured.
- ★ `staff_preauthorizations` — the provisioning procedure (email → role_keys on signup) (36) (also Authorization).

### 6. Evidence Memory — proof, audit, compliance, integrity
- ★ `audit_log` — the append-only action ledger (122; e.g., the 22 `role.revoked` rows from the fixture cleanup).
- ★ `consent_grants` — consent evidence with effective/expiry/revoke (51) (also Authorization).
- ★ `document_assignments` — assignment + acknowledgment + signature evidence.
- ★ `narr_compliance` — NARR standard status + evidence + verification.
- ★ `iowa_checklist_status` — checklist status + evidence + verification.
- ★ `fee_ledger` — financial record (append-style).
- ★ `screenings`, `incidents`, `medication_status_reviews`, `supervision_coordination_records` — recorded, verifiable facts with reviewer attribution.
- ★ `backfill_log` — data-migration provenance.
- ★ `navigation_referrals.connection_evidence` — connection proof (the "referral ≠ connection" invariant lives here).
- Secondary: `service_events` (the reporting authority for delivered service; also Episodic).

### 7. Adaptive Context — signals that should shape recommendations and Grace, not just be stored
- ★ `recovery_capital_assessments` — BARC-10 etc. (score + responses + context). **Governed:** BARC canon (10–60; no subdomain scores; 47 = reference only; ≤35 crisis rejected).
- ★ `check_ins` (secondary) — trend signals (mood/craving/hope/connection over time).
- ★ `person_profiles` — accessibility/communication preferences, timezone, recovery_date (shapes *how* Grace engages).
- ★ `goals` / `action_steps` (secondary) — what the person is working toward.
- ★ `navigation_needs` (secondary) — active unmet needs (drives resource matching).

### 8. Authorization Memory — who may do or see what
- ★ `role_assignments` — the role grants (active vs. revoked) (95 rows; 22 privileged fixtures now revoked).
- ★ `person_classification` — production vs. test_fixture (the P0 boundary input) (58).
- ★ `consent_grants` (secondary) — consent as an access gate.
- ★ `staff_preauthorizations` (secondary) — pre-grant of roles.
- ★ `conversation_members` (secondary) — thread-level read authorization.
- ★ `support_team_memberships` (secondary) — relationship-based access basis.
- **Also authorization, though not tables:** the 129 RLS policies and the 0147/0149 predicate functions (`has_role`, `is_privileged_role`, `is_production_actor`, `is_intake_coordinator`, …) *are* Authorization Memory expressed as code. The Brain must treat these as first-class, not incidental.

### 9. Collective Learning — cross-person / cross-org aggregate learning
- ★ `slogans` (secondary) — factor scoring + applicability (enneagram/true-colors/stage) is a learning surface.
- ★ `resources` (secondary) — partner/effectiveness attributes accrue as collective knowledge.
- **Mostly future / derived.** No table today is *primarily* collective-learning; this category is largely **read models and future projections** built from Episodic + Evidence, and must be governed (aggregate-only, no re-identification) before it exists.

---

## Artifact D — Gap Register (seeded from evidence)

Only **NEEDS SCHEMA EXTENSION** items may ever become migrations, and only with a demonstrated requirement.

| Item | Class | Note |
|---|---|---|
| Relational/State/Episodic/Evidence tables above | **ALREADY EXISTS** | The record plane is substantially complete; build read models over it. |
| Grace context assembly (role+relationship+consent+purpose+minimum-necessary) | **NEEDS WIRING** | Logic exists in pieces (RLS, predicates, consent_grants); no single context-assembly path yet. Artifact C. |
| "What matters now for this person + task" | **NEEDS READ MODEL** | Compose from check_ins + goals + navigation_needs + open support_requests + residency state. Do **not** persist a copy. |
| Cross-participant learning / effectiveness | **NEEDS READ MODEL** (governed) | Category 9 is derived, aggregate-only; needs governance before it exists. |
| `organization_relationships` access | **NEEDS SEMANTIC DECISION** → then **NEEDS POLICY** | Relationship taxonomy + visibility rules first; keep deny-all until settled. |
| `locations` access | **NEEDS SEMANTIC DECISION** → then **NEEDS POLICY** | Resolve sensitivity (org/service locations only vs. ever participant/safety-sensitive) first. |
| `funding_sources` access | **NEEDS SEMANTIC DECISION** → then **NEEDS POLICY** | Institutional/reporting-access model; likely restricted, not general staff. Keep deny-all. |
| `is_privileged_role`, `lead_contact_events_immutable` mutable search_path | **NEEDS POLICY/HYGIENE** (prepared, reviewed) | Low risk (no unqualified object refs). Pin via a reviewed prepared migration; do not disturb the P0 chain ad hoc. |
| 16 legacy trigger functions with PUBLIC/anon EXECUTE | **DEFER** | Not current exposure (all trigger-returning, not RPC-exposed). Bundle into a future function-ACL hardening migration. |
| Leaked-password protection disabled | **NEEDS CONFIG** (not schema) | Auth setting; enable unless a documented compatibility reason exists. Track outside this architecture. |
| `lead-intake` deployed but inert (`LEAD_INTAKE_SECRET` unset) | **NEEDS WIRING** (front door) | Set the Edge secret + wire the Wix automation; then leads flow to `leads`. |
| `residence-intake` canonical deploy | **NEEDS WIRING** (front door, gated) | Confirm `TURNSTILE_SECRET` + live-form token before deploying the hardened receiver. |

---

## Artifact B — Canonical Capture Matrix (skeleton; contents are human/design decisions)

Method — for each material human occurrence, answer six columns. **The rows below are the occurrences to decide; the cells are deliberately left for GFA to author** (per "map first, decide second"). Nothing here is filled from inference.

| Human occurrence | What materially changed | Canonical record (table) | Evidence required | Who can see it | What Grace receives |
|---|---|---|---|---|---|
| Website inquiry arrives | | `leads` (+ `lead_contact_events`) | | | |
| Contact attempted / connection made | | `lead_contact_events` | | | |
| Participant checks in | | `check_ins` | | | |
| Service delivered | | `service_events` | | | |
| Need identified / referral made / connection confirmed | | `navigation_needs` / `navigation_referrals` | | | |
| Goal set / step completed | | `goals` / `action_steps` | | | |
| Residency admission / phase change / discharge | | `residencies` / `residency_phases` | | | |
| Incident / screening / grievance | | `incidents` / `screenings` / `grievances` | | | |
| Consent granted / revoked | | `consent_grants` | | | |
| Document acknowledged / signed | | `document_assignments` | | | |

Filling this is the substantive Phase-1 work session; each row is a small governance decision (minimum sufficient documentation; activity ≠ outcome; referral ≠ connection).

## Artifact C — Context Assembly Contract (skeleton; the pipeline is fixed, the rules are decisions)

The Brain must never do "has info → give to Grace." It must run the governed pipeline (ratified direction):

```
Does RecoveryOS have the information?
  → Is it relevant to THIS purpose?
    → Is THIS actor authorized (role)?
      → Does the RELATIONSHIP permit access?
        → Does CONSENT apply?
          → Is this the MINIMUM NECESSARY context?
            → Context available to orchestration → Grace
```

What must be authored before this is implementable (all decisions, not code):
- **Purpose vocabulary** — the finite set of authorized purposes a context request may carry.
- **Relationship-permits-access rules** — how `coaching_relationships` / `navigation_relationships` / `support_team_memberships` / `conversation_members` gate person-scoped context (beyond role).
- **Consent applicability map** — which `consent_types` gate which context classes (ties to the G4 consent matrix).
- **Minimum-necessary projections** — per purpose, the smallest field set (never the whole participant record).
- **Grace's allowed context surface** — explicitly what Grace may and may not receive, per the ICARE/Grace governance (no risk inference, no passive surveillance, human-governed).

The existing RLS + predicate estate is the strong technical base for this contract; the contract makes the *purpose/relationship/consent/minimum-necessary* layers explicit above the row-level base.

---

## What is decided vs. pending

- **Decided (evidence):** the baseline facts (§Established baseline) and Artifact A/D classifications, which are read from the live schema.
- **Pending (GFA decisions, in order):** the three zero-policy tables' access semantics; the Capture Matrix cells (B); the Context Assembly rules (C). None of these should produce SQL until the requirement is demonstrated.

_No migration, policy, deploy, or configuration change is made by this document._
