# RecoveryOS Canonical State (2026-08-31) — AUTHORITATIVE RECONCILIATION

> **Record note (2026-09-03, not part of the reconciliation text):** this edition
> incorporates the 2026-09-01 Controlling executive scope update and was committed to git
> on 2026-09-03 by executive direction; the prior edition remains in git history. Estate
> facts verified after 2026-09-01 (e.g. Worker redeployments on 09-01/09-02, later branch
> movement) are recorded in later commits and session records, not retrofitted here.

Full-estate VERIFY → RECONCILE → REPORT pass (no mutations). Evidence levels are marked
throughout: **VERIFIED** (live tool evidence this pass), **HUMAN VERIFIED** (executive
observation), **INFERRED** (deduced, stated why), **UNKNOWN**. This document supersedes
conflicting statements in older registries; the deployment registry and readiness document
remain as history with pointers here.

## Controlling executive scope update — 2026-09-01

This current explicit executive decision supersedes the priority and next-action assignments
in the older cutover sections below without deleting their historical evidence.

- **YKY and legacy public system:** frozen/out of scope. Do not access, inspect, migrate,
  reconcile, preserve, clean up, delete, retire, or conduct legacy-user continuity work.
- **Current RecoveryOS program:** CQCX active pilot, inactive intake foundation, canonical
  authority records, verified least-privilege design, and safe local/staged verification.
- **`vrcc.app`:** remains the intended future public address for RecoveryOS. Cutover is
  deferred—not retired—until the registrar/nameserver mismatch is explicitly resolved, the
  exact release is ready for controlled verification, and cutover is separately authorized.
- **Current priority effect:** DNS/registrar work and legacy continuity are removed from the
  near-term critical path. No additional YKY, legacy-user, registrar, zone, or route evidence
  is required for the current intake package.
- **No-action boundary:** no YKY access; no DNS, nameserver, registration, route, custom
  domain, Auth URL, legacy deployment, rollback, retirement, or account changes.

The prior DNS and legacy findings remain classified evidence only. They are not current work
assignments.

## Historical deployment evidence snapshot — 2026-09-01

This snapshot preserves verified deployment evidence. The controlling executive scope update
above governs priorities and permitted work.

| Surface or fact | Verified state |
| --- | --- |
| Repository lineage | `main` = `4959156`; canonical continuation = `7e2cece`, 64 commits ahead and 0 behind; no convergence action authorized |
| Canonical backend | CQCX `cqcxvwoukyhxyokfwnjm`; migration tail 0146 at the latest read-only verification |
| Active pilot | `recoveryos-staging`; last verified deployment `ec36922`; preserve unchanged |
| Production candidate | `gfa-eco-recovery-residence-os`; last verified deployment `ec36922`; not established as the public origin |
| Public apex and www | At 2026-09-01 09:25 UTC both returned the legacy “GFA VRCC” response and CSP connections to YKY; the underlying Worker route is not verified |
| Public delegation | Cloudflare DNS-over-HTTPS returned `ryan.ns.cloudflare.com` / `vera.ns.cloudflare.com`, SOA on `ryan` |
| Visible pending zone | A binding in the PENDING candy/devin zone is not proof of public cutover |
| Cutover | **BLOCKED** pending registrar/authoritative-zone reconciliation |

Second-account dashboard observations support this STOP decision but remain reported
evidence unless independently reproduced. They do not establish the live Worker route.

Do not change DNS, Worker routes/custom domains, Auth URLs, deployments, rollbacks,
repository refs or deployable source, migrations, YKY, or accounts from this evidence. No
registrar, zone, route, YKY, or legacy-user evidence is required in the current phase.

## A. Executive answer

1. **What is canonical RecoveryOS today?** The GFA-ECO monorepo platform (React 19 + TS +
   Vite, role workspaces) at commit `ef884b7`, running against Supabase **CQCX**
   (`cqcxvwoukyhxyokfwnjm`, RecoveryOS-Launch), deployed to two Workers:
   `recoveryos-staging` (active pilot) and `gfa-eco-recovery-residence-os` (production
   candidate) — both currently serving build `ec36922`.
2. **Authoritative repository:** `rcoiowa/GFA-ECO` (VERIFIED).
3. **Authoritative source continuation:** `claude/recoveryos-canonical-audit-1pvcwr` at
   **`7e2cece`** — 64 commits ahead of `main`, 0 behind; `main` remains at `4959156`
   (VERIFIED 2026-09-01). No convergence action is authorized by this record.
4. **Canonical production candidate:** Worker `gfa-eco-recovery-residence-os` (deploy
   commit `ec36922`, modified 2026-08-31T00:31Z, DEPLOYMENT VERIFIED; human smoke test
   PASS). This is not proof that public `vrcc.app` reaches it.
5. **Authoritative backend:** CQCX `cqcxvwoukyhxyokfwnjm` — ACTIVE_HEALTHY, PG17, ledger
   tail `0146_ejwrh_document_activation` (VERIFIED).
6. **Where are real users operating?** On `recoveryos-staging.thomas-499.workers.dev`
   against CQCX — 6 real/staff accounts, latest sign-in 12:26 UTC today (VERIFIED).
