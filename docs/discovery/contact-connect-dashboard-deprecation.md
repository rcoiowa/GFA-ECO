# P1-B — Contact-Connect Dashboard: Deprecation Assessment

**Date:** 2026-08-07 · **Repo:** `Grace-For-Addictions/contact-connect-dashboard` @ `main`
(single commit, 2026-07-16) · **Its Supabase project:** `yqonwnzqtgmnoiymkefk` (**not**
the canonical `ykykeioydvtxpyreshhs`).

## Correction to the P0 report

The P0 remediation report attributed the two schema-drift errors
(`user_profiles.assigned_coach_id`, `crisis_events.resolution_status`) to this
dashboard. **That attribution was wrong** and is corrected here:

- A full-repo search finds **no reference to `user_profiles`, `crisis_events`, or
  `resolution_status` anywhere** in this codebase. It does not query either table.
- Its only `assigned_coach_id` usage is in `src/pages/AddParticipant.jsx` (lines 37,
  59-66, 317), writing to its own **`participants`** table — not `user_profiles`, and
  not even a column its own migrations define.
- It defaults to project `yqonwnzqtgmnoiymkefk` (`src/api/client.js:21-25`), so its
  queries do **not** reach the canonical project at all. It produced none of the
  canonical postgres errors.

The true emitter of those two errors is a **different, unidentified deployed client**
querying `gfa_ui.user_profiles` / `gfa_ui.crisis_events` on the canonical project with
column names that don't exist there. Confirmed against the live schema:

| Error identifier | Reality on the canonical project | Correct concept |
| --- | --- | --- |
| `user_profiles.assigned_coach_id` | `gfa_ui.user_profiles` has **no** `assigned_coach_id` (its columns: id, role, first/last/display_name, email, phone, org_id, approval_status, requested_role, user_id, …). The coach link lives on `gfa_ui.participant_profiles.assigned_coach_id` (**exists**) | Read the coach relationship from `participant_profiles.assigned_coach_id` (or, canonically, `recoveryos.coaching_relationships` / the live `v2_coach_assignments`) — never `user_profiles` |
| `crisis_events.resolution_status` | `gfa_ui.crisis_events` has `status` and `resolved_at`, **not** `resolution_status` | Use `status` (+ `resolved_at`) |

Note: the RLS helper `gfa_ui.coach_can_access_participant(pid)` references
`participant_profiles.assigned_coach_id` — a column that **does** exist — so that
function is valid and is **not** the error source. No server-side change is warranted;
no columns should be added.

**Finding the emitter is UNKNOWN / REQUIRES ACCESS** — it needs either Cloudflare/host
log correlation (which deployed hostname issues `/rest/v1/user_profiles?...assigned_coach_id`
and `/rest/v1/crisis_events?...resolution_status`) or PostgREST request-log access with
a longer retention window than this session had. Candidates to check first: any older
`gfa_ui`-era VRCC bundle (e.g. the `grace-harbor-16` Lovable build) still pointed at
the canonical project.

## What the dashboard is

"VRCC — Virtual Recovery Community Center": a Base44-generated spatial "building" SPA
(lobby → rooms) covering participants, coaches, check-ins, group sessions, residences,
crisis 988 resourcing. ~30 pages (`src/pages.config.js`). Data layer is a Base44-shim
Supabase client whose `run()` **swallows all errors and returns `[]`**
(`src/api/client.js:123-132`) — schema mismatches surface as empty UI, never as user
errors.

## Production-responsibility assessment

Signals point to **early prototype, not maintained production**:

- **Single commit total**, 2026-07-16, bot-authored; no iteration history.
- **No deploy config committed** (no wrangler/netlify/vercel/CI; only `_redirects`).
  A CF Pages project `gfaconnection` is referenced in the package deploy script but not
  wired in-repo.
- Baked-in **public anon key** + permissive prototype RLS; README explicitly says
  "anyone can read/write the demo tables. That's fine for prototype testing."
- Integrations stubbed (`InvokeLLM/SendEmail/SendSMS/...` return `notWired`).
- Two hardcoded permanent super-admins (`connect@graceforaddictions.org`,
  `degarmeaux@rcoiowa.org`, `src/lib/identity.js:18-21`); client-side-only role gate
  (`identity.js:1-8`: "There is no hardened auth yet").
- Targets its own project `yqonwnzqtgmnoiymkefk`, isolated from canonical data.

No other system in scope imports from or depends on it.

## Recommendation: DECOMMISSION

From the canonical project's perspective this app is a self-contained prototype on a
separate database with no canonical dependencies and no canonical traffic. Recommend
**decommission** rather than refactor.

**Decommission steps (all caller/infra-side; no Supabase column adds):**
1. Unpublish the `gfaconnection` CF Pages deployment (and any deployment whose env
   overrides `VITE_SUPABASE_URL` to the canonical project — README documents that
   override path as the only way it could ever reach canonical data).
2. Rotate the exposed publishable key `sb_publishable_FFANoT7uKT8KWdumUeTsMw_ets7uvgE`
   (`client.js:25`) if it was ever pointed at real data.
3. Archive the repo (SOURCE artifact; do not delete).

**If retention is required instead of decommission** — the minimum caller-side fix to
stop the one invalid write it *does* emit (against its own DB) is in
`AddParticipant.jsx`: drop the phantom `assigned_coach_id` field (lines 37, 59-66) and
bind the coach `<Select>` (line 317) to a real column (`assigned_coach_email` /
`assigned_coach_name`, which its `0008_mvp_coaching.sql` defines). No crisis change is
possible or needed here — the app has no `crisis_events` code.

## Remaining dependencies to clear before retirement

- Confirm no CF Pages/host deployment overrides `VITE_SUPABASE_URL` to
  `ykykeioydvtxpyreshhs` (REQUIRES ACCESS — Cloudflare Pages env inspection).
- Confirm the `yqonwnzqtgmnoiymkefk` project holds no data that must be migrated
  (it is INACTIVE per the project listing; see `docs/migration/README.md`).
- Separately, hunt the true emitter of the `user_profiles`/`crisis_events` drift
  errors (above) — that is a **different** client and remains the open drift item.
