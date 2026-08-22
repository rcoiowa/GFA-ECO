# P2 — Service Event, Provenance & Evidence Integrity: Canonical Architecture

> **Status: RATIFIED 2026-08-22 with executive corrections (P2 Executive Ratification).**
> **The canonical compact record now lives at
> `docs/architecture/service-event-provenance-v1.0.md`** (P2.1 semantic lock) — this
> document is preserved as the full analysis and ratification audit trail. Implementation
> proceeds under `docs/plans/p2-implementation-plan.md`.
>
> Executive corrections incorporated into this document:
> 1. **Reporting-authority naming** — the proposal's "Class A/B/C" labels are REJECTED
>    (collision with the GFA Institutional Evidence Ledger's Evidence Classes A–F, a
>    different governance layer). Replaced by semantic keys:
>    `organizationally_attested`, `participant_reported`, `system_derived` (§O).
> 2. **Provenance backfill rule** — historical rows are classified only by demonstrable
>    writer provenance (writer fingerprints), never solely by
>    `provider_person_id IS NULL / NOT NULL`. Never fabricate provenance (§E).
> 3. **Reserved source value** — `partner_confirmed` is vocabulary only; no writer exists
>    until an approved workflow exists (§E).
>
> **FINAL RECONCILIATION (2026-08-22, P2 Final Reconciliation Gate — supersedes the two
> points above where they conflict):**
> - **`imported` is removed from the provenance vocabulary.** It is an ingestion/transport
>   mechanism, not an attestation authority; if ingestion-channel tracking is ever needed it
>   is modeled separately through explicitly governed ingestion metadata (§E). The canonical
>   P2 vocabulary is exactly: `participant_self_reported`, `staff_attested`,
>   `partner_confirmed`, `system_derived`.
> - **No NULL/unknown/unclassified provenance semantics.** Every existing service_event was
>   verified deterministically classifiable by writer fingerprint (live census 2026-08-21:
>   15 rows, all fingerprint-matched). `source` is therefore **NOT NULL**; the backfill
>   migration classifies under the documented deterministic rules and **fails (aborts) if
>   any row cannot be defensibly classified** — no silent guessing, no speculative unknown
>   bucket, no architecture change without executive review.
> - **`system_derived` does not independently establish external reporting authority** —
>   see §O conditions.
> - **Partner-confirmed activity is never automatically treated as GFA-delivered service**;
>   its reporting authority is defined by the future governed workflow (§O).
> 4. **Self-recordable types locked for P2** — `daily_check_in`,
>    `recovery_capital_assessment`, `recovery_practice`. Self-reported meeting/community
>    participation is deliberately excluded from P2 (future design under the P1
>    Recovery ≠ Community decision) (§K).
> 5. **`support_request` deprecation approved** — the request workflow/concept is NOT
>    deprecated; no replacement "responded_to_request" type is created (§J).
> 6. **Resident-window reporting approved** — two separately labeled lenses, never summed,
>    never produced by mutating attribution, operational definitions exposed (§H).
> 7. **Provider self-read approved narrowly** — `provider_person_id = actor` only, never
>    role-wide history; full positive/negative test matrix required (§Q).
> 8. **Shared writer Option B ratified** — internal writer owns canonical validation and is
>    never a public authenticated RPC (§T.3).
> 9. **Idempotency contract** — ONE HUMAN ACTION → ONE DEDUPE KEY; retries reuse the key,
>    new real interactions get a new key (§F).
> 10. **Staged self-insert cutover required** — the participant direct-insert path is not
>    removed until the replacement `record_my_activity` path is deployed and verified;
>    no participant dead end (§K, implementation plan P2.5).
> 11. **Governance rule added (§O-G)** — RecoveryOS event source describes individual
>    record origin; the Institutional Evidence Ledger A–F classification describes
>    institutional evidence authority. Different layers; neither vocabulary impersonates
>    the other.

Baseline verified 2026-08-21: branch `claude/recoveryos-canonical-audit-1pvcwr`, HEAD `2d90520`
(= origin, tree clean, CI run #94 green), CQCX `cqcxvwoukyhxyokfwnjm` (RecoveryOS-Launch,
ACTIVE_HEALTHY), migration ledger through `0132_domain_reporting_lens` (68 entries), all 10
governance/security guards passing. Every live claim below was verified read-only against CQCX
on this date; repo claims cite file:line.

Governing principle applied throughout: **EXTEND BEFORE CREATING.**

---

## A. Executive assessment

`service_events` is sound as the canonical event spine and should be **kept and extended,
not replaced**. The table already carries the four linkage columns a timeline needs
(appointment, coaching relationship, navigation relationship, referral — added 0112:863-867),
has a structural one-event-per-appointment guarantee, is append-only to clients under RLS, and
every writer path is known and small (four, total). Nothing found is structurally incapable.

What P2 must fix, in order of evidence risk:

1. **Provenance is implicit.** "How did this row become institutional evidence?" is currently
   answered only by inference from `provider_person_id IS NULL`. That inference is reliable
   today (all four writers are known) and will stop being reliable the day a partner
   confirmation or import path exists. One immutable `source` column closes this permanently.
