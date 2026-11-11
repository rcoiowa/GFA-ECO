# Source-of-Truth Assessment — 2026-11-11

**Assignment:** GFA Recovery Infrastructure Stabilization, Prompt 1 (read-only discovery:
"establish what exists"). This document records findings only. It authorizes nothing,
decides nothing, and does not supersede any ratified governance.

**Relation to prior registers:** extends the Phase A discovery set in this directory
(2026-08-04) and the later dated audits; it does not replace them. Evidence classes follow
the ratified GFA Institutional Evidence Ledger
(`docs/governance/gfa-project-knowledge-authority-protocol-v1.0.md`, §3, ratified
2026-09-03): **A** Primary/Legal · **B** Verified Operational Evidence · **C**
Leadership-Confirmed · **D** Reported/Historical · **E** Inferred · **F** Unknown.
Lifecycle statuses are used exactly as established: Proposed, Approved, Implemented,
Deployed, Verified In Production, Archived.

**Session evidence basis (what this assessment could actually reach):**

- Full read access to `rcoiowa/GFA-ECO` at `main` = `claude/stoic-pasteur-wn7sdp`
  HEAD `6aaa532` (2026-11-10), plus remote branch/PR metadata via the GitHub API.
- Unauthenticated HTTP probes of public domains, including each domain's
  `/release.json` manifest and the served production JS bundle.
- Local execution of the repository's own read-only governance verification scripts.
- **Not reachable this session:** Supabase live state (MCP unauthenticated), the
  Cloudflare account configuration (no token; no MCP), Wix internals, repositories
  outside `rcoiowa/GFA-ECO`, and any executed paper agreements.

---

## 1. What is deployed (Class B — runtime evidence, verified 2026-11-11)

Every probe below was performed this session. Content lengths and bundle names were
compared directly.

| Domain | Observed response | `/release.json` |
| --- | --- | --- |
| `vrcc.app`, `www.vrcc.app` | RecoveryOS platform shell ("VRCC — Virtual Recovery Community Center", bundle `index-DGeObB_M.js`) | `release=4990829e…`, `supabaseProject=cqcxvwoukyhxyokfwnjm` |
| `recoverycommunity.center`, `recoverycommunity.app` | identical platform shell (same bytes) | same |
| `recoveryresidence.app` | identical platform shell | same |
| `recoveryresidence.org` | "RecoveryResidence.org — National Recovery Housing Directory" entrance page (host-routed) | same |
| `recoveryos-staging.thomas-499.workers.dev` | identical platform shell | same |
| `vrcc.app/api/weather/des-moines` | HTTP 200, small JSON (weather endpoint live) | — |
| `gfa-vrcc.pages.dev` | **legacy** build still live: "GFA VRCC — Connection Prevents Crisis", bundle `index-CoFlmJ02.js` | — |
| `gracehouse4.pages.dev` | **legacy** page still live: "Grace House Documents \| Grace For Addictions" | — |
| `graceforaddictions.org` | Wix site live ("Compassionate Recovery Support") | — |
| `rcoiowa.org` | "RCO Iowa · Connection across Iowa" served directly (no redirect observed) | — |

