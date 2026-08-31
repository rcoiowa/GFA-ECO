# RecoveryOS — Canonical Multi-Repository State Reconciliation (2026-08-31)

**Task class:** VERIFY → RECONCILE → REPORT. **No mutations were performed** — no deploys,
merges, DNS/Cloudflare/Auth/Supabase changes, no data changes, no cleanup, no archival.
The only write produced by this task is this document (plus its commit on the designated
reconciliation branch).

**Evidence session:** 2026-08-31, remote read-only session. Tools available: Git (all four
in-scope repositories), GitHub API (branches, commits, Actions runs), Cloudflare Workers
API (read-only; **no zone/DNS/Pages/custom-domain API**), Supabase management API
(projects, edge functions, SQL read-only on CQCX and YKY). **Public DNS and public HTTP
are unreachable from this environment (egress-blocked network policy)** — every claim
about what the public Internet sees is therefore carried at the evidence level stated,
never silently assumed.

Evidence levels used throughout: `LIVE-VERIFIED` (observed via authenticated API/SQL this
session) · `DEPLOYMENT VERIFIED` (CI run + platform metadata cross-check) · `SOURCE
VERIFIED` (read from exact commit) · `HUMAN VERIFIED` (recorded human observation, cited)
· `REPORTED` (executive narrative, not independently checkable here) · `INFERRED` ·
`UNKNOWN`.

---

## A. Executive answer

1. **What is the canonical RecoveryOS today?** The GFA-ECO monorepo platform
   (`apps/platform`, React/Vite static-assets Worker) at commit `ec36922`, running against
   Supabase **RecoveryOS-Launch** (`cqcxvwoukyhxyokfwnjm`, schema `recoveryos`), served at
   `recoveryos-staging.thomas-499.workers.dev` (ACTIVE PILOT) and
   `gfa-eco-recovery-residence-os.thomas-499.workers.dev` (production candidate).
2. **Which repository is authoritative?** `rcoiowa/GFA-ECO`. (Caveat: its GitHub default
   branch is still `claude/supabase-mcp-setup-ep29rp`, a four-file setup branch — a naming
   hazard, see the drift register.)
3. **Which branch/commit is authoritative?** The live canonical line is
   `claude/recoveryos-canonical-audit-1pvcwr`, HEAD `ef884b7119` (docs + residence-intake
   allowlist reconciliation on top of the deployed `ec36922fac`). `main` (`4959156a50`) is
   **61 commits behind** this line and does not contain the deployed Gate B / EJWRH work.
   The deployed artifact commit is `ec36922facccb41d61bdb82f2a8075e58aafe1c8`
   (DEPLOYMENT VERIFIED on both Workers).
4. **Which deployment is authoritative?** Production candidate Worker
   `gfa-eco-recovery-residence-os` (deploy run 1, success, 2026-08-31T00:31Z, SHA
   `ec36922`). The pilot users are on `recoveryos-staging` (run 71, same SHA, 00:28Z).
5. **Which backend is authoritative?** `cqcxvwoukyhxyokfwnjm` (RecoveryOS-Launch),
   LIVE-VERIFIED ACTIVE_HEALTHY, all `recoveryos` tables RLS-enabled, 7 ACTIVE edge
   functions.
6. **Where are real users currently operating?** Two places — and this is the key
   correction to the working picture: (a) the **6-person canonical pilot cohort** in CQCX
   (re-verified live: 66 auth users, 60 `@fixtures.recoveryos.test`, 6 real); and (b) a
   **separate legacy cohort on YKY** (`ykykeioydvtxpyreshhs`): 30 auth users of which ~26
   have real-person domains, with account creation as late as 2026-08-24 and a real
   (gmail) sign-in at **2026-08-31 01:12 UTC** — i.e. the legacy vrcc.app front door was
   still live with real use minutes before the cutover attempt. These legacy accounts are
   NOT the pilot cohort and are not in CQCX.
7. **What is vrcc.app currently serving publicly?** **UNKNOWN from this environment**
   (public DNS/HTTP unreachable; no Cloudflare zone API). The best-evidence inference:
   because the Cloudflare zone holding the new Worker binding is PENDING (registrar
   delegation `ryan/vera` ≠ zone-assigned `candy/devin`), the binding has **no public
   effect**, and the public Internet most likely still resolves vrcc.app through the old
   delegation — i.e. **still the legacy surface**, consistent with the 01:12Z YKY
   sign-in. REQUIRES HUMAN VERIFICATION (one `dig NS vrcc.app` + a browser check).
