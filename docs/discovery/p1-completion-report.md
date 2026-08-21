# P1 Completion Report — Legacy Containment, Security & Deployment Ownership

**Date:** 2026-08-07 · **Branch:** `claude/grace-coaching-audit-b0fyhq` · **Project:**
`ykykeioydvtxpyreshhs`

Evidence legend used throughout: **VERIFIED LIVE** · **VERIFIED SOURCE** · **INFERRED** ·
**UNKNOWN / REQUIRES ACCESS**. Cloudflare account state was **not** fully verifiable this
session — see E and the Cloudflare map; nothing there is claimed as verified beyond the
Workers/KV/D1/R2 lists the MCP surface actually returned.

## A. What was discovered

1. **Six distinct apps, one canonical project.** `p1-active-client-map.md` attributes
   every live caller. The live **split-brain** is precisely between the **deployed
   vrcc.app mvp worker** (`virtualrecovery`, real coaches on `mvp_*` — VERIFIED LIVE via
   `degarmeaux@icloud.com` polling) and the **Grace Coaching prototype** (`coaching`
   Edge Function on `v2_*`). A third live surface, the **canonical platform**
   (`recoveryos` schema), is used from mobile (VERIFIED LIVE via
   `recoveryos.people`/`role_assignments`).
2. **The P0 drift attribution was wrong — corrected.** The two errors
   (`user_profiles.assigned_coach_id`, `crisis_events.resolution_status`) do **not**
   come from `contact-connect-dashboard` (which targets a *different* project,
   `yqonwnzqtgmnoiymkefk`, and contains no such code). The RLS helper
   `gfa_ui.coach_can_access_participant` references `participant_profiles.assigned_coach_id`
   — a column that **exists** — so it is valid and not the source. The true emitter is an
   **UNKNOWN** deployed client querying `gfa_ui.user_profiles`/`crisis_events` with wrong
   column names. Correct targets: `participant_profiles.assigned_coach_id` (coach link)
   and `crisis_events.status`/`resolved_at`.
3. **create-meeting authorized by a client-supplied `coachEmail`** and fell back to a
   public, guessable `meet.jit.si` room — a horizontal-escalation + open-room hazard.
4. **notify-fanout had no caller verification** — a service-role email/SMS relay if
   secrets were ever set.
5. **A coach could read every participant's phone** (`v2_profiles` table-wide SELECT).
6. **Cloudflare:** 10 Workers, 1 KV, 0 D1, R2 disabled (VERIFIED LIVE). Routes, DNS,
   custom domains, Pages projects, and per-Worker bindings are **REQUIRES ACCESS** — the
   available MCP surface does not expose them.

## B. What was changed (all prototype-layer, applied live + committed same session)

- **`create-meeting` (v5, hardened):** identity from JWT only; delegates to the
  `provision_session_meeting` SECURITY DEFINER RPC (coach-ownership + session-state +
  idempotency); **no jit.si fallback** — controlled 409 instead. `supabase/functions/create-meeting`.
- **`notify-fanout` (v4, hardened):** mandatory `x-webhook-secret` (fail-closed);
  payload validation; per-channel idempotency + audit via `v2_notification_deliveries`;
  consent-gated; safe-fail. External channels remain OFF; enable-steps documented in
  `supabase/functions/README.md`. `supabase/functions/notify-fanout`.
- **Progressive disclosure (migration `coaching_engine_p1_security`):** `phone`
  column-revoked from `authenticated` on `v2_profiles`; `list_open_requests()` (pool
  discovery, staff-only, minimal fields) and `get_my_participants()` (record access
  incl. phone, active-relationship-scoped) added.
- **`v2_notification_deliveries`** table (audit + idempotency substrate), RLS: recipient
  reads own, service-role writes.
- All annotated SQL: `docs/migration/recovered/20260807_coaching_engine_p1_security.sql`.

## C. What was deliberately left unchanged

- **No `v2_*` → `recoveryos` migration** (P2, prepared not executed).
- **No coaching UI rewrite.** The `coaching` function is untouched behaviorally; the
  only source change is a one-line explanatory comment (behavior-identical under
  PostgREST column-privilege expansion; the deployed v2 remains correct).
- **The live mvp coach experience** (`virtualrecovery`, Apps A/B) — left running; it is a
  migration source with active users, retired only after canonical parity.
- **The P0 verified state** (transactional RPCs, RLS hardening, reminder idempotency,
  cron) — preserved; cron confirmed still firing (VERIFIED LIVE).
- **No compatibility columns added** for the drift errors (correct: the fix is
  caller-side / the emitter must be found).
- **Non-coaching Edge Functions** (`grace-companion*`, `vrcc-api-gateway*`, etc.) — not
  touched; flagged as source-control drift to capture before any future change.

## D. Security verification (impersonated, rolled back)

