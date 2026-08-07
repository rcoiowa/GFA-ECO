# P3C-B4 — Canary Deployment & Authenticated HTTP Verification: Report (A–R)

**Date:** 2026-08-07 · **Project:** `ykykeioydvtxpyreshhs` · **Purpose:** clear or fail the HTTP
verification gate. **This phase does NOT authorize production canonical-write activation, and none
was performed.** All six production `write_authority` rows remain `v2` (DB-VERIFIED).

Verification labels (never collapsed — §18): **DB-VERIFIED · CODE-VERIFIED · DEPLOY-VERIFIED ·
HTTP-VERIFIED · REALTIME-VERIFIED**.

---

## TL;DR — the gate is NOT cleared (and could not be, from this environment)

The canary was **deployed** (DEPLOY-VERIFIED). The **authenticated HTTP harness could not be run
here**: this environment's egress to `*.supabase.co` is hard-blocked by org policy (`403 CONNECT`,
re-confirmed via the agent-proxy status endpoint), there is no function-invoke MCP tool, and valid
fixture JWTs cannot be minted without the auth endpoint or the project JWT signing secret. Therefore
**no HTTP-VERIFIED evidence exists**, and per the phase's own standard (§4: "HTTP 200 is not
sufficient"; §20/§26: "prove first, then request authorization") every wave is **NO-GO / NOT READY
pending the harness run**. The harness (`supabase/functions/grace-coaching-canary/harness.ts`) is the
ready instrument; an HTTP-capable operator runs it to produce the evidence. Nothing about this is a
failure of the machinery — it is DB-proven — it is purely the environment's inability to originate
authenticated HTTP.

## A. Deployment evidence (DEPLOY-VERIFIED)

