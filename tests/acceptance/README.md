# DEV acceptance suite (Phase C2 skeleton)

Runs only against **disposable bootstraps or the isolated DEV environment** —
never production. Entry point: `python3 scripts/test-dev-acceptance.py`
(bootstraps a fresh container via the hash-pinned live-parity manifest,
applies the DEV fixtures, runs every battery in `sql/`, destroys the
container).

## Layers

- `sql/` — database-level batteries (RLS, consent, role boundaries,
  cross-residence denial). Present now: `initial_rls_acceptance.sql`.
- `journeys/` — Playwright end-to-end journeys per the Phase C1 plan §7
  (participant, applicant/attestation, resident, Circle/GFARC, navigator,
  staff, admin, Contact Connect, cross-role matrix, accessibility lane).
  **Phase C4 work — directory reserved; nothing here yet.** The existing
  `.github/workflows/live-gate.yml` MODE A/B harness is the base to extend.

## Real CLI local stack (validated 2026-11-12, CLI 3.1.0)

First start is two-phase, because PostgREST's configured `recoveryos` schema
does not exist until the bootstrap runs:

```bash
supabase start -x studio,imgproxy,realtime,logflare,vector,supavisor,postgres-meta --ignore-health-check
python3 scripts/bootstrap-dev.py --target local-stack --with-fixtures --include-activations
docker restart supabase_rest_recoveryos-local   # reload schema cache → healthy
```

`[db.migrations] enabled = false` in `supabase/config.toml` is a hard
requirement: CLI 3.x otherwise auto-applies `supabase/migrations/` (the
retired YKY history) on start. Never run `supabase db reset`.

Known limitation in TLS-intercepting sandboxes: the Edge runtime cannot fetch
remote modules (esm.sh) through an intercepting proxy, so local function
serving needs a normal network (or the deployed DEV project); function logic
is covered by `deno check` + the receiver tests in CI either way.

## Rules

- Synthetic fixture personas only (`supabase/dev-fixtures/`); no production
  data, credentials, or records, ever.
- Batteries are read-only against fixture state (single transaction, ROLLBACK)
  unless a battery explicitly documents the synthetic rows it creates.
- A battery passes only by printing `PASSED`; silence or errors fail the run.
- Never weaken a classification, RLS, role, or consent protection to make a
  test pass — fix the test or report the finding.
