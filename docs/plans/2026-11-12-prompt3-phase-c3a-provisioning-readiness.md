# Phase C3-A — DEV Cloud Provisioning Readiness Report (2026-11-12)

**Authorization:** Executive authorization "Phase C3-A" of 2026-11-12 (readiness and safety
verification only), carrying the executive decisions: DEV project `recoveryos-dev`; Worker
`recoveryos-dev` on its own `workers.dev` hostname only; GitHub environment `dev`;
synthetic-only data; Grace disabled with no provider key; executive-controlled credentials;
production unchanged; DR-02 open. **Restrictions honored:** nothing cloud-side was created;
no cloud write, migration, or deployment; no production change; PR #53 not merged; no
refusal protection weakened (seven were added); no expenditure.

## 1. Baseline reverified

PR #53 open, draft, unmerged; head `4712f671f4d59c5074c447bda00ec993f4e61e36` = origin ref =
CI run 43166887135 head, conclusion **success**. This phase's one code change (the inert
cloud-target skeleton, §4) advanced the branch to `f88699e…`; its CI conclusion is appended
in §9.

## 2. Capacity and cost — VERIFIED (not assumed)

The organization (free tier, verified) holds **four** projects, read directly this session:

| Project | Status |
| --- | --- |
| RecoveryOS-Launch (CQCX) | **ACTIVE_HEALTHY** — production, untouched |
| Grace For Addictions (YKY, retired) | INACTIVE (paused) |
| contact-connect-dashboard | INACTIVE (paused) |
| AR-Prevention-Trials — **previously unregistered; see Unresolved risks** | INACTIVE (paused) |

Free tier allows **two active projects**; exactly one is active, so **one free active slot
exists for `recoveryos-dev` — incremental cost $0** (E: confirm the limit wording at
creation time). Free-tier consequences accepted per the C1 plan: the DEV project auto-pauses
after ~1 week idle (unpause on use), 500 MB database (ample for synthetic data), built-in
email limits (irrelevant — DEV disables confirmations, §5). Contention note: restoring any
paused project later would compete for the second active slot.

## 3. Creation permissions and resources — verified without creating

- **Supabase:** the authorized connector operates on the owner organization (it created
  reads across all four projects and exposes project creation); region recommendation:
  `us-west-1` (same as production, for parity).
- **Cloudflare:** the Worker name `recoveryos-dev` is **unused** (nine existing Workers
  listed this session; none by that name). No pre-creation is needed: the first authorized
  `deploy-dev.yml` dispatch creates the Worker, exactly as the existing deploy lanes work.
- **GitHub:** the `dev` environment does not exist (deploy-dev.yml fails closed on that
  today — by design).

## 4. Fail-closed cloud bootstrap — designed AND implemented inert (commit `f88699e`)

`bootstrap-dev.py --target dev-project` now exists and **cannot act**:
- requires `scripts/dev-project-identity.json` — the executive-approval artifact that only
  Phase C3-B may create (`{"ref","approved_by","approved_on"}`); a guard proof asserts the
  file is absent from the repository today;
- refuses a malformed ref, the production ref, and both retired refs;
- requires `DEV_DB_PASSWORD` from the environment (never a file, never committed, never a
  GitHub secret — see §6);
- **verifies the target is empty/expected state** (no `recoveryos` schema, empty migration
  ledger) before applying anything, and refuses otherwise;
- applies the same hash-pinned manifest as every other target (chain guard first; checksum,
  order, and drift refusals identical), then mirrors each applied migration into
  `supabase_migrations.schema_migrations` so DEV's ledger reads like production's (names
  identical; version timestamps DEV-local, documented);
- the local-only targets and every existing refusal are unchanged; the guard suite grew
  from 14 to **21/21 negative proofs**, all in CI.

## 5. How DEV obtains everything (and local-vs-managed discrepancies)