8. **Is the production cutover COMPLETE, PARTIAL/BLOCKED, or NOT STARTED?**
   **PARTIAL / BLOCKED at Step 6.** Steps 1–5 are complete (Step 5 independently
   verified this session); the Step 6 domain binding exists as configuration
   (REPORTED) but is publicly inert while the zone is PENDING.
9. **What is the single largest blocker?** The vrcc.app **registrar-delegation /
   zone-nameserver mismatch** (zone expects `candy`/`devin.ns.cloudflare.com`; registrar
   delegation observed as `ryan`/`vera.ns.cloudflare.com`). Until reconciled inside
   Cloudflare, no change in the pending zone reaches the public Internet.
10. **What should we do next?** Resolve the zone question with Cloudflare evidence (which
    account owns the registrar record; whether an older ACTIVE zone still answers on
    ryan/vera), then align delegation to the surviving zone — one authorized change, no
    new zones. Full ordered list in §M. In parallel (independent of DNS): decide the
    disposition of the ~26 real legacy accounts on YKY, and open the PR that lands the
    canonical-audit line on `main`.

---

## B. Repository matrix

Scope note: this session's GitHub access is limited to the four repositories below. The
broader estate (Grace House site source, gfaconnection, EJWRH site source, Lovable/Base44
exports beyond what is vendored in `vrcc.app/base44`, recoveryresidence.org site source)
was **not enumerable from here**; prior in-repo inventories
(`docs/discovery/repository-inventory.md`, audit branch) remain the reference for those.
Nothing in this session contradicted them.

| Repository | Default branch | HEAD (main) | Last activity | Type | Backend | Deployment | Authority | Disposition | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| `rcoiowa/GFA-ECO` | ⚠ `claude/supabase-mcp-setup-ep29rp` (4-file setup branch) | `main` = `4959156a50` (2026-08-21); live line = `ef884b7119` | 2026-08-31 (cutover work) | pnpm monorepo, React/Vite platform + workers + supabase | CQCX (canonical; guards enforce) | Workers `recoveryos-staging`, `gfa-eco-recovery-residence-os` | **CANONICAL** | KEEP (fix default branch; land audit line on main) | VERIFIED |
| `Grace-For-Addictions/vrcc.app` | `main` | `83b2de6` (2026-08-16) | 2026-08-16 | React/Vite (MVP in `src/mvp` + Base44 export in `base44/`) | **YKY** (`src/mvp/supabase.js` default) | Worker `virtualrecovery` (name in its `wrangler.jsonc`), Pages `gfa-vrcc` | **LEGACY — live rollback substrate** | FREEZE (keep intact until cutover stable) | VERIFIED |
| `Grace-For-Addictions/RecoveryResidenceOS` | `main` | `056d385` (2026-07-30) | 2026-07-30 | React/Vite SPA | **YKY** (`gfa_residence` schema; CI once applied migrations to it) | Worker `recovery-residence-os` (stale, Jul 29 build) | **LEGACY / SOURCE** (directory+residence features absorbed into GFA-ECO per p4f report) | MINE-then-ARCHIVE-LATER | VERIFIED |
| `Grace-For-Addictions/vite-react-template` | `main` | `e67a1b4` (2026-08-01, "source repo import") | 2026-08-01 | Vite template | none | template Workers 1–5 (experiments) | EXPERIMENT | ARCHIVE-LATER | VERIFIED |

## C. Branch matrix (GFA-ECO)

