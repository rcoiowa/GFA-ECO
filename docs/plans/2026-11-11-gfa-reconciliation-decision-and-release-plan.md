# GFA Reconciliation Decision and Release Plan — 2026-11-11 (Prompt 2)

**Assignment:** GFA Recovery Infrastructure Stabilization, Prompt 2 — Evidence Verification
and Reconciliation Planning. Authorized 2026-11-11 by the Executive Director on acceptance of
the Prompt 1 assessment (`docs/discovery/source-of-truth-assessment-2026-11-11.md`) as the
working evidence baseline.

**This document is planning only.** Every recommendation below carries lifecycle status
**Proposed**. Nothing here merges, deploys, migrates, modifies data, changes DNS or Wix,
retires hosting, changes access, or alters ratified governance. Prompt 3 requires separate
explicit authorization, increment by increment.

**Evidence vocabulary** (ratified ledger, protocol §3): **A** Primary/Legal · **B** Verified
Operational Evidence · **C** Leadership-Confirmed · **D** Reported/Historical · **E** Inferred
· **F** Unknown. Lifecycle statuses: Proposed / Approved / Implemented / Deployed /
Verified In Production / Archived. Testing, merge state, and observed runtime are recorded as
supporting facts, never as lifecycle categories.

**What this session could and could not reach:** authorized **read-only** Supabase MCP access
to CQCX (migration ledger, Edge Function list and sources) and read-only Cloudflare MCP
access (Worker list and metadata; **routes/custom-domain bindings are not exposed by the
connected tool**), plus HTTP runtime probes, the full repository, and GitHub PR metadata.
Not reached: Cloudflare domain-binding configuration, Supabase Auth/secret configuration,
RLS behavior under real roles, Wix internals, repositories outside `rcoiowa/GFA-ECO`, and
executed paper agreements. No write credential was treated as write authorization; no write
was performed.

---

## 1. Verified production architecture and release baseline

All items Class B (verified this session, 2026-11-11) unless marked.

**Frontend.** Seven public hostnames (`vrcc.app`, `www.vrcc.app`, `recoverycommunity.center`,
`recoverycommunity.app`, `recoveryresidence.app`, `recoveryresidence.org`,
`recoveryos-staging.thomas-499.workers.dev`) serve one release:
`release.json = { release: 4990829e16ec4c83ec62fa245f0f9b4f0308dd0b, supabaseProject: cqcxvwoukyhxyokfwnjm }`.
`recoveryresidence.org` host-routes to the housing-directory entrance; the rest serve the
platform shell. The served bundle references exactly one backend (CQCX) and zero retired-YKY
references. Release SHA `4990829e` = head of `release/restore-housing-directory-20261104`
(committed 2026-11-04 19:13 UTC).

**Serving Worker.** The Cloudflare account lists 9 Workers. `recoveryos-staging` was modified
2026-11-04 19:31 UTC — 18 minutes after the release commit — and the staging hostname serves
bytes identical to every public domain. Conclusion that **the Worker named `recoveryos-staging`
serves public production traffic** is Class B on content identity and timing, **Class E on the
binding itself** (the connected Cloudflare tool does not expose routes/custom domains).
`gfa-eco-recovery-residence-os` (named "production candidate") was last modified 2026-10-13 and
is **behind** production. The legacy `virtualrecovery` and `vrcc-app` Workers no longer exist.
Still present: `rco-iowa-public` (modified 2026-10-09; the inferred server of `rcoiowa.org` —
Class E), `recovery-residence-os` (frozen since July), five `vite-react-template*` scratch
Workers. Still live elsewhere: legacy `gfa-vrcc.pages.dev` and `gracehouse4.pages.dev` pages,
the Wix site, `rcoiowa.org`.

