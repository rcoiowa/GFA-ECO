# RecoveryOS DEV Environment Architecture and Acceptance Plan — 2026-11-12 (Phase C1)

**Authorization:** Executive authorization "Phase C1" of 2026-11-12 — investigation, design,
and documentation only. **Nothing here provisions, writes, deploys, migrates, or changes any
configuration.** Every item below carries lifecycle status **Proposed** until you approve it.
No real participant data is used or proposed for any fixture. DR-02 and all open governance
decisions are preserved untouched.

Evidence classes per the ratified ledger. Facts marked (B) were verified read-only this
session or in Phases 1–B2; (C/D) as noted; costs marked (E) are estimates to confirm at
implementation against current vendor pricing.

---

## 1. Verified configuration inventory (condensed; details in the phase reports)

- **Supabase (B):** one canonical project, CQCX `cqcxvwoukyhxyokfwnjm` (RecoveryOS-Launch),
  Postgres 17.6, us-west-1, `recoveryos` schema; 94 applied ledger entries including two
  whose SQL lives outside the canonical tree (housing follow-through; attestations —
  hash-pinned, authorization review open); Edge Functions `grace` (verify_jwt, policy
  1.2.0), `grace-judge`, `grace-coaching-canary`, `create-meeting`, and three public
  receivers (`lead-intake` v16, `residence-intake` v7, `ejwrh` v7 — origin-allowlist +
  Turnstile instead of JWT). **Organization plan: FREE tier (B)** — this constrains the
  options below. Auth configuration (SMTP, redirect URLs, OAuth) is not readable with
  current access (F) — one dashboard read at implementation. The retired YKY project is
  frozen/out of scope; its slot status needs one dashboard read (F).
- **Cloudflare (B):** account `499272c2…`; Worker `recoveryos-staging` serves all six public
  domains (production, despite the name); `gfa-eco-recovery-residence-os` is the isolated
  candidate (own `workers.dev` hostname, currently serving the reconciled `main` content,
  release `3761d644`); `rco-iowa-public`; legacy/scratch Workers; two legacy Pages still
  live.
- **GitHub Actions (B):** `ci.yml` (push/PR, tests only); two dispatch-only deploy
  workflows with typed confirmations (staging→production Worker; candidate); Grace
  eval/lock/compare workflows gated by `--require-approved-policy`; `live-gate.yml`
  Playwright harness with **MODE A (local build) and MODE B (URL target)** already built.
  GitHub environments in use: `staging`, `production-candidate`, `p4h-live-gate` (hold the
  Cloudflare token, Turnstile site key, account id).
- **Test assets already in the repo (B):** deterministic launch bootstrap
  (`supabase/launch/README.md`, with the 2026-10-21 drift caveat); idempotent seeds
  0200–0203 (org, programs, both residences, consent/service taxonomies, 59 slogans,
  resources, staff preauthorization); preflight contract check; P0 negative-test SQL
  suites; residence-intake fixtures + cleanup; PGlite Circle suite; Docker replay harness;
  80-check document-review Postgres suite; 52 deno receiver tests; Playwright live-gate.
  **No `supabase/config.toml`** — no committed local-CLI stack; PR #45's local
  GoTrue/PostgREST run was ad hoc (D).
- **Relevant schema concept (B):** `person_classification = 'test_fixture'` exists, and
  applied 0147 *blocks fixture-classified actors from privileged roles* — a production
  safety property that shapes the fixture strategy (§5).

## 2. Requirements the design must satisfy

Isolation: separate database, Auth user pool, Storage, secrets, and identities — no path
from any test to a live participant record. Fidelity: real GoTrue sessions, PostgREST+RLS
under real JWTs, Edge runtime, Turnstile flow, the exact live schema (including the two
out-of-tree migrations). Privacy: synthetic-only data, no production copies, no real names/
contacts. Coverage: RecoveryOS platform, VRCC, Circle/GFARC, Contact Connect, both
residences, consent workflows. Sustainability: free-tier-first, scripts over ceremony,
nothing a one-person organization cannot operate.

## 3. Options compared

