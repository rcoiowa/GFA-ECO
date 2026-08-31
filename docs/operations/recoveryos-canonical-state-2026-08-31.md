# RecoveryOS Canonical State (2026-08-31) — AUTHORITATIVE RECONCILIATION

Full-estate VERIFY → RECONCILE → REPORT pass (no mutations). Evidence levels are marked
throughout: **VERIFIED** (live tool evidence this pass), **HUMAN VERIFIED** (executive
observation), **INFERRED** (deduced, stated why), **UNKNOWN**. This document supersedes
conflicting statements in older registries; the deployment registry and readiness document
remain as history with pointers here.

## A. Executive answer

1. **What is canonical RecoveryOS today?** The GFA-ECO monorepo platform (React 19 + TS +
   Vite, role workspaces) at commit `ef884b7`, running against Supabase **CQCX**
   (`cqcxvwoukyhxyokfwnjm`, RecoveryOS-Launch), deployed to two Workers:
   `recoveryos-staging` (active pilot) and `gfa-eco-recovery-residence-os` (production
   candidate) — both currently serving build `ec36922`.
2. **Authoritative repository:** `rcoiowa/GFA-ECO` (VERIFIED).
3. **Authoritative branch/commit:** `claude/recoveryos-canonical-audit-1pvcwr` at
   **`ef884b7`** — 61 commits ahead of `main`, 0 behind; `main` (at `4959156`, 2026-08-21)
   is 61 commits STALE and must not be treated as canonical until fast-forwarded (VERIFIED).
4. **Authoritative deployment:** Worker `gfa-eco-recovery-residence-os` (deploy commit
   `ec36922`, modified 2026-08-31T00:31Z, DEPLOYMENT VERIFIED; human smoke test PASS).
5. **Authoritative backend:** CQCX `cqcxvwoukyhxyokfwnjm` — ACTIVE_HEALTHY, PG17, ledger
   tail `0146_ejwrh_document_activation` (VERIFIED).
6. **Where are real users operating?** On `recoveryos-staging.thomas-499.workers.dev`
   against CQCX — 6 real/staff accounts, latest sign-in 12:26 UTC today (VERIFIED).
7. **What is vrcc.app currently serving publicly?** Public DNS (three independent
   resolvers) delegates vrcc.app to **ryan/vera.ns.cloudflare.com**, resolving to
   Cloudflare proxy IPs (VERIFIED). The application behind it is the **legacy VRCC app via
   Worker `virtualrecovery`** (INFERRED: the authoritative zone was not the one edited
   during cutover, so pre-cutover serving is unchanged; last direct observation was the
   legacy app; container egress prevents fetching the page — one human browser check
   confirms).
8. **Cutover status: PARTIAL / BLOCKED at step 6.** Steps 1–5 complete (4 human-confirmed,
   5 verified); the step-6 Worker custom-domain binding was created in a **PENDING,
   non-authoritative zone** (expects candy/devin NS) and has **no public effect** because
   the live delegation is ryan/vera.
9. **Single largest blocker:** the vrcc.app **zone/registrar split** — the live zone
   (ryan/vera) is not the zone (candy/devin, PENDING) in which the cutover binding was
   created, almost certainly an account-level split (see §J/§L). Cloudflare-account
   dashboard access, which only Thomas has, is required to resolve it.
