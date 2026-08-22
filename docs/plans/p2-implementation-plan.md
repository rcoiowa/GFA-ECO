# P2 Implementation Plan — Service Event, Provenance & Evidence Integrity

**Status: PLAN ONLY — awaiting implementation authorization.** Executes the RATIFIED
architecture (`docs/plans/p2-service-event-provenance-proposal.md`, ratified 2026-08-22 with
executive corrections). Nothing below has been applied; migration numbers 0133–0137 are
reserved by this plan.

Standing constraints carried into every phase: additive-first; historical rows never
rewritten; unknown provenance stays NULL; no enum surgery; no parallel events table; no
free-text case-note columns; `funding_source_id` stays NULL; least privilege — the internal
writer is never a public RPC; the participant direct-insert path survives until the
replacement is deployed and verified (no participant dead end); pre-mutation checklist +
full 9-step (becoming 10-step) preflight around every live apply; every phase separately
committable and STOP-capable.

---

## P2.1 — Semantic / governance lock + CI guard

**Files**
- `docs/architecture/service-event-provenance-v1.0.md` (new) — canonical record: source
  vocabulary + immutability + NULL-is-unknown rule; writer-fingerprint backfill rule;
  reporting-authority model (`organizationally_attested` / `participant_reported` /
  `system_derived`) + source→authority mapping; the O-G rule (event source ≠ Institutional
  Evidence Ledger class); idempotency contract (one human action → one dedupe key);
  modality=HOW vs delivery_context=WHERE; residence-attribution rule + two reporting lenses;
  self-recordable type list (closed); appointment doctrine; what-not-to-capture boundary.
- `docs/plans/p2-service-event-provenance-proposal.md` — banner pointing at the architecture
  doc (audit trail, P1.1 pattern).