**Meeting security**
| Case | Result |
| --- | --- |
| Participant provisions own session | `not_authorized` |
| Assigned coach provisions | `set` + room URL |
| Double-tap | `exists` (idempotent, not regenerated) |
| Unrelated-coach case | covered by the ownership check (`coach_id = caller` or staff); single-coach dataset limited the negative case, logic verified by the participant + admin paths |

**Progressive disclosure**
| Case | Result |
| --- | --- |
| Coach reads open-request pool | visible (≥1) |
| Participant reads pool | 0 (role-gated) |
| Direct `phone` read by any authenticated user | **BLOCKED** (column privilege) |
| Unassigned participant in coach's `get_my_participants` | absent |
| Assigned participant's phone via scoped RPC | returned |

**Notifications**
| Case | Result |
| --- | --- |
| First per-channel delivery claim | inserted |
| Duplicate delivery claim (same notification+channel) | **BLOCKED** (unique) — idempotent |
| Distinct channel | allowed once |
| Unsigned / malformed webhook call | rejected — **verified by code + fail-closed design**; live HTTP invocation is **REQUIRES ACCESS** (this environment's network policy 403s `*.supabase.co`) |

## E. Active application / deployment map

`p1-active-client-map.md` (clients) + `cloudflare-deployment-map.md` (infra). Summary:
canonical → Worker `gfa-eco-recovery-residence-os` + `recoveryos` schema (VERIFIED
SOURCE + LIVE); live mvp → Worker `virtualrecovery` (INFERRED binding; domain→worker is
REQUIRES ACCESS); Grace Coaching → Supabase Edge Function `coaching` (VERIFIED LIVE).

## F. GitHub source-of-truth map

`p1-github-source-of-truth.md`. Coaching scope is **fully** under source control
(functions + migrations + schema + frontend all in `GFA-ECO`). Remaining SOURCE CONTROL
DRIFT (flagged, out of coaching scope): the non-coaching Edge Functions and the
un-recorded deployed commits of `recoveryos-staging` / `virtualrecovery`.

## G. Canonical frontend recommendation

`canonical-frontend-decision.md` — **DECIDED:** `apps/platform` in `rcoiowa/GFA-ECO`
(React 19 + TS + Vite → Worker `gfa-eco-recovery-residence-os` → `vrcc.app` at Phase 9),
`recoveryos` backend. The Grace Coaching Edge-Function app and the mvp worker are
**migration sources / behavioral specs**, not canonical.

## H. Legacy deprecation order

1. (P1, done) capture source, secure boundaries, decide ownership — nothing retired.
2. Build canonical Coach/Navigator Workspace + Connect on `recoveryos` (P2–P3).
3. Retire the `coaching` Edge Function after coaching parity.
4. Retire the mvp path on `virtualrecovery`; Phase 9 repoints `vrcc.app`.
5. Decommission Contact-Connect (`gfaconnection`) — independent, no canonical traffic.
6. Clean up `vrcc-app` + 5 `vite-react-template*` Workers after owner confirmation.

## I. P2 migration proposal

`p2-canonical-migration-plan.md` — per-entity DIRECT / TRANSFORMATION / NO-EQUIVALENT /
EXTEND verdicts. Headlines: `v2_coach_assignments` → **extend** `coaching_relationships`;
`v2_session_requests` → **split** into new `support_requests` + `booking_requests`/
`booking_proposals` + **extended** `appointments`; messaging/notifications/follow-ups →
**build new** in `recoveryos`. **No P2 mutation performed.**

## J. Exact remaining blockers

1. **Drift-error emitter is UNKNOWN** — needs Cloudflare/host log correlation or longer
   PostgREST request-log retention to identify which deployed client queries
   `gfa_ui.user_profiles.assigned_coach_id` / `crisis_events.resolution_status`. (No
   canonical schema change is correct regardless.)
2. **Cloudflare zones / routes / custom domains / Pages / bindings = REQUIRES ACCESS** —
   need dashboard access or a token with zone+Pages read scope to finish the
   hostname→owner map and to find any `VITE_SUPABASE_URL` override.
3. **Deployed commits of `recoveryos-staging` / `virtualrecovery` unrecorded** — enforce
   commit-stamping in CI.
4. **Non-coaching Edge Functions lack repo source** — capture before any edit/retire.
5. **External notification channels** stay OFF until `NOTIFY_WEBHOOK_SECRET` + a
   secret-bearing DB webhook + provider secrets are configured (steps in the functions
   README).
6. **Live HTTP function tests** could not run from this environment (network policy 403s
   `*.supabase.co`); function correctness verified by deploy success + DB-level tests +
   code review. Re-run HTTP black-box tests from an unrestricted environment before
   enabling external channels.

## Governing-rule check

Working recovery support preserved (mvp coaches and canonical mobile users
uninterrupted; cron still firing). Split-brain **located and bounded** (not yet
merged — that's P2, deliberately). Remaining boundaries **secured**
(meeting/notifications/disclosure). Source ownership **established** for coaching scope.
Migration is **prepared, not begun**.