**Deployed release identified (Class B):** all platform domains and the staging
hostname serve release SHA `4990829e16ec4c83ec62fa245f0f9b4f0308dd0b`. That commit
exists in `rcoiowa/GFA-ECO` as the head of branch
`release/restore-housing-directory-20261104` ("Restore searchable housing directory
entrance and current residence links", committed 2026-11-04).

**Backend reference in the served artifact (Class B):** the production JS bundle
downloaded from `vrcc.app` contains exactly one Supabase project reference —
`cqcxvwoukyhxyokfwnjm.supabase.co` (canonical CQCX) — and zero references to the
retired `ykykeioydvtxpyreshhs` project. This verifies the *frontend points at* CQCX; it
does not verify any database state (see §4).

**Which Cloudflare service answers these domains (Class E, config unverified):** the
staging `workers.dev` hostname serves byte-identical content and the same release
manifest as every public domain, and in-repo records
(`docs/audits/2026-10-13-applicant-intake-flow-review.md`; draft PR #40 of 2026-10-16,
Class D) state that the five public domains bind to the `recoveryos-staging` Worker. The
inference that the Worker named "staging" serves public production traffic is strong but
remains unconfirmed at the Cloudflare configuration level this session.

**Cutover authorization record (Class F):** the launch-era documents
(`docs/launch/launch-foundation-completion-report.md`,
`docs/launch/service-readiness-scorecard.md`) required a separate authorization for any
vrcc.app cutover and recorded none. No decision record authorizing the public-domain
binding now observed was located in this repository this session. Per §9 of the
protocol, the available materials do not independently establish whether such an
authorization exists elsewhere; this is flagged for confirmation, not asserted as a
violation.

## 2. Repository state (Class B — inspected this session)

- `main` HEAD `6aaa532` (2026-11-10); the clone used here matches `origin/main` exactly.
  86 remote branches exist, including families `release/*`, `deploy-candidate/*`,
  `codex/*`, `claude/*`.
- **The deployed release line is not on `main`.** `4990829e` (deployed) is *not* an
  ancestor of `main`. The two lines diverged at merge-base `79172a4` (2026-10-12).
  The deployed line carries **30 commits not on `main`** (October 13 applicant/housing
  intake fixes, lobby sync, document review workflow, residence directory restoration);
  `main` carries **27 commits not deployed** (the distinction-register audits, the
  October 21 language-guide merge, Circle/GFARC workspace work, the Grace 1.2.1
  candidate gate). Draft PR #40 (Class D) already warned of exactly this: "`main` …
  does not contain the October 13 production-candidate housing/applicant enhancements."
- The same pattern exists for Edge Functions: the 2026-11-10 Issue #35 plan (Class D,
  read-only inventory) records that deployed `lead-intake` v16 contains `/contact` and
  `/rco-iowa` adapters that exist only on the unmerged branch
  `codex/rco-iowa-supabase-inquiry-2026-10-07` — redeploying from `main` would remove
  live routes.
- **Open pull requests:** 10 open, 9 of them drafts, none merged: #45 (document
  attestations, 2026-10-23), #42 (housing follow-through release, 2026-10-20), #41
  (housing follow-through + collaboration bridge, 2026-10-19), #40 (release
  convergence, 2026-10-16), #38/#37 (housing intake fixes, 2026-10-13/14), #33 (RCO
  Iowa inquiry backend, 2026-10-07), #25 (community-center prototype), #23 (GFA
  cinematic brand / Wix cutover preparation, production hold), #2 (2026-08-01 legacy
  `grace-vrcc` worker, open non-draft).
- Monorepo contents: one frontend (`apps/platform`), eight `@recoveryos/*` packages,
  `workers/platform` (static-assets Worker + weather proxy), `workers/api`
  (**dormant/quarantined**, consistently marked do-not-deploy), three static `sites/`
  (ejwrh, gfa-vrcc-residence, recoveryresidence-directory), `backoffice/rco-iowa`
  (agent profiles, not deployed).
- Migration trees: `supabase/launch/migrations/` (78 files, `0000`–`0146` with recorded
  gaps, plus three `20261005*` files) is the only line to apply;
  `supabase/launch/prepared/` holds 0147–0151 + rollbacks; `supabase/migrations/`
  (0000–0036) is the retired-YKY history, never to be applied; `supabase/live-drift/cqcx/`
  captures known drift. Edge functions present: `grace`, `grace-judge`,
  `grace-coaching-canary`, `lead-intake`, `residence-intake`, `ejwrh`, `create-meeting`,
  `create-meeting-canonical`, `notify-fanout` + `coaching` (YKY captures, do not deploy).

## 3. Governance controls (Class B — scripts executed this session)

All four repository governance checks pass on the current checkout:

- `scripts/grace-model-lock-verify.mjs` — PASS (static). Confirms model lock
  (`claude-sonnet-5`), and that source `grace-policy-1.2.1` is a **declared
  candidate, evaluation pending; approved remains `grace-policy-1.2.0`**, not
  approved for deployment. **The live half of this check was skipped** (no Supabase
  credentials): whether the deployed `grace` function matches the lock is unverified
  this session (Class F).
- `scripts/icare-lock-verify.mjs` — PASS. ICARE stages, BARC-10 invariants (10 items,
  1–6 scale, 10–60 total, no subdomains, ≤35 rejected, 47 reference-only) all hold in
  lock, Authority, and code.
- `scripts/check-icare-governance.mjs` — PASS (no prohibited behavior in
  implementation surfaces).
- `scripts/check-no-retired-ref.mjs` — PASS (no retired YKY reference in deployable
  canonical assets).

CI wiring (Class B, workflow files inspected): the four checks run in `ci.yml` on every
push/PR; `grace-lock.yml` / `grace-eval.yml` / `grace-compare.yml` additionally run
`grace-model-lock-verify.mjs --require-approved-policy` before any `grace` function
deploy, so the 1.2.1 candidate gate blocks Grace deployment until promotion or
reversion. The two deploy workflows are manual-only with typed confirmations and require
green CI on the exact SHA; they do not re-run the governance scripts themselves.