`main` = `4959156a50` (merge of PR #6, 2026-08-21). Ahead/behind counted against main;
"cherry" = patch-equivalence check.

| Branch | HEAD | vs main (ahead/behind) | Verdict |
|---|---|---|---|
| `claude/recoveryos-canonical-audit-1pvcwr` | `ef884b7119` | **+61 / −0** (strictly ahead; contains main and the deploy branch) | **CANONICAL UNMERGED VALUE — the live canonical line.** Contains all Gate A/B intake architecture (0139–0146), P0/P0.5/P1/P2 hardening, EJWRH activation, the 2026-08-31 readiness review + cutover runbook, and the residence-intake allowlist reconciliation. Must be landed on `main` via PR. |
| `deploy-candidate/ejwrh-activation-ec36922` | `ec36922fac` | +53 / −0 | Deploy trigger branch; ancestor of the audit line. SUPERSEDED once audit line merges (keep as deploy record). |
| `claude/consolidation-canonical-line-2026-08-18` | `115934d1da` | +1 / −1 | **CANONICAL UNMERGED VALUE (1 commit):** `115934d` "Resident Rights & Responsibilities acknowledgeable in signing flow". ⚠ Its migration is numbered `0125_resident_rights_acknowledgment.sql`, which **collides** with the audit line's applied `0125_analytics_view_security.sql` — must be renumbered and reconciled against the Gate B document-edition machinery (which already carries rights-acknowledgment text in the GH/EJWRH editions) before any merge. Do not lose; do not merge as-is. |
| `claude/recoveryos-state-reconciliation-7ed7so` | this branch | +1 / −1 (same base as consolidation) | Working branch for this document. |
| `claude/recoveryos-canonical-reconciliation-a25g21` | `df6f614e74` | +1 / −50 | 1 unmerged docs-only audit commit. MINE (docs), then SUPERSEDED. |
| `claude/recoveryos-greenfield-build-ka6992` | `71fa3ac098` | +14 / −88 | Unmerged: visual themes (GFA Brand / RCOIA / space), Grace House policy catalog, early state reports. Policy content re-cataloged on the canonical line; themes superseded by P4H Hearth system. MINE for theme/palette detail if ever wanted; otherwise SUPERSEDED. |
| `claude/what-is-built-here-3co21c` | `2d47dc8982` | +2 / −88 | Historic grace-vrcc worker experiment. REFERENCE / SUPERSEDED. |
| `live-gate/run-001` | `de764e5572` | +29 / −51 | Early live-gate iterations; functionality superseded by run-002 (fully merged) and the canonical line. SUPERSEDED. |
| `claude/supabase-mcp-setup-6mbu2j` | `9099d5fa8a` | +1 / −1 | 1 commit (MCP config). Harmless; MINE or drop. |
| Fully merged (0 ahead): `grace-coaching-audit-b0fyhq`, `public-support-onboarding-85u07i`, `recoveryos-intake-audit-zouh7q`, `residence-application-flow-jsesw6`, `supabase-mcp-setup-ep29rp`, `recoveryos-greenfield-build-8pns7n`, `grace-compare/sonnet5-001`, `grace-eval/run-001..003`, `grace-lock/apply-001`, `live-gate/run-002` | — | 0 ahead | **SUPERSEDED** (safe; nothing unmerged). |

## D. Deployment matrix

Cloudflare account Workers list LIVE-VERIFIED 2026-08-31. No Pages API available this
session; Pages rows carry prior-registry evidence.

| Deployment | Platform | Deployed SHA | Source | Backend | Domain(s) | Last modified | Real-user exposure | Authority / end-state | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| `recoveryos-staging` | Worker (static assets) | **`ec36922`** | GFA-ECO, deploy-staging.yml run 71 (branch `claude/recoveryos-canonical-audit-1pvcwr`) | CQCX (bundle guard in-workflow) | `recoveryos-staging.thomas-499.workers.dev` | 2026-08-31T00:28:41Z | **YES — ACTIVE PILOT, REAL USER DATA** | Keep serving unchanged ≥30–60 days post-cutover, then staged redirect | DEPLOYMENT VERIFIED |
| `gfa-eco-recovery-residence-os` | Worker (static assets) | **`ec36922`** | GFA-ECO, deploy-production-candidate.yml run 1 (trigger branch `deploy-candidate/ejwrh-activation-ec36922`) | CQCX (bundle guard) | workers.dev; vrcc.app binding configured but publicly inert (zone PENDING) | 2026-08-31T00:31:10Z | YES (human smoke test) | **PRODUCTION CANDIDATE → canonical front door** | DEPLOYMENT VERIFIED; binding REPORTED |
| `virtualrecovery` | Worker | unknown (built from `vrcc.app` repo dist; repo `wrangler.jsonc` names this Worker) | `Grace-For-Addictions/vrcc.app` | **YKY** (MVP default) | historically `vrcc.app` | 2026-08-16T09:41Z | **YES — legacy real users (YKY sign-ins through 08-31)** | LEGACY — **rollback substrate, do not touch** | LIVE-VERIFIED (exists, untouched today); source link INFERRED (strong) |
| `vrcc-app` | Worker | unknown (`index-D0SDJ3Bt.js` per Aug-4 registry) | vrcc.app family | YKY presumed | none known | 2026-08-16T14:28Z | UNKNOWN | EXPERIMENT — cleanup candidate (after cutover) | prior registry + live list |
| `recovery-residence-os` | Worker | pre-2026-07-30 build (stale) | RecoveryResidenceOS | YKY (`gfa_residence`) | none | 2026-07-29 | UNKNOWN (likely staff-only historic) | LEGACY — freeze | LIVE-VERIFIED (unchanged) |
| `vite-react-template`…`template5` | 5 Workers | n/a | vite-react-template | none | none | Aug 1–2 | NO | EXPERIMENT — cleanup candidates | LIVE-VERIFIED |
| `gfa-vrcc` Pages (`gfa-vrcc.pages.dev`) | Pages | unknown (`index-CoFlmJ02.js` MVP per Aug-4 registry) | vrcc.app repo `main` (Git-connected) | YKY | `www.vrcc.app` CNAME preserved per cutover narrative | — | LIKELY (public) | LEGACY | prior registry (Aug 4) + REPORTED DNS |
| `recoveryos` Pages (`recoveryos.pages.dev`) | Pages | **unrecoverable** — manual drag-and-drop zip upload (~2026-08-04), **no Git connection** | GFA-ECO build zipped locally (QUICKSTART Option 1) | ⚠ build predates the 2026-08-08 fix that stopped baking the retired backend — may carry YKY | none | ~Aug 4 | UNKNOWN (unadvertised) | **STALE EXPERIMENT — retire later; treat as possibly YKY-pointing until proven otherwise** | SOURCE VERIFIED lineage (QUICKSTART.md); content UNKNOWN |
| `gracehouse4.pages.dev` | Pages | static single-page site | unknown repo (not in scope) | none (informational; on residence-intake origin allowlist) | — | — | public info site | KEEP | prior registry |
| `gfaconnection.pages.dev` | Pages | — | not in session scope | contact-connect project (INACTIVE) | — | — | UNKNOWN | INVESTIGATE (low priority; its backend is INACTIVE) | UNKNOWN |
| `recoveryos-api` Worker (`api.vrcc.app`) | described in docs/deployment/README.md | — | `workers/api` (source exists at `ec36922`) | — | — | — | **NEVER DEPLOYED** (absent from live Workers list) | documentation drift — see §J | LIVE-VERIFIED absence |
| CQCX edge functions | Supabase Edge | see §F | GFA-ECO `supabase/functions` | CQCX | `cqcxvwoukyhxyokfwnjm.supabase.co/functions/v1/*` | residence-intake v2: 2026-08-31 ~04:51Z | YES (public intake, EJWRH portal) | CANONICAL | LIVE-VERIFIED |

## E. Domain map

⚠ Public DNS was not queryable this session; rows distinguish configured vs public state.

| Domain | Configured (Cloudflare, REPORTED) | Public state | Evidence |
|---|---|---|---|
| `vrcc.app` (apex) | New/pending zone: apex CNAME→gfa-vrcc.pages.dev **removed**; Worker custom domain → `gfa-eco-recovery-residence-os` created; zone **PENDING**, expects NS `candy`/`devin.ns.cloudflare.com` | UNKNOWN here; most likely still answered via old `ryan`/`vera` delegation → legacy surface (corroborated by 01:12Z YKY sign-in) | REPORTED + INFERRED; **REQUIRES HUMAN VERIFICATION** |
| `www.vrcc.app` | CNAME → `gfa-vrcc.pages.dev` preserved | UNKNOWN | REPORTED |
| Email DNS (root MX, `send.vrcc.app` MX, SES/SPF, DKIM TXT, Google site-verification) | preserved in pending zone | ⚠ if public delegation is the OLD zone, mail keeps flowing only while that old zone still holds these records — **do not delete/alter anything on either zone until the mismatch is resolved** | REPORTED; flagged |
| `recoveryos-staging.thomas-499.workers.dev` | Worker route (automatic) | serving pilot (HUMAN VERIFIED sign-ins 08-31) | DEPLOYMENT VERIFIED |
| `gfa-eco-recovery-residence-os.thomas-499.workers.dev` | Worker route | candidate, human smoke test PASS 08-31 | HUMAN VERIFIED |
| `recoveryresidence.org` / `.app` | on residence-intake origin allowlist; `.org` EJWRH route (`/ejwrh*`) prepared but **not activated** | UNKNOWN | SOURCE VERIFIED (allowlist), registry |
| Grace House (`gracehouse4.pages.dev`) | allowlisted origin | public info site | prior registry |
| RCO Iowa / GFA org domains | out of session scope | — | UNKNOWN |

## F. Backend map

| Project | Status | Role | Who points at it | Key facts (LIVE-VERIFIED today) |
|---|---|---|---|---|
| **`cqcxvwoukyhxyokfwnjm` RecoveryOS-Launch** | ACTIVE_HEALTHY | **CANONICAL** | Both canonical Workers (`ec36922` bundles, guard-enforced) | 66 auth users (60 fixtures / 6 real); schema `recoveryos` ~84 tables, **RLS enabled on every listed table**; consent_grants 71, role_assignments 118, audit_log 135, document_templates 26/versions 27/assignments 15, service_events 19; edge functions ACTIVE: `grace` v14, `grace-judge`, `grace-coaching-canary`, `create-meeting`, `lead-intake` (verify_jwt=false, server-to-server secret), `residence-intake` v2 (verify_jwt=false — public-browser endpoint with origin allowlist + honeypot + caps + optional Turnstile; **deployed source origin-identical to repo head**), `ejwrh` (verify_jwt=false). **No `notify-fanout` function exists** (see §J). Advisors: 4×INFO (RLS-no-policy = default-deny on empty tables), 1×WARN (leaked-password protection disabled). |
| **`ykykeioydvtxpyreshhs` "Grace For Addictions"** | ACTIVE_HEALTHY | **RETIRED-declared, but factually still serving the legacy estate** | `vrcc.app` repo MVP (hardcoded default), RecoveryResidenceOS, hence Workers `virtualrecovery`, `vrcc-app`, `recovery-residence-os`, Pages `gfa-vrcc` | 30 auth users: 4 `@vrcc-v2.test` fixtures + ~26 real-person domains (gmail 10, GFA/RCO staff 6, icloud 3, vrcc.app 2, others); latest account 2026-08-24, latest sign-in **2026-08-31 01:12Z**; ~20 schemas incl. its own `recoveryos` (74 tables), `gfa_residence` (34), `gfa_*` family, `ztest`; row volumes small (biggest table ~300 rows). CI guard `check-no-retired-ref.mjs` (CANONICAL=CQCX, RETIRED=YKY) prevents reintroduction into canonical builds. |
| `vlsxjkqyaexcxwkbovlq` contact-connect-dashboard | **INACTIVE** | deprecated (deprecation doc on audit line) | gfaconnection surface (dormant) | No action; leave as-is. |
| `cmodbvkydzqlzxqxwoeu`, `gffosjyiunshhmtpjsqa` (named in Aug-4 registry) | **not in the org's current project list** | historical mentions | none found | Presumed deleted/never-ours; UNKNOWN. |

## G. Product capability matrix (canonical, at deployed `ec36922`)

Verification legend: **LV** = live/human-verified · **DV** = deployed-artifact verified ·
**SC** = source complete (files + tests at `ec36922`) · **P** = partial · **NB** = not built.

- **Participant/VRCC** (27 source files): onboarding LV (real signups 08-31); Today,
  Check-ins, Recovery Capital (BARC-10 page), My Recovery, My Journey, Connect LV/DV;
  Grace chat SC+edge fn ACTIVE; **Support Now LV (human, candidate `/vrcc/connect`)**;
  Messages, Sessions, Resources, Tools, Learn, Notifications, Profile, Privacy/Consent
  SC (consent machinery LV server-side — 71 grants via 0140 flow); Getting Settled
  (acknowledgments) SC + LV server-side E2E.
- **Coach** (13 files): home, roster, participant detail, requests, sessions, follow-ups,
  messaging SC; coaching relationships LV (2 live relationships; coach chains verified
  server-side).
- **Navigator** (9 files): people, connections/referrals, requests, follow-ups, messaging,
  person detail SC; navigation needs/referrals LV (10/10 rows live).
- **Resident** (10 files): resident today, My Residence, house board, schedule, documents
  + document detail (signing/acknowledgment) SC + LV server-side (0146 editions,
  signature-at-pinned-hash E2E), grievances SC; residency phase SC.
- **Residence staff/operator** (25 files): applications, intake queue LV server-side
  (Gate B 0139–0146 chain: conversion → readiness → gated admission), screenings, beds
  (BedBoard), residents, house ops, incidents, fees, grievances, compliance
  (NARR/Iowa checklist tables seeded: 82/7 rows), reports, messaging SC.
- **Admin/executive** (11 files): people, access/roles, audit, operations, residences,
  evidence, directory submissions, system SC; audit_log live (135 entries).
- **Public/infrastructure:** landing + Grace House public pages + directory static site
  (`/residence/directory/`) DV; public residence application/referral via
  `residence-intake` LV-config (v2 ACTIVE; in-app submit from vrcc.app pending cutover);
  EJWRH portal serving from Supabase functions URL (public route on recoveryresidence.org
  **prepared, not activated**); recoveryresidence.org site itself out of scope here.
- **Not built / forward:** payment processing beyond fee ledger, storage-based document
  upload flows (no user files exist yet), `recoveryos-api` gateway (source only, never
  deployed).

## H. Real-user / pilot state

- **Canonical (CQCX):** 6 real humans (re-verified by census this session; per-person
  detail in `docs/operations/vrcc-production-readiness-2026-08-31.md` §1 on the audit
  branch): 2 staff-domain accounts (08-09/08-11), 3 participants + 1 participant/coach
  (all 08-31). Fixture convention `@fixtures.recoveryos.test` re-verified: exactly 60
  accounts match, machine-cadence creation, zero overlap with real domains. **Reliable**,
  with the standing caveat that staff should confirm no real person was ever handed a
  fixture-domain account. No cleanup mechanism was run or created; any future cleanup must
  key on that domain only, under separate authorization.
- **Legacy (YKY): the working assumption "all real users are in CQCX" is FALSE at estate
  level.** ~26 real-person accounts exist on YKY (staff among them, but also
  gmail/icloud/yahoo/proton addresses), created 2026-02→2026-08-24, signing in through
  2026-08-31. Their data footprint is small (hundreds of rows total) but real. They
  currently depend on the legacy front door continuing to work. **Nothing was touched.**
  Their disposition (migrate, invite-to-reregister, or deliberately sunset with the legacy
  surface) is an open executive decision — §M.
- **Intake evolution** (what existing users completed vs forward-only): fully reconciled
  in the readiness review §1 and re-affirmed here — accounts/roles/in-app consents are
  SATISFIED BY EXISTING RECORD; residence application, screening consent,
  electronic-records consent, signatures, acknowledgments, emergency contact, medication
  review are NEW ACTIONS (forward-only, never retrofitted); no real user repeats data the
  system already holds (0144 prepopulate/confirm path).

## I. Cutover runbook state (runbook §8 of the readiness review; 17 steps)

| Step | Status | Evidence |
|---|---|---|
| 1 Pre-cutover verification [RO] | **COMPLETE + VERIFIED** | CI green on `ec36922`; both Workers at `ec36922` (runs 71 & 1); C1–C3 recorded |
| 2 Rollback reference [RO] | **COMPLETE** | Legacy target (`virtualrecovery`) recorded in registry; Worker untouched (modified 08-16, LIVE-VERIFIED) |
| 3 Auth allowlist [RC] | **COMPLETE + HUMAN VERIFIED** (C1, 2026-08-31): all three origins PRESENT | readiness doc; not re-readable by tooling |
| 4 Auth Site URL → `https://vrcc.app` [RC] | **COMPLETE (REPORTED)** — changed during the authorized run; **current live value UNVERIFIED** (no Auth-config API access this session) | REQUIRES HUMAN VERIFICATION (dashboard read) |
| 5 `residence-intake` redeploy [PM] | **COMPLETE + VERIFIED (this session)** — v2 ACTIVE, updated 2026-08-31 ~04:51Z, `verify_jwt=false` intentionally (public browser endpoint; origin allowlist + honeypot + caps + optional Turnstile), deployed origin set **identical** to repo head; net change vs v1 additive (`vrcc.app`, `www.vrcc.app`, candidate origin) per commits `eabb36d`/`ef884b7` | LIVE-VERIFIED |
| 6 Bind vrcc.app → candidate Worker [PM] | **BLOCKED** — binding record REPORTED created, but zone PENDING (NS mismatch) ⇒ **no public effect**; not equivalent to a completed cutover | REPORTED + INFERRED |
| 7–12 smoke/continuity/routing/reset/intake/SupportNow on vrcc.app | **NOT YET VALID** (blocked on 6) | — |
| 13 Rollback criteria [RO] | STANDING | doc |
| 14 Rollback procedure [RC] | **AVAILABLE** — `virtualrecovery` intact | LIVE-VERIFIED |
| 15 Staging coexistence [RC] | **PRESERVED** — staging serving `ec36922`, unredirected | DEPLOYMENT VERIFIED |
| 16 Post-cutover monitoring | NOT APPLICABLE YET | — |
| 17 User communication | NOT APPLICABLE YET | — |

## J. Drift / contradiction register

1. **"All real users are in canonical CQCX" vs live YKY census.** EVIDENCE: 30 YKY auth
   users, ~26 real-domain, sign-ins through 2026-08-31 01:12Z. CURRENT TRUTH: the CQCX
   claim is true for the *staging pilot cohort* only; a distinct legacy cohort operates on
   YKY via the legacy vrcc.app surface. CORRECTION: executive decision needed on legacy
   cohort disposition; until then the legacy surface must keep working (already policy).
2. **GitHub default branch.** CLAIM A (implicit): main/canonical line is the entry point.
   CLAIM B (GitHub): default = `claude/supabase-mcp-setup-ep29rp` (4 config files).
   TRUTH: default branch is a husk; it misled Cloudflare Git-connect once already
   (QUICKSTART 2026-07-31 note). CORRECTION REQUIRED: repoint default to `main` (owner
   action; safe, non-destructive).
3. **`main` vs deployed reality.** main (`4959156`) lacks the entire Gate B/EJWRH/
   cutover line (61 commits) that is deployed and live-verified. CORRECTION: PR the audit
   line into main; until then main is NOT a safe build source.
4. **Migration numbering collision `0125`.** Audit line: `0125_analytics_view_security`
   (applied live). Consolidation line: `0125_resident_rights_acknowledgment` (unapplied,
   unmerged `115934d`). CORRECTION: renumber + reconcile before merging 115934d; never
   apply the consolidation 0125 as-is.
5. **Readiness doc names `notify-fanout` ACTIVE; live CQCX has no such function.** PR #6
   history explains: notify-fanout is a verbatim YKY capture, marked do-not-deploy.
   TRUTH: not deployed on CQCX (LIVE-VERIFIED). CORRECTION: readiness doc's function list
   was inaccurate on that item; this register is the correction.
6. **`docs/deployment/README.md` still lists YKY env vars and an `api.vrcc.app`/
   `recoveryos-api` gateway.** TRUTH: canonical env is CQCX (guards enforce);
   `recoveryos-api` was never deployed (absent from live Workers list). CORRECTION:
   supersede that README (docs-only change) — it predates canonicalization.
7. **Misleading names (standing):** Worker `gfa-eco-recovery-residence-os` is the whole
   platform, not a residence app; repo `vrcc.app` is the LEGACY app, not the canonical
   front-door source; Worker `virtualrecovery` is named in the vrcc.app repo's wrangler
   config; YKY project is named "Grace For Addictions" while being retired; a second
   `recoveryos` schema lives inside YKY. Names are evidence of nothing — treat this
   register as the authority.
8. **Old Aug-4 registry vs live Workers list:** registry said `gfa-eco-recovery-residence-os`
   "deleted"; live list shows it created 2026-08-04 and serving since — the registry
   snapshot predates its re-creation. The 2026-08-31 registry entry supersedes it.
9. **Cutover narrative vs public DNS:** a Worker custom-domain record existing (and even
   dashboard DNS edits) in a PENDING zone does not change what the Internet sees.
   CORRECTION: cutover is PARTIAL/BLOCKED, not complete — no document should claim
   vrcc.app production until the zone is ACTIVE and step 7–12 checks pass.
10. **recoveryos.pages.dev:** manual zip upload from ~2026-08-04, i.e. from the window
    when builds could bake the retired backend (fixed 2026-08-08, `c10b965`). TRUTH:
    lineage confirmed, content unverifiable here. CORRECTION: treat as possibly
    YKY-pointing; retire after cutover (authorization required); never advertise it.

## K. Unreconciled value (outside canonical)

- **`115934d`** — resident-rights acknowledgability fix (needs renumber/reconcile; §C).
- **YKY real-user accounts/data** (~26 accounts, small row volume) — decision pending.
- **`vrcc.app` repo `base44/` export + MVP** — reference only; Base44 retirement is
  ADR-recorded. The pre-Aug-2 "rich build" (`index-DMwbAUg-.js`) remains a reference
  artifact whose source was never pushed (per Aug-4 registry) — nothing new found.
- **RecoveryResidenceOS `gfa_residence` schema (34 tables on YKY)** — features absorbed
  into canonical (p4f report); any residual live data joins the YKY-disposition decision.
- **ka6992 themes / a25g21 audit doc / 6mbu2j MCP config** — minor MINE candidates.
- Everything else examined is either merged, superseded, or reference-only.

## L. Blockers

| # | Blocker | Severity | Class |
|---|---|---|---|
| 1 | vrcc.app zone PENDING: registrar delegation (`ryan`/`vera`) ≠ zone NS (`candy`/`devin`); domain reportedly on Cloudflare Registrar — mismatch implies an old zone still authoritative, a zone deleted/re-added, or a cross-account registrar/zone split. Public cutover impossible until reconciled. | **CRITICAL** | CLOUDFLARE / DNS / DOMAIN |
| 2 | Email DNS continuity risk during zone reconciliation: MX/SPF/DKIM must exist in whichever zone is/becomes authoritative before delegation moves. | **HIGH** | DNS / OPERATIONS |
| 3 | ~26 real legacy accounts on YKY still active via legacy surface; no disposition decision; cutover changes what vrcc.app serves them. | **HIGH** | DATA / GOVERNANCE |
| 4 | Canonical line (61 commits, incl. deployed code) unmerged to `main`; main is stale as a build source. | **HIGH** | CODE |
| 5 | Auth Site URL live value unverified post-change (step 4 REPORTED only). | **MEDIUM** | AUTH |
| 6 | Migration `0125` collision blocks `115934d` (rights acknowledgment) from landing. | **MEDIUM** | CODE |
| 7 | GitHub default branch is the setup husk. | **MEDIUM** | OPERATIONS |
| 8 | `recoveryos.pages.dev` stale manual upload, possibly retired-backend-pointing. | **MEDIUM** | CLOUDFLARE / SECURITY |
| 9 | Supabase Auth leaked-password protection disabled (advisor WARN). | **LOW** | AUTH / SECURITY |
| 10 | Stale docs (`docs/deployment/README.md`, route-registry "reserved" rows, Aug-4 registry) contradict live state. | **LOW** | DOCUMENTATION |
| 11 | Duplicate role rows on person 234; template/experiment Workers awaiting cleanup. | **INFORMATIONAL** | DATA / OPERATIONS |

Security spot-check (bounded, evidence-only): RLS enabled across all `recoveryos` tables;
intake tables service-role-only with RPC-only writes (verify-intake-boundary, 21
invariants, CI-wired); `residence-intake` verify_jwt=false is intentional and layered
(origin allowlist/honeypot/caps/Turnstile-optional); `lead-intake` verify_jwt=false is
server-to-server with shared secret (per source comments); Grace/ICARE governance locks
verified present and CI-wired at `ec36922` (`check-no-retired-ref`, `icare-lock-verify`,
`check-icare-governance`, `grace-model-lock-verify`); no service-role key in any repo file
scanned; Support Now contacts governance-canon (human-verified on candidate). No new
concrete security defect found this session beyond advisor WARN (#9).

## M. Next actions (smallest ordered set)

1. **[HUMAN, read-only, minutes]** Establish ground truth on DNS: `dig NS vrcc.app` (or
   any public DNS tool) + load `https://vrcc.app` in a browser; note which app answers.
   Record both here.
2. **[HUMAN, Cloudflare dashboard, read-only]** In the Cloudflare account: (a) Domain
   Registration → confirm vrcc.app registrar account + its nameserver setting;
   (b) Websites → confirm whether ONE zone or two exist for vrcc.app and each zone's
   status/NS pair. This decides which of the three mismatch hypotheses is real.
3. **[THOMAS AUTHORIZATION]** Single reconciling change, depending on 2: either update the
   registrar's nameservers to the pending zone's pair (`candy`/`devin`) after confirming
   that zone holds ALL records (Worker binding + www CNAME + every email record), or —
   if an old ACTIVE zone still exists in-account — perform the cutover inside that zone
   instead and delete nothing. **No new zone; no registrar transfer; email records
   verified present before any delegation change.**
4. **[RO]** On zone ACTIVE: execute runbook steps 7–12 (smoke, continuity, routing,
   reset, intake 201, Support Now), then steps 16–17.
5. **[CODE]** Open PR: `claude/recoveryos-canonical-audit-1pvcwr` → `main`; after merge,
   set `main` as GitHub default branch.
6. **[GOVERNANCE]** Executive decision on the YKY legacy cohort (~26 accounts):
   sunset-with-notice vs invite-to-canonical; then schedule legacy-surface retirement
   sequencing (virtualrecovery stays until decided).
7. **[CODE, small]** Renumber + reconcile `115934d` against the Gate B document editions;
   land it.
8. **[CONFIG, small]** Enable leaked-password protection; verify Auth Site URL value
   (step 4) while in the dashboard.

Everything else (worker/template cleanup, recoveryos.pages.dev retirement, doc
supersessions, role-row tidy) is post-cutover hygiene, each under its own authorization.

---

*Prepared 2026-08-31 on branch `claude/recoveryos-state-reconciliation-7ed7so`. This
document supersedes prior state snapshots where they conflict; where it relies on
REPORTED or HUMAN VERIFIED evidence, the citation is inline. No prior document was
deleted or edited.*