10. **What next:** (i) decide the Site-URL interim posture (it now points at vrcc.app,
    which still serves the legacy app — new signups' confirmation emails land there);
    (ii) identify which Cloudflare account holds the domain registration and the ryan/vera
    zone; (iii) reconcile zone→account so the candidate Worker and the authoritative zone
    live in the same account, then re-run cutover steps 6–17. Ordered actions in §M.

## B. Repository matrix

| Repository | Default | HEAD | Last activity | Type | Backend | Deploys to | Authority | Disposition | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| `rcoiowa/GFA-ECO` | main (stale) | working `ef884b7` / main `4959156` | 2026-08-31, cutover + reconciliation | pnpm monorepo, React19+TS+Vite | **CQCX** | recoveryos-staging + gfa-eco-recovery-residence-os | **CANONICAL** | KEEP | VERIFIED |
| `Grace-For-Addictions/vrcc.app` | main | `83b2de6` (2026-08-16 chore; last real change 08-02) | legacy VRCC prod source | Base44-export React (Vite) | **YKY** `ykykeioydvtxpyreshhs` | Worker `virtualrecovery` → vrcc.app (public prod today) | LEGACY-SOURCE (live) | **FREEZE** (rollback substrate) | VERIFIED (SHA+backend ref) |
| `Grace-For-Addictions/RecoveryResidenceOS` | main | `056d385` (2026-07-30: public directory, profiles, online application) | legacy residence system | React+TS worker | YKY (`gfa_residence`) | Worker `recovery-residence-os` | LEGACY-SOURCE | FREEZE; **MINE-check**: its public residence *profiles* concept — directory + application already superseded by canonical 0122 flows | VERIFIED |
| `Grace-For-Addictions/contact-connect-dashboard` | main | `c90e6d7` (2026-08-16 chore; real work 07-15/16: coaching MVP + BARC-10 intake) | prototype | Base44-style React | `yqonwnzqtgmnoiymkefk` (own project, INACTIVE in this org list? see §F) | Pages `gfaconnection` | LEGACY/EXPERIMENT (deprecation doc exists) | ARCHIVE-LATER; BARC-10 content governed by ICARE authority — never migrate its threshold logic | VERIFIED |
| `rcoiowa/Late-Night-Recovery-` | main | `4b65839` (2026-06-08, single commit, GH Pages workflow) | unrelated experiment | static | none | GitHub Pages | EXPERIMENT | ARCHIVE-LATER | VERIFIED |
| `rcoiowa/react-router-starter-template`, `vite-react-template2/3`, `Grace-For-Addictions/vite-react-template` | main | — | Aug 1–3 | dashboard-created starter templates (match the `vite-react-template*` Workers) | none | template Workers | EXPERIMENT | ARCHIVE-LATER | VERIFIED (list) |
| `GFAVRCC/icrco`, `GFAVRCC/ICRCO-` | — | — | 2026-03-03 (pre-dates RecoveryOS) | private | UNKNOWN | UNKNOWN | UNKNOWN | **INVESTIGATE** in a session with GFAVRCC as source (cross-tier add blocked here) | UNKNOWN |
| `GFAVRCC/grace-harbor-16` (Grace House site) | — | — | — | Lovable React (per registry) | `kmvlkvfxrjqrfxsljvxl` (per registry) | Pages `gracehouse4` | LEGACY-SOURCE (registry) | INVESTIGATE (not visible to this account; cross-tier) | UNKNOWN (registry-INFERRED) |

## C. GFA-ECO branch matrix (21 remote branches, VERIFIED)

Canonical line: **`claude/recoveryos-canonical-audit-1pvcwr` = `ef884b7`** (61 ahead of
main, 0 behind). `deploy-candidate/ejwrh-activation-ec36922` is a pure prefix (deploy
trigger record). `main` = `4959156` (2026-08-21) — **61 commits behind; STALE**; nothing on
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
| `gfa-eco-recovery-residence-os` | Worker | commit `ec36922` (candidate run 1; bundle guard passed) | GFA-ECO canonical line | CQCX | workers.dev; vrcc.app binding created in PENDING zone (publicly inert) | 08-31 00:31Z | Smoke-test only | CANONICAL production candidate | Becomes vrcc.app |
| `virtualrecovery` | Worker | legacy VRCC build | `Grace-For-Addictions/vrcc.app` | **YKY** | **vrcc.app (public production today — INFERRED, one browser check confirms)** | 08-16 | **YES (public)** | LEGACY-LIVE | Rollback substrate; freeze; retire only after stable cutover |
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

## I. Cutover runbook state (verified, not copied)

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
5. Legacy YKY data — out of scope of this pass (prohibited); a future authorized
   YKY→CQCX data-disposition review remains on the long-term list before YKY can ever be
   truly retired.

## L. Blockers

| # | Severity | Class | Blocker | Minimum action |
|---|---|---|---|---|
| 1 | **CRITICAL** | DNS/CLOUDFLARE/DOMAIN | vrcc.app zone/registrar split: live zone ryan/vera vs pending candy/devin zone holding the cutover binding; likely two Cloudflare accounts | Thomas (dashboard): identify which account holds the **Registrar registration** and the ryan/vera zone; then either (a) Cloudflare's move-domain-between-accounts path so registration+zone+Workers share one account, or (b) if both zones turn out to be in one account, delete the pending duplicate and bind the custom domain in the active zone. **Before any authority change: verify email DNS record parity in the target zone.** Do NOT create a third zone; do NOT leave email records behind. |
| 2 | **HIGH** | AUTH/OPERATIONS | Site URL now `https://vrcc.app` while vrcc.app publicly serves the legacy app → new signup confirmation emails land users on the legacy app (confirmation itself still completes at Supabase; the landing is wrong/confusing) | Either resolve #1 promptly, or revert Site URL to the staging origin until cutover unblocks (single field; REQUIRES AUTHORIZATION) |
| 3 | MEDIUM | CODE | `/residence/documents/resident_rights` NotFound in deployed candidate (missing residence-content module) | Mine `residentRights.ts` (from the published DB v2.0 body) into the canonical line; redeploy with the next build |
| 4 | MEDIUM | DOCUMENTATION/GOVERNANCE | `main` 61 commits stale; a stray commit landed on a side branch | Fast-forward main to the canonical line at the next natural point (REQUIRES AUTHORIZATION; branch-protection choice), and treat the canonical line as the only base for new work |
| 5 | LOW | CLOUDFLARE | Unknown `vrcc-app` Worker + template Workers clutter | Investigate/rename-later; no action now |
| 6 | LOW | DOMAIN | www.vrcc.app → stale Pages deploy | Fold into cutover step 6 (bind www with apex) |
| 7 | INFORMATIONAL | DATA | recoveryresidence.org/.app do not resolve | Prospective domains; activate only as a separate decision |
| 8 | INFORMATIONAL | GOVERNANCE | GFAVRCC repos unreachable cross-tier | Investigate from a GFAVRCC-sourced session once |

## M. Smallest ordered action set to finish convergence

1. **[Thomas, dashboard]** Resolve blocker 1 (zone/account) — everything else waits on it.
2. **[Thomas, one field]** Interim Site-URL decision (blocker 2) if #1 will take more than
   a day or two.
3. **[Code, canonical line]** Mine `residentRights.ts` (blocker 3) so the next deploy
   closes the one known UI gap.
4. **[Resume runbook]** Re-run step 6 in the authoritative zone (apex + www), then steps
   7–17 exactly as written.
5. **[After stable cutover]** Fast-forward `main`; then the already-documented
   coexistence/wind-down plan (staging serves → 302 → 301; legacy Workers frozen; YKY
   disposition review as its own future gate).

No new deployment surface, backend, branch, or architecture is needed for any of this.

## Evidence limitations

Cloudflare zones/DNS records/Pages projects are not enumerable with available tooling
(Workers list/read only) — zone conclusions rest on public DNS (strong) + human dashboard
observations; what vrcc.app *serves* needs one human browser check; Supabase Auth settings
remain dashboard-only; YKY was not accessed (prohibition); GFAVRCC private repos
unreachable cross-tier; container egress blocks fetching any public page.