7. **What is vrcc.app currently serving publicly?** The apex and www returned the legacy
   “GFA VRCC” HTML response with YKY in the response CSP at 2026-09-01 09:25 UTC
   (VERIFIED). The exact underlying Worker route remains UNKNOWN.
8. **Cutover status: PARTIAL / BLOCKED at step 6.** Steps 1–5 complete (4 human-confirmed,
   5 verified); the step-6 Worker custom-domain binding was created in a **PENDING,
   non-authoritative zone** (expects candy/devin NS) and has **no public effect** because
   the live delegation is ryan/vera.
9. **Deferred domain condition:** the vrcc.app registrar/zone-delegation mismatch remains
   unresolved historical evidence. It must be explicitly resolved before a future cutover,
   but it is not a current RecoveryOS blocker or assignment.
10. **What next:** continue CQCX intake identity, consent, deadline, routing, notification,
    least-privilege, and staged-verification gates.

## B. Repository matrix

| Repository | Default | HEAD | Last activity | Type | Backend | Deploys to | Authority | Disposition | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| `rcoiowa/GFA-ECO` | main (stale) | continuation `7e2cece` / main `4959156` | 2026-09-01, intake + deployment-gate reconciliation | pnpm monorepo, React19+TS+Vite | **CQCX** | recoveryos-staging + gfa-eco-recovery-residence-os | **CANONICAL** | KEEP | VERIFIED |
| `Grace-For-Addictions/vrcc.app` | main | `83b2de6` (2026-08-16 chore; last real change 08-02) | legacy VRCC source | Base44-export React (Vite) | **YKY** `ykykeioydvtxpyreshhs` | public apex/www return its legacy YKY-pointing response; exact Worker route UNKNOWN | LEGACY-SOURCE (public response live) | **FREEZE** (rollback substrate) | SHA/backend ref + public response VERIFIED; route UNKNOWN |
| `Grace-For-Addictions/RecoveryResidenceOS` | main | `056d385` (2026-07-30: public directory, profiles, online application) | legacy residence system | React+TS worker | YKY (`gfa_residence`) | Worker `recovery-residence-os` | LEGACY-SOURCE | FREEZE; **MINE-check**: its public residence *profiles* concept — directory + application already superseded by canonical 0122 flows | VERIFIED |
| `Grace-For-Addictions/contact-connect-dashboard` | main | `c90e6d7` (2026-08-16 chore; real work 07-15/16: coaching MVP + BARC-10 intake) | prototype | Base44-style React | `yqonwnzqtgmnoiymkefk` (own project, INACTIVE in this org list? see §F) | Pages `gfaconnection` | LEGACY/EXPERIMENT (deprecation doc exists) | ARCHIVE-LATER; BARC-10 content governed by ICARE authority — never migrate its threshold logic | VERIFIED |
| `rcoiowa/Late-Night-Recovery-` | main | `4b65839` (2026-06-08, single commit, GH Pages workflow) | unrelated experiment | static | none | GitHub Pages | EXPERIMENT | ARCHIVE-LATER | VERIFIED |
| `rcoiowa/react-router-starter-template`, `vite-react-template2/3`, `Grace-For-Addictions/vite-react-template` | main | — | Aug 1–3 | dashboard-created starter templates (match the `vite-react-template*` Workers) | none | template Workers | EXPERIMENT | ARCHIVE-LATER | VERIFIED (list) |
| `GFAVRCC/icrco`, `GFAVRCC/ICRCO-` | — | — | 2026-03-03 (pre-dates RecoveryOS) | private | UNKNOWN | UNKNOWN | UNKNOWN | **INVESTIGATE** in a session with GFAVRCC as source (cross-tier add blocked here) | UNKNOWN |
| `GFAVRCC/grace-harbor-16` (Grace House site) | — | — | — | Lovable React (per registry) | `kmvlkvfxrjqrfxsljvxl` (per registry) | Pages `gracehouse4` | LEGACY-SOURCE (registry) | INVESTIGATE (not visible to this account; cross-tier) | UNKNOWN (registry-INFERRED) |

## C. GFA-ECO branch matrix (21 remote branches, VERIFIED)

Canonical line: **`claude/recoveryos-canonical-audit-1pvcwr` = `7e2cece`** (64 ahead of
main, 0 behind). `deploy-candidate/ejwrh-activation-ec36922` is a pure prefix (deploy
trigger record). `main` = `4959156` (2026-08-21) — **64 commits behind; STALE**; nothing on
main is missing from the canonical line.

Branches with commits not in the canonical line, judged by content:

| Branch | Unique vs canonical line | Verdict |
|---|---|---|
| `claude/consolidation-canonical-line-2026-08-18` | 1 commit `115934d` (2026-08-30!): adds `packages/residence-content/src/documents/residentRights.ts` so `/residence/documents/resident_rights` renders | **CANONICAL UNMERGED VALUE (partial)** — its assignment-creation rationale is superseded by Gate B (acks assign and complete fine in intake, live-verified), but the canonical line's resident Documents detail page gates on the static package and `residentRights.ts` IS missing → that route is NotFound in the deployed candidate. Action: **mine the one module** (recreate from the published DB version), do not merge the branch (it sits on stale main). |
| `claude/recoveryos-canonical-reconciliation-a25g21` | 1 audit-doc commit (08-18) | SUPERSEDED (historical audit; this document supersedes) |
| `claude/supabase-mcp-setup-6mbu2j` | 1 MCP-config commit (08-20) | SUPERSEDED (MCP works in the canonical environment) |
| `claude/recoveryos-greenfield-build-ka6992` | 14 commits (Aug 2–3): GH policy intake catalog, phase model, themes, ADR-0012, early CI | SUPERSEDED — policy intake lives in `docs/content-intake` on the canonical line; phase/docs/passes machinery rebuilt canonically; themes superseded by design tokens. (Registry once called this branch canonical — no longer true.) |
| `claude/what-is-built-here-3co21c` | 2 commits (08-01): early Worker deploy config | SUPERSEDED (root wrangler.jsonc) |
| `live-gate/run-001` | 29 commits (08-08): P4G/P4H work | SUPERSEDED BY CONTENT — `git diff` shows main's tree fully contains it (0 files unique) |
| All others (grace-eval/lock/compare, live-gate/run-002, intake-audit, residence-application-flow, public-support-onboarding, grace-coaching-audit, greenfield-8pns7n, supabase-mcp-setup-ep29rp) | 0 commits ahead of main | SUPERSEDED (run artifacts / absorbed lines) |

## D. Deployment matrix (Cloudflare account visible to tooling = the Workers account)