| Need | Source | Managed-vs-local discrepancy |
| --- | --- | --- |
| Schema + migrations | the hash-pinned manifest via `--target dev-project --include-activations` | managed provides real roles/auth/storage → only the 0138 placeholder prelude applies; `sslmode=require`; `postgres` role is not superuser (sufficient — validated operations use ordinary DDL/DML; `set local role authenticated` works for batteries) |
| Extensions | pg_cron, pgcrypto ship on managed (0104 applies) | verify via extension list at C3-B checkpoint 4 |
| Auth configuration | dashboard, executive/operator action: site URL `https://recoveryos-dev.thomas-499.workers.dev`, redirect URLs `/sign-in` and `/reset-password`, **email confirmations OFF** | fixtures use `@example.test` addresses that can never receive mail — confirmations must be off in DEV (locally Mailpit captured them); this is a DEV-only posture, not a production recommendation |
| Storage | nothing to create (the one historical bucket was a closed EJWRH deploy-window artifact) | — |
| Edge Functions | `supabase functions deploy` of all seven from the reconciled tree, with `verify_jwt` flags per the live inventory | **closes the C2-V Edge blocker**: deployment bundles modules at deploy time, so the sandbox's TLS interception is irrelevant there |
| Function secrets | `TURNSTILE_SECRET` = Cloudflare's published always-pass TEST secret; `LEAD_INTAKE_SECRET` = freshly generated DEV-only value; `INTAKE_TURNSTILE_OPTIONAL` unset; **no `ANTHROPIC_API_KEY`, no `GRACE_MODEL`** (Grace serves its honest `ai_unconfigured`/`consent_required` paths — per your decision) | — |
| Fixtures | manifest `--with-fixtures` (session-guarded, synthetic-only) | direct `auth.users` inserts work on managed with the postgres role, same as validated locally |
| Frontend | `deploy-dev.yml` dispatch (builds against the DEV URL/key, Turnstile TEST site key, inverse asset grep) | — |

## 6. GitHub `dev` environment security design

- **Secrets/vars (the complete list):** secret `CLOUDFLARE_API_TOKEN` (a NEW token, §7);
  vars `CLOUDFLARE_ACCOUNT_ID`, `DEV_SUPABASE_URL`, `DEV_SUPABASE_ANON_KEY` (the anon key
  is publishable-class, like the production one already in workflows).
- **Never in GitHub:** the DEV database password, the DEV service-role/secret key, any
  production credential, any Grace provider key. `DEV_DB_PASSWORD` stays
  executive-controlled (password manager), supplied transiently to an explicitly
  authorized operator session only at bootstrap time, then rotated at will.