**A — Separate Supabase DEV project** (same org, e.g. `recoveryos-dev`).
*Fidelity:* high — real Auth/PostgREST/RLS/Edge runtime, cloud-identical. *Privacy:* strong
(separate project = separate everything). *Cost (E):* $0 on the free tier **if** the
two-active-project limit has a free slot (CQCX active; retired YKY likely paused — confirm);
free-tier projects auto-pause after ~1 week idle (acceptable for DEV; unpause on use).
*Complexity:* moderate one-time bootstrap (exists, §6); low steady-state. *Risk:* secrets
hygiene — DEV keys must never land in production configs (naming + separate GitHub
environment mitigate).

**B — Supabase preview branching.** *Blocked by plan (B):* branching requires a paid plan;
the org is free-tier. Also poor fit: branching derives from a standard `supabase/migrations`
tree, while this repo's canonical line is the nonstandard `launch/` tree plus out-of-tree
applied SQL — parity would fight the tool. **Not recommended now;** revisit only if the org
upgrades for other reasons.

**C — Local stack only** (`supabase start`: Dockerized Postgres+GoTrue+PostgREST+Storage+
Edge runtime+Inbucket mail-catcher). *Fidelity:* high for API/RLS/Auth flows; email captured
locally; Edge functions served locally; no real Turnstile (use Cloudflare's official
always-pass test keys); not reachable by a hosted frontend. *Privacy:* perfect (nothing
leaves the machine/CI). *Cost:* $0. *Complexity:* low once `supabase/config.toml` + scripts
exist; already half-proven by the document-review suite and PR #45's ad-hoc stack.
*Limit:* cannot serve a persistent, human-clickable DEV site.

**D — Hybrid (RECOMMENDED): C + A.**
*Tier 1 (local/CI):* committed local stack config; the acceptance suite (§7) runs headless
in CI against an ephemeral, seeded local stack on every candidate — free, deterministic,
no cloud state. *Tier 2 (cloud DEV):* one separate free-tier DEV project + one new Worker
(`recoveryos-dev`, its own `workers.dev` hostname only) whose build points at the DEV
project — a persistent, human-testable environment for executive/browser acceptance and the
Turnstile-real flow. Tier 1 gives speed and determinism; Tier 2 gives the clickable truth.

## 4. Recommended architecture (Proposed)

- **Backends:** `PROD` = CQCX (untouched). `DEV` = new free-tier project `recoveryos-dev`
  (name decision §12). Local = ephemeral CLI stack.
- **Frontends:** production Worker (today `recoveryos-staging` — rename decision §12, e.g.
  `recoveryos-production`); candidate Worker (unchanged role: prod-pointed, isolated
  hostname); **new `recoveryos-dev` Worker**, built with `VITE_SUPABASE_URL` = DEV project,
  deployed by a new dispatch-only `deploy-dev.yml` (clone of the candidate workflow with the
  DEV env vars and its own GitHub environment `dev`). No DEV surface ever gets a public
  domain.
