# DOMAIN-003 — vrcc.app dependency register (2026-09-15)

**Governing decisions:** DEC-005 (`recoverycommunity.app` = authenticated
participant application) and DEC-006 (`vrcc.app` = intentionally deferred
future immersive AR/VR experience). This register classifies every repository
occurrence so the domain migration is governed, never a blind global
replacement. **No DNS, route, or deployed-configuration change is made or
authorized by this register.** Scope: this branch's tree (main + control-tower
work) plus the PR #7-lineage receiver noted where it differs. `dist/` build
artifacts are derived and carry no disposition (rebuilt from source).

**Dispositions:** KEEP (correct as-is, or historical evidence that must not be
rewritten) · MIGRATE (changes when the recoverycommunity cutover program runs,
as a reviewed batch with redirects) · DEFER (belongs to the future immersive
experience; untouched until that program exists) · RETIRE (goes away with an
already-identified legacy retirement).

## 1. Application source (`apps/platform`)

| Occurrence | Count (approx.) | Disposition |
|---|---|---|
| Internal SPA route prefix `/vrcc/*` (ParticipantShell nav, page crumbs, links, tests; the `/app/*` → `/vrcc/*` legacy redirect in `WorkspaceShells.tsx`) | ~90 | **MIGRATE** — one coordinated rename to the ratified participant path naming at cutover, shipped with a splat-preserving redirect exactly like the existing `/app` precedent; deep links, PWA start URLs, and saved bookmarks must keep working. Until that program: KEEP (functioning internal names; renaming early would churn every page for no user value). |
| `HOST_HOMES` domain routing (`App.tsx`, ADR-0014 pattern) — currently keys recoveryresidence.org/.app + gracehouse vanity; **no vrcc.app key** (vrcc.app serves the default landing) | 1 map | **MIGRATE** — cutover adds `recoverycommunity.center`/`.app` keys; whether `vrcc.app` then gets its own key (interim redirect vs future immersive holding page) is a cutover-plan decision. |
| `ResidenceApplyPage.tsx`: `answers.source = 'vrcc.app'` (hard-coded source attribution) | 1 | **MIGRATE** — derive from `window.location.hostname` (or the ratified source vocabulary) so attribution stays truthful after cutover; hard-coding the old domain would silently misattribute future submissions. |
| `SystemPage.tsx`: "Public cutover (vrcc.app) — Not performed" status row | 1 | **KEEP now** (truthful current-state claim), reworded by the cutover change itself. |
| Comments (`App.tsx`, `ParticipantArea.tsx`, `ResidentArea.tsx`, `packages/domain/.../barc10.ts`) | ~5 | **MIGRATE** (wording) — ride the same cutover batch; comments only. |

## 2. Worker / Edge Function source

| Occurrence | Disposition |
|---|---|
| `supabase/functions/residence-intake` ALLOWED_ORIGINS: `https://vrcc.app` (main version; the PR #7 handler adds `https://www.vrcc.app` and candidate/staging workers.dev origins) | **MIGRATE** — cutover adds the ratified public housing origins (`recoverycommunity.*` if housing forms will be reachable there) and then **RETIRE the vrcc.app entries**: housing intake will not be served from the future immersive domain. Interim: KEEP (live continuity for the current front door). |
| `supabase/functions/notify-fanout`: `NOTIFY_FROM_EMAIL` default `VRCC <notify@vrcc.app>`, `APP_URL` default `https://vrcc.app` | **RETIRE with LEGACY-001** — the function is inactive legacy (v2 pipeline). If it is ever revived instead, the defaults must be replaced with ratified values (never a vrcc.app default). |
| `workers/api/src/index.ts` + `workers/api/wrangler.toml` (vrcc.app references in the quarantined prototype) | **RETIRE** — rides the already-quarantined `workers/api` retirement (PR #7 disposition). |
| `wrangler.jsonc` ("Phase 9 cutover re-points the vrcc.app custom domain to this Worker") and `wrangler.staging.jsonc` comment | **MIGRATE** — the cutover plan itself supersedes these comments; the actual custom-domain/route change is a separately gated Cloudflare action (HOLD). |

## 3. CI / deployment configuration

| Occurrence | Disposition |
|---|---|
| `.github/workflows/deploy-staging.yml`, `grace-*.yml` — comments describing current posture relative to vrcc.app | **KEEP now / MIGRATE wording** at cutover; no behavior encoded. |

## 4. Sites / content / builds

| Occurrence | Disposition |
|---|---|
| `sites/gfa-vrcc-residence/` (directory name; page itself is the Recovery Residence platform page) | **MIGRATE** — rename with the cutover batch (path is referenced by sync tooling; coordinate with `scripts/sync-directory-site.mjs`). Content already carries no vrcc branding. |
| `source-builds/` (1 file mentioning vrcc) | **KEEP-HISTORICAL** — archived build provenance; never rewritten. |
| `apps/platform/dist/**` | Derived — no disposition; rebuilt from source. |
| PWA `manifest.webmanifest`, `index.html` | No vrcc occurrences found — **no action**; cutover still re-verifies start_url/scope against the new domain. |

## 5. Notifications and links

Covered by §2 (`notify-fanout` defaults) — no other outbound template in the
repo embeds vrcc.app. Live Resend/Auth email templates and Supabase Auth
redirect-URL allowlists are **not repository state**: they are cutover
checklist items requiring live inspection (listed in §8).

## 6. Documentation (74 files)

**KEEP-HISTORICAL** as a class — audits, decision records, handoffs, and
reconciliations that mention vrcc.app are evidence and must not be rewritten
(No Silent Reconciliation). Exceptions that are *living* documents get
**MIGRATE** wording at cutover: `README.md`, current-state architecture pages,
and `docs/STATE-OF-THE-SYSTEM.md` if still maintained.

## 7. Test fixtures / data vocabulary

`@vrcc-v2.test` fixture emails (0030 migration text, classification reasons,
live person rows) — **KEEP** as data vocabulary: it names test identities, not
the domain, and rewriting applied-migration history is prohibited. New
fixtures should use a neutral namespace going forward.

## 8. Outside the repository (live state — needs the authenticated cutover checklist)

Not classifiable from here; each is a cutover-program line item requiring live
inspection under its own gate: vrcc.app registrar/zone/nameservers/certs and
the Worker custom-domain binding (Cloudflare — HOLD); Supabase **Auth redirect
URL allowlist / site URL**; OAuth callbacks; Resend sending domains and any
live email templates; analytics properties; QR codes and printed/partner
materials (human inventory). Historical evidence records zone ambiguity for
vrcc.app — fresh verification required before any repointing.

## Summary

No occurrence requires action **now**; nothing here blocks 0148/0149/0147R.
The register's value is at cutover time: ~90 route-prefix renames ride one
reviewed batch with redirects; four source-behavior points (§1 attribution,
§2 allowlist, HOST_HOMES, sync tooling path) are the only functional changes;
retirements ride LEGACY-001; documentation history is never rewritten; and the
live-state items in §8 form the cutover checklist skeleton. `vrcc.app` itself
stays DEFER (reserved future immersive) throughout.
