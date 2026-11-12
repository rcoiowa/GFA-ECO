# Phase C2 — Completion Report: Repository-Only DEV Infrastructure (2026-11-12)

**Authorization:** Executive authorization "Phase C2" of 2026-11-12. **Safeguards honored:**
dedicated feature branch + draft PR, no merge; no cloud project created or modified; no
Cloudflare/Worker change; no production database writes, migrations, or testing; synthetic
fixtures only (no production information anywhere); no classification/RLS/role/consent/
governance protection weakened (guards were only added); no service-role credential in any
bundle or repository file; attestation authorization explicitly unresolved; Grace
unconfigured in DEV (no provider key anywhere); DR-02 untouched.

## 1. Exact commits

**Branch `feat/dev-environment-c2`, HEAD `b89176ed8f90529d3df78d19250eebe1487b9e34`.**
**Draft PR #53** (→ `main`, not merged): https://github.com/rcoiowa/GFA-ECO/pull/53

| Commit | Content |
| --- | --- |
| `f0aeaec` | Housing follow-through adoption with verified provenance + chain-guard pin |
| `393db5e` | Local stack config, bootstrap manifest + script, fixtures, acceptance harness, inert DEV deploy workflow, environment-separation CI guard |
| `b89176e` | Table-access gate registration of the adopted migration as frozen applied history |

## 2. What was built (authorized items 1–7)

1. **Local stack:** `supabase/config.toml` — CLI stack for Postgres 17 / Auth / PostgREST /
   Storage / Edge runtime / local mail capture; live-matching schema exposure and
   `verify_jwt` flags; hard hazard note so `db reset` can never apply the retired YKY
   history (CI-enforced).
2. **Bootstrap:** `scripts/dev-bootstrap-manifest.json` (91 hash-pinned entries in live
   ledger order, seeds at their historical positions) + `scripts/bootstrap-dev.py`.
   Fail-closed on every required condition; production structurally unreachable (no DSN
   input exists; the CQCX ref is refused wherever it could appear; cloud hosts refused —
   extending to the DEV project is a deliberate Phase C3 change).
3. **Housing follow-through reconciled:** live ledger `20261020010443` now in
   `launch/migrations/`, verbatim (bytes after the provenance header hash to exactly the
   applied artifact's `7bd74792…`), pinned in the chain guard and frozen in the
   table-access gate. The adoption cites PR #41/ACTIVATION.md's "approved and applied
   2026-10-20" record as what it is — a Class D record whose **approver attribution still
   needs your confirmation**. No authorization was invented or implied.
4. **Fixtures:** 12 synthetic personas (participant, revoked-consent participant,
   registered applicant + an accountless intake, resident, coach, navigator, residence
   staff ×2, residence manager, administrator, GFARC facilitator, leadership) provisioned
   through the canonical signup trigger and preauthorization allowlist; self-verifying;
   `@example.test` only; refuses to run without its session guard.
5. **Acceptance harness:** disposable runner + initial battery proving identity
   resolution, participant own-row visibility, active/revoked/expired consent states,
   Grace House vs EJWRH staff scoping with cross-residence denial in both directions,
   participant `grant_role_assignment` → `not_authorized`, and anonymous denial.
6. **Inert DEV deployment:** `wrangler.dev.jsonc` (Worker `recoveryos-dev`; routes/domains
   impossible) + dispatch-only `deploy-dev.yml` that fails closed until the Phase C3 `dev`
   environment exists. **Wrong input cannot retarget it:** no input names a Worker, config,
   or URL; the production ref is refused; the build must grep-contain the DEV ref and
   grep-exclude CQCX before deploy.
7. **Separation guard in CI:** `scripts/check-env-separation.mjs` — DEV can never
   reference CQCX; production workflows can never carry DEV credentials or Turnstile test
   keys; fixtures stay synthetic and guarded; the hazard note and refusal constants cannot
   be silently removed.

## 3. Verification results (item 8 — disposable infrastructure only)

- **Bootstrap repeatability:** two fresh pinned-postgres:17 containers produced the
  identical schema fingerprint `f7dcadcee66635d27f0e7d30f9de0e1e`; the second run was held
  to it with `--expect-fingerprint`, and the fingerprint read is itself double-checked.
- **Fail-closed proofs:** (a) organic — a fixture edit after manifest generation made the
  very first verification run fail with the exact mismatch (`checksum mismatch: … sha256=…
  pinned=…`) before anything was applied; (b) planted — a stray
  `9999_drift_probe.sql` failed the chain guard *and* would fail the manifest's
  unmanifested-migration check (defense in depth), then was removed.
- **Acceptance:** `scripts/test-dev-acceptance.py` end-to-end on a fresh container —
  bootstrap + fixtures + battery PASS; the battery's assertions were first validated
  empirically (participant sees exactly 1 people row; GH staff scope `{1}` seeing the GH
  application and intake row; EJWRH staff scope `{2}` seeing zero GH rows).
- **Whole-repo regression with the adopted migration present:** 455 workspace tests,
  typecheck, build; all governance locks/guards including the new separation guard;
  `replay-launch-local.py` PASS; `test-document-review.py` 80/80; circle PGlite suite;
  worker tests; deno check + 52/52 receiver tests.
- **Hosted CI on PR #53:** running at report time; its conclusion is appended below before
  this phase is considered closed.

> **Hosted CI conclusion (appended 2026-11-12): run 43164634396 on head `b89176ed` —
> SUCCESS**, including the new environment-separation guard, the table-access gate with the
> adopted migration registered, the 80-check document-review suite with the adopted
> migration in its replay, and the full existing gate set.

## 4. Schema parity statement (honest gaps, per the authorization)

The bootstrap reproduces the live ledger's applied set with these **declared** exceptions:
0104 (needs pg_cron — absent in plain containers; available on the CLI stack/DEV project)
and 0146 (content activation) are skipped by default and reported at runtime; live drift
entries are represented by the replay's established containment placeholder rather than
byte-replayed; the `0123` ledger anomaly is unchanged; prepared 0150/0151 are correctly
absent from live-parity (a `replay-compat` profile retains the older superset semantics).
**Exact byte-for-byte production schema parity is therefore NOT claimed** — parity is
demonstrated against the verified 2026-11-11 ledger with the gaps above named; closing
them fully (applying activations on the CLI stack, real drift replay) is C3/C4 work.

## 5. Limitations

The Supabase CLI stack itself was not booted in this environment (the CLI's multi-image
download was out of proportion here); `config.toml` is validated structurally and the
database-level work ran on the same pinned Postgres the repo's existing harnesses use.
First `supabase start` is an early C3 step. GoTrue/PostgREST journey tests (beyond PR #45's
precedent) are C4 scope. The deno receiver tests and app suite are unaffected by C2 content
but were re-run anyway.

## 6. C3 readiness

Ready: the bootstrap manifest and script work unattended and fail closed; fixtures and the
first acceptance battery are proven; the DEV deploy lane exists and cannot fire or
mistarget until you provision it. **C3 needs from you:** the DEV project name + free-slot
confirmation; creation of the DEV Supabase project and the GitHub `dev` environment with
its secrets (Cloudflare token scope, DEV URL/key); first `supabase start` + manifest run
against it; and the standing deferred items (attestation approver record, Grace-in-DEV
default stays "no key").

**Stopped per the authorization: PR #53 stays a draft; no cloud provisioning; no merge.**
