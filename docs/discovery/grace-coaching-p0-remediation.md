# Grace Coaching — P0 Remediation Report

**Date:** 2026-08-07 · **Live project:** `ykykeioydvtxpyreshhs` · **Branch:**
`claude/grace-coaching-audit-b0fyhq`

Companion to `grace-coaching-audit.md` (the Phase 0 audit + migration map). This
report is the deliverable set the remediation directive asked for **before** large
changes (A–E), followed by the P0 fixes actually applied and verified. The governing
rule was honored: **capture production into Git and fix schema-drift + transactional
integrity first; do not migrate `v2_*` to canonical or redesign the UI yet.**

---

## A. Current-state architecture map

One Supabase project (`ykykeioydvtxpyreshhs`, 143 applied migrations) carries five
overlapping generations. Full manifest: `docs/migration/live-migration-manifest.md`.

- **Live coaching backend (Gen 4):** `v2_profiles`, `v2_coach_assignments`,
  `v2_session_requests`, `v2_direct_messages`, `v2_notifications`,
  `v2_session_reminders`, `v2_session_feedback`, `coach_meeting_rooms`. Triggers:
  `v2_on_session_confirmed`, `v2_on_coach_assigned`, `v2_on_dm_insert`. Cron:
  `vrcc-session-reminders` runs `v2_sweep_session_reminders()` every 5 min
  (verified firing in the postgres logs, "cron job 1 completed: 1 row").
- **Live coaching frontend:** Edge Function `coaching` (self-contained HTML app).
- **Deployed vrcc.app worker (Gen 1/2):** still the `mvp_*` email-keyed tables; the
  API logs show a coach client (`degarmeaux@icloud.com`) actively polling
  `mvp_session_requests` / `mvp_sessions` / `participants`. This surface does **not**
  see the `v2_*`/`coaching` requests, and vice-versa.
- **Canonical RecoveryOS (`recoveryos` schema):** `people`, `role_assignments`,
  `coaching_relationships`, `appointments`, `service_events`, `consent_grants`. Live
  and in use (API logs show `/rest/v1/people`, `/rest/v1/role_assignments` from a
  mobile client) but coaching tables are empty and select-only.

Reminder engine traced end-to-end: confirm trigger seeds three rows
(`day_before`/`hour_before`/`starting_now`), sweep selects due unsent rows
`FOR UPDATE SKIP LOCKED` while `status='confirmed'`, inserts `v2_notifications`, and
stamps `sent_at`. It is idempotent per row; cancellation is inert (sweep filters on
`confirmed`); the one gap — reschedule stacking stale reminders — was fixed (§ P0.5).

## B. Schema-drift report (with lineage)

Both errors in the postgres logs come from **one stale application**: the
`contact-connect-dashboard` build (repo `Grace-For-Addictions/contact-connect-dashboard`),
whose own Supabase project ref is `yqonwnzqtgmnoiymkefk` but which is being run
against — or whose queries reach — the canonical project.

| Obsolete reference | Real caller | Lineage / canonical replacement | Action |
| --- | --- | --- | --- |
| `user_profiles.assigned_coach_id does not exist` | `contact-connect-dashboard/src/pages/AddParticipant.jsx:37,63,317` writes an `assigned_coach_id` field | `gfa_ui.user_profiles` has no such column (it lives on `gfa_ui.participant_profiles` and `gfa_ui.support_requests`). The canonical coach↔participant link is `recoveryos.coaching_relationships` / the live `v2_coach_assignments`. | **Fix the caller**, not the schema. The dashboard is a DEPRECATE-list legacy build; do not add the column. |
| `crisis_events.resolution_status does not exist` | same dashboard family (crisis view) | `gfa_ui.crisis_events` real columns are `status`, `resolved_at` — there is no `resolution_status`. The caller wants `status`. | **Fix the caller** (`resolution_status` → `status`). Do not add a duplicate column. |

Confirmed by exhaustive search across functions, views, matviews, and columns:
**no live view, function, trigger, or canonical table references either identifier.**
Adding the columns back would have deepened the drift; the correct fix is caller-side
in a legacy build that is already slated for retirement. Logged here so whoever owns
that dashboard can patch or decommission it.

## C. Source-control drift report

Production **was** ahead of Git; it no longer is for the coaching scope:

- **Captured this session** (`supabase/functions/`, committed): the deployed
  `coaching`, `create-meeting`, and `notify-fanout` Edge Functions, verbatim, plus
  `docs/migration/live-migration-manifest.md` (all 143 live migrations).
- **Recovered earlier** (`docs/migration/recovered/`): the four
  `vrcc_coaching_engine_v1*` migrations that had been applied live and never
  committed.
