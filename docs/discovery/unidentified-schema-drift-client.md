# Unidentified Schema-Drift Client — Tracker

**Opened:** 2026-08-07 · **Status:** OPEN · **Blocks:** legacy retirement (P8 gate) ·
**Does NOT block:** additive canonical modeling (P2+).

A deployed client is issuing PostgREST queries against the canonical project
`ykykeioydvtxpyreshhs` that reference columns which do not exist, producing recurring
`ERROR` lines in the Postgres logs. No canonical schema change is warranted — the fix is
caller-side, once the caller is identified. **No guessing.**

## Observations (VERIFIED LIVE — Postgres logs)

| Timestamp (UTC) | Error | Severity |
| --- | --- | --- |
| 2026-08-07 ~15:58 (1786115912037) | `column user_profiles.assigned_coach_id does not exist` | ERROR |
| 2026-08-07 ~15:58 (1786115908803) | `column crisis_events.resolution_status does not exist` | ERROR |
| 2026-08-07 ~15:55 (1786115734097) | `column user_profiles.assigned_coach_id does not exist` | ERROR |

Both target `gfa_ui` tables (via PostgREST). Reality on the live schema:
- `gfa_ui.user_profiles` has **no** `assigned_coach_id` (columns: id, role, first/last/
  display_name, email, phone, org_id, approval_status, requested_role, user_id, …). The
  coach link canonically lives on `gfa_ui.participant_profiles.assigned_coach_id`
  (**exists**) or `recoveryos.coaching_relationships`.
- `gfa_ui.crisis_events` has `status` + `resolved_at`, **not** `resolution_status`.

## Ruled out (VERIFIED SOURCE)

- **`contact-connect-dashboard`** — targets a *different* project
  (`yqonwnzqtgmnoiymkefk`); contains no `user_profiles`/`crisis_events` code. Not the
  source. (See `contact-connect-dashboard-deprecation.md`.)
- **`gfa_ui.coach_can_access_participant()`** RLS helper — references
  `participant_profiles.assigned_coach_id` (which exists); it is valid and does not emit
  either error.
- No live view/function/matview in any schema references the missing identifiers
  (exhaustive `pg_proc`/`pg_views`/`pg_matviews` search).

## Not yet captured (REQUIRES ACCESS)

- Emitting **hostname / deployment** (needs Cloudflare/host log correlation, or PostgREST
  request logs with a longer retention window than the MCP `get_logs` 24h/limited buffer).
- **Role / JWT** characteristics of the caller.
- **User-agent / IP / edge** metadata.
- Whether a Cloudflare Pages/Worker deploy overrides `VITE_SUPABASE_URL` to point an older
  `gfa_ui`-era build (e.g. `grace-harbor-16` Lovable build, or an old vrcc bundle) at this
  project.

## Suspected (INFERRED, unconfirmed)

An older `gfa_ui`-era VRCC/admin bundle still pointed at the canonical project, written
against a `user_profiles.assigned_coach_id` / `crisis_events.resolution_status` shape that
predates the current `gfa_ui`. Candidate: `grace-harbor-16` (Lovable) or a stale vrcc.app
admin surface. **Not confirmed — do not act on this as fact.**

## Next steps (opportunistic; do not block P2)

1. When Cloudflare zone/route/Pages access is available, correlate the error timestamps to
   an inbound hostname; map hostname → deployment → repo.
2. If PostgREST/edge request logs with longer retention become available, capture the full
   request path (`/rest/v1/user_profiles?select=…assigned_coach_id`) + headers.
3. Once identified: fix caller-side (`resolution_status` → `status`; read the coach link
   from `participant_profiles`/`coaching_relationships`, not `user_profiles`) or
   decommission the deployment. **Never add the columns.**

## Gate

Per the P2 directive, this item is a **P8 legacy-retirement gate**: no `gfa_ui`/legacy
structure that this client might consume may be dropped or altered until the client is
identified and contained. Additive canonical work proceeds regardless.
