# P1-A — Active Client Attribution Map

**Date:** 2026-08-07 · **Canonical project:** `ykykeioydvtxpyreshhs`

Evidence legend: **VERIFIED LIVE** (seen in Supabase API/postgres logs this session) ·
**VERIFIED SOURCE** (read from a repo/branch) · **INFERRED** (reasoned from evidence) ·
**REQUIRES ACCESS** (needs data this session could not reach).

## Applications (six distinct build/deploy units)

| # | App | Repo / branch | Supabase project | Deploy target | Auth |
| --- | --- | --- | --- | --- | --- |
| A | VRCC MVP (Gen 1) | `vrcc.app` `origin/main` `src/mvp/*` | `ykykeioydvtxpyreshhs` | CF Worker `virtualrecovery` | Supabase email + `get_my_role()`; `mvp_*` email-keyed |
| B | VRCC v3 "Quantum Bridge" (Gen 2, **deployed**) | `vrcc.app` `origin/claude/live-app-source` | `ykykeioydvtxpyreshhs` | CF Worker `virtualrecovery` (`virtualrecovery.thomas-499.workers.dev`) | Supabase email; `participants.email`-keyed |
| C | VRCC v2 PWA (Gen 3) | `vrcc.app` `origin/claude/v2-build-verification-4skk46` `v2/` | `ykykeioydvtxpyreshhs` (backend live, frontend not deployed) | none named | Supabase email; `v2_profiles.role` |
| D | Grace Coaching prototype (Gen 4, **deployed**) | `GFA-ECO` `supabase/functions/coaching` | `ykykeioydvtxpyreshhs` | Edge Function `coaching` (`verify_jwt=false`) | publishable key + RLS + hardened RPCs |
| E | Canonical RecoveryOS platform | `GFA-ECO` `apps/platform` + `packages/data-access` | `ykykeioydvtxpyreshhs` **`recoveryos` schema** | CF Worker `gfa-eco-recovery-residence-os` | Supabase email; person model |
| F | Contact-Connect "building" dashboard | `contact-connect-dashboard` `main` | **`yqonwnzqtgmnoiymkefk`** (different project) | CF Pages `gfaconnection` | Supabase email; permissive prototype RLS |

Two "v2" lineages must not be conflated: the **v2 PWA (C)** schema (`v2_foundation`,
`v2_session_feedback`, `v2_housing_*`, no assignments/DMs) vs the **coaching engine
(D)** superset (`v2_coach_assignments`, `v2_direct_messages`) recovered in
`docs/migration/recovered/20260807090536_...`.

## Live traffic confirmed this session (VERIFIED LIVE)

- **Desktop coach `degarmeaux@icloud.com`** polling `mvp_session_requests`
  (`coach_email=eq…&order=created_date.desc`), `mvp_sessions`
  (`order=scheduled_at.asc`), `participants` (`assigned_coach_email` /
  `intake_complete` filters). Ordering matches **App A/B** (`CoachApp.jsx:47-48`,
  `useSessionStore.js`). This is the **deployed vrcc.app worker** — the mvp layer is
  in active production use.
- **Mobile Safari client** hitting `recoveryos.people?auth_user_id=eq…` and
  `recoveryos.role_assignments?person_id=eq.4&revoked_at=is.null`, plus
  `recoveryos.residences`. This is **App E** (canonical platform), also live.
- **`coaching` Edge Function** GET 200s (App D).

## Attribution table