- **Still outside this repo (flagged, not owned here):** the deployed vrcc.app
  Cloudflare worker frontend (`virtualrecovery`, Gen 1/2 `mvp_*` app — source on
  the vrcc.app repo's `claude/live-app-source` branch, not this monorepo), and the
  `contact-connect-dashboard` build. These belong to their own repos; consolidating
  them is Phase 8 (data migration) / the separate frontend-extraction track, not P0.

Cloudflare state could not be directly enumerated (no account-level Cloudflare API
tool is exposed in this session). What is verifiable: GFA-ECO deploys `apps/platform`
to Cloudflare via `.github/workflows/deploy-staging.yml` (`wrangler deploy`); the
coaching prototype is served from Supabase, not Cloudflare. Target split
(Cloudflare=frontend, Supabase=backend/RPC/cron, GitHub=canonical source) is recorded
in the audit's § 6 and unchanged by this work.

## D. Canonical ownership matrix

Unchanged from `grace-coaching-audit.md` § 5 (KEEP/EXTEND/MIGRATE/DEPRECATE/REMOVE).
P0 did not move any responsibility between owners — it hardened the current owner
(the `v2_*` prototype layer) in place. The MIGRATE column (support_requests /
booking_* / conversations / notifications+deliveries / follow_ups onto `recoveryos`)
remains Phase 1+ and deliberately untouched.

## E. P0 remediation — applied and verified

All changes are additive to the prototype layer, committed under
`docs/migration/recovered/`, and were applied live in the same session (per the
drift-reconciliation rule).

### P0.1 — production captured into Git
`supabase/functions/{coaching,create-meeting,notify-fanout}` + migration manifest.

### P0.2 — schema drift traced (§ B); no schema change made (correct outcome).

### Security hardening (`coaching_engine_p0_hardening`, applied earlier this session)
Role-escalation guard on `v2_profiles`; removed blanket read of
`coach_meeting_rooms`; `meeting_url` injection guard; role-gated the legacy
`participants_coach_update` policy.

### P0.3–P0.5 — transactional integrity (`coaching_engine_p0_rpcs`)
Three atomic SECURITY DEFINER RPCs replace the browser multi-writes; the coaching
Edge Function now calls them (redeployed, v2, HTTP 200):

- `claim_coaching_request(request_id)` — lock → verify open+unclaimed → create/verify
  the assignment → claim, in one transaction; graceful jsonb results.
- `assign_participant_to_coach(participant_id, coach_id)` — coach self-claim or
  admin/navigator assign+transfer; deactivate-old and activate-new in one
  transaction (no unassigned window), history preserved.
- `accept_session_proposal(request_id, selected_time)` — verifies the time is in the
  live proposal set for the caller's side, confirms once, idempotent on double-tap.
- Reminder idempotency: partial unique `(session_request_id, kind)` on unsent rows;
  confirm trigger clears unsent reminders before reseeding (reschedule-safe).
- Server-authoritative confirm: a BEFORE trigger rejects any client transition into
  `confirmed` outside the RPC and blocks participants from moving `coach_id`.

### Trigger ACL lockdown (`coaching_engine_trigger_fn_acl`)
Revoked direct EXECUTE on the trigger/sweep functions from anon/public.

### Verification (impersonated RLS tests, run in rolled-back transactions)

Participant JWT, isolation & escalation:

| Test | Result |
| --- | --- |
| Participant sets own `role='admin'` | **blocked** — "Role changes require an administrator" |
| Participant sets own `coach_id` | **blocked** — "Coach assignment changes require staff" |
| Participant force-confirms own request | **blocked** — "Sessions are confirmed through accept_session_proposal" |
| Participant injects `meeting_url` | **blocked** — "Meeting links are set by your coach or the system" |
| Foreign `v2_session_requests` visible | **0 rows** |
| Participant claims unassigned `participants` rows | **0 rows updated** |
| `coach_meeting_rooms` visible to participant | **0 rows** |

Coach/admin RPC concurrency & scheduling (synthetic pool request):

| Test | Result |
| --- | --- |
| Coach claims open request | `claimed` |
| Same coach retries | `already_yours` (idempotent) |
| Second staff races the claim | `already_claimed` (loser) |
| Navigator races an already-claimed request | `already_claimed` |
| Active assignments after claim | exactly **1** |
| Accept a never-offered time | `time_not_offered` |
| Coach accepts a real preferred time | `confirmed` |
| Double-tap same acceptance | `already_confirmed` (idempotent) |
| Pending reminders after confirm | **3** (not stacked) |
| Admin/navigator transfer to a valid coach | `assigned`, active=1, history=2 (old kept) |
| Assign to a non-coach id | `not_a_coach` |

Security advisors after the changes: the three new RPCs appear as the expected
`authenticated_security_definer_function_executable` (intended — they are the
authorization boundary); the pre-existing broad `pg_graphql_*` table-exposure and
`recoveryos` `security_definer_view` advisories are unrelated to coaching and
predate this work.

## What was deliberately NOT done (per directive)

- No `v2_*` → canonical normalization (Phase 2+, behind parity tests).
- No React/Vite rewrite of the coaching UI (frontend-extraction track).
- No new domain tables. No columns added to silence the drift errors.
- `notify-fanout` external channels left unwired; **do not set RESEND/TWILIO secrets
  until the function verifies a shared webhook secret** (documented in
  `supabase/functions/README.md`).

## Recommended next (P1)

1. Patch or decommission `contact-connect-dashboard` (the drift-error source).
2. `create-meeting` ownership check (`coach_id = caller`) + drop the public jit.si
   fallback.
3. Scope the coach roster/pool reads behind views (progressive disclosure).
4. Begin Phase 1 canonical foundation (extend `coaching_relationships` /
   `appointments`; `support_requests`) as laid out in the audit.
