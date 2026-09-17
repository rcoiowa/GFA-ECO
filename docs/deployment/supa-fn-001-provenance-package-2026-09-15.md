# SUPA-FN-001 — Edge Function provenance package (2026-09-15)

**Purpose:** the evidence framework mapping every live CQCX Edge Function to a
reproducible repository source. **Priority blocker** (executive direction
2026-09-14): something deployed live but absent from `main` is not
authoritative merely because it is running. Live columns below carry the
2026-09-14T07:43:56Z Control Tower baseline (carried forward — this session
has no authenticated CQCX access); the PROVE step at the end fills them.

**Provenance vocabulary:** PROVEN (live bytes/config tied to an exact commit
SHA) · PARTIAL (a strong repository candidate exists; live equality unproven)
· UNKNOWN (no main-line source, or candidates conflict). **Redeploy
eligibility** is NO for every function until its row is PROVEN or the redeploy
itself is the provenance-establishing act under the deployment gate (deploy a
pinned SHA, record version → SHA).

| Function | Live (baseline) | Repository candidate source(s) | Provable commit | Secrets/config (names only) | Write scope (candidate source) | Provenance | Redeploy eligibility |
|---|---|---|---|---|---|---|---|
| `lead-intake` | v11 ACTIVE | `main` `supabase/functions/lead-intake/index.ts` (87-line monolith); PR #7 refactor (`handler.ts` + entrypoint, adds 0147 columns) — **the PR #7 version must NOT be deployed before 0147R applies** (apply-order rule) | none proven | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LEAD_INTAKE_SECRET, RESEND_API_KEY, RESEND_FROM, LEAD_ALERT_TO | `recoveryos.leads` INSERT only | **PARTIAL** (two candidates; live equality unproven) | NO — after 0147R + gate, deploying the pinned PR #7-lineage SHA becomes the proving act |
| `residence-intake` | v2 ACTIVE | `main` version (accepts missing Origin; Turnstile skip-when-unset) vs PR #7 hardened handler — materially different security posture; which one is live matters | none proven | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TURNSTILE_SECRET, (PR #7: INTAKE_TURNSTILE_OPTIONAL) | `residence_listing_submissions`, `residence_application_intake` INSERT only | **PARTIAL** | NO — hardened redeploy is step 5 of the PR #7 integration sequence |
| `ejwrh` | v2 ACTIVE | **No source on `main`.** Only candidate: PR #7 lineage `supabase/functions/ejwrh/index.ts` (portal page + canonical-kind form) | none | SUPABASE_URL (page); TURNSTILE_SITE_KEY (PR #7 version) | none direct (posts to residence-intake; page render only) | **UNKNOWN** | **NO REDEPLOY** (explicit executive condition) until an exact live-source mapping is proven |
| `grace` | v14 ACTIVE | `main` `supabase/functions/grace/index.ts` (grace-model-lock verified against source) | none proven | SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY, GRACE_MODEL, GRACE_DISABLE_THINKING | none (caller-JWT reads under RLS) | **PARTIAL** | NO — also gated by grace-model-lock / GRACE-002 (provider activation separate) |
| `grace-judge` | v7 ACTIVE | `main` `supabase/functions/grace-judge/index.ts` | none proven | ANTHROPIC_API_KEY, GRACE_MODEL, GRACE_JUDGE_MODEL, GRACE_EVAL_SECRET | none | **PARTIAL** | NO |
| `grace-coaching-canary` | v11 ACTIVE | `main` `supabase/functions/grace-coaching-canary/index.ts` | none proven | SUPABASE_URL, SUPABASE_ANON_KEY, CANARY_ENABLED, CANARY_ALLOWED_SUBS | `support_requests` INSERT via caller JWT (RLS) | **PARTIAL** | NO |
| `create-meeting` | v11 ACTIVE | `main` `supabase/functions/create-meeting/index.ts` — targets **legacy `v2_session_requests`**, while `create-meeting-canonical` (recoveryos) sits undeployed (F-EF4) | none proven | SUPABASE_URL, SUPABASE_ANON_KEY, ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET | via RPC `provision_session_meeting` (v2) | **PARTIAL** (and canonical-drift flagged) | NO — convergence decision (INTAKE-001/LEGACY-001) precedes any redeploy |
| `notify-fanout` | not in the active seven | `main` source exists (legacy v2; vrcc.app defaults) | n/a | NOTIFY_WEBHOOK_SECRET, RESEND_API_KEY, NOTIFY_FROM_EMAIL, APP_URL, TWILIO_* | `v2_notification_deliveries` | n/a (not live) | n/a — LEGACY-001 retirement candidate |
| `coaching`, `create-meeting-canonical` | not in the active seven | `main` sources exist | n/a | (see files) | client-side v2 / recoveryos RPC | n/a (not live) | canonical booking decision first |

## The PROVE step (requires an authenticated CQCX session; read-only)

For each ACTIVE function:

1. `GET /v1/projects/cqcxvwoukyhxyokfwnjm/functions` — record slug, version,
   `created_at`/`updated_at`, `verify_jwt`, entrypoint.
2. `GET /v1/projects/{ref}/functions/{slug}/body` (or the MCP
   `get_edge_function` equivalent) — download the live source bytes.
3. Normalize (the deploy bundler may rewrite imports) and diff against each
   repository candidate at its exact blob hash; record
   `live version N ↔ commit SHA / blob SHA, diff: none|listed`.
4. Record configured secret NAMES per function
   (`/v1/projects/{ref}/secrets`, names only — never values).
5. Update this table: PROVEN with the SHA, or keep PARTIAL/UNKNOWN with the
   diff attached. `ejwrh` stays NO REDEPLOY until its row reads PROVEN.
6. Going forward, every authorized deploy records `slug, new version, source
   SHA, operator, gate reference` here — the table then stays PROVEN by
   construction (the deploy workflows' exact-`release_ref` requirement from
   PR #7 supports this once integrated).

## Register effect

SUPA-FN-001 remains OPEN. This package converts it from "unknown shape" to a
fill-in-the-columns exercise the first authenticated session can complete
read-only. It blocks: any Edge Function redeploy, PR #7 integration step 5,
and every claim that live receiver behavior equals reviewed source.
