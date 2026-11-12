# Phase C2-V — Independent DEV Infrastructure Validation Report (2026-11-12)

**Authorization:** Executive authorization "Phase C2-V" of 2026-11-12 — independent
validation and narrowly scoped corrections on `feat/dev-environment-c2` only.
**Restrictions honored:** no cloud provisioning or deployment; zero production Supabase
connections of any kind this phase; no production Worker/domain/DNS/Wix change; PR #53 not
merged; synthetic data only; no protection weakened (every change added checks or fixed the
validated environment); no Grace provider key; no retroactive authorization claims.

## 1. Baseline and final commits

- **Baseline re-verified:** PR #53 head `b89176ed8f90529d3df78d19250eebe1487b9e34` — local
  clone, origin ref, and CI run 43164634396 (`success`) all agree on that exact SHA.
- **Validation corrections advanced the branch to final head
  `4712f671f4d59c5074c447bda00ec993f4e61e36`** in four commits (every change enumerated in
  §6). Hosted CI on the final head: see the appended conclusion (§7).

## 2. Real Supabase CLI stack — STARTED AND VALIDATED (with three real findings)

Supabase CLI **3.1.0** against the repository's committed config, Docker-isolated, in this
disposable environment. After corrections, **all components initialized: Postgres 17 (db),
GoTrue (auth), Kong, PostgREST (rest), Storage, Edge runtime, Mailpit — containers healthy**,
and PostgREST answered HTTP 200 once the schema existed.

Validation findings — each the kind of defect C2's structural review could not catch and
exactly what this phase existed to find:

- **F1 (config schema drift):** CLI 3.x rejects `[inbucket]`; renamed to `[local_smtp]`.
- **F2 (the YKY hazard is real and fires by default):** `supabase start` AUTO-APPLIED
  `supabase/migrations/` — the retired YKY history — and crashed at a YKY-only migration.
  The C2 comment was insufficient; **`[db.migrations] enabled = false` is now a hard
  config requirement**, and the separation guard continues to protect the setting's
  documentation.
- **F3 (first-start ordering):** PostgREST exits unhealthy until the `recoveryos` schema
  exists. The validated two-phase procedure (start `--ignore-health-check` → bootstrap →
  restart REST) is now documented in `tests/acceptance/README.md`.

## 3. Bootstrap + canonical flows on REAL services — PASS

- **Bootstrap (live-parity + activations + fixtures) on the real stack: OK**, with the
  schema fingerprint **identical to the disposable-container profile**
  (`f7dcadcee66635d27f0e7d30f9de0e1e`) — cross-target reproducibility.
- **Activations applied on the real stack:** 0104's pg_cron job exists (`cron.job` = 1) and
  0146 applied — the two C2 parity gaps are closed where pg_cron exists (DEV/CI stack);
  plain containers still skip them loudly by design.
- **Canonical signup trigger, real GoTrue:** POST `/auth/v1/signup` provisioned a person +
  `participant` role. **Preauthorization flow:** a preauthorized email signed up and
  received `participant,residence_staff` with the allowlist row consumed — the exact 0103
  contract, on real Auth.
- **RLS + JWT, real PostgREST:** the new user's JWT saw exactly its own `people` row;
  anonymous was denied outright (execute denied on `current_person_id` — stricter than an
  empty set).
- **Acceptance battery on the real stack: PASSED** (after the dual-channel impersonation
  fix §6) — same battery also green on the container path, so both environments prove the
  same RLS/consent/scoping/denial assertions, now including real `auth.uid()` semantics.
- **Edge runtime — precise blocker (environment, not product):** the runtime container
  starts, routes requests, and fails only when fetching `esm.sh` modules, because this
  sandbox's TLS-intercepting egress proxy presents a certificate Deno rejects
  (`UnknownIssuer`). Function logic remains covered by `deno check` + 52/52 receiver tests
  (CI), and deployed functions bundle at deploy time. **Safe alternative plan:** complete
  local function-serving validation on any normally-networked machine or on the real DEV
  project in C3; no function source was altered to work around the sandbox. **Local Edge
  serving is accordingly NOT claimed as validated here.**

## 4. Schema-parity gaps — investigated, none concealed

- **0104 / 0146:** applied and verified on the real stack (§3); remain explicit, loudly
  reported skips on plain containers.