- **Secrets model:** one GitHub environment per target (`dev` / `production-candidate` /
  `staging`→rename `production`), each holding only its own Supabase URL+publishable key,
  Turnstile keys (DEV uses Cloudflare's official test keys: always-pass sitekey/secret),
  and the Cloudflare token. DEV Edge functions get their own `LEAD_INTAKE_SECRET`/
  `TURNSTILE_SECRET` project secrets, never shared with PROD. `grace` in DEV stays
  unconfigured (no provider key) unless its evaluation plan says otherwise — the function's
  `ai_unconfigured` path is designed for exactly that.
- **Naming rule:** every nonproduction resource name contains `dev` or `candidate`;
  anything serving a public domain contains `production`. The misnamed
  `recoveryos-staging` is the one standing violation — rename recommended (§12; a
  Cloudflare rename/cutover is an owner dashboard action, out of C1 scope).

## 5. Synthetic-data strategy (never copies production)

- **Source of truth:** the existing idempotent seeds 0200–0203 (reference data: org,
  programs, both residences, taxonomies, templates, slogans, resources) — no participant
  rows in them — plus a new `supabase/dev-fixtures/` seed set: ~12 named synthetic personas
  (obviously fake names, `@example.test` emails, `000`-prefix phones, fixed UUIDs) covering
  participant, applicant (pre-account and registered), resident (each residence), coach,
  navigator, residence staff (each residence), admin, leadership-read-only, Circle
  facilitator, and a declined/revoked-consent persona.
- **Classification:** ordinary classifications inside DEV (the whole project is synthetic).
  `test_fixture` classification is reserved for the rare, already-governed production
  fixtures; the 0147 rule (fixture ≠ privileged role) stays untouched, and DEV staff
  personas work because DEV is a separate project, not because any guard is weakened.
- **Rules:** no production row is ever exported/copied; no real person's name, story, or
  contact in any fixture; generated free-text uses lorem-style recovery-neutral content
  reviewed against the language guide; fixtures are committed SQL (reviewable, versioned);
  a cleanup script resets DEV to seed state. Grace transcripts: none persisted anywhere by
  design (B).

## 6. Reproducible migration + function procedure (the live-parity manifest)

Proposed `scripts/dev-bootstrap-manifest.json` + `scripts/bootstrap-dev.py` (new, to be
built in C2): a declarative, hash-pinned apply list that makes any empty project equal to
the live schema —
1. `supabase/launch/migrations/0000–0146` (existing order, with the documented 0104/0146
   activation steps included for DEV);
2. the historical drift entries required as dependencies (from `supabase/live-drift/cqcx/`,
   per the 2026-10-21 replay caveat);
3. applied-prepared `0147–0149` (pins already in the chain guard);
4. the three `20261005*` migrations;
5. **housing follow-through `activation.sql`** (hash `7bd74792…`, today only on PR #42's
   branch — adopting it into the canonical tree is already a proposed repo-only item);
6. **`document_review_attestations`** (hash-pinned `9894caca…`; applying it in DEV does not
   touch the open production-authorization question);
7. seeds 0200–0203 + DEV fixtures; then the preflight contract check and the negative-test
   suites as the bootstrap's own acceptance.
Edge Functions: deploy all seven from `main` (now reconciled with deployed sources) to DEV
with DEV secrets; `verify_jwt` flags per the live inventory. The same manifest doubles as
the production disaster-recovery rehearsal script — closing the replay-parity gap noted in
the ledger reconciliation.

## 7. End-to-end acceptance suite design (runs against local stack and DEV)

**Framework:** extend the existing Playwright live-gate (MODE A local / MODE B URL) into
`tests/acceptance/`, driven by the fixture personas; SQL/deno suites stay as-is underneath.

**Journeys (each with denied-path twins):**
1. *Public → participant:* register → onboarding consents → VRCC home → tools/resources →
   Grace panel shows consent gate; grant `ai_features` → `ai_unconfigured` honest fallback;
   revoke → gate returns (revocation effect same-session).
2. *Applicant (accountless):* public application (both residences, Turnstile test key) →
   staff intake queue → clarification → conversion (distinct from approval/admission) →
   `/my-housing` after registration → assigned documents → full attestation + receipt →
   paper-review path via staff → receipt retrieval after reload.
3. *Resident:* documents, consent page (expired/revoked display correctness — the fix now
   on `main`), grievance path rendering.
4. *Coach/Circle (GFARC):* facilitator logs a meeting; draft survives navigation/refresh;
   duplicate prevention; shared-note scoping (authorized GFA staff see, leadership
   read-only, non-GFA denied) — mirroring the PGlite assertions through the real UI.
5. *Navigator and staff:* scoped queues, cross-residence denial, document review workspace.
6. *Admin:* access boundaries; owner-private areas deny staff.
7. *Contact Connect / RCO Iowa:* origin-allowlisted POST against DEV `lead-intake`
   (synthetic submission in DEV only), receipt code, dedup on resubmit, minimal alert path
   suppressed (no Resend key in DEV).
8. *Cross-role isolation matrix:* every persona attempts every other persona's URLs/records;
   expected denial recorded per cell (extends the Prompt 2 §8 matrix).
**Accessibility lane:** the B2-A checks (keyboard, reduced motion, 200% zoom, 375px) run on
every journey's key screens; the owed manual screen-reader pass is scheduled once against
DEV and recorded.

## 8. Gates, promotion, rollback, naming

Promotion path (Proposed): CI green → Tier 1 acceptance green (CI job against local stack)
→ DEV deploy + Tier 2 acceptance green (+ human look) → candidate deploy (prod-pointed,
read-only checks only, as in B2-A) → **separate executive authorization** → production
dispatch of the exact SHA → post-deploy `release.json` + smoke verification. Rollback:
frontends are one dispatch to the prior pinned SHA (production: `4990829e` today); DEV
database resets from the manifest; production DB changes remain individually authorized
with prepared rollbacks — nothing in this plan changes that. Naming per §4; `release.json`
stays the universal runtime identity check.

## 9. Risk register

| Risk | Severity | Mitigation |
| --- | --- | --- |
| DEV secrets leak into a prod config (or vice versa) | High | per-environment GitHub environments; name rule; CI grep gate asserting each build's `VITE_SUPABASE_URL` matches its target (extend the existing retired-ref grep) |
| Free-tier limits (2 active projects; auto-pause; email caps) | Medium | confirm YKY slot; auto-pause acceptable for DEV; Inbucket locally; no external email in DEV |
| Manifest drift (DEV stops matching live after future prod migrations) | Medium | the chain-guard pin mechanism extends to every new applied migration; manifest is the single list CI replays |
| Fixture realism gaps (tests pass in DEV, fail in prod reality) | Medium | fixtures derived from schema constraints + the negative suites; candidate stage retains prod-pointed read-only checks |
| "staging" name confusion persists until rename | Medium | §12 decision; interim: the warning already in the B1 report |
| Turnstile test keys in a prod build by mistake | Low | the env-match CI gate above; prod keys live only in the production environment |
| Grace provider key accidentally set in DEV | Low | DEV leaves it unset; any Grace evaluation uses its own gated workflow and plan |

## 10. Acceptance criteria for the DEV environment itself

(1) Bootstrap from empty to seeded via the manifest, unattended, twice, with identical
schema fingerprints; (2) preflight + negative suites green on DEV; (3) every §7 journey
green on Tier 1 and Tier 2; (4) zero requests from any DEV surface to CQCX (verified by
build grep + runtime request log); (5) production untouched throughout (release.json sweep
unchanged); (6) reset-to-seed script proven.

## 11. Implementation phases (each independently approvable; none authorized yet)

- **C2 — repo-only:** commit `supabase/config.toml` + local-stack scripts, the bootstrap
  manifest + script, DEV fixtures, `deploy-dev.yml` (dispatch-only, inert until secrets
  exist), acceptance-suite skeleton; CI job for Tier 1. No cloud resources.
- **C3 — provisioning (owner + session):** create the DEV Supabase project (dashboard or
  one authorized MCP action), set DEV secrets, bootstrap via the manifest, deploy DEV
  functions, create the `recoveryos-dev` Worker via the new workflow.
- **C4 — acceptance build-out:** implement §7 journeys; run Tier 1 + Tier 2 to green;
  screen-reader pass; publish the acceptance report.
- **C5 — process adoption:** gates of §8 recorded as the release process; rename decision
  executed (owner); current-state record updated.

## 12. Minimum executive decisions, credentials, resources, costs

Decisions: (1) approve the hybrid architecture and phases C2–C5 (or C2 alone first);
(2) DEV project name + confirm the free-project slot (else accept ~$10/mo Pro-project cost
— E, confirm pricing); (3) approve the `recoveryos-staging` → production rename plan (owner
dashboard action, scheduled separately); (4) who besides you may hold DEV service-role
credentials (least privilege; DEV is synthetic but still gated); (5) whether DEV Grace ever
gets a provider key (default: no). Credentials/resources needed at C3, not before: Supabase
dashboard action to create the project; the existing Cloudflare token scope extended to the
new Worker name (or a new scoped token); Cloudflare Turnstile official test keys (free,
public); no new paid services required under the recommended path. Estimated incremental
cost of the recommended architecture: **$0/month (E)** on current tiers, with the free-slot
confirmation as the only contingency.

---

**Stop.** This plan is delivered for executive review. Nothing is provisioned, deployed,
written, merged, or changed. C2 (repo-only) is the natural first approval if you accept the
recommendation.