**Backend.** CQCX applied migration ledger (94 entries) verified: launch line `0000`–`0146`
(with the documented numbering gaps), the three `20261005*` migrations, **`0147`, `0148`,
`0149` applied 2026-09-17**, `20261020010443_housing_follow_through_private_admin_collaboration`
(2026-10-20), and `20261023223104_document_review_attestations` (2026-10-23). **Not applied:**
`0150`, `0151` (held/sequenced per G11 — ledger confirms), `0152` (ED-name correction,
prepared, awaiting authorization). One note: `0123` does not appear in the ledger even though
`supabase/live-drift/cqcx/` marks it applied — likely applied outside `schema_migrations`
tracking (Class E; one `execute_sql` read would settle it).

**Edge Functions.** Seven active: `grace` v16, `grace-judge` v9, `grace-coaching-canary` v13,
`create-meeting` v13 (all unchanged since ~Aug 6), `lead-intake` v16 (2026-10-07),
`residence-intake` v7 (2026-09-28), `ejwrh` v7 (~2026-09-25). Correctly absent: `coaching`,
`notify-fanout` (YKY captures), `create-meeting-canonical`. `verify_jwt` is true on the Grace
family and `create-meeting`, false on the three public intake receivers (by design — they
carry origin allowlists + Turnstile instead).