- Deployed `grace-coaching-canary` from the committed source via the Supabase management API (MCP,
  which does not use this session's blocked egress). Response: `slug=grace-coaching-canary`,
  `version=1`, `status=ACTIVE`, `verify_jwt=true`, `ezbr_sha256=ccf16e27…c0dd`. Confirmed present in
  `list_edge_functions`.
- The production Grace Coaching function (`coaching`) was **not** modified; `create-meeting` /
  `notify-fanout` untouched; `vrcc.app` not repointed; no `write_authority` row changed; external
  channels remain OFF. (§1 satisfied.)
- **The canary is INERT as deployed.** `CANARY_ENABLED` is unset (no secrets-management tool is
  available in this session), so every request returns `503 canary_disabled`. `verify_jwt=true` also
  makes the platform reject any request lacking a valid signed JWT before the function body runs.
  It performs no work until an operator sets the two secrets.

## B. Access-control verification (CODE-VERIFIED; HTTP checks PENDING)

The gate is enforced in code + platform (reviewed): `CANARY_ENABLED` must equal `"true"`; caller JWT
`sub` must be in `CANARY_ALLOWED_SUBS` (fixtures only) else `403`; the caller's JWT is the execution
identity (anon key + `Authorization` header — **no service-role impersonation**); `verify_jwt=true`
adds edge-level signature validation; no external delivery. Email-domain matching is **not** used —
explicit subject allowlisting only. The **live** authentication assertions (unauthenticated `401`,
non-allowlisted `403`, participant-only / coach-only authority, `v2_profiles.role` confers nothing)
are encoded in `harness.ts` §5 but are **PENDING** an HTTP run.

## C. Pre / post data snapshots (DB-VERIFIED — zero residue from deployment)

Identical before and after deploy (deployment touches no data; no HTTP ran):

| Metric | Pre | Post |
| --- | --- | --- |
| write_authority (all domains) | v2 | v2 |
| canon relationships / v2 coach assignments | 0 / 0 | 0 / 0 |
| canon support requests / v2 session requests | 1 / 1 | 1 / 1 |
| bookings / proposals / appointments | 0 / 0 / 4 | 0 / 0 / 4 |
| canon notifications / v2 notifications | 6 / 6 | 6 / 6 |
| pending v2 reminders | 0 | 0 |
| legacy_projection_outbox (total / failed / open) | 0 / 0 / 0 | 0 / 0 / 0 |
| fixtures classified test_fixture / with privileged roles | 4 / 0 | 4 / 0 |

migration_state unchanged (relationships/support/bookings/appointments/notifications=CANONICAL_READ,
messages=CANONICAL_PARITY, reminders=LEGACY_ONLY). **Any future run must diff against this baseline;
any unexpected production delta is a STOP condition (§17).**

## D–K. HTTP test suites — PENDING (harness built, not run)

All of the following are implemented as **semantic** assertions in `harness.ts` (§23: canonical
mutation + authorization + v2 compatibility + idempotency + no duplicate side effect), and all are
**PENDING** because no authenticated HTTP could originate here. Each was, however, already proven at
the DB layer (fixtures, rolled back) in P3C-A/B — so what remains is strictly the *over-HTTP* proof.

| Del. | Suite | DB-VERIFIED (prior) | HTTP-VERIFIED |
| --- | --- | --- | --- |
| D | Authentication (401 / 403 / role scoping / v2 role confers nothing) | ✅ (RLS, P3A/B) | ⛔ PENDING |
| E | Relationship (assign → one active primary; self-assign rejected; retry idempotent) | ✅ | ⛔ PENDING |
| F | Support request (own-create; cross-person rejected; pool + fixture exclusion; claim race) | ✅ | ⛔ PENDING |
| G | Booking/appointment (propose/counter/accept; **one appointment**; double-accept same appt; unoffered rejected) | ✅ | ⛔ PENDING |
| H | Reminder bridge (3 reminders; reschedule reseeds; cancel suppresses) | ✅ | ⛔ PENDING |
| I | Scheduling outbox recovery (commit + durable failed row + backoff + idempotent retry) | ✅ (degraded path proven) | ⛔ PENDING |
| J | Meeting provisioning (authorized coach; idempotent; participant/unrelated denied; no public fallback) | ✅ (P1) | ⛔ PENDING |
| K | Notification dedup (one event → one canonical → one v2 copy; re-emit no-op) | ✅ | ⛔ PENDING |

## L. Fixture-safety verification (DB-VERIFIED)

Post-deploy: all 4 fixtures remain `test_fixture`, hold **0** privileged canonical roles, are excluded
from `list_active_coaches` / `list_open_support_requests` (P3B), and trigger no external delivery
(channels OFF). The canary allowlist is the only intended path to exercise them, and it is inert.

## M. Realtime verification status

**NOT VERIFIED / labelled separately (§16).** The canary uses REST + read-back, not realtime; no
canonical realtime subscription was exercised. Realtime remains design-only (P3B §F). Not counted
toward any HTTP-VERIFIED claim.

## N. Production residue check (DB-VERIFIED)

Zero delta vs the pre-deploy baseline (table in C). No production participant data was modified; no
`write_authority` changed; native appointments (4) intact; no new bookings/outbox/notifications. The
only change to the project is the addition of one inert, JWT-gated edge function.

## O. WAVE 1 — Relationships + Support Requests

```
WAVE 1 — Relationships + Support Requests
GO / NO-GO:          NO-GO (pending HTTP verification)
Evidence:            DB-VERIFIED (fixtures, rolled back) for assign→one-active-primary, self-assign
                     rejection, support-request ownership + pool fixture-exclusion, claim atomicity,
                     canonical→v2 compat. Canary DEPLOY-VERIFIED (inert). NO HTTP evidence exists.
Remaining risks:     Legacy-UI visibility over real HTTP is the one thing DB tests cannot show; the
                     v2_profiles.role-confers-nothing check is DB-proven but not yet HTTP-proven.
Rollback readiness:  Ready — set_write_authority(domain,'v2') after draining the outbox; per-domain
                     forward/rollback documented (P3C-B report §P). Relationships/support have no
                     outbox (synchronous exception-safe compat).
HTTP verification:   NOT PERFORMED — egress to *.supabase.co blocked in the authoring environment.
Recommended steps:   (1) operator sets CANARY secrets to the 2 fixtures; (2) mint fixture JWTs;
                     (3) flip relationships+support_requests to 'canonical' in a STAGING project (or,
                     if none, the live project — the flip only changes projection direction and the
                     canary uses fixtures); (4) run harness.ts; (5) if the relationship + support
                     sections are green with zero residue, return a GO for Wave 1 production only.
```

## P. WAVE 2 — Bookings + Appointments

```
WAVE 2 — Bookings + Appointments:  NOT READY (pending HTTP)
DB-VERIFIED: full propose/counter/accept flow, one-appointment invariant + double-tap idempotency,
             canonical→v2 scheduling compat, CRITICAL outbox recovery (commit + failed + backoff +
             retry), reminder bridge (3 reminders across confirm/reschedule/cancel), reschedule
             lineage. HTTP-VERIFIED: none. Do NOT execute. Report separately from Wave 1 — passing
             HTTP here must NOT auto-promote scheduling (§19).
```

## Q. WAVE 3 — In-App Notifications

```
WAVE 3 — In-App Notifications:  NOT READY (pending HTTP)
DB-VERIFIED: single-source generation, dedup no-op on repeat, one canonical → one v2 copy, no loop,
             external delivery OFF. HTTP-VERIFIED: none. Do NOT execute.
```

## R. Exact production activation runbook (for a future authorized session — NOT executed)

Per wave, only after that wave's harness sections are green in a staging/canary run **and** the owner
gives explicit per-wave authorization:

1. **Snapshot** the pre-activation baseline (this report's §C query) and confirm the outbox is empty.
2. **Repoint the consumer** for that wave only: deploy the production Grace Coaching writer (or a thin
   adapter) so the wave's mutations call the canonical RPCs. Keep all other domains on v2.
3. **Flip authority atomically:** Wave 1 → `select recoveryos.set_write_authority('relationships',
   'canonical'); select recoveryos.set_write_authority('support_requests','canonical');` · Wave 2 →
   `select recoveryos.set_scheduling_write_authority('canonical');` (bookings+appointments together) ·
   Wave 3 → `select recoveryos.set_write_authority('notifications','canonical');`.
4. **Smoke-test** narrowly with a controlled authorized account; watch `legacy_projection_outbox`
   (must stay drained) and `backfill_log` (compat errors = 0).
5. **STOP and verify** the checkpoint (source of truth, write/read path, projection direction, RLS,
   idempotency, legacy compatibility, telemetry, rollback) before the next wave. Never batch waves.
6. **Rollback if needed:** stop canonical writes → drain/reconcile the outbox
   (`process_legacy_projection_outbox`) and confirm every canonical row of the window has its v2
   compat row → `set_write_authority(domain,'v2')` (or `set_scheduling_write_authority('v2')`) →
   verify v2 re-syncs. Never a bare authority flip without reconciliation.

Messaging stays `CANONICAL_PARITY` (§23); reminders stay `LEGACY_ONLY`, v2 authoritative (§24).

---

## Success-condition check (§26) — honest

P3C-B4 succeeds when authenticated HTTP proves the canonical service layer can perform the real
coaching workflows already proven at the DB layer. **That evidence does not yet exist**, because the
authoring environment cannot originate authenticated HTTP to Supabase. Delivered instead: canary
**DEPLOY-VERIFIED** (inert, gated), the pre/post snapshot with **zero residue**, the semantic harness
ready to run, and honest **NO-GO / NOT-READY** verdicts for all three waves with an exact activation
runbook. **No production write authority was changed.** The single remaining action to clear the gate
is an operator running `harness.ts` from an HTTP-capable session; its green result is what would
justify requesting Wave 1 authorization — nothing here should be read as that authorization.