2. **The participant self-insert policy is far too wide.** RLS policy
   `service_events_insert_self` (0012) restricts *who* (self) but not *what*: a participant
   can today insert a `coaching_session`, set any `residence_id`, any `program_id`, any
   `organization_id` — and that row would enter the residence Exhibit E report and staff
   supervision reads. No abuse observed live (0 self-inserted rows exist), but this is an
   open evidence-integrity hole in the external-claim path.
3. **Idempotency is exact-timestamp equality** in both ad-hoc attestation RPCs — two clicks
   produce two `now()` values and two events. Live fixture data already contains a same-day
   same-person same-provider same-type duplicate pair, demonstrating the failure mode.
4. **`delivery_context` mixes WHERE with HOW.** `virtual` is a channel, not a setting, and
   `complete_session` *derives* the setting from the channel (0112:975-976). All 4 live
   coaching events carry `delivery_context='virtual'`, erasing the program setting.
5. **Residence reporting asks one question with the wrong lens.** Coaching/navigation for
   residents correctly carries `residence_id = NULL` (VRCC delivered it, not the house) — but
   the residence reports only count `residence_id`-attributed rows, so "what are our
   residents receiving?" undercounts to zero. This is a reporting-lens fix, not a write-path
   fix; deriving residence attribution at write time would be the wrong repair.
6. **`outcome_status` is dead weight** — text, no CHECK, never written (0 of 15 rows), never
   read for decisions. It invites exactly the activity-as-outcome conflation P2 exists to
   prevent. Deprecate it.

Live scale check: 15 service events exist, **all fixture-person data** (0 production events);
`funding_sources` is empty; 0 check-ins/BARC rows. P2 lands before real volume — the cheapest
possible moment to fix semantics.

---

## B. Current service-event architecture

Table `recoveryos.service_events` (0005:20-45, extended 0112:863-871; live shape verified):

| Column | Type | Null | Written by | Notes |
|---|---|---|---|---|
| id | bigint identity | no | — | |
| person_id | bigint FK people | no | all writers | recipient |
| service_type_id | bigint FK service_types | no | all writers | |
| provider_person_id | bigint FK people | yes | RPCs (self path leaves null) | current implicit provenance |
| organization_id | bigint FK | no | all | single org live (GFA=1); `complete_session` hard-codes `coalesce(...,1)` |
| program_id | bigint FK | yes | complete_session (from appt), self path (vrcc) | |
| residence_id / residency_id | bigint FK | yes | residence RPC only | CHECK: `recovery_residence` context ⇒ residence_id present |
| delivery_context | enum(7) | no | all | `vrcc, recovery_residence, community_outreach, justice_reentry, partner_site, virtual, other` |
| modality | enum(6) | no | all | `in_person, video, phone, chat, self_directed, group` |
| started_at / ended_at | timestamptz | no / yes | all | ended derived from duration where given |
| outcome_status | text (no CHECK) | yes | **nobody** | 0 rows non-null live |
| funding_source_id | bigint FK | yes | **nobody** | funding_sources table empty live |
| created_at | timestamptz | no | default | insert time (≠ started_at: attestation lag preserved) |
| appointment_id | bigint FK | yes | complete_session | **unique partial index** — structural idempotency |
| coaching_relationship_id | bigint FK | yes | complete_session | |
| navigation_relationship_id | bigint FK | yes | navigation RPC | |
| navigation_referral_id | bigint FK | yes | navigation RPC accepts it | **0 of 11 live rows use it** — UI never passes it |

RLS (live-verified, 3 policies): `service_events_insert_self` (INSERT: person=self, provider
null-or-self — **no type/attribution restriction**); `service_events_select_self` (participant
reads own); `service_events_staff` (staff read residence-attributed rows for their residences).
No UPDATE/DELETE policy exists ⇒ append-only and immutable to all client roles. Coaches and
navigators **cannot read back events they delivered** (their UIs read appointments/needs
instead — privacy-lean, documented limitation).

Indexes: person+started, context+started, program, residence, appointment (unique partial),
coaching_rel, navigation_rel, residency, service_type (0118:80-83).

## C. All writer paths (complete)

Four writers exist. No others (verified: grep of all `insert into … service_events` across repo;
0127/0128 write meetings/chores tables, never service_events).