- `packages/domain/src/serviceProvenance.ts` (new) — `SERVICE_EVENT_SOURCES` (5 keys),
  `REPORTING_AUTHORITIES` (3 keys + display labels: "Organizationally attested service
  activity", "Participant-reported engagement", "System-derived activity"),
  `reportingAuthorityForSource(source)` mapping, `SELF_RECORDABLE_SERVICE_TYPES` (3 keys).
  Exported from `packages/domain/src/index.ts`.
- `packages/domain/src/serviceProvenance.test.ts` (new) — pins: 5 sources; mapping
  staff_attested→organizationally_attested, participant_self_reported→participant_reported,
  system_derived→system_derived; partner_confirmed/imported have NO mapped authority (throws
  or returns null — reserved); self-recordable list exactly the 3 ratified keys; no label
  contains "Class A/B/C".
- `scripts/verify-service-provenance.mjs` (new) + `.github/workflows/ci.yml` step — pins the
  0133 CHECK value list ↔ TS `SERVICE_EVENT_SOURCES` ↔ architecture doc; asserts the
  self-recordable whitelist matches in 0134's `record_my_activity` body and TS; asserts the
  internal writer is revoked from authenticated in 0134; greps reporting UI for banned
  "Class A/B/C" evidence labels.

**Schema / RLS / live**: none. **Tests**: the new domain tests + guard self-test (negative:
mutate a source key locally → guard fails). **Rollback**: revert commit. **Gate**: guards +
typecheck + suite + build green locally and in CI.

## P2.2 — Provenance + dedupe foundation (migration 0133)

**File**: `supabase/launch/migrations/0133_service_event_provenance.sql`

**Schema changes (additive)**
- `alter table recoveryos.service_events add column if not exists source text
  check (source in ('participant_self_reported','staff_attested','system_derived',
  'partner_confirmed','imported'))` — **nullable**: NULL = explicitly unknown historical
  provenance (ratification §2.D).
- `add column if not exists dedupe_key uuid`.
- Expression unique index:
  `create unique index service_events_dedupe_uidx on recoveryos.service_events
  ((coalesce(provider_person_id, person_id)), dedupe_key) where dedupe_key is not null`
  — scopes the key to the acting owner (provider for staff writes, person for self writes).
- `comment on column recoveryos.service_events.outcome_status` → DEPRECATED (never wire;
  physical drop only under a later separately reviewed cleanup).
- Guard trigger `service_events_provenance_guard` (before insert or update):
  - INSERT with `source` set → pass through (writer-stamped).
  - INSERT with `source` NULL → transition stamping: if the row matches the W1 direct-insert
    fingerprint (`person_id = recoveryos.current_person_id()`, `provider_person_id` null,
    service type in the ratified self list, modality `self_directed`) → set
    `source := 'participant_self_reported'` (deterministic: RLS makes the self path the only
    client direct insert); otherwise RAISE — no sourceless institutional record.
  - UPDATE changing `source` or `dedupe_key` → RAISE (immutability, ratification §2.B).
- **Backfill by writer fingerprint only** (ratification §2.D — never provider-null alone):
  `appointment_id is not null` → `staff_attested`;
  `navigation_relationship_id is not null and service_type = resource_navigation` →
  `staff_attested`; `residency_id is not null and service_type =
  residence_recovery_support` → `staff_attested`; W1 fingerprint → 
  `participant_self_reported`; else leave NULL (explicit unknown).
- Header ROLLBACK: drop trigger + function, drop index, drop both columns, restore
  outcome_status comment to null.

**RLS/RPC/UI**: none in this phase. **Compatibility**: W1 direct inserts keep working (the
trigger stamps them); all RPCs keep working (source NULL → but wait: RPC inserts run before
0134 re-creates them, so their inserts arrive sourceless and do NOT match the W1 fingerprint —
the trigger would RAISE.) **Therefore the trigger's RAISE branch is deferred**: in 0133 the
non-matching sourceless branch stamps `staff_attested` **only when the insert carries a
staff-writer fingerprint** (appointment_id / navigation_relationship_id+type /
residency_id+type — the same demonstrable-provenance rule applied at insert time) and RAISEs
only when no fingerprint matches. 0137 tightens it to require explicit source once all
writers stamp. This keeps 0133 independently deployable with zero writer changes.

**Tests**: extend guard script (0133 parsed: CHECK list, fingerprint backfill present, no
provider-null-only rule). **Live CQCX checks (at apply)**: pre-mutation checklist; post-apply:
15 rows classified `staff_attested`, 0 `participant_self_reported`, 0 NULL (all current rows
carry fingerprints — verified 2026-08-21); trigger present; unique index present; e2e temp-
table probe: direct self-insert of `daily_check_in` as unknown-authenticated fixture identity
gets stamped `participant_self_reported`; UPDATE of source → error. Preflight run (unchanged
steps must stay green — no privilege change in 0133). **Deploy order**: first live change of
P2. **Rollback**: header script; safe while nothing reads `source` (P2.6 is the first reader).

## P2.3 — Shared internal event writer + role-specific wrappers (migration 0134)

**File**: `supabase/launch/migrations/0134_canonical_event_writer.sql`

**Function changes**
- New `recoveryos.record_service_event_internal(...)` — SECURITY DEFINER, **revoked from
  public, anon, AND authenticated** (never a client RPC; wrappers only). Owns canonical
  validation: source required + CHECK-valid; dedupe key uniqueness (insert … on conflict on
  the dedupe index → return existing id with `already_recorded`); service-type
  active/whitelist per caller class; attribution rules (residence pair complete-or-absent —
  existing CHECK stays the backstop; org resolved by lookup, **no `coalesce(org,1)`
  fallback**); linkage pass-through; timestamp normalization (`ended_at` from duration);
  never touches `outcome_status`/`funding_source_id`. Authorization facts (who may write what
  for whom) are supplied by the wrappers, which keep their existing checks.
- Re-create wrappers over the internal writer, same names, same authorization logic,
  stamping source + accepting dedupe:
  - `complete_session(p_appointment_id, p_duration_minutes)` — signature unchanged
    (structural appointment idempotency retained; no dedupe param needed); stamps
    `staff_attested`; **stops deriving delivery_context from modality** (P2.4 semantic: uses
    the appointment's program setting, default `vrcc`; modality passes through); org by
    explicit lookup.
  - `record_navigation_service_event(..., p_dedupe_key uuid default null)` — old signature
    dropped first (PostgREST overload safety); stamps `staff_attested`; keeps
    relationship/referral checks; timestamp-equality check retained as secondary belt during
    transition, removed in 0137.
  - `record_residence_support_service_event(..., p_dedupe_key uuid default null)` — same
    pattern.
  - New `record_my_activity(p_service_type_key text, p_delivery_context, p_started_at
    timestamptz default now(), p_dedupe_key uuid default null)` — participant self path:
    person = `current_person_id()`, provider forced NULL, source
    `participant_self_reported`, residence/residency forced NULL, org GFA lookup, modality
    `self_directed`, type restricted to the ratified whitelist
    (`daily_check_in`, `recovery_capital_assessment`, `recovery_practice`); returns
    `{ok, code, service_event_id}` envelope.
- Grants: EXECUTE to authenticated on the four wrappers; explicit revoke on the internal
  writer verified in-migration.

**Tests**: data-access wrapper tests (rpc names/params); guard script asserts internal-writer
revoke text + wrapper source stamping. **Negative tests (live, temp-table pattern at
apply)**: authenticated cannot execute `record_service_event_internal` (42501);
`record_my_activity` with `coaching_session` → refused envelope; same dedupe key twice → one
row + `already_recorded`; two distinct keys same person/day → two rows (legitimate repeat
contact preserved). **Preflight modifications** (same commit): step 8 list gains
`record_navigation_service_event`, `record_residence_support_service_event`,
`record_my_activity`; **new step 10**: `record_service_event_internal` must NOT be executable
by anon or authenticated (negative privilege assertion, the §39 pattern inverted). **Live
checks**: preflight 10 steps green; prosrc probes confirm no `coalesce(...,1)` and no
modality→context derivation remain in `complete_session`. **Compatibility**: old frontends
calling the previous 3-arg/4-arg signatures keep working where signatures are unchanged
(complete_session) and break nowhere else because dropped signatures are replaced in the same
transaction with defaulted parameters covering the old call shapes. **Rollback**: re-create
0113/0112/0115 wrapper bodies (scripts embedded in the migration header), drop internal
writer + `record_my_activity`; preflight step-8/10 edits reverted by commit revert.

## P2.4 — Attribution / modality corrections + frontend idempotency

**Files**: `apps/platform/src/coach/pages/SessionsPage.tsx`,
`apps/platform/src/navigator/hooks/useNavigatorWorkspace.ts` (+ NavPersonPage),
`apps/platform/src/staff/pages/ResidentsPage.tsx`,
`packages/data-access/src/repositories/navigation.ts`, `residenceSupport.ts`.

**Changes**
- Dedupe-key discipline (ratification §9): each attestation form generates
  `crypto.randomUUID()` **once per human action** (on form open / action initiation), holds
  it in component state, reuses it across retries of that submission, and regenerates only
  after confirmed success. No key churn on network retry; no same-day composite blocking.
- Wrappers pass `p_dedupe_key`.
- `complete_session` UI unchanged (structural idempotency).
- No delivery-context UI vocabulary change; writers simply stop emitting `virtual` (0134).
  Historical `virtual` rows are untouched; reporting lenses (P2.6) label-normalize reads.

**Tests**: component tests pinning one-key-per-action (retry reuses; success regenerates);
wrapper param tests. **Negative test**: simulated double-submit produces one recorded id.
**Live checks**: none (frontend release). **Compatibility**: frontend requires 0134 live
first. **Rollback**: revert commit (wrappers tolerate absent dedupe key). **Deploy gate**:
0133+0134 applied and preflight-green before this release ships.

## P2.5 — Participant self-record restriction + staged cutover (migration 0135, then 0137)

**Files**: `packages/data-access/src/repositories/serviceEvents.ts` (W1 reroute:
`recordSelfServiceEvent` → calls `record_my_activity` RPC; failure surfaces to telemetry, and
feature-row-first ordering is preserved — a check-in never fails because attribution failed),
`checkIns.ts` / `pulse.ts` / `recoveryCapital.ts` (unchanged call sites),
`supabase/launch/migrations/0135_self_insert_boundary.sql`, later
`supabase/launch/migrations/0137_self_insert_retirement.sql`.

**Staged cutover (ratification §20 — order is binding)**
1. **Replacement live**: 0134's `record_my_activity` applied and verified (P2.3).
2. **Frontend switched**: this phase's release routes all W1 traffic through the RPC.
3. **0135 (narrowing, not removal)**: re-create `service_events_insert_self` with the
   ratified boundary as a compatibility belt for stragglers:
   person = self AND provider NULL AND service type in the 3-key whitelist AND
   residence_id/residency_id NULL AND funding_source_id NULL. Old app versions doing
   legitimate self check-ins keep working; forged-attribution inserts die here.
   Also in 0135: **provider self-read policy** (ratified §7):
   `create policy service_events_provider_read on recoveryos.service_events for select to
   authenticated using (provider_person_id = recoveryos.current_person_id())` — actor
   identity only, no role test, no relationship-wide reach.
4. **Telemetry / zero-direct-insert gate**: direct inserts are distinguishable — RPC-written
   self rows carry `dedupe_key is not null`; trigger-stamped direct inserts carry
   `source='participant_self_reported' and dedupe_key is null and created_at > <0135 apply>`.
   Gate: **zero such rows for 14 consecutive days** (checked live, read-only).
5. **0137 (retirement)**: drop `service_events_insert_self`; tighten the provenance guard
   trigger to require explicit `source` on every insert (transition stamping removed);
   remove the retained timestamp-equality belts in the two ad-hoc wrappers.

**RLS test matrix (live, temp-table pattern, required by ratification §7 — run at 0135
apply)**: positive provider-self read (fixture navigator reads own 11 attested events);
negative cross-provider (fixture coach reads navigator's events → 0 rows); participant-own
read unchanged; residence-staff boundary unchanged (non-residence events invisible);
unknown-authenticated identity → 0 rows on every path; whitelist policy: self-insert of
`daily_check_in` OK, of `coaching_session` → 42501, with residence_id set → 42501.
**Rollback**: 0135 header restores the 0012 policy text and drops the provider-read policy;
0137 header restores the 0135 policy + transition trigger. **Compatibility**: no participant
dead end at any step — the direct path dies only after telemetry proves it idle.

## P2.6 — Service-type deprecations + reporting-authority corrections (migration 0136)

**Files**: `supabase/launch/migrations/0136_reporting_authority.sql`,
`apps/platform/src/admin/hooks/useAdminData.ts`,
`apps/platform/src/admin/pages/EvidencePage.tsx` (+ test),
`packages/data-access/src/repositories/exhibitEReport.ts`, `supervisionReport.ts`,
`apps/platform/src/staff/pages/ReportsPage.tsx`.

**0136 contents**
- `update recoveryos.service_types set is_active = false where key in
  ('navigation','support_request')` + comments (deprecated; historical rows untouched;
  `navigation` superseded by `resource_navigation`; `support_request` is a request state,
  not a delivery — RATIFIED §5/§13).
- Re-create `admin_evidence_summary()` services block (0132-pattern: add beside, never
  replace): `events_by_authority` — counts keyed `organizationally_attested` /
  `participant_reported` / `system_derived` / `unclassified` (NULL source stays visible,
  never absorbed); `people_served` gains the explicit definition "distinct people with
  organizationally attested service activity" and a separate
  `people_engaging_participant_reported` count — **no silent combination** (§17).
- New definer RPC `residence_service_lenses(p_residence_id, p_window_days)` — staff-of-
  residence or platform-admin gated; returns **aggregates only** (no rows): lens A
  (residence-delivered: `residence_id` match) and lens B (received-during-residency:
  person + residency-window join, all sources labeled by authority), each with its
  operational-definition string embedded in the payload. Aggregate-only design avoids any
  row-level RLS widening for residence staff (§6, §23).
- Preflight step 8 gains `residence_service_lenses`.

**TS/UI**
- Exhibit E: service-event query adds `source` to the select and filters
  `source = 'staff_attested'` for every delivery metric; block notes gain the operational
  definition + "organizationally attested" language; a separate labeled lens-B block renders
  from `residence_service_lenses`. Historical `virtual` context normalization happens here
  as a labeled read lens only.
- Supervision report: scope sentence ("residence-attributed services only; VRCC services are
  not shown here") — honest label, no data change.
- EvidencePage: services card splits by authority with the P1.6-style additive chips; the
  ladder badges stay; "unclassified" renders when present.

**Tests**: EvidencePage tests (authority split rendering; no "Class" strings; unclassified
visible); exhibitE compiler unit test with mixed-source fixture data (self rows excluded from
delivery metrics); guard script extended (authority keys pinned SQL↔TS↔doc). **Negative
tests (live)**: `residence_service_lenses` as non-staff → not_authorized envelope; as staff
of another residence → not_authorized. **Live checks**: preflight (10 steps); function prosrc
probes; evidence summary output carries the new keys with correct counts (15 staff_attested
fixture events → unclassified 0). **Rollback**: re-run 0132 body for the summary; re-activate
the two types; drop the lens RPC (header scripts). **Compatibility**: EvidencePage typing
optional-keyed (frontend-ahead-of-migration safe, P1.6 pattern).

## P2.7 — Linkage / read preparation for Loop & Timeline (no migration)

**Files**: `apps/platform/src/navigator/pages/NavPersonPage.tsx` (+ hook),
`apps/platform/src/coach/pages/SessionsPage.tsx`,
`docs/architecture/service-event-provenance-v1.0.md` (timeline join contract appendix).

**Changes**
- Referral pass-through: the navigator attestation gains an optional "this contact was
  about…" picker over the person's open referrals → `p_referral_id` (parameter has existed
  since 0112; UI never passed it — 0 of 11 live rows linked).
- Optional micro-capture per ratified §15: after a successful attestation/completion, an
  optional one-tap "schedule a follow-up" (existing `createFollowUp` path) and a link to the
  person's needs for state movement — **no new persistence, no text fields**.
- Timeline join contract documented for P7: who (person/provider), what (type), when
  (started_at vs created_at), how (modality), where (context/residence), source, and the
  four linkage joins; state movement is read from the state tables the event links to — the
  timeline joins, never duplicates.

**Tests**: NavPersonPage test (referral picker passes id; skippable); follow-up prompt test
(optional, creates via existing path). **Rollback**: revert commit. **No live change.**

---

## Migration sequence & deployment gates

| Order | Step | Gate before | Gate after |
|---|---|---|---|
| 1 | P2.1 commit (docs+guard) | baseline re-verify (branch/HEAD/CI/CQCX/ledger 0132/guards) | CI green |
| 2 | 0133 apply | pre-mutation checklist | backfill counts verified (15/0/0-NULL), trigger probes, preflight green |
| 3 | 0134 apply | 0133 verified | 10-step preflight green, internal-writer negative probe, wrapper probes |
| 4 | Frontend release A (P2.4 dedupe/wrappers + P2.5 W1 reroute + P2.7 UI) | 0134 live | suite/typecheck/build/guards + remote CI green |
| 5 | 0135 apply | release A live | full RLS test matrix (positive/negative/cross-provider/boundary/unknown) |
| 6 | 0136 apply | 0135 verified | preflight green, evidence-summary output verified, lens RPC probes |
| 7 | Telemetry window | ≥14 days zero direct inserts (read-only check) | — |
| 8 | 0137 apply | telemetry gate met | policy-absent probe, tightened-trigger probe, preflight green |

Every apply: exact ref `cqcxvwoukyhxyokfwnjm`, ledger verification, rollback material staged
from the migration header before mutation. Any FAIL → stop, report, no deploy-around.

## Explicitly out of P2 scope

Partner-confirmed/imported writers; relationship-wide provider visibility; physical drop of
`outcome_status`; delivery_context enum surgery or historical rewrites; funding attribution;
self-reported meeting/community participation; the timeline itself (P7); Institutional
Evidence Ledger export tooling (aggregate-compatibility metadata only, per §P of the
architecture); Development/reporting role access changes.
