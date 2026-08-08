# RecoveryOS Launch Bootstrap (`supabase/launch/`)

Deterministic bootstrap of a clean RecoveryOS production backend from an **empty** Supabase
project. This is the launch counterpart to `supabase/migrations/` (the dev project's full
history, kept for audit): the launch set contains the **final canonical architecture only** —
no `mvp_*`/`v2_*`/`gfa_*`, no identity crosswalk, no projections, no `write_authority` /
`migration_state` / `legacy_projection_outbox`, no backfill functions.

## Contents

- `migrations/0000–0030` — verbatim copies of the canonical dev migrations, with exactly three
  curations: `0025`/`0026` omit the `v2_identity_map` crosswalk, and `0010` exposes
  `public,graphql_public,recoveryos` (dev also exposed legacy `gfa_*` schemas).
  `legacy_ref` columns are retained as inert nullable provenance fields (no legacy FK; RPCs
  reference them; safe to drop post-launch).
  Dev `0028` (v2 backfill), `0029` (v2-crosswalk provisioning) and `0031–0036` (projection /
  write-authority / compat scaffolding) are **deliberately absent**.
- `migrations/0100` — canonical coaching write surface: booking RPCs (create / propose /
  counter / accept / cancel / reschedule with lineage) + notification dedup/emitters wired to
  the domain by exception-safe triggers (single event source, in-app only).
- `migrations/0101` — canonical appointment reminder engine (3 kinds, reschedule-safe,
  cancellation suppression, SKIP LOCKED dispatcher, delivery audit). Cron job is created only
  after verification (`0104_reminder_cron.sql`).
- `migrations/0102` — canonical lead intake (`recoveryos.leads`, Edge-Function-only inserts,
  in-app staff alerts) + canonical content tables (`slogans`, unified `resources`).
- `migrations/0103` — deliberate identity provisioning: signup → `people` + `participant`
  role; staff/admin authority only via the `staff_preauthorizations` allowlist (consumed once).
  No SQL-fabricated credentials.
- `seed/` — idempotent reference-data seeds (org, programs, residences, service/consent types,
  NARR standards, Iowa checklist, document templates, curfew/chores, 59 slogans, unified
  resource directory, owner staff-preauthorization).

## Bootstrap procedure (verified against Supabase docs/CLI current as of 2026-08)

Option 1 — CLI (`supabase` >= v2): from a checkout, point the CLI at this directory's files:
```bash
supabase link --project-ref <launch-ref>
# copy launch files into a clean workdir supabase/migrations, then:
supabase db push          # applies migrations in filename order
psql "$DB_URL" -f supabase/launch/seed/*.sql   # or supabase db push --include-seed with seed.sql
```
Option 2 — Management API / MCP (how the launch project was actually built and proven):
apply each `migrations/*.sql` in filename order via the migrations API, then the seed files.
Both paths are order-deterministic and idempotent to re-run (seeds use natural-key upserts).

The bootstrap was **proven from an empty project** (see
`docs/launch/launch-foundation-completion-report.md` §D for the verification evidence).

## Non-negotiables

- Authority chain: `auth.users → recoveryos.people → recoveryos.role_assignments`. Never
  user-editable metadata, never legacy role text.
- External SMS/email delivery is OFF; notifications are in-app canonical rows.
- Test fixtures never enter this project — fixtures belong to the staging environment.