| # | Path | UI origin | Wrapper | Write mechanism | Type | Provider | Linkage | Attribution | Idempotency | Self-insertable? | Enters reporting |
|---|---|---|---|---|---|---|---|---|---|---|---|
| W1 | Participant self-record | Check-in flows, Pulse, BARC-10 | `recordSelfServiceEvent` (serviceEvents.ts:44) called by checkIns.ts:36, pulse.ts:166, recoveryCapital.ts:54 | **direct table INSERT** via 0012 policy | `daily_check_in`, `recovery_capital_assessment` | null | none | org GFA, program vrcc-if-vrcc, no residence | **none** (retry ⇒ duplicate); best-effort try/catch — failure logged to console, row silently absent | yes (by definition) | admin evidence people_served/by_type; NOT Exhibit E (no residence_id) |
| W2 | Coach session completion | SessionsPage.tsx:24 | `completeSession` (navigation.ts:152) | RPC `complete_session` (0112:932, re-created 0113:225 — provider-or-platform-admin) | appointment's type (`coaching_session` live) | appointment provider | appointment_id + coaching_relationship_id | org `coalesce(appt.org,1)`; program from appt; context **derived from modality** (video/phone/chat→`virtual` else `vrcc`); no residence | **structural** (unique appointment_id index + status check + unique_violation catch) — sound | no | admin evidence; supervision only if residence-attributed (never is) |
| W3 | Navigator service attestation | NavPersonPage via useNavigatorWorkspace.ts:227 | `recordNavigationServiceEvent` (navigation.ts:140) | RPC `record_navigation_service_event` (0112:877) — requires active navigation relationship | `resource_navigation` | navigator | navigation_relationship_id (+ referral_id accepted, **never passed by UI**) | org from relationship; caller-chosen context (default vrcc) + modality (default phone); no residence, no program | **exact `started_at` equality** — weak | no | admin evidence; NOT Exhibit E |
| W4 | Residence staff support | ResidentsPage.tsx:121 | `recordResidenceSupportServiceEvent` (residenceSupport.ts:35) | RPC `record_residence_support_service_event` (0115:867) — staff-of-residence or platform admin, requires active residency | `residence_recovery_support` | staff member | residence_id + residency_id | org from residence; context `recovery_residence`; no program | **exact `started_at` equality** — weak | no | Exhibit E + supervision + admin evidence |

Timestamp behavior (all): `started_at` caller-supplied or now; `created_at` insert time —
attestation lag is preserved and must stay preserved (timeline provenance).

## D. All reporting consumers

| Reader | Where | Inclusion logic | Fixture filter | Known distortion |
|---|---|---|---|---|
| `admin_evidence_summary()` services block (0117:664-675, re-created 0132) | EvidencePage (admin/executive) | all events, all types | **yes** (`is_production_person`) | people_served mixes self-recorded engagement with staff-attested delivery — invisible today (0 self rows), wrong the day check-ins ship; funding rows structurally 0 (UI already hides them, P0-4) |
| Exhibit E compiler (exhibitEReport.ts:41) | staff ReportsPage | `residence_id = :residence` only, window 90d | **no** (RLS staff scope is the only guard; fixture residents at a real residence would count) | residents' VRCC coaching/navigation invisible (all such rows have null residence — *undercount for "services received by residents"*); self-inserted rows with forged residence_id would count (*overcount hole via W1 policy width*) |
| Supervision report (supervisionReport.ts:46) | staff ReportsPage | per-person, `started_at >= window`, RLS-visible rows | RLS only | staff see only residence-attributed rows ⇒ "participation history" omits VRCC services — **privacy-correct**, but the report label doesn't say so |
| Analytics views (0008; security_invoker since 0125) | **no frontend consumer** (docs only) | pass-through | none | shelf views; `analytics_service_events` exposes deprecated `outcome_status` |
| people_served view (0008:8) | none | any event ever | none | unused; superseded by evidence summary |

No justice/reentry report reads service_events yet (`justice_reentry` delivery_context has no
consumer). Duplicate risk live: one same-day duplicate pair exists in fixture data (W3/W4
timestamp-equality weakness demonstrated).

---

## E. Provenance recommendation

**Add one column: `source text NOT NULL` + CHECK, immutable, on `service_events`.** Every
row carries a defensible provenance value — there is no NULL/unknown/unclassified state
(FINAL RECONCILIATION): the backfill classifies every existing row under the documented
deterministic rules and the migration ABORTS if any row cannot be defensibly classified.
Every post-P2 writer sets `source` explicitly (enforced by the internal writer plus an
insert-time guard trigger; see the backfill rule below for the transition behavior). Values
(the complete, closed P2 vocabulary):

| Value | Meaning | Ladder rung of what it can evidence |
|---|---|---|
| `participant_self_reported` | the person recorded their own activity | ENGAGEMENT (never org delivery) |
| `staff_attested` | a human staff member claimed delivery occurred (identity in provider_person_id, lag visible in created_at−started_at) | ACTIVITY (delivered service) |
| `system_derived` | generated deterministically from another confirmed system fact (e.g. future: meeting attendance ⇒ participation event); the generating fact must be linked | does NOT independently establish external authority — only under the §O system-derived conditions |
| `partner_confirmed` | **RESERVED** — external partner attested. No writer exists or may be created until an approved partner-confirmation workflow exists | defined by the future governed workflow — never automatically GFA-delivered service |

**`imported` is deliberately NOT in this vocabulary** (FINAL RECONCILIATION): import is an
ingestion/transport mechanism, not an attestation authority — how a record *traveled* says
nothing about who attested the underlying fact. If data ingestion ever becomes necessary,
ingestion-channel tracking is modeled separately through explicitly governed ingestion
metadata (e.g. an import-batch reference), and each imported row still receives a real
attestation `source` from the source system's evidence — or the import is refused. Transport
and attestation are never mixed.

Rejected: a separate provenance table (over-engineering — provenance is a property of how the
row was born, 1:1, immutable); provenance on outcome records instead (outcomes already have
their own evidence discipline — `connection_evidence` + `verified_at` on referrals; goal
status is participant-owned; those stay where they are).

What actor+timestamp already answer: *who* and *when-lag* — they do not answer *by what
authority*, which is the reporting question. `provider IS NULL ⇒ self` is true today only
because the writer set is closed; `source` makes the closed-world assumption explicit and
survives its opening.