**Governance controls.** Deployed `grace` v16 source read directly: **`POLICY_VERSION =
'grace-policy-1.2.0'` — the approved version** — with the server-side consent gate, no
transcript persistence, no staff alerts, no psychographic reads, and the ignore-client-overrides
posture all present in the deployed code. Whether provider activation is ON/OFF could not be
read (env secrets not exposed; Class F — CLAUDE.md's "provider activation OFF" remains Class C/D).
All four repository governance checks pass on `main`; the 1.2.1 candidate gate
(`--require-approved-policy`) blocks Grace deploys in all three Grace workflows.

## 2. Source-to-production discrepancy matrix

Baseline fact (Class B): production (`4990829e`) and `main` (`6aaa532`) diverged at
`79172a47` (2026-10-12). Production carries **30 commits** main lacks; main carries
**27 commits** production lacks. Totals: 67 files, +3,860/−892 on the deployed line.

| # | Area | Production has (not on `main`) | `main` has (not deployed) | Live behavior at stake |
| --- | --- | --- | --- | --- |
| D1 | Housing intake UI | `/my-housing` entry (My application / documents / consent), `HousingIntakeArea`, `HousingConsentPage`, applicant document access without resident role, staff intake conversion clarity, auth return paths | — | **Active applicant journeys.** Grace House intake rows exist through 2026-11-05 (Class D, Issue #35 plan) |
| D2 | Document attestations | Full attestation workflow (attestation fields, receipts, print, staff `DocumentReviewPage`, `documentReview` repository) matching the **applied** `20261023223104` migration | — | Live document receipts/attestation records are being created against this code |
| D3 | Residence directory | Searchable housing-directory entrance + current residence links (the 2026-11-04 release itself) | — | `recoveryresidence.org` front door |
| D4 | Community Center | Accessible lobby hotspot sync | — | public lobby |
| D5 | Consent display | expired/revoked grants shown as not allowed (PR #40 fix, commit `1126bfe` lineage) | *also on main?* — **not verified**; treat as carried by the release line | consent accuracy |
| D6 | Circle / GFARC | — | GFARC facilitator workspace, Circle draft protection, notes scoping (frontend only; its SQL is **prepared, not applied**) | not yet live |
| D7 | Language guide | — | October 21 language-guide merge + CI language guards | deployed UI predates the Oct 21 guide |
| D8 | Grace gate | — | policy 1.2.1 candidate + lock gate + evaluation plan | deployed Grace correctly still 1.2.0 |
| D9 | `lead-intake` | Deployed v16 = `codex/rco-iowa-supabase-inquiry-2026-10-07` (PR #33): `/contact` + `/rco-iowa` adapters, permission receipts, alert suppression. `main` lacks all of it | main == pre-adapter version | **Contact Connect on graceforaddictions.org and RCO Iowa inquiries break if redeployed from `main`** |
| D10 | `residence-intake` | Deployed v7 contains a CORS fix (`x-client-info` allowed header) found at **no branch head** (87 swept) | repo copy (both lines identical) lacks it | **Residence applications via `supabase.functions.invoke` would fail CORS preflight if redeployed from any branch** |
| D11 | CI/deploy workflows | small edits on the release line | gate/guard additions on main | workflow drift to reconcile |

Deployed-source captures and recovery pointers: `docs/discovery/deployed-captures-2026-11-11/`.

## 3. Updated conflict register (C1–C10)

| ID | Status after verification | Evidence | Resolution route |
| --- | --- | --- | --- |
| C1 Release line vs `main` | **CONFIRMED, quantified** (§2) | B | Technical plan (§5) + **executive choice of integration approach** |
| C2 Prepared 0147–0151 | **RESOLVED:** 0147–0149 applied 2026-09-17; 0150/0151 not applied | B (live ledger) | Technical housekeeping: move 0147–0149 into `launch/migrations/`, correct stale "NOT APPLIED" headers, record the apply event. The 2026-10-29 DR-02 concern (release client depends on 0149) is **closed** — 0149 is live |
| C3 Hosting narrative | **Mostly resolved:** runtime verified; Worker inventory verified; `virtualrecovery` gone; binding config still unread; **cutover authorization record still not located** | B / E / F | Executive: confirm or locate the binding authorization; technical: one Cloudflare dashboard/API read of custom domains |
| C4 `lead-intake` drift | **CONFIRMED** (D9) | B | Technical merge of the adapter code (PR #33 line) + executive acceptance of PR #33's pending activation decisions |
| C5 Grace policy | **RESOLVED:** deployed = 1.2.0 (approved), read from live source | B | None needed now; 1.2.1 follows its own evaluation gate (owner naming = executive) |
| C6 Stale current-state anchors | Unchanged; this document now records verified current state | B | Technical: supersession banners + a designated current-state record (**executive designation**) |
| C7 YKY status | Still unverified (out of this session's authorized read scope) | F | Technical: one authorized read; otherwise leave frozen/out of scope per 2026-09-01 executive decision |
| C8 Duplicate ADR numbers | Unchanged | B | Technical housekeeping (renumber per 2026-08-18 plan) |
| C9 Stale unbannered registers | Unchanged | B | Technical housekeeping |
| C10 DR-02 / distinction register | Unchanged — **explicitly preserved; nothing in this plan resolves DR-02** or any DR implicitly | D | Executive/governance per the register's own process |

**New findings this pass (not in C1–C10):**

- **N1 — `residence-intake` v7 source at no branch head** (D10). The live residence
  application write path runs code the repository cannot reproduce. Captured in full under
  `docs/discovery/deployed-captures-2026-11-11/`.
- **N2 — `document_review_attestations` applied from a draft PR.** The migration is live
  (2026-10-23) and production code uses it, while its source SQL sits on unmerged draft
  PR #45's branch (also present as a proposal file on the deployed line). PR #45's body
  records CI, 80 DB checks, and an authorization narrative (Class D); the **apply
  authorization record** should be confirmed and the SQL moved into the canonical migration
  tree so the live ledger and repo lineage agree.
- **N3 — `0123` ledger anomaly** (§1, minor).

## 4. Risk-ranked findings (participant-service continuity first)

| Rank | Finding | Continuity implication | Severity |
| --- | --- | --- | --- |
| R1 | **Any redeploy of `residence-intake` from any branch removes the live CORS fix** (N1/D10) | Residence applications from the platform directory could fail at preflight — applicants silently blocked | **High** (latent; harmless until someone redeploys) |
| R2 | **Any redeploy of `lead-intake` from `main` removes `/contact` and `/rco-iowa`** (C4/D9) | Contact Connect submissions from graceforaddictions.org and RCO Iowa inquiries rejected; people reaching out get errors | **High** (latent) |
| R3 | **Live DB objects whose source is outside the canonical migration tree** (N2; 0147–0149 until relocated) | A "rebuild from repo" or disaster-recovery replay would produce a database missing live objects; attestation receipts and intake workflow would break | **High** (latent) |
| R4 | **Frontend reconciliation risk (C1):** a naive merge or a deploy of `main` as-is would drop D1–D4 live behavior (applicant journeys, attestations, directory entrance) | Approved applicants lose `/my-housing`; attestation UI disappears while its DB evidence remains | **High if executed carelessly; no risk while nothing is deployed** |
| R5 | `gfa-eco-recovery-residence-os` ("production candidate") is behind production; its name invites a wrong-target deploy | Deploying there believing it is production produces a stale or divergent public surface if bindings ever move | Medium |
| R6 | Legacy surfaces still live (`gfa-vrcc.pages.dev`, `gracehouse4.pages.dev`) with old branding/flows; `gracehouse4.pages.dev` is also still an **allowed intake origin** | Confused entrances; an unretired origin keeps accepting applications from a stale page | Medium |
| R7 | Grace 1.2.1 evaluation unowned (plan target 2026-11-13) | None today (gate holds); delay only postpones language-guide alignment of Grace | Low |
| R8 | Cutover/binding authorization record not located (C3) | None operational; governance/records risk | Low |
| R9 | 0150/0151/0152 pending; ED-name correction unapplied | Known, gated; 0152 affects emergency-response naming accuracy | Low–Medium (0152 is a correctness correction awaiting authorization) |

## 5. Integration approaches compared, and recommendation

Context that shapes the choice: the deployed line is **ahead** of `main` on participant-facing
housing behavior and **matches the live database** (attestations, 0149 dependencies); `main` is
ahead on governance, language, and Circle/GFARC work that has **no live dependency yet**. Both
lines are wanted; neither is obsolete.

**Option A — Reviewable integration branch (reconcile both lines).** Create
`integration/reconcile-2026-11` from the deployed SHA, merge `main` into it with explicit
conflict review (or vice versa), run full CI + the language guards + synthetic acceptance,
deploy nothing until separately authorized.
*Participant value:* preserves every live journey and brings the language guide to production.
*Feature preservation:* full, by construction (review against §2 matrix).
*Privacy/security:* no new surface; language-guard CI runs against the merged result.
*Effort:* moderate (one careful merge; D1/D2 files overlap little with Circle/GFARC files, so
conflicts should be modest — Class E).
*Reversibility:* high before deploy (a branch); after deploy, frontend rollback = redeploy
previous SHA.
*Maintainability:* best — ends the two-line drift and the per-feature release-branch sprawl.
**Recommended.**

**Option B — Selective carry-forward (cherry-pick deployed work onto `main`).** Re-apply the 30
deployed commits (or squashed feature units) onto `main`.
*Pros:* keeps `main` as the single line.
*Cons:* highest omission risk — missing one commit silently regresses a live journey (exactly
R4); re-review of 30 commits costs more than one merge review; history duplication confuses
`release.json` provenance. *Rating:* workable fallback if the Option A merge proves
conflict-heavy. Not preferred.

**Option C — Keep the narrow release-branch path temporarily.** Continue cutting
`release/*` branches from the deployed SHA for urgent fixes while A is prepared.
*Drift cost:* every week widens D7 (production still pre-language-guide) and deepens R3-class
divergence. *Retirement condition:* ends the day the Option A integration deploys.
*Use:* only as the **interim posture** (it is the de-facto current one), not the destination.

**Option D — Deploy `main` and re-add deployed features later.** Rejected: knowingly removes
live applicant journeys and the attestation UI against a live schema (R4 realized immediately).

**Option E — Defer everything.** Rejected as a standing answer: R1–R3 are latent traps that
fire on the next routine redeploy; cost of Option A is modest and shrinks nothing by waiting.
Deferral is acceptable only for the *deploy* step, never for the function-source
reconciliation (Increments 1–2 below), which is what disarms the traps.

**Recommended release process after reconciliation (simplest maintainable):** one protected
`main`; short-lived feature branches; releases cut from `main` by the existing **manual,
typed-confirmation** workflows (keep them — they are good controls); `release.json` remains the
runtime provenance check; retire per-feature `release/*` branches once merged; emergency fix =
branch from the deployed SHA, fix, deploy, and merge the same commit back to `main` within the
same change. No permanent dev/prod branch pair, no new staffing assumptions. Status: Proposed.

## 6. Reconciliation matrix (material conflicts)

| Conflict | Intent of each side | Behavior to preserve | Proposed resolution | People/records affected | Acceptance checks | Rollback/recovery |
| --- | --- | --- | --- | --- | --- | --- |
| Frontend lines (D1–D8) | Release line: live housing/attestation UX. Main: governance/language/Circle | Both; language guide wins on wording, deployed line wins on workflow behavior | Option A merge; where a file conflicts, keep workflow logic from the release line and re-apply guide wording | Applicants, residents, staff; no records change | full CI incl. language guards; synthetic journeys: public apply (both houses), `/my-housing`, document attestation, consent display, Circle entry/exit | frontend-only: redeploy prior SHA `4990829e` (captured). No DB effect |
| `lead-intake` (C4) | Deployed: adapters + receipts. Main: pre-adapter | `/contact`, `/rco-iowa`, permission receipts, alert minimization | merge PR #33 line (or equivalent) to `main` **before** any function redeploy; keep PR #33's own activation gates (secret config, acceptance) as recorded | people submitting contact/inquiry forms | deno tests; synthetic OPTIONS/POST per origin; verify `intake_disabled`/`unavailable` codes only where secrets are intentionally absent | redeploy prior captured bundle (hash `9688a74f…`); receipts/leads rows are unaffected by function rollback |
| `residence-intake` (N1) | Deployed: CORS fix. Repo: none | preflight success from allowlisted origins incl. platform `functions.invoke` | commit the captured v7 source to `supabase/functions/residence-intake/` on the integration branch (diff-reviewed against capture hashes) | public applicants | deno tests + synthetic preflight (OPTIONS with `x-client-info`) from each allowed origin | redeploy prior captured bundle; intake rows unaffected |
| DB lineage (C2/N2) | Ledger: 0147–0149 + attestations live. Repo trees: prepared/proposal folders | the live schema exactly as it is | **documentation-only moves**: relocate applied SQL into `supabase/launch/migrations/` with headers recording actual apply dates and authorization references; no SQL executed | none (no DB change) | `list_migrations` unchanged before/after; replay scripts pass against the relocated tree | git revert of the relocation commits; nothing live moves |
| Attestation authorization (N2) | PR #45 narrative vs. absence of a decision record | admission consequences stay exactly as live | executive confirms (or supplies) the apply authorization; decision record added per protocol §14 | applicants/residents under attestation rules | record exists and names decision-maker/date/rationale | n/a (records) |
| 0150/0151/0152 | prepared, gated | gates stay closed | carry forward untouched; 0152 scheduled only by explicit apply authorization | — | ledger shows no new entries without a decision record | n/a |
| Grace 1.2.1 (D8/R7) | candidate vs approved 1.2.0 | deployed 1.2.0 until evaluation passes | keep the gate; name evaluation owner; evaluate per the 2026-11-10 plan; promotion is its own authorization | participants using Grace | eval suite vs language-guide scenarios; lock verify `--require-approved-policy` green | gate already blocks; rollback = keep 1.2.0 |

**Irreversibility notes (planned before any execution):** redeploying old frontend code cannot
un-create attestation receipts, consent grants, or intake rows — database recovery is a
separate, per-table, authorization-gated path, and **no rollback plan here deletes participant
records**. External notifications (staff alert emails) cannot be retracted; the alert design
already minimizes content. The only irreversible step this plan *proposes* is documentation
(git-revertible). Anything touching Wix, DNS, Pages retirement, or data is out of scope and
flagged below.

## 7. Continuous, accessible experience (planning requirements)

- **Shared reference:** derive a portable visual/writing reference from verified sources only —
  `docs/language-guide.md` (Oct 21 authority) + `@recoveryos/design-tokens` — one page naming
  voice, required terminology, color/type tokens, and the approved Grace House variation.
  No new brand language is authored by this plan.
- **Continuity paths:** public → VRCC (`/community-center` four doors), GFARC entry and safe
  return paths (already on `main`, D6), public-to-apply (both residences), sign-in return
  paths (deployed line, D1). The Option A acceptance suite must walk each of these.
- **Accessibility checks carried as acceptance criteria:** keyboard-only pass, visible focus,
  contrast at tokens level, `prefers-reduced-motion` honored (lobby animation), 200% text
  zoom, 320px width, slow-connection first paint (static shell + SPA fallback), readable
  error/status text for every intake failure code (no bare codes to humans). A manual
  screen-reader pass remains owed (carried from the 2026-08 scorecard) and stays a named gate.
- **Site consolidation (Wix, legacy Pages):** planning constraint only — separate
  **unpublish / redirect / migrate / disable-automation / delete** as distinct, individually
  authorized steps; before retiring `gracehouse4.pages.dev`, verify its traffic and remove it
  from the `residence-intake` origin allowlist in the same reviewed change; preserve Wix
  members (155) and Contact Connect history (122 submissions — Class D, PR #23) wherever the
  Wix decision lands; nothing in Prompt 3's proposed increments touches any of this.

## 8. Privacy, access testing, operations, measurement (planning requirements)

**Access-test matrix (synthetic only; production tests need their own authorization and a
staging frontend may still point at production):** anonymous (public pages, intake doors,
nothing else), participant (own data only; cross-participant denial), second participant
(foreign-record URLs denied), facilitator (GFARC scope only), authorized GFA staff
(role-scoped; leadership read-only where Circle decision says so), residence-scoped roles
(other residence denied), admin (owner-private admin boundary), Grace (consent-gated; no reads
beyond the authorized context set), revoked/expired consent paths, exports and logs
(no message bodies, no secrets). Email domain or role title never substitutes for a grant —
EJWRH recipients specifically require their own authorization (Issue #35 gate). Isolated
test infrastructure (a DEV target) is **a named dependency**, chosen per the Issue #35 open
decision; its absence blocks live-acceptance gates, not documentation work.

**Contact Connect and intake operations:** keep the distinctions receipt → routing → ownership
→ attempt(s) → follow-up → completed human connection. The deployed adapters record receipt
with a permission receipt; routing/ownership/attempt tracking is future work (Issue #35
gates 3–4) and is **not** claimed by this plan. Grace is not a backup human and completes no
connection. Existing submission methods (email/phone fallbacks on the RCO page) stay until a
replacement is verified end-to-end.

**Meeting documentation (Circle):** acceptance checks already partly on `main` (draft
protection); the plan carries: validation, every navigation exit, retained drafts, failed
refresh, uncertain-save reconciliation before retry, exact retry idempotency, duplicate
prevention, permission change mid-session, correction with history, and the hard separation of
private reflections from shared operational notes (ratified 2026-11-09 scope; retention rule
and correction owner are **open executive items** carried forward).

**Metrics (definitions before collection; each needs definition, source, window, unit, dedup,
missing-data rule, denominator, permitted interpretation):**
1. *Digital participation and practice* — meaningful interactions, cumulative practice days
   (never reset by absence), revisits. Filter bots/duplicates; a click is not a benefit.
2. *Participant-reported value* — optional usefulness/belonging/confidence items and
   appropriate validated instruments (BARC-10 under its locked invariants: one 10–60 total,
   no subdomains, no thresholds, no automation). Self-report labeled as such; missing
   responses counted, not imputed.
3. *Human services and connections* — requests, attempts, referrals, attendance,
   follow-through, and separately defined **participant-authorized completed peer
   connections**. A voicemail, form receipt, appointment, or Grace exchange is none of these.
   Unreachable people stay in the request denominator.
4. *Outcomes* — defined changes over time with consent, denominators, and attribution limits.
   Activity never proves recovery progress or crisis prevention; "Connection Prevents Crisis"
   stays doctrine-and-hypothesis in all reporting.

No new collection begins without audience, consent, retention, access, aggregation,
withdrawal effects, and small-cell protections defined. Private reflections are never joined
to facilitator records, Grace context, or organizational reporting. Content tags stay distinct
from assessed needs; ICARE, wellness, recovery-capital, and Hope Hub frameworks stay separate
absent an approved crosswalk; no disputed slogan canon is settled here. No Connection Score,
predictive-risk score, or recovery classification is proposed, directly or renamed.

## 9. Proposed Prompt 3 execution plan — independently approvable increments

Each increment is separately approvable, separately rollback-able, and blocked until its named
authorization exists. Order matters only where stated. All statuses: **Proposed**.

| # | Increment | Type | Depends on | Rollback |
| --- | --- | --- | --- | --- |
| 1 | **Function-source reconciliation (repo only):** commit captured `residence-intake` v7 and the PR #33 `lead-intake` adapters to the integration branch; no deploys | git only | — | git revert |
| 2 | **Migration-lineage reconciliation (repo only):** relocate applied 0147–0149 + attestations SQL into `launch/migrations/` with true apply dates; fix stale headers; record N2/N3 resolutions | git only | executive confirmation of N2 authorization record | git revert |
| 3 | **Integration branch (Option A):** merge `main` ↔ release line per §6; full CI + synthetic acceptance; **no deploy** | git only | 1, 2 | delete branch |
| 4 | **Staging deploy + verification** of the integration SHA via the existing manual `Deploy staging` workflow; verify `release.json`, journeys, accessibility checks | deploy (staging) | 3; deploy authorization | redeploy `4990829e` |
| 5 | **Production deploy** of the same SHA via the gated candidate/production path; verify | deploy (prod) | 4; **separate explicit authorization** | redeploy `4990829e` (captured, reproducible) |
| 6 | **Records housekeeping:** supersession banners (C6/C9), ADR renumbering (C8), designated current-state record | git only | executive designation of the record | git revert |
| 7 | **Cloudflare inventory decisions:** owner labels/deletes the five template Workers; decides `gfa-eco-recovery-residence-os` role; binding read documented | dashboard (owner) | owner action | n/a (labels) / recreate |
| 8 | **Grace 1.2.1 evaluation** per the 2026-11-10 plan; promotion/reversion is its own gate | eval then gated deploy | named owner; eval target | gate holds 1.2.0 |
| 9 | **0152 ED-name correction apply** | DB migration | explicit apply authorization | prepared rollback file |
| 10 | **Legacy-surface retirement planning** (Pages, Wix language publication) — each its own scoped assignment per §7 | separate assignments | separate authorizations | per assignment |

Increments 1–3 and 6 change only this repository and can proceed under a single "repo-only
reconciliation" authorization if you prefer to grant them together. 4, 5, 7, 8, 9, 10 each
need their own go.

## 10. Decisions requiring executive approval

1. **Integration approach:** adopt Option A (recommended) or direct an alternative (§5).
2. **N2:** confirm/locate the `document_review_attestations` apply authorization; accept its
   admission-consequence effect (PR #45 flagged it as a readiness/admission decision).
3. **C3:** confirm or locate the public-domain binding (cutover) authorization record; state
   which Worker is henceforth *named* production (or direct renaming at increment 7).
4. **Grace 1.2.1:** name the evaluation owner and the evaluation target (per the 2026-11-10
   plan's open items).
5. **Issue #35 pending decisions** (sender identity, EJWRH recipient authorization, routing
   table scope, DEV target) — carried forward unchanged.
6. **Circle notes:** retention rule and correction/removal owner (carried from 2026-11-09).
7. **0152:** apply authorization (and notice-distribution decision).
8. **Current-state record:** designate the successor current-state document (C6).
9. **DR-02 and the distinction register:** remain with their own governance process —
   explicitly **not** advanced by this plan.

---

**Stop.** Prompt 2 ends here. This plan and its evidence are presented for review. No merge,
deployment, PR closure, database change, site retirement, DNS/Wix change, access change, or
governance change has occurred or will occur without the separate, explicitly scoped Prompt 3
authorizations named above.