| Deployment | Platform | Deployed identity | Source | Backend | Domain(s) | Last modified | Real users | Authority | End-state |
|---|---|---|---|---|---|---|---|---|---|
| `recoveryos-staging` | Worker | commit `ec36922` (deploy-staging run 71) | GFA-ECO canonical line | CQCX (LIVE VERIFIED: today's signups/sign-ins land there) | workers.dev only | 08-31 00:28Z | **YES — ACTIVE PILOT** | CANONICAL pilot | Keep serving unchanged; 302→301 long after cutover |
| `gfa-eco-recovery-residence-os` | Worker | commit `ec36922` (candidate run 1; bundle guard passed) | GFA-ECO canonical line | CQCX | workers.dev; vrcc.app binding created in PENDING zone (publicly inert) | 08-31 00:31Z | Smoke-test only | CANONICAL production candidate | Intended future `vrcc.app` origin after deferred milestone gates |
| `virtualrecovery` | Worker | legacy VRCC build | `Grace-For-Addictions/vrcc.app` | **YKY** | public response is legacy; exact Worker route UNKNOWN | 08-16 | UNKNOWN without legacy access | LEGACY-FROZEN | Freeze/out of scope; no access, change, migration, or retirement |
| `vrcc-app` | Worker | UNKNOWN (created 08-02, modified 08-16 — same day as the repos' "backfill" chores) | likely `vrcc.app` repo | UNKNOWN | none known | 08-16 | UNKNOWN | UNKNOWN | INVESTIGATE (probably a duplicate legacy deploy) |
| `recovery-residence-os` | Worker | legacy residence build | RecoveryResidenceOS repo | YKY | workers.dev | 07-29 | historic | LEGACY | Freeze; archive-later |
| `vite-react-template{,2,3,5}` | Workers | starter stubs | template repos | none | none | Aug 1–2 | NO | EXPERIMENT | Archive-later |
| `recoveryos.pages.dev` | Pages (manual upload, project `recoveryos`) | early-Aug platform build, **no Git connection** (QUICKSTART Option 1, recorded 08-04) | GFA-ECO greenfield era | **YKY (INFERRED: that era's code fallback was YKY; CQCX did not exist until 08-07)** | recoveryos.pages.dev | ~08-04 | UNKNOWN (unpublicized) | STALE snapshot | Archive-later; nothing unique (predates Gate B and CQCX) |
| `gfa-vrcc.pages.dev` | Pages | stale legacy VRCC deploy (last ~07-08, per registry) | vrcc.app repo | YKY | gfa-vrcc.pages.dev (+ www.vrcc.app CNAME points here — see §E) | 07-08 | bookmarks possible | STALE | Archive-later |
| `gracehouse4.pages.dev` | Pages | Grace House site | grace-harbor-16 (INFERRED) | kmvlk… (registry) | gracehouse4.pages.dev | UNKNOWN | YES (public GH site) | LEGACY-LIVE | Keep until content absorbed |
| `gfaconnection.pages.dev` | Pages | Contact-Connect prototype | contact-connect-dashboard | yqonw… | gfaconnection.pages.dev | ~07-16 | prototype | LEGACY | Archive-later (deprecation doc exists) |
| CQCX Edge Functions | Edge | `residence-intake` **v2** (VERIFIED byte-equal to `ef884b7`, verify_jwt=false by design), `ejwrh` v2, `grace` v14, `grace-judge` v7, `lead-intake` v11, `grace-coaching-canary` v11, `create-meeting` v11 | GFA-ECO | CQCX | supabase.co functions | 08-31 (residence-intake) | ejwrh/residence-intake public | CANONICAL | Keep |

## E. Domain map

| Host | Public DNS (VERIFIED via system + 1.1.1.1 + 8.8.8.8) | Serving | Notes |
|---|---|---|---|
| `vrcc.app` | **NS = ryan/vera.ns.cloudflare.com (authoritative, SOA on ryan)**; apex → Cloudflare proxy IPs | Legacy VRCC app via `virtualrecovery` (INFERRED — confirm with one browser view) | The zone edited during cutover (candy/devin) is PENDING and publicly inert |
| `www.vrcc.app` | resolves (Cloudflare proxy) | per prior observation: CNAME → `gfa-vrcc.pages.dev` (**stale legacy Pages deploy**) | www serves an *older* build than the apex — pre-existing inconsistency, register entry §J |
| `recoveryos-staging.thomas-499.workers.dev` | workers.dev | canonical pilot (`ec36922`/CQCX) | ACTIVE PILOT |
| `gfa-eco-recovery-residence-os.thomas-499.workers.dev` | workers.dev | canonical candidate (`ec36922`/CQCX) | HUMAN VERIFIED smoke pass |
| `recoveryresidence.org` / `.app` | **do not resolve publicly (NXDOMAIN, VERIFIED)** | nothing | Zones/delegation never activated; the "public directory" origins in configs are prospective |
| `gracehouse4.pages.dev` | pages.dev | Grace House site | Legacy-live |
| `recoveryos.pages.dev` | pages.dev | stale manual snapshot | see §D |
| Email DNS (`vrcc.app` MX, `send.vrcc.app`, SPF/DKIM/TXT) | live records under the **ryan/vera** zone (INFERRED — they work today); copies preserved in the pending zone (HUMAN VERIFIED) | — | **Any zone-authority change must first prove email-record parity in the target zone** |

## F. Backend map (Supabase; org visible to tooling)

| Project | Ref | Status | Role | Referenced by |
|---|---|---|---|---|
| **RecoveryOS-Launch (CQCX)** | `cqcxvwoukyhxyokfwnjm` | ACTIVE_HEALTHY (created 08-07) | **CANONICAL** — `recoveryos` schema, ledger tail 0146; Auth = 66 users (60 fixture-domain, 6 real/staff, 1:1 person join, VERIFIED again this pass); 7 edge functions | staging Worker, candidate Worker, canonical repo, both deploy workflows (guards enforce) |
| Grace For Addictions (YKY) | `ykykeioydvtxpyreshhs` | **ACTIVE_HEALTHY — still the live backend of public vrcc.app** (legacy app) + RecoveryResidenceOS worker | retired *for RecoveryOS*, but NOT dormant: it backs current public production until cutover | vrcc.app repo (VERIFIED ref), RecoveryResidenceOS (VERIFIED ref), gfa-vrcc.pages.dev, recoveryos.pages.dev (INFERRED) — never accessed by this pass (standing prohibition) |
| contact-connect-dashboard | `vlsxjkqyaexcxwkbovlq` | INACTIVE | prototype project (note: the repo's code targets `yqonwnzqtgmnoiymkefk`, which is NOT in this org's project list — either another org or deleted; drift entry §J) | contact-connect repo |
| `kmvlkvfxrjqrfxsljvxl` (Grace House), `yqonwnzqtgmnoiymkefk` (GFA Connection) | — | **not in this account's project list** (VERIFIED absent) | external/other-org per migration README | gracehouse4, gfaconnection |

Canonical-bundle hygiene: the candidate deploy's in-workflow guard proved the deployed
assets contain the CQCX ref and no YKY ref; the same guard now protects staging deploys
(added 2026-08-31).

## G. Product capability matrix (canonical line `ef884b7` / deployed `ec36922`)

Legend: L+V = live/human verified this period · DEP = deployed, not human-verified ·
SRC = source-complete · PART = partial · NB = not built · LEG = legacy-only.

- **Participant:** onboarding/account (L+V — real signups today incl. confirmation
  emails), Today/check-ins (DEP; check_ins rows exist from real users), Connect /
  Support Now (L+V on candidate), Grace chat (DEP surface; **provider activation OFF by
  governance lock** — deliberate), messaging (DEP; 33 msgs/13 convs real), sessions/
  bookings (DEP; live rows), Getting Settled intake view incl. e-consent + sign + paper
  path (L+V via SQL E2E + component tests; browser-verified on staging by pilots),
  Recovery Capital / My Recovery / My Journey / goals / plans (SRC-PART; tables live,
  0 real rows yet), resources/learning (SRC), notifications (DEP; DB-driven),
  profile/privacy-consent (L+V — consents granted by real users).
- **Coach:** home/roster/participant detail/requests/sessions/follow-ups/messaging (DEP;
  coaching_relationships live with real links; get_my_participants LIVE VERIFIED).
- **Navigator:** people/needs/referrals/relationships (SRC-DEP; tables + role live; light
  real use).
- **Resident:** dashboard/My Residence/house board/schedule (DEP-SRC), documents +
  acknowledgments/signatures (L+V machinery; **known gap:** `/residence/documents/
  resident_rights` NotFound — §C unmerged value), grievances (DEP; scoped RLS verified by
  preflight), phase/status (DEP).
- **Residence staff/operator:** applications + intake queue + conversion + readiness
  checklist + admission (L+V — full rolled-back live E2E on both residences), screening
  consent flows (L+V), beds (DEP), incidents/fees (DEP; append-only/RPC posture verified),
  grievances (DEP), compliance/reporting (SRC-PART), messaging (DEP).
- **Admin/executive:** people/roles/audit/evidence/directory submissions (DEP; P4G
  machinery verified by preflight step 7; admin UI human-used on staging).
- **Public/infrastructure:** residence directory page (DEP at `/residence/directory/`),
  public EJWRH application portal + residence-intake receiver (LIVE FUNCTION VERIFIED),
  Grace House public site (LEGacy-live on gracehouse4), recoveryresidence.org (**NB as a
  domain** — does not resolve), vrcc.app (legacy app until cutover).

## H. Real users vs fixtures (re-verified this pass)

66 auth users = 60 `@fixtures.recoveryos.test` (AUTOMATED FIXTURE — convention re-verified
reliable; includes 2 fixtures holding admin/exec roles for tests) + 6 real-domain accounts:
2 AUTHORIZED STAFF (graceforaddictions.org), 4 REAL USERS (created 08-31; latest sign-in
12:26Z today). 1:1 auth↔person integrity intact both directions. No cleanup exists that
targets accounts by anything other than explicit identification; any future fixture cleanup
must key on the fixture domain **only** and requires separate authorization. Nothing
deleted or altered.

## I. Historical cutover runbook state — deferred and frozen

This section records prior work only. It is not an active runbook under the controlling
executive scope update.

| Step | State |
|---|---|
| 1 pre-cutover verification | COMPLETE + VERIFIED (CI 123 green on ed045e8; preflight PASS) |
| 2 rollback reference | COMPLETE + VERIFIED (worker ids/timestamps recorded) |
| 3 Auth allowlist | COMPLETE + HUMAN VERIFIED (3 origins PRESENT) |
| 4 Site URL → vrcc.app | COMPLETE (HUMAN CONFIRMED; not tool-verifiable) — **see side-effect HIGH-2 (§L)** |
| 5 residence-intake redeploy | COMPLETE + VERIFIED (v2 ACTIVE, byte-equal to `ef884b7`, verify_jwt=false preserved) |
| 6 vrcc.app binding | **BLOCKED** — binding created in the PENDING candy/devin zone; public DNS remains ryan/vera → no production effect |
| 7–12 smoke battery on vrcc.app | NOT STARTED (invalid until zone authoritative) |
| 13–14 rollback | AVAILABLE (legacy Worker intact; Site URL revert is one field) |
| 15 staging coexistence | PRESERVED + VERIFIED (pilot signing in today) |
| 16–17 monitoring/comms | NOT STARTED |

## J. Drift / contradiction register

1. **Zone authority.** CLAIM A (Cloudflare dashboard during step 6): vrcc.app →
   gfa-eco-recovery-residence-os. CLAIM B (public DNS): ryan/vera zone authoritative,
   binding inert. EVIDENCE: NS/SOA from three resolvers. TRUTH: B. CORRECTION: cutover is
   BLOCKED, not complete; readiness/deployment records already say so; resolve the
   zone/account split (§M).
2. **www.vrcc.app ≠ apex.** www CNAMEs to the STALE `gfa-vrcc.pages.dev` while the apex
   serves the newer legacy Worker. TRUTH: pre-existing inconsistency. CORRECTION: at
   cutover, bind www to the candidate Worker too (runbook step 6 already says so).
3. **`main` looks canonical but is 61 commits stale.** TRUTH: the canonical line is
   `claude/recoveryos-canonical-audit-1pvcwr`. CORRECTION: fast-forward main (a later,
   separately authorized act) — until then this document is the pointer.
4. **A 2026-08-30 commit landed on a non-canonical branch** (`115934d` on
   consolidation-canonical-line) while canonical work was in flight — partial real value
   (§C). CORRECTION: mine the module into the canonical line; treat side-branch commits to
   stale bases as a process risk.
5. **QUICKSTART (08-04) says deploy-staging.yml targets `gfa-eco-recovery-residence-os`.**
   TRUTH today: deploy-staging targets `recoveryos-staging`; the candidate has its own
   workflow. CORRECTION: QUICKSTART is historical; marked by this document.
6. **Old registries name YKY as canonical/shared.** TRUTH: CQCX is canonical since 08-08;
   YKY remains the *legacy-production* backend behind vrcc.app until cutover. CORRECTION:
   recorded here; both statements were true at their times.
7. **contact-connect targets `yqonw…` but the org's project list has `vlsxjkqyaexcxwkbovlq`
   (INACTIVE) named contact-connect.** TRUTH: the repo's baked project is not in this
   account's org — other org or deleted. CORRECTION: INVESTIGATE only if that prototype's
   data ever matters; deprecation doc already recommends against migration.
8. **"66 pilot users."** Corrected earlier: 60 fixtures + 6 real/staff (re-verified).
9. **Worker names mislead** (`gfa-eco-recovery-residence-os` is the whole platform;
   `vrcc-app` Worker is NOT vrcc.app's server). CORRECTION: naming note recorded; renames
   are cosmetic and deferred (renaming production resources is out of scope).

## K. Unreconciled value outside the canonical line

1. `115934d` residentRights.ts module (§C) — small, real, mine it.
2. RecoveryResidenceOS public residence *profiles* (07-30) — concept not yet in the
   canonical public directory; MINE-check when the public directory becomes a priority.
3. Grace House public site content (gracehouse4/grace-harbor-16) — inaccessible from this
   session; canonical repo carries reconciled GH *policy* content, but the public *website*
   remains legacy-hosted.
4. GFAVRCC private repos (icrco/ICRCO-, 2026-03) — unknown; likely pre-RecoveryOS
   experiments; investigate once, then archive.
5. Legacy YKY data — frozen/out of scope. No census, migration, preservation, cleanup,
   deletion, or retirement work is assigned without a new explicit executive decision.

## L. Historical blockers — removed from the current critical path

The table below preserves the 2026-08-31 cutover assessment. Its DNS, Auth, legacy, and
domain actions are deferred and unauthorized in the current program.

| # | Severity | Class | Blocker | Minimum action |
|---|---|---|---|---|
| 1 | **CRITICAL** | DNS/CLOUDFLARE/DOMAIN | vrcc.app zone split (REFINED — see Zone follow-up addendum): the live ryan/vera zone is alive and serving but is NOT the visible account's zone (candy/devin, PENDING, holds the inert step-6 binding); leading hypothesis: live zone under a different Cloudflare login | Thomas: complete the Registrar → Manage Domains → vrcc.app check (decisive); then choose Path A (repoint apex record in the live zone — minimal change) or Path B (registrar delegation → candy/devin, after email-parity + www re-point). Do NOT create a third zone; do NOT change anything until the registrar evidence is in. |
| 2 | **HIGH** | AUTH/OPERATIONS | Site URL now `https://vrcc.app` while vrcc.app publicly serves the legacy app → new signup confirmation emails land users on the legacy app (confirmation itself still completes at Supabase; the landing is wrong/confusing) | Either resolve #1 promptly, or revert Site URL to the staging origin until cutover unblocks (single field; REQUIRES AUTHORIZATION) |
| 3 | MEDIUM | CODE | `/residence/documents/resident_rights` NotFound in deployed candidate (missing residence-content module) | Mine `residentRights.ts` (from the published DB v2.0 body) into the canonical line; redeploy with the next build |
| 4 | MEDIUM | DOCUMENTATION/GOVERNANCE | `main` 61 commits stale; a stray commit landed on a side branch | Fast-forward main to the canonical line at the next natural point (REQUIRES AUTHORIZATION; branch-protection choice), and treat the canonical line as the only base for new work |
| 5 | LOW | CLOUDFLARE | Unknown `vrcc-app` Worker + template Workers clutter | Investigate/rename-later; no action now |
| 6 | LOW | DOMAIN | www.vrcc.app → stale Pages deploy | Fold into cutover step 6 (bind www with apex) |
| 7 | INFORMATIONAL | DATA | recoveryresidence.org/.app do not resolve | Prospective domains; activate only as a separate decision |
| 8 | INFORMATIONAL | GOVERNANCE | GFAVRCC repos unreachable cross-tier | Investigate from a GFAVRCC-sourced session once |
| 9 | MEDIUM | DNS/OPERATIONS | No public email DNS for vrcc.app (no MX/SPF/DKIM/DMARC anywhere in the live zone; records staged only in the inert pending zone) while `notify-fanout` sends from `notify@vrcc.app` → degraded notification deliverability today (pre-existing; Supabase auth emails unaffected) | Add the staged email records to whichever zone ends up authoritative (folds into Path A or B); until then expect notification emails to spam-fold |

## M. Current ordered action set

1. Preserve the CQCX active pilot and production-candidate distinction.
2. Continue the inactive Contact Connect intake foundation and canonical authority records.
3. Verify the five intake identities and least-privilege membership/routing mappings.
4. Ratify required/optional consent, deadline, round-robin, routing, and minimal-alert policy.
5. Complete local negative authorization tests and safe staged verification before any
   activation proposal.
6. Keep YKY and legacy work frozen. Keep `vrcc.app` as a deferred future milestone until
   registrar/nameserver reconciliation and release readiness are separately established.

## Zone follow-up addendum (2026-08-31, second pass — refined diagnosis)

**New human evidence:** ONE visible Cloudflare account holds all four zones (vrcc.app
[PENDING, candy/devin], recoveryresidence.app, recoveryresidence.org,
justgraceforaddictions.org) AND all four relevant Workers; no second account selector in
that session; the vrcc.app zone's Worker Routes page is empty; recoveryos-staging has no
custom domains.

**Evidence correction (owed):** the first pass asserted the ryan/vera NS finding as
"verified via three resolvers" without a recorded NS query — the recorded probes were
A-records only. It has now been genuinely verified: recursive NS = ryan/vera, SOA primary
ryan (serial 2411666283). Additionally discovered: this container intercepts port 53, so
"direct" queries to any nameserver return recursive answers (aa=false) — direct
authoritative probing is impossible from here; recursive-view findings below are still
decisive where noted.

**New DNS facts (VERIFIED via recursive resolution):**

1. **The ryan/vera zone is ALIVE and actively served** — a never-before-queried random
   label under vrcc.app returned authoritative NXDOMAIN through recursion, which requires
   a live authoritative zone. It is not a deleted-zone remnant and delegation is not
   dangling.
2. **The live zone serves no email records at all**: apex MX — none; apex TXT/SPF — none;
   `send.vrcc.app` — NXDOMAIN; `_dmarc` — NXDOMAIN. The MX/SPF/DKIM records observed
   during cutover exist only in the PENDING zone and are publicly inert.
   Consequence: `notify-fanout` sends from `notify@vrcc.app` with no public SPF/DKIM →
   degraded deliverability today (pre-existing; unrelated to the cutover; Supabase auth
   emails use Supabase's sender and are unaffected). New blocker L-9.
3. The live zone publicly serves only proxied A answers for apex and www.

**Hypothesis status (the four options posed):**

1. *Stale registrar delegation after zone delete/re-add (old zone gone)* — **REFUTED**:
   a deleted zone stops being served; this zone answers live.
2. *Zone re-assignment inside the same account* — **NOT SUPPORTED**: the visible account
   shows exactly one vrcc.app zone (candy/devin PENDING), and Cloudflare does not hold two
   zone objects for one domain in one account.
3. *Older hidden/deactivated zone state* — **REFUTED**: deactivated zones do not serve;
   this one does.
4. *Another supported registrar/zone mismatch* — **LEADING HYPOTHESIS**: the live
   ryan/vera zone exists under a **different Cloudflare login/account** (the dashboard
   account selector only lists accounts the current login belongs to — an old email,
   Base44-era, or partner login would be invisible). Supporting mechanics: the visible
   account shows no route/custom-domain carrying vrcc.app traffic, yet `virtualrecovery`
   (this account) serves it — exactly what a **proxied CNAME in the other-account live
   zone → `virtualrecovery.thomas-499.workers.dev`** would produce (cross-account proxied
   CNAMEs to workers.dev are supported and flatten to the proxy A records we observe;
   www → `gfa-vrcc.pages.dev` the same way).

**Decisive next check (in progress, Thomas):** Registrar / Domain Registration → Manage
Domains → vrcc.app — (a) is the registration in this account at all, and (b) what
nameservers does the registration record carry. If the registration is absent there, the
domain (registrar + live zone) lives under another login. If present with ryan/vera NS,
Cloudflare support can say which account those were assigned to.

**Candidate resolution paths (for later authorization — listed, not recommended-executed):**

- **Path A (minimal change):** locate the login holding the live zone; complete the
  cutover *in that zone* by repointing the existing apex record from
  `virtualrecovery.thomas-499.workers.dev` to
  `gfa-eco-recovery-residence-os.thomas-499.workers.dev` (and www alongside) — the same
  serving mechanism vrcc.app uses today; rollback is repointing back; email records should
  then be added to the live zone (they are already drafted in the pending zone).
- **Path B (consolidation):** keep the visible account authoritative — change the
  registrar delegation to candy/devin, activating the PENDING zone (the step-6 custom
  domain then goes live). Preconditions: registrar access, email-record parity (staged ✓),
  and re-pointing the pending zone's www record (it currently targets the stale
  `gfa-vrcc.pages.dev`).

Cutover remains paused at step 6; posture unchanged (staging = ACTIVE PILOT untouched,
candidate ready, virtualrecovery intact as rollback, no retired-backend access, no code
work, no mutations performed in this pass).

## DELTA / CONTRADICTION ADDENDUM (2026-08-31, third pass)

Reconciles this record against (a) newer human-observed Cloudflare evidence and (b) the
**parallel reconciliation report `f45f714`** (branch
`claude/recoveryos-state-reconciliation-7ed7so`, built atop `115934d`, main+2) — a separate
session's read-only report, now accepted by the Executive Director as an evidence source.
It is NOT this session's work; where it reports things this session was prohibited from
doing (YKY census), its findings are preserved at reported-evidence level without expansion.

### 1. New evidence (human-observed, Cloudflare account home)

One visible account holds zones vrcc.app (PENDING, expects candy/devin),
recoveryresidence.app, recoveryresidence.org, justgraceforaddictions.org — and Workers
gfa-eco-recovery-residence-os, recoveryos-staging, vrcc-app, virtualrecovery. No second
account selector visible in that session. The vrcc.app zone's Worker Routes page: none
configured; its DNS table shows a root Worker custom-domain record →
gfa-eco-recovery-residence-os — **inside the PENDING zone, therefore not proof of public
cutover**. recoveryos-staging: workers.dev only, no custom domains/routes (consistent with
ACTIVE PILOT).

### 2. Findings still valid (re-affirmed)

Public delegation = ryan/vera (recursive NS/SOA, serial 2411666283); a fresh-random-label
query returns authoritative NXDOMAIN — **a live zone answers for vrcc.app right now**; the
live zone serves no email records (apex MX/TXT none; send/_dmarc NXDOMAIN); both canonical
Workers at `ec36922`; residence-intake v2 verified byte-equal to repo head; CQCX census
66 = 60 fixtures + 6 real/staff; cutover PARTIAL/BLOCKED at step 6; staging untouched;
`main` 61 commits behind the canonical line; recoveryos.pages.dev = stale manual zip
upload (~08-04), no Git connection. **Newly verified this pass:** the GitHub **default
branch setting** is `claude/supabase-mcp-setup-ep29rp` (the stale July setup branch) — the
"four-file husk" claim is CURRENT truth. Four distinct concepts, not to be collapsed:
default-branch setting (stale husk) ≠ branch `main` (61 behind) ≠ canonical working line
(`…canonical-audit-1pvcwr`, HEAD `ef884b7`+docs) ≠ deployed source (`ec36922`).

### 3. Findings downgraded

- "Leading hypothesis: second Cloudflare account" → **downgraded to one of four open
  hypotheses, not currently evidenced** (no second account selector observed). All four
  remain open: (1) stale registrar delegation to an older ryan/vera assignment; (2) zone
  delete/re-add with delegation left on the old pair; (3) an older
  hidden/deactivated/orphaned zone state; (4) a second account. Standing constraint the
  registrar screen must explain: hypotheses 2 and 3, as normally understood, predict the
  ryan/vera servers would stop answering — yet a live zone demonstrably serves; this
  tension is recorded, not resolved.
- "vrcc.app apex is served via a cross-account proxied CNAME to virtualrecovery" →
  **downgraded to speculation**; what publicly serves vrcc.app remains INFERRED-legacy
  pending one human browser check.
- recoveryos.pages.dev backend "YKY-era" → remains **INFERRED ("possibly YKY-pointing")**,
  not upgradable without deployment evidence.
- Auth Site URL "= https://vrcc.app" → **downgraded to UNVERIFIED** (set during cutover
  step 4 per human confirmation, but current live value must be human-re-verified).
  Conditional operational warning stands: if it is still `https://vrcc.app`, CQCX
  confirmation links may land on the legacy public surface until cutover completes. Do
  not change without authorization.

### 4. New material finding (from `f45f714`, preserved at reported-evidence level)

The parallel report described approximately 26 real-domain YKY accounts with recent sign-ins.
That remains reported evidence only. Leadership believes YKY is predominantly test data,
but neither claim will be investigated or resolved in this phase. No legacy-user continuity
gate, census, migration, preservation, contact, cleanup, deletion, or retirement work is on
the current critical path. YKY remains frozen and must not be accessed.

Also from `f45f714`: the `115934d` rights-acknowledgment commit carries a **migration
0125 numbering collision** against the canonical line — reinforcing the standing verdict:
real value (residentRights content), **must NOT merge or cherry-pick as-is**; no
renumbering, no consolidation PR, no default-branch change, no merge of the audit line
into main until separately authorized.

### 5. Historical cutover blocker (deferred)

Cloudflare registrar/zone delegation mismatch: registry delegation ryan/vera (live,
serving) vs the visible account's PENDING candy/devin zone (holds the inert step-6
binding and the staged email records).

### 6. Current evidence needed

No registrar, zone, route, YKY, or legacy-user evidence is required in the current phase.
The next evidence belongs to the intake package: verified CQCX identities and explicit
consent, deadline, routing, round-robin, and notification decisions.

### 7. No-action list (explicit)

No code, DNS, Auth, Supabase, Git (merge/default-branch/cherry-pick/PR/renumber),
deployment, migration, fixture-cleanup, or retirement action occurs yet. No zone
deletion/recreation/transfer, no route creation, no nameserver change, no rollback merely
because the pending-zone binding is inert, no virtualrecovery changes, no YKY access, no
legacy-user contact. The only change made this pass is this documentation addendum.

RECOVERYOS CURRENT STATE — DELTA
Overall: YELLOW
Canonical RecoveryOS: unchanged (GFA-ECO · canonical-audit line · CQCX)
Active pilot: unchanged (recoveryos-staging, untouched)
Production candidate: unchanged (gfa-eco-recovery-residence-os @ ec36922)
Public vrcc.app: future RecoveryOS address; current cutover DEFERRED
Cutover: deferred milestone; no action authorized
Cloudflare diagnosis: preserved historical evidence; not current work
YKY / legacy cohort: frozen and out of scope; no continuity gate in this phase
Immediate next action: intake identity and policy verification on CQCX

## Evidence limitations

Cloudflare zones/DNS records/Pages projects are not enumerable with available tooling
(Workers list/read only) — zone conclusions rest on public DNS (strong) + human dashboard
observations; what vrcc.app *serves* needs one human browser check; Supabase Auth settings
remain dashboard-only; YKY was not accessed (prohibition); GFAVRCC private repos
unreachable cross-tier; container egress blocks fetching any public page.
