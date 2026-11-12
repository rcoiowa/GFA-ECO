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

## Rules

- Synthetic fixture personas only (`supabase/dev-fixtures/`); no production
  data, credentials, or records, ever.
- Batteries are read-only against fixture state (single transaction, ROLLBACK)
  unless a battery explicitly documents the synthetic rows it creates.
- A battery passes only by printing `PASSED`; silence or errors fail the run.
- Never weaken a classification, RLS, role, or consent protection to make a
  test pass — fix the test or report the finding.