- **Protection rules:** required reviewer = the Executive Director on the `dev`
  environment (one click per deploy on top of the typed `DEPLOY_DEV` confirmation);
  deployment branches restricted (initially `feat/dev-environment-c2` and `main`;
  tighten to `main` after PR #53 merges).
- **Separation:** the `dev` environment is the only place the DEV token lives; the
  production-facing environments never gain DEV values (CI-enforced by the separation
  guard), and the dev environment never holds production values (same guard, inverse).

## 7. Cloudflare token scope — reviewed, with an honest limit

The existing deploy token (held in the `staging`/`production-candidate` environments)
demonstrably deploys Workers on account `499272c2…`. **Cloudflare API tokens cannot be
scoped to a single Worker name** — Workers Scripts edit is account-wide. Therefore:
- **Recommendation:** mint a **separate DEV token** with exactly `Account → Workers
  Scripts: Edit` and **no Zone permissions whatsoever** — structurally incapable of
  touching routes, custom domains, or DNS (production domain bindings live in zone/domain
  config, outside this token's reach), and revocable independently of production deploys.
- **Residual risk, stated plainly:** such a token could technically write other Workers'
  scripts *if used outside the workflow*. Mitigations: it exists only in the
  reviewer-protected `dev` environment; the only workflow with access deploys exclusively
  via `wrangler.dev.jsonc` (Worker name pinned, no routes possible), with gates proven to
  precede the deploy (guard suite, in CI); and production rollback remains one dispatch.
  This is the same residual model the existing production token already carries, now with
  strictly fewer privileges and more guards.

## 8. C3-B provisioning checklist (each checkpoint verifiable; stop conditions explicit)

1. **Create DEV project** `recoveryos-dev` (region us-west-1, free plan; database password
   generated into executive custody). *Checkpoint:* project status ACTIVE_HEALTHY; ref
   recorded. *Cleanup:* delete/pause the project. **Stop if** the platform demands any
   payment or the active-slot is unexpectedly occupied.
2. **Create the identity artifact** `scripts/dev-project-identity.json` (ref + approver +
   date) on the feature branch. *Checkpoint:* guard suite flips its absence-proof to a
   content-proof (suite update in the same commit); CI green.
3. **Bootstrap:** `--target dev-project --include-activations --with-fixtures` with
   `DEV_DB_PASSWORD` supplied transiently. *Checkpoints:* emptiness check passed; schema
   fingerprint equals `f7dcadcee66635d27f0e7d30f9de0e1e`; ledger rows mirror the manifest;
   12 personas verified. *Cleanup:* reset the DEV database (or delete project).
   **Stop if** the emptiness check refuses or the fingerprint differs.
4. **Verify extensions + Auth config** (pg_cron present; confirmations off; site/redirect
   URLs set). *Checkpoint:* acceptance battery passes against DEV.
5. **Deploy Edge Functions** with DEV-only secrets. *Checkpoints:* `grace` returns
   `consent_required`/`ai_unconfigured` (never a model reply); `residence-intake` returns
   `forbidden_origin` without an allowed origin — closing the C2-V Edge blocker.
6. **Create the GitHub `dev` environment** per §6 (new token first, per §7).
7. **First `deploy-dev.yml` dispatch** (creates the Worker). *Checkpoints:* the new
   hostname serves `release.json` with the DEV backend ref; **all production surfaces
   re-probed unchanged on their release**; the built assets contain the DEV ref and no
   production ref (workflow-enforced). *Cleanup:* delete the `recoveryos-dev` Worker.
8. **Acceptance:** run the battery + a B2-A-style read-only browser pass against the DEV
   hostname (synthetic submissions now permitted — it is DEV). *Stop before* any step that
   would touch a production surface; none exists in this list by construction.

Irreversibility review: every step above is reversible (delete project/Worker/environment);
the only durable artifacts are repo commits. No production-adjacent action exists in the
checklist; the global stop condition is any check reading a production identifier where a
DEV identifier is expected.

## 9. Required credentials, unresolved risks, recommendation

**Credentials needed at C3-B (none needed now):** Supabase project-creation action (via
your dashboard or the authorized connector, your choice); the new scoped Cloudflare token;
the DEV database password (executive custody); GitHub admin to create the `dev` environment.

**Unresolved risks:** (a) **AR-Prevention-Trials** — an INACTIVE project created
2026-11-01 exists in the organization and appears in no GFA register this effort has
touched; it does not block C3-B (slot math counts ACTIVE only) but should be identified
and either registered or removed — your call; (b) the §7 residual token model; (c) the
standing items (attestation approver record; `recoveryos-staging` rename; Circle retention
owner) — unaffected by C3.

> **Hosted CI on C3-A head `f88699e4…` (appended 2026-11-12): run 43168784715 — SUCCESS**,
> including all 21 guard negative proofs (the seven new cloud-target refusals among them)
> and the full existing gate set.

**Recommendation: GO for Phase C3-B** — capacity verified at $0, the cloud path is
implemented and provably inert until your identity artifact exists, every refusal has an
executed negative proof in CI, and the checklist's steps are individually verifiable and
reversible with explicit stops.

**Stopped per the authorization. Nothing was provisioned.**