Immutability: already structural for clients (no UPDATE policy, no UPDATE in any RPC);
document as a contract, optionally pin with a `before update` guard trigger on the column.

Backfill (EXECUTIVE CORRECTION applied): **only by demonstrable writer provenance — writer
fingerprints — never solely by `provider_person_id IS NULL / NOT NULL`.** The fingerprints,
each recoverable from the closed set of writers that have ever existed:

- `appointment_id IS NOT NULL` ⇒ written by `complete_session` (the unique partial index
  guarantees this is the only path that sets it) ⇒ `staff_attested`;
- `navigation_relationship_id IS NOT NULL AND service_type = resource_navigation` ⇒ written
  by `record_navigation_service_event` ⇒ `staff_attested`;
- `residency_id IS NOT NULL AND service_type = residence_recovery_support` ⇒ written by
  `record_residence_support_service_event` ⇒ `staff_attested`;
- `provider_person_id IS NULL AND service_type IN (daily_check_in,
  recovery_capital_assessment) AND modality = self_directed` ⇒ written by the W1 direct-insert
  path (the 0012 policy is the only client insert path, and it forces person = actor) ⇒
  `participant_self_reported`;
- **anything else ⇒ the migration ABORTS** (raises inside the transaction, applying nothing):
  the unexpected row's shape is reported for executive review, no source is invented, and the
  architecture is not changed to accommodate it without that review (FINAL RECONCILIATION).

The 15 live rows all match the first two fingerprints (verified live 2026-08-21: 11 W3 +
4 W2), so the backfill classifies them `staff_attested` on writer evidence, not on a
provider-null heuristic — and `source` is set NOT NULL in the same migration, after the
backfill proves completeness. A fresh read-only fingerprint census is re-run immediately
before the live apply; the in-migration abort check is the backstop at the moment of mutation.

Transition behavior (no participant dead end, no NULL rows): while pre-P2 writers remain
live during the staged cutover, the BEFORE-INSERT guard trigger stamps a sourceless insert
under the same demonstrable-provenance fingerprints used for backfill — the W1 direct-insert
shape → `participant_self_reported` (RLS guarantees only the self path reaches a direct
insert), a staff-writer fingerprint → `staff_attested` (covers pre-0134 RPC bodies) — and
RAISES for any insert matching no fingerprint. The trigger fires before the NOT NULL
constraint is evaluated, so no NULL ever lands. After the cutover completes, the trigger
tightens to require an explicit `source` from every writer.

## F. Idempotency recommendation

Three-layer strategy, matched to writer class:

1. **Appointment-anchored events (W2): keep the structural unique index.** It is the correct
   design; no change.
2. **Ad-hoc attestations (W3, W4) and self-records (W1): caller-supplied idempotency key.**
   Add nullable `dedupe_key uuid` + partial unique index
   `(provider_person_id, dedupe_key) where dedupe_key is not null` (self path: person_id
   substitutes as owner in the RPC). The UI generates one key per form submission; a retry of
   the same submission is one event; a second deliberate recording (same person, same day,
   two real phone calls) is a new key and a new event. **This deliberately does NOT make
   repeated same-day human contact impossible** — that was the flaw in the timestamp approach
   at day granularity, and the flaw in the current approach at instant granularity (retries
   duplicate).
3. **Self-record events additionally anchor to their feature row** where one exists (a
   check-in event derives from a check_ins row; BARC event from an assessment row) — the RPC
   sets dedupe_key deterministically from the feature row identity, so one check-in can never
   yield two events.

Retire the `started_at =` equality checks when the RPCs gain dedupe_key (keep as a secondary
belt during transition). Rejected: composite natural keys on (person, type, provider, day) —
they encode the false rule that two real contacts a day cannot happen; server-generated
operation IDs — they protect nothing the client key doesn't, and the client is where the retry
originates.

## G. Delivery-context / modality decision (semantic model only — no vocabulary change yet)

Confirmed conflation. Clean semantics:

- **`modality` = HOW the contact happened** (channel): `in_person, video, phone, chat,
  self_directed, group`. Already correct as-is.
- **`delivery_context` = WHERE/UNDER WHAT PROGRAM SETTING the service is attributed**:
  `vrcc, recovery_residence, community_outreach, justice_reentry, partner_site, other`.
  **`virtual` does not belong** — a video coaching session is still a VRCC service; the
  channel is already captured by modality.

Findings: `virtual` in the enum is a HOW value inside the WHERE vocabulary; `complete_session`
actively derives context from modality (0112:975-976), so all 4 live coaching events lost
their program setting to `virtual`. The values in the directive's list that don't exist in the
enum (`residence`, `community`, `phone`, `in_person`) confirm the enum itself is mostly
place-shaped — the defect is the one value plus the derivation site.

P2 action (when authorized): stop *writing* `virtual` (complete_session uses the appointment's
program setting, default `vrcc`); keep the enum value for history (never rewrite the 4 rows);
reporting treats `virtual` as `vrcc` in a labeled lens. No enum surgery.

## H. Residence attribution decision

**Rule: `residence_id` states who DELIVERED under residence programming — it is never derived
from where the participant sleeps.**

- Attribute residence when: residence staff deliver in their residence role (W4 — already
  correct), residence programming events (house meetings if ever event-ized).