- **0123 — RESOLVED, documented by design:** its own header plus
  `docs/migration/ejwrh-intake-drift-reconciliation.md` §7 record a TYPE D grants-only live
  configuration change executed 2026-08-14T09:29:28Z **under explicit authorization**,
  deliberately outside the migration ledger. No anomaly remains; the ledger reconciliation
  document now says so.
- **Historical drift:** the placeholder strategy is validated — 0138 applied cleanly on the
  real stack with only the containment placeholder; the five captured EJWRH drift files
  remain provenance-only, as designed.
- **0150/0151:** correctly absent from live-parity; retained under `replay-compat`.

## 5. Fail-closed review and new negative proofs — 14/14 PASS (now in CI)

`scripts/test-dev-guards.py` proves, with disposable broken manifests and no container or
cloud action: production references and cloud hosts are refused before anything runs;
checksum mismatches, missing artifacts, unmanifested migrations, and ordering violations
each fail closed; `deploy-dev.yml`'s refusal, CI, and asset-grep gates all precede its
single `wrangler.dev.jsonc` deploy; its dispatch inputs are exactly `release_ref` and
`confirmation`, so **no input can name a Worker, config, or URL**; the dedicated `dev`
GitHub environment is required; and the separation guard is CI-wired and passing. One
organic proof also recurred this phase: a stale pin failed with both hashes reported before
any apply.

## 6. Corrections made (minimum necessary; all on `feat/dev-environment-c2`)

| Commit | Change |
| --- | --- |
| `e9b1…/1st` | `[inbucket]`→`[local_smtp]`; **`[db.migrations] enabled=false`**; local-stack prelude (0138 placeholder only); `DEV_BOOTSTRAP_MANIFEST` test-only override (scanned by the same refusal); `scripts/test-dev-guards.py` + CI wiring |
| 2nd | battery dual-channel impersonation (works on shim and real `auth.uid()`); 120 s container-readiness window (load-race finding: one sweep bootstrap failed while the full stack ran alongside; clean rerun green); gitignore CLI runtime dir |
| 3rd | 0123 resolution recorded in the ledger reconciliation; validated stack procedure + sandbox limitation documented |

Full suites after corrections: container-path acceptance PASS · real-stack battery PASS ·
455 workspace tests · build · typecheck · all governance locks · language guards ·
chain/table-access/env-separation guards · 14/14 guard proofs · circle suite · worker tests
· (CI additionally re-runs deno checks/tests and the 80-check document-review suite).

## 7. Fixture review (item 7)

Privacy: every address `@example.test` (guard-enforced), names unmistakably artificial,
authored purely from schema — no production-derived information anywhere, and no
production connection existed this phase. Repeatability: second apply is a clean no-op with
verification intact, proven on the real stack. Role boundaries: canonical provisioning
path, residence-scoped staff verified bidirectionally (GH staff see GH rows only; EJWRH
staff see zero GH rows), no privilege escalation, `test_fixture` classification semantics
untouched. Fixed DEV-namespace UUIDs documented in the file.

> **Hosted CI on final head `4712f671` (appended 2026-11-12): run 43166887135 — SUCCESS**,
> including the 14 guard negative proofs, the separation guard, both review gates with the
> adopted migration, the deno checks/receiver tests, and the 80-check document-review suite.
> The intermediate head `eb593bfd` also ran green (run 43166694407).

## 8. Unresolved risks

Local Edge function serving unvalidated in this sandbox (§3 blocker; plan stated).
Storage behaviors beyond service health not yet exercised (C4 journeys). The standing
executive items are unchanged (attestation approver record; DEV project naming/slot;
`recoveryos-staging` rename; Circle retention owner). Free-tier auto-pause will apply to
the future DEV project (acceptable, documented in C1).

## 9. Recommendation

**GO for Phase C3**, on this evidence: the stack genuinely starts; the bootstrap is
reproducible cross-target with the real-service chain (signup → trigger → roles →
preauthorization → RLS under real JWTs) proven end-to-end; every fail-closed guarantee now
has an executed negative proof in CI; and the three real defects validation found were the
kind C3 would otherwise have hit live, and are fixed and documented. C3 conditions:
create the DEV project + GitHub `dev` environment per the C1 plan §12 decisions; first
cloud action is the hash-pinned bootstrap; validate Edge function serving there (closing
§3's blocker); production remains untouched throughout.

**Stopped for executive review.**