## 4. Backend state (declared vs. verifiable)

- **Declared canonical (Level 4 current-state records + CLAUDE.md pointer):** Supabase
  RecoveryOS-Launch `cqcxvwoukyhxyokfwnjm`, `recoveryos` schema, launch migration line.
  Corroborated at the frontend by runtime evidence (§1).
- **Live database state: UNVERIFIED this session (Class F).** The Supabase MCP is
  unauthenticated here. Specifically unverifiable: the applied migration ledger tail;
  whether prepared `0147`–`0151` are applied (file headers say NOT APPLIED; October
  readiness docs say 0147–0149 were applied; the 2026-10-29 DR-02 review states the
  repository alone cannot settle this — see conflict C2); deployed Edge Function
  versions; RLS behavior; row counts. The 2026-11-10 Issue #35 plan reports recent live
  counts (leads: 2; Grace House intake: 11; EJWRH intake: 6) — those are Class D here
  (another session's report), not re-verified.
- **Retired YKY project:** status reported variously as active-but-frozen (2026-08-18),
  paused (2026-08-08), out of scope (2026-09-01 executive scope update), INACTIVE
  (2026-10-28 register). Current actual status: Class F.

## 5. Material disagreements register (unresolved unless stated)

Stated per protocol §7: what each source establishes, and what remains open. No
reconciliation is performed here; reconciliation choices belong to Prompt 2 after this
assessment is reviewed.

- **C1 — Deployed line vs. `main` (new finding, Class B).** Production serves
  `release/restore-housing-directory-20261104` (diverged 2026-10-12); `main` has moved
  on separately. Neither is a subset of the other (30 vs. 27 unique commits). The
  repository documents the release-branch deployment practice in PR bodies and
  readiness docs, but no in-repo record designates which line is the integration
  target for reconciliation. **UNRESOLVED — reconciliation decision required.**
- **C2 — Prepared migrations 0147–0149.** Prepared-file headers and the 2026-09-15 G11
  package: NOT APPLIED / not authorized. October readiness documents: "applied prepared
  0147–0149". 2026-10-29 DR-02 review: cannot be determined from the repository; the
  release client calls six RPCs and one table that exist only in prepared 0149, so
  either 0149 is live outside the recorded lineage or those screens fail at runtime.
  **UNRESOLVED — requires authenticated live-ledger read.**
- **C3 — Hosting narrative.** The 2026-08-31 canonical-state record (staging = pilot,
  `gfa-eco-recovery-residence-os` = production candidate, vrcc.app = legacy app) is
  superseded in fact by observed runtime state (§1) and by the 2026-10-13/10-21
  records, but no current-state record supersedes it explicitly. The cutover
  authorization record is not located (§1). **UNRESOLVED as a records gap; the runtime
  facts themselves are established (Class B).**
- **C4 — `lead-intake` deployed vs. source.** Deployed v16 ≠ `main` (adapters only on
  an unmerged branch). **UNRESOLVED — merge/reconcile decision pending (Issue #35
  gates).**
- **C5 — Grace policy version.** Approved = 1.2.0 (lock, CLAUDE.md); source = 1.2.1
  candidate, merged to `main` 2026-11-08, evaluation not started (plan of 2026-11-10
  targets Nov 13 for naming an evaluation lead). Deployed `grace` function v16
  (2026-08-09) is only *inferred* to serve 1.2.0. **Consistent gating, but deployed
  policy version is Class E until live verification.**
- **C6 — Stale current-state anchors.** The two most prominent "current state"
  documents (`docs/audits/canonical-reconciliation-2026-08-18.md`,
  `docs/launch/service-readiness-scorecard.md`) predate the 0123–0146 migration tail,
  `residence-intake` deployment, and the public-domain binding, and carry no
  superseded banner (unlike HANDOFF/STATE-OF-THE-SYSTEM, which do). The successor
  documents proposed on 2026-08-18 (`CURRENT-STATE.md`, `DATA-AUTHORITY.md`,
  `RELEASE-GATES.md`) were never created; no single current-state record exists after
  `docs/operations/recoveryos-canonical-state-2026-08-31.md`. **Records gap.**
- **C7 — YKY status wording** (see §4). **Class F pending live check.**
- **C8 — Duplicate ADR numbers.** `adr-0013-*` and `adr-0014-*` each have two files;
  the 2026-08-18 plan to renumber them was never executed. Note the pair is not merely
  clerical: `adr-0013-recovery-residence-separation.md` (separate housing platform) is
  marked Superseded by `adr-0014-one-platform-multi-domain.md`. **Open housekeeping.**
- **C9 — Stale unbannered registers.** `docs/discovery/blockers-and-unverified.md`
  (2026-08-04) and parts of this directory's README describe conditions that later
  records overtook, without supersession banners. (This assessment is the 2026-11-11
  re-verification; it does not retro-edit those files.)
- **C10 — DR-02 and the distinction register.** The 2026-10-28
  GFA–RecoveryOS Distinction Register holds 12 records, all pending verification;
  DR-02 (RecoveryOS vs VRCC) carries a recorded Abstract-vs-Unify conflict with no
  approved disposition. **UNRESOLVED by its own terms.**

## 6. Organizational boundaries snapshot

- **GFA ↔ RecoveryOS:** GFA is the 501(c)(3); RecoveryOS is its technology/operational
  infrastructure. Distinction DR-01 is "Preserve", pending verification (Class D,
  2026-10-28 register).
- **Grace House:** presented in the canonical document set as operated by GFA
  (`packages/residence-content`; ADR-0013 Grace House policy authority, Accepted
  2026-08-02). (Class B for what the repo says; operational reality not independently
  verified here.)
- **EJWRH:** a separate legal operator — Ernest & Johnnie White Recovery House, L.L.C.
  (sole member Curtis White) — with GFA as contracted recovery-program and technical
  services provider. Sources: `docs/agreements/ejwrh-psa-v4.1.md` ("FINAL FOR
  EXECUTION"), the EJWRH program model v1.0, and the 2026-08-31 activation record in
  which the Executive Director attests the PSA was executed (Class C). The executed
  instrument itself was not accessible this session (Class A evidence not ingested);
  the program model's own §9.2 flags confirming the executed PSA version. The
  2026-11-10 plan restates plainly that EJWRH is not a GFA house and its alert
  recipients need their own authorization.
- **RCO Iowa:** distinct statewide initiative. `rcoiowa.org` observed live (§1);
  its serving infrastructure and content source were not identified this session
  (PR #33's inquiry backend remains an unmerged draft; `sites/rco-iowa` exists only on
  that branch). Class E/F on hosting details.
- **Wix (`graceforaddictions.org`):** live and unchanged by any repo action; the
  October 21 Wix language replacement drafts remain unpublished (Class B that the
  drafts exist in-repo; Wix-side state unverified).

## 7. What this session could not verify (refresh of the blockers register)

1. **Supabase live state** — MCP unauthenticated (unchanged since B-01, 2026-08-04).
   Blocks: applied-ledger reconciliation (C2), Grace live lock check, deployed function
   versions, RLS verification, any row-count claim.
2. **Cloudflare account configuration** — no token/MCP. Blocks: confirming which Worker
   answers each domain (C3), custom-domain bindings, Pages project status, and cleanup
   verification of the two still-live legacy `pages.dev` surfaces.
3. **Wix internals** — not connected. Blocks: form inventory (Issue #35 gate F1),
   language replacement publication state.
4. **Repositories outside `rcoiowa/GFA-ECO`** — session GitHub scope is this repo only.
   Legacy-org repos were not re-inspected.
5. **Executed agreements** (EJWRH PSA, Grace House packet signatures) — paper/Class A
   evidence not reachable from this environment.

## 8. Verification needs handed to Prompt 2 (inputs, not decisions)

These name the verification or decision each conflict requires. Nothing here is
approved, scheduled, or authorized by this document.

1. Authenticated read of the CQCX migration ledger and function versions → settles C2,
   C5, C7, and the live half of the Grace lock check.
2. Cloudflare configuration read → settles C3 (which service answers each domain;
   legacy Pages disposition inventory).
3. Owner/executive confirmation (or location) of the public-domain binding
   authorization record → closes the §1 records gap.
4. Reconciliation decision for the deployed release line vs. `main` (C1) and for
   deployed `lead-intake` vs. source (C4) — explicitly flagged as requiring review in
   PR #40 and the Issue #35 plan.
5. A designated successor current-state record (C6) and the deferred housekeeping items
   (C8, C9), if the owner directs.
6. Disposition verification for the distinction register (C10), beginning with DR-02.

---

*Read-only session: no merge, deploy, database, DNS, Wix, access, or governance-control
change was made. The only repository change associated with this assessment is this
document (plus an index pointer in this directory's README).*