- Never attribute when: VRCC coaching/navigation happens to reach a resident. The existing
  NULLs are semantically correct. Auto-deriving from active residency would fabricate
  attribution and double-claim VRCC work for the house — rejected.
- Attribution is chosen explicitly by the writer, immutable after insert (append-only table).
- The undercount is fixed in *reporting* (RATIFIED, two lenses):
  **A. RESIDENCE-DELIVERED SERVICES** — services actually delivered under the residence
  program / residence attribution (`residence_id`);
  **B. SERVICES RECEIVED DURING RESIDENCY** — GFA services received by a participant while an
  active residency existed, regardless of who delivered them (person + residency-window join).
  Attribution is never mutated to produce lens B; the lenses are never summed as though
  mutually exclusive; every report using either exposes its operational definition.

## I. Program / organization / funding attribution decision

| Field | Disposition |
|---|---|
| `organization_id` | **Derivable, keep required.** Single-org reality (GFA=1 is the only row). Fix the `coalesce(v_a.organization_id, 1)` hard-code in complete_session to an explicit lookup — latent multi-org bug, zero live impact today. |
| `program_id` | **Selected/inherited, nullable.** W2 inherits from appointment (correct); W1 sets vrcc for vrcc context (acceptable); W3/W4 leave null (navigation and residence support aren't program-enrolled services yet — null is honest). No backfill. |
| `residence_id`/`residency_id` | Per §H: explicit writer choice, W4-style derivation from the *staff member's authority + active residency* only. |
| `funding_source_id` | **Leave null everywhere.** `funding_sources` is empty live; no workflow assigns funding; EvidencePage already refuses to publish the structural zero (P0-4). Populating it to make metrics look complete is prohibited: **a null is better than fabricated attribution.** Wire only when a real funding-attribution workflow (with a human chooser) exists. |

## J. Service-type disposition

14 live rows, one category set (0005:12-16). Live usage: `resource_navigation` 11,
`coaching_session` 4, all others 0.

| Key | Disposition | Rationale |
|---|---|---|
| `navigation` | **DEPRECATE** (`is_active=false`, row kept, history untouched) | confirmed duplicate of `resource_navigation` (0112:873 added the wired one); zero events; two keys for one meaning invites split counts |
| `resource_navigation` | KEEP | the wired navigation attestation type |
| `support_request` | **DEPRECATE** (RATIFIED — event type only; the request workflow/concept is untouched; no replacement "responded_to_request" type) | a request is not a delivered service; requests live in `support_requests`; the human/system response creates the appropriate actual service event (coaching, navigation, peer support, residence support). Zero events. Keeping it invites counting asks as delivery. |
| `coaching_session`, `peer_support`, `mentoring`, `accountability`, `recovery_circle`, `residence_recovery_support`, `community_event`, `education_module` | KEEP (staff/system-recordable delivery types) | real service taxonomy; several await writers ("wire before rebuilding" applies later, not in P2) |
| `daily_check_in`, `recovery_capital_assessment`, `recovery_practice` | KEEP (participant-self class) | engagement-rung activity; must be labeled as such in reporting (§O) |

Domain mappings: P1 deliberately did **not** map service types to domains (service type ≠
domain; navigation events carry domain through their need/loop). No P2 change.

No historical rows deleted, ever; deprecation is `is_active=false` + comment.

## K. Participant self-insert boundary

Principle: **a participant may self-record what they themselves did (their own activity /
engagement); only staff or system may record what GFA delivered.**

Self-recordable (participant authority, ENGAGEMENT rung — **RATIFIED LIST, closed for P2**):
`daily_check_in`, `recovery_capital_assessment`, `recovery_practice`. Self-reported
meeting/community participation is deliberately NOT added in P2 — it is a valid future
participant/community-engagement concept requiring its own design under the P1
Recovery ≠ Community decision. Participant self-recording means the participant records what
THEY did; it must never silently become "GFA delivered this service."

Staff/system-only (delivery claim, ACTIVITY rung): `coaching_session`, `peer_support`,
`mentoring`, `accountability`, `recovery_circle`, `resource_navigation`,
`residence_recovery_support`, `community_event` (facilitation), `education_module` (delivery).

Current defect: the 0012 policy enforces none of this and also leaves `residence_id`,
`program_id`, `organization_id`, `delivery_context` free — the forged-attribution hole (§A.2).

Recommended repair (phased):
1. Route W1 through a definer RPC `record_my_activity(type, context, feature-anchor)` that
   whitelists self types, forces `provider=null`, `source='participant_self_reported'`,
   `residence_id=null`, org=GFA, sets dedupe_key from the feature row.
2. Then narrow policy `service_events_insert_self` with a type whitelist + null-residence
   check (compatibility belt), and finally drop it once all clients call the RPC.
This also fixes W1's silent-loss risk: the RPC runs in-band, and the wrapper keeps feature-row
priority (check-in saves even if attribution fails) but surfaces the failure to telemetry.

## L. Relationship / referral / appointment linkage

**Relationship linkage rule: link when a canonical relationship causally generated the event;
never require one.** Current writers already comply (W2→coaching_relationship from the
appointment; W3→navigation_relationship it authorized under; W4→residency). Drop-in services
with no formal relationship stay linkage-free — correct. Support-team membership is a
derivation, not a link target. No schema change needed.

**Referral linkage:** `navigation_referral_id` exists and works but the UI never passes it —
0 of 11 live navigation events are referral-linked, so the future timeline cannot connect "the
navigator worked this referral" to "this contact happened." P2 action: NavPersonPage's service
attestation gains an optional "this contact was about…" referral picker (pass-through of the
existing parameter; no schema change).

**Separation preserved (unchanged doctrine):**
- REFERRAL = activity (a row in navigation_referrals; its `status` walk is loop state);
- CONNECTION = evidence-gated state (`connected` requires `connection_evidence`, 0113/0126);
- SERVICE EVENT = support delivered (this table).
A warm-handoff completion is a referral state transition **plus** (optionally) the navigation
service event that performed it. Not double-counting: connections and service counts are
different metrics and are never summed; the referral-linked event makes the pair auditable
rather than duplicative.

**Appointment chain (audited live: 6 appointments, 4 completed, each with exactly one event;
0 no-shows, 0 cancellations recorded yet):**
- Completed session ⇒ exactly one service event: **keep** (structural).
- No-show ⇒ appointment status `no_show` (exists in the status CHECK), **never a service
  event** — nothing was delivered. Reporting may count no-shows from appointments.
- Cancelled ⇒ status only, never an event. Current behavior already correct (complete_session
  refuses non-confirmed).
- Optional post-session capture: see §M — via follow-up creation, not event columns.

## M. Optional micro-capture recommendation

**Recommendation: no new persistence in P2.** The two ratified questions map onto existing
structures:

- **"What happens next?"** → the existing `follow_ups` machinery (due dates, notifications,
  today-view surfacing — already wired end-to-end). P2 action is UI-only: after
  session/service attestation, offer an optional one-tap "schedule a follow-up" (creates a
  follow_up linked to the person/relationship). Structured, actionable, consumed — the best
  possible continuity capture already exists; wire it, don't duplicate it.
- **"What moved?"** → where movement is real it already has a home: need status change,
  referral outcome, goal progress — each evidence-gated. Attach the optional prompt to those
  actions in the same post-attestation moment (e.g. "did a need move? update it"), rather than
  persisting a parallel narrative.

Compared and rejected for P2: short text fields on service_events (drifts toward case notes;
privacy surface; unreadable by machine); a separate event-detail table (defensible future
shape *if* narrative is ever mandated — strict RLS, participant-readable by default — but no
current consumer justifies it); structured outcome codes on events (re-invents outcome_status).
Minimum sufficient documentation = linkage + follow-up, both existing.

## N. outcome_status disposition

Unused (0 of 15 rows), unconstrained (bare text), unread (only passed through an unconsumed
analytics view), and semantically hazardous — an "outcome" slot on an activity row is the
ladder violation in column form. It cannot be wired without inventing meaning.

**Disposition: DEPRECATE.** Comment the column deprecated (like `resources.category`), exclude
it from the post-P2 semantic model and from `analytics_service_events` when that view is next
touched, never write it. Outcomes live where evidence gates them: referral connection state,
need resolution, goal status, residency completion. Column physically dropped only in a later
cleanup phase, never rewritten.

## O. Reporting-authority model (EXECUTIVE CORRECTION applied — renamed)

The three-level distinction is ratified; the "Class A/B/C" names are **rejected** — GFA's
Institutional Evidence Ledger already carries Evidence Classes A–F with entirely different
meanings, and RecoveryOS must not create a second A/B/C system. The reporting-authority
model uses semantic machine keys:

| Reporting authority (key) | Source values mapped in | May support | Must never be presented as |
|---|---|---|---|
| **`organizationally_attested`** | `staff_attested` | external claims: "GFA delivered N services", Exhibit E, funder reports | participant outcome |
| **`participant_reported`** | `participant_self_reported` | "N participants actively engaging", retention/engagement signals | GFA-delivered service, ever — unless the metric name says "participant-reported" |
| **`system_derived`** | `system_derived` | see the authority conditions below — labeled deterministic derivation | independent evidence |
| *(future)* partner-confirmed activity | `partner_confirmed` | defined by the future governed partner workflow, according to the underlying evidence | GFA-delivered service, automatically — partner confirmation is never auto-folded into `organizationally_attested` |

**`system_derived` authority conditions (FINAL RECONCILIATION §C):** deterministic system
derivation does not independently establish external reporting authority. A system-derived
event may support an externally reportable claim only when (1) the generating fact is itself
authoritative, (2) the derivation is deterministic and traceable to that fact, and (3) the
metric's operational definition explicitly permits that use. Otherwise system-derived
aggregates are internal/labeled activity only.

**Event source and reporting authority are related but not identical layers.** `source`
describes how one row entered institutional record; reporting authority describes what an
aggregate over such rows may claim. The mapping above is the canonical translation;
`partner_confirmed` acquires its reporting authority only when the approved workflow defines
the underlying evidence — never by assumption.

Binding rules: external service-delivery claims draw from `organizationally_attested` only,
fixture-filtered (`is_production_person`), with period and operational definition attached.
The `admin_evidence_summary` services block splits authorities the day `participant_reported`
rows exist. Exhibit E gains an explicit `source = 'staff_attested'` filter so the §A.2 hole is
closed at the report too, not just at the write path. Ladder mapping:
`organizationally_attested` events = ACTIVITY; `participant_reported` = ENGAGEMENT;
CONNECTION and above never come from this table.

### O-G. Governance rule: event source is not Institutional Evidence Class

**RecoveryOS event provenance/`source` describes individual record origin. The GFA
Institutional Evidence Ledger A–F classification describes institutional evidence authority.
They are different layers. Neither vocabulary impersonates the other.** The Ledger may later
classify a generated RecoveryOS aggregate independently under its own A–F governance taxonomy;
RecoveryOS never emits "Class A/B/C…" language of its own, and Ledger classes never appear as
row-level values in RecoveryOS.

## P. Evidence-Ledger compatibility (aggregate-only)

Each exported aggregate carries: metric key; operational definition (human sentence); period
(start/end, timezone rule); method (source tables, filters, dedup rule); evidence class
(§O class + ladder rung); provenance (which `source` values included; fixture exclusion
stated); generated_at + generating function version. The post-P2 spine provides everything
needed (immutable rows, `source`, `started_at` vs `created_at`, type, attribution) — the
ledger integration itself is a later phase that reads **only** definer aggregate functions.
Development never receives row-level access, individual narratives, or person identifiers;
no new read path for Development is created in P2.

## Q. Privacy / RLS assessment

Current posture is sound and mostly stays: participants read their own rows; residence staff
read residence-attributed rows only (residents' VRCC services stay invisible to house staff —
correct data minimization; the supervision report should *say* its scope rather than imply
completeness); admin/executive read aggregates via definer RPCs only; no client UPDATE/DELETE
anywhere (append-only stands).

Changes proposed, all narrowing or neutral except one:
- **Narrowing:** self-insert policy restricted then removed (§K) — the only genuine widening
  risk in P2 is *not* doing this.
- **Neutral:** RPC writers already definer-gated; dedupe/provenance columns add no read surface.
- **One widening (RATIFIED, narrowly):** a `provider_person_id = current_person_id()` SELECT
  policy so providers read exactly the events they personally attested — the principle is
  actor identity, never "role = coach therefore read broad participant history."
  Relationship-wide service-event visibility remains a later explicit design decision.
  Required tests before ship: positive provider-self read; negative cross-provider read;
  participant-own read unchanged; residence-staff boundary unchanged; unknown-authenticated
  identity reads zero rows.

Consent: service events record service facts, not disclosures; no consent-gated content is
added (and §24's boundary keeps it that way). Cross-role leakage: none found; navigation
events are invisible to residence staff and vice versa unless residence-attributed.

## R. Proposed post-P2 `service_events` semantic model

| Field | Meaning | Source | Req | Mutable | User-visible | Reporting authority | Privacy |
|---|---|---|---|---|---|---|---|
| id | identity | db | ✓ | never | via own-row reads | — | — |
| person_id | who received/did | writer | ✓ | never | self | denominator | scoped by RLS |
| service_type_id | what kind | writer (whitelist per source class) | ✓ | never | label only | by_type | low |
| **source** *(new)* | how this became evidence | writer, CHECK enum §E (4 values, NOT NULL) | ✓ | **never** | no (drives labels) | **reporting-authority selector** | low |
| provider_person_id | who attested/delivered | RPC identity | staff sources | never | staff name only where role-appropriate | organizationally_attested actor | medium — display-name rules apply |
| organization_id | delivering org | derived | ✓ | never | no | org claims | low |
| program_id | program setting | inherited/selected | opt | never | no | program rollups | low |
| residence_id / residency_id | residence-delivered attribution (§H) | writer authority | opt | never | staff | residence reports | medium |
| delivery_context | WHERE/setting (§G; `virtual` deprecated value) | writer | ✓ | never | no | context rollups | low |
| modality | HOW/channel | writer | ✓ | never | no | modality rollups | low |
| started_at / ended_at | when service occurred | writer | ✓ / opt | never | self ("your activity") | period bucketing | low |
| created_at | when attested | db | ✓ | never | no | attestation-lag audit | low |
| **dedupe_key** *(new)* | idempotency anchor (§F) | client/RPC-derived | opt | never | no | none | none |
| appointment_id | generating appointment | RPC | opt | never | indirectly | chain audit | low |
| coaching_relationship_id / navigation_relationship_id | generating relationship | RPC | opt | never | no | relationship lens (P7 timeline) | medium |
| navigation_referral_id | referral this contact served | RPC (UI pass-through added) | opt | never | no | referral↔service audit | low |
| outcome_status | **DEPRECATED** — never write | — | — | — | no | none | — |
| funding_source_id | funding attribution | future workflow only | opt (null) | never | no | funder split when real | low |

Every field immutable after insert: corrections happen by amendment (future: a void/replace
RPC that preserves the original — not in P2 scope), never by edit. Timeline provenance (§19 of
the directive) is satisfied: who (person/provider), what (type), when (started/created), how
(modality), where (context/residence), source (provenance), linked loop (via
referral→need), linked relationship, linked appointment; state movement stays on the state
tables the event links to — the timeline joins, it does not duplicate.

## S. Migration strategy (when authorized — nothing applied now)

All additive; historical rows never rewritten; provenance is classified only under
documented deterministic rules, and a migration aborts rather than guess.

- **0133_service_event_provenance**: add `source text` + CHECK (the four-value closed
  vocabulary — no `imported`); deterministic backfill by the §E writer fingerprints (rule
  documented in-migration); **ABORT if any row remains unclassified**; set NOT NULL after the
  backfill proves completeness; add `dedupe_key uuid` + partial unique index; comment
  `outcome_status` DEPRECATED. Rollback: drop the two columns + index.
- **0134_canonical_event_writer**: re-create the three RPCs (complete_session,
  record_navigation_service_event, record_residence_support_service_event) over one internal
  `record_service_event_internal` (§7 option B — see T); they stamp `source`, accept
  `p_dedupe_key`, keep every existing check; complete_session stops deriving context from
  modality and drops the org hard-code. New `record_my_activity` RPC (§K). Grants:
  authenticated EXECUTE on wrappers only; internal function unexported. Rollback: re-create
  0113/0112/0115 bodies.
- **0135_self_insert_boundary**: narrow `service_events_insert_self` (type whitelist +
  forced-null attribution) as the compatibility belt; frontend switches W1 to the RPC in the
  same release; policy dropped in a later migration once telemetry shows zero direct inserts.
  Rollback: restore 0012 policy text.
- **0136_reporting_corrections**: `is_active=false` on `navigation`, `support_request`;
  evidence-summary services block splits reporting authorities and the resident-window lens lands beside
  the residence lens (0132 pattern: add beside, never replace); preflight step-8 list gains
  the new RPCs. Rollback: re-run prior bodies.

Deployment order: 0133 → 0134 → frontend release (wrappers + dedupe keys + referral picker +
follow-up prompt) → 0135 → 0136; full 9-step preflight after each apply; every step keeps old
clients working until the switch is complete.

## T. Implementation sequence (smallest safe steps)

1. **P2.1 — Semantic lock**: promote this document's §E–§R decisions to
   `docs/architecture/` (the P1.1 pattern); CI guard pinning the `source` CHECK list and the
   authority-class table against the doc.
2. **P2.2 — Provenance + idempotency columns** (0133): pure additive schema + deterministic
   backfill. *(Reordered ahead of the shared writer — the writer must stamp `source`, so the
   column lands first; the directive's suggested order is otherwise kept.)*
3. **P2.3 — Shared writer** (0134): §7 option **B** — one internal definer function owning
   validation (source stamping, dedupe, attribution rules, type whitelists per role) under
   role-specific wrappers that keep their narrow authorization checks. Rejected: option A
   (one universal RPC — collapses role authorization into parameter soup), option C (status
   quo — three copies of validation already drifted once: 0113 had to re-create
   complete_session to fix its admin check).
4. **P2.4 — Attribution corrections**: context-derivation fix, org-lookup fix, referral
   pass-through UI, follow-up micro-capture prompt.
5. **P2.5 — Self-insert restriction** (0135 + W1 reroute).
6. **P2.6 — Evidence/reporting corrections** (0136 + EvidencePage class labels + Exhibit E
   `staff_attested` filter + resident-window lens + supervision scope label).
7. **P2.7 — Timeline/loop linkage prep**: verify every writer emits full linkage; document
   the timeline join contract for P7. No timeline built.

Each step: separable commit, tests, guards, preflight on live applies, STOP-capable.

## U. What not to build (P2 boundary)

No parallel generic events table. No psychotherapy/case notes, trauma narratives, character
judgments, or free-text columns on events. No emotion inference or engagement surveillance.
No staff-productivity rankings (provider_person_id aggregates by provider are for evidence
audit, not league tables — no such report gets built). No auto-derived events from message
activity or page views (Grace interactions are never service events — locked doctrine). No
mandatory capture fields. No funding backfill. No BARC-linked event outcomes. No timeline UI
(P7). No enum surgery on delivery_context. No deletion of any historical row or type.

## V. Executive Director decisions — ALL RESOLVED (P2 Executive Ratification, 2026-08-22)

1. **Self-recordable type list (§K).** DECIDED: `daily_check_in`,
   `recovery_capital_assessment`, `recovery_practice` only. Self-reported meeting/community
   participation is excluded from P2 (future deliberate design under Recovery ≠ Community).
2. **`support_request` service-type deprecation (§J).** APPROVED as an event type; the
   request workflow/concept is untouched; NO replacement "responded_to_request" type.
3. **Reporting-authority model (§O).** RATIFIED with naming correction:
   `organizationally_attested` / `participant_reported` / `system_derived` — never "Class
   A/B/C" (Institutional Evidence Ledger collision). Participant-reported metrics must say so
   in every external artifact.
4. **Resident-window residence reporting (§H).** APPROVED: two separately labeled lenses,
   operational definitions exposed, never summed, never produced by mutating attribution.
5. **Provider self-read policy (§Q).** APPROVED narrowly: `provider_person_id = actor` only,
   never role-wide participant history; full positive/negative test matrix required;
   relationship-wide visibility remains a later explicit design decision.

---

*RATIFIED architecture. Implementation plan: `docs/plans/p2-implementation-plan.md`.
No migration created, no schema/RLS/service-type/reporting change made, no CQCX mutation
performed. Implementation awaits separate authorization.*