| Table | App | Evidence (file:line) | Op | Ref | Class |
| --- | --- | --- | --- | --- | --- |
| mvp_session_requests | B (deployed) | `useSessionStore.js:21/32/104` | s/i/u | ykyk | **MIGRATION SOURCE** |
| mvp_session_requests | A | `mvp/CoachApp.jsx:47`, `ParticipantApp.jsx:82` | s/i/u | ykyk | MIGRATION SOURCE (live) |
| mvp_sessions | A/B (deployed) | `useSessionStore.js:23/91/125`, `CoachApp.jsx:263` | s/i/u | ykyk | MIGRATION SOURCE (live) |
| mvp_messages | A | `mvp/Messaging.jsx:17/51` | s/i | ykyk | MIGRATION SOURCE |
| participants | A/B (deployed) | `supabaseClient.js:23`, `mvp/lib.js` | s/u | ykyk | MIGRATION SOURCE (live; canonical = recoveryos.people) |
| session_feedback | B | `useSessionStore.js:133` | i | ykyk | MIGRATION SOURCE |
| coach_meeting_rooms | B, D | `CoachRoomSettings.jsx:27`, `create-meeting` | s/u | ykyk | TEMPORARY COMPATIBILITY |
| notifications (v6) | B | `useNotificationStore.js:14/25` | s/u | ykyk | MIGRATION SOURCE |
| v2_session_requests | D (deployed) | `coaching/index.ts` (RPCs + reads) | s/i/u | ykyk | **TEMPORARY COMPATIBILITY** |
| v2_session_requests | C | `v2/.../SessionList.jsx:34`, `CoachQueue.jsx:12` | s/i/u | ykyk | TEMPORARY COMPATIBILITY |
| v2_coach_assignments | D only | `coaching/index.ts` (via RPCs) | s/i | ykyk | TEMPORARY COMPATIBILITY |
| v2_direct_messages | D only | `coaching/index.ts:353/368/374` | s/i | ykyk | TEMPORARY COMPATIBILITY |
| v2_notifications | D, C | `coaching/index.ts:483`, `v2/NotificationBell.jsx:17` | s/u | ykyk | TEMPORARY COMPATIBILITY |
| v2_profiles | D, C | `coaching/index.ts:118`, `v2/lib/supabase.js:19` | s/i | ykyk | TEMPORARY COMPATIBILITY |
| recoveryos.people | E (live) | `people.ts:16` + `ensure_person_for_current_user` | s/rpc | recoveryos | **CANONICAL CANDIDATE** |
| recoveryos.role_assignments | E (live) | `people.ts:37`, `staffOperations.ts:31` | s | recoveryos | **CANONICAL CANDIDATE** |
| recoveryos.appointments | E | `sessions.ts:21/37` | s/i | recoveryos | CANONICAL CANDIDATE (session-request model) |
| recoveryos.coaching_relationships | — | migrations `0005:109`, `0009:183` only; **no app caller** | DDL/RLS | recoveryos | CANONICAL CANDIDATE (empty, no caller) |
| mvp_*/participants (F) | F | `client.js:78/111-113` | s/i/u | **yqon** | **DEPRECATE** (different project, no canonical traffic) |

## Classification summary

- **CANONICAL CANDIDATE:** the `recoveryos` schema tables read by App E
  (`people`, `role_assignments`, `appointments`, `coaching_relationships`). This is
  the destination.
- **MIGRATION SOURCE:** the `mvp_*` layer + `participants` (Apps A/B), **in active
  production use** — must stay live until the canonical coaching surface reaches
  parity (do not retire yet).
- **TEMPORARY COMPATIBILITY:** the `v2_*` layer (Apps C/D) — the hardened Grace
  Coaching prototype (D) is the reference implementation; the v2 PWA (C) is a
  dormant parallel workstream.
- **DEPRECATE:** Contact-Connect (F) — points at a **different** project
  (`yqonwnzqtgmnoiymkefk`) and generates **no traffic** against the canonical
  project. See `contact-connect-dashboard-deprecation.md`.
- **SAFE TO RETIRE:** nothing yet. No table has been attributed to zero live callers
  on the canonical project.

## Split-brain, precisely stated

The live split-brain is between **the deployed vrcc.app worker (mvp layer, App A/B —
what real coaches use today)** and **the Grace Coaching prototype (v2 layer, App D —
the newer engine)**. They share one project but disjoint tables, so a request created
in one is invisible in the other. The canonical platform (App E, `recoveryos`) is a
third, separate live surface used from mobile. Eliminating the split-brain = bringing
the mvp coaches onto the canonical engine (Phase 2+), not patching either prototype.

## Open item

The postgres schema-drift errors (`user_profiles.assigned_coach_id`,
`crisis_events.resolution_status`) do **not** originate from any of A–F as their
source stands (corrected — see the deprecation doc). Their emitting client is
**UNKNOWN / REQUIRES ACCESS**: some deployed bundle querying `gfa_ui.user_profiles`
and `gfa_ui.crisis_events` with wrong column names, not reproduced in any repo in
scope.
