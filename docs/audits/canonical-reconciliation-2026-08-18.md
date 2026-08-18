# RecoveryOS Canonical Reconciliation — 2026-08-18

**Session type:** reconciliation audit only. No merges, no deploys, no migrations, no DNS, no
default-branch changes were performed. This document records verified state so any future session
can reach the same conclusions from Git + live infrastructure alone.

**Evidence base:**

- Git: full remote fetch of `rcoiowa/GFA-ECO` (16 branches), commit-graph containment analysis,
  file-level diffs. Main HEAD at audit time: `950143a`.
- Live Supabase (verified 2026-08-18 via authenticated MCP): project list, CQCX migration list,
  CQCX edge-function list, CQCX SQL probes (table existence, RLS policies), YKY schema census.
- Live Cloudflare (verified 2026-08-18 via authenticated MCP): Workers list + metadata. Worker
  *code contents* could not be retrieved (tool failure) — deployed-bundle facts are UNKNOWN.

Facts are labeled **VERIFIED** (observed directly), **INFERRED** (consistent evidence, not
directly observed), or **UNKNOWN**. Governance directives current as of this audit: canonical
Supabase authority is **RecoveryOS-Launch (`cqcxvwoukyhxyokfwnjm`, "CQCX")**; project
`ykykeioydvtxpyreshhs` ("YKY") is legacy — kept running, receives no new intentional
participant/service data, no participant-data migration out of it. Grace generative-provider
activation stays OFF.

---

## A. Canonical State

### A.1 What main contains (VERIFIED from Git)

`main` (`950143a`, 43 commits) is the consolidated greenfield RecoveryOS monorepo: pnpm
workspace, `apps/platform` (public + participant + coach + navigator + resident + staff + admin
surfaces), shared packages (`data-access`, `domain`, `ui`, `design-tokens`, `safety`,
`residence-content`), `supabase/migrations` 0000–0024, Grace House policy library
(`docs/residence-documents`), ADRs 0001–0016, CI (typecheck + build).

**However, main is entirely YKY-era.** VERIFIED: `main` contains **zero** references to
`cqcxvwoukyhxyokfwnjm` and no root `CLAUDE.md`. It actively declares YKY canonical in
`.env.example`, `docs/STATE-OF-THE-SYSTEM.md` ("CANONICAL — recoveryos schema live"),
`docs/HANDOFF.md` (last updated 2026-08-04), `.mcp.json` (Supabase MCP pinned to YKY), the
staging deploy workflow, and `workers/api/wrangler.toml` (`SUPABASE_URL` = YKY). Under current
governance, all of these are **DRIFT: repository behind governance**.

### A.2 Where the CQCX-era work actually lives (VERIFIED)

Every branch that post-dates the CQCX launch forms **one linear stack** of 80 commits forked from
`5bce683` (main's parent). Containment was verified by commit-graph analysis; each branch below
is a strict prefix of the next:

```
5bce683 (main^)
  └─ live-gate/run-001 (29)
      └─ grace-eval/run-001 (53) ─ run-002 (55) ─ run-003 (57)
          └─ grace-compare/sonnet5-001 (59)
              └─ grace-lock/apply-001 (61)
                  └─ claude/grace-coaching-audit-b0fyhq = live-gate/run-002 (69, same SHA 990363f)
                      └─ claude/recoveryos-intake-audit-zouh7q (75, incl. a517d5a)
                          └─ claude/public-support-onboarding-85u07i (80)  ← TIP
```

**`claude/public-support-onboarding-85u07i` (`c1db2aa`) is the single most complete line in the
repository.** It contains, cumulatively: the CQCX launch migration line
(`supabase/launch/migrations` 0000–0122 + seeds + preflight), the Grace Coaching migration
P0→P4H (coach/navigator/messaging/scheduling/residence/admin workspaces, live e2e gate), Grace
AI governance locks (`grace-model-lock.json`, provider OFF, policy 1.2.0), the ratified ICARE
Authority v1.0 + implementation locks + CI guards, the public-intake convergence (`a517d5a`),
the EJWRH drift capture + hardening record, the service-readiness scorecard, the launch safety
fixes (password reset, public `/support`, onboarding consent, staff grievance queue), a root
`CLAUDE.md` (pointer-not-authority pattern), and the `check-no-retired-ref` YKY CI guard.

Main and the stack tip share **no changed paths** other than the two files added by `950143a`
(docs-only, new files) — VERIFIED via diff: a merge of the tip into main has no overlapping-path
conflicts.

### A.3 What live infrastructure confirms (VERIFIED 2026-08-18)

**Supabase — 3 projects, one org:**

| Project | Ref | Status | Role |
|---|---|---|---|
| RecoveryOS-Launch | `cqcxvwoukyhxyokfwnjm` | ACTIVE_HEALTHY (created 2026-08-07) | **Canonical (governance)** |
| Grace For Addictions | `ykykeioydvtxpyreshhs` | ACTIVE_HEALTHY (created 2026-02-15) | Legacy — keep, do not feed |
| contact-connect-dashboard | `vlsxjkqyaexcxwkbovlq` | INACTIVE | Deprecated (matches repo doc) |

**CQCX matches the branch stack, not main:**

- Applied migrations = launch line **0000–0121** (+ seeds 0200–0203) exactly as in the stack's
  `supabase/launch/migrations/`, **plus** two out-of-line entries dated 2026-08-11:
  `create_housing_applications_ejwrh` and `harden_set_updated_at_search_path` (the EJWRH drift the
  stack captured under `supabase/live-drift/cqcx/`).
- Migration **0122 (public intake boundary) is NOT applied**: SQL probe confirms
  `recoveryos.residence_listing_submissions`, `recoveryos.residence_application_intake`, and the
  `residence_directory_public` view do not exist. `recoveryos` schema holds 73 tables.
- Edge Functions: `lead-intake`, `grace-coaching-canary`, `create-meeting`, `grace`,
  `grace-judge` — all ACTIVE. **`residence-intake` is NOT deployed.** This matches `a517d5a`'s
  own claim ("prepared, not deployed") — the prior report was accurate.
- EJWRH hardening **is applied**: `public.housing_applications` has RLS enabled with exactly one
  policy, `housing_applications_public_insert` (INSERT-only; no anon read).

**YKY is the legacy sprawl the stack describes:** 20+ application schemas (`gfa_core`,
`gfa_residence`, `gfa_ui`, `gfa_icare`, …, `ztest`, `public`, plus an older 69-table `recoveryos`
copy). Still ACTIVE_HEALTHY. Not paused, per governance.

**Cloudflare Workers (metadata only; deployed bundle contents UNKNOWN):** `recoveryos-staging`
(modified 2026-08-10 — INFERRED: the stack's staging target), `vrcc-app` (modified 2026-08-16),
`virtualrecovery` (2026-08-16), `gfa-eco-recovery-residence-os` (2026-08-07),
`recovery-residence-os` (2026-07-29), five `vite-react-template*` scratch workers. Which commit
each serves, and what `vrcc-app`/`virtualrecovery` changed on 2026-08-16 (after the last repo
commit 2026-08-15), is **UNKNOWN**. No worker named `recoveryos-api` appears — INFERRED: the
`workers/api` gateway has never been deployed.

---

## B. Branch Survival Matrix

| Branch | HEAD | Unique work | Authority status | Drift | Disposition |
|---|---|---|---|---|---|
| `main` | `950143a` | Greenfield monorepo + `950143a` Phase-0 audit doc (2 new doc files not in stack) | Default branch; **pre-CQCX** | Declares YKY canonical throughout | **RECEIVES the merge** (stays default) |
| `claude/public-support-onboarding-85u07i` | `c1db2aa` | Stack TIP: everything in A.2; last 5 commits add public `/support`, onboarding consent, warm-line fix, reset-flow tests, staff grievance queue | Most complete; CQCX-aligned; CI-guarded | Only residual: `.mcp.json` still YKY | **MERGE into main** (the canonical line) |
| `claude/recoveryos-intake-audit-zouh7q` | `fb4a52d` | `a517d5a` intake convergence + scorecard (all contained in tip) | Superseded by tip (strict prefix) | none beyond tip | **ARCHIVE** after merge (tag) |
| `claude/grace-coaching-audit-b0fyhq` | `990363f` | Grace coaching P0→P4H + Grace/ICARE governance (contained in tip) | Superseded by tip | — | **ARCHIVE** after merge (tag) |
| `live-gate/run-002` | `990363f` | Same SHA as above (CI run pointer) | Duplicate pointer | — | **ARCHIVE** (tag once) |
| `grace-lock/apply-001` | `bfa2294` | Grace V1 model lock (contained in tip) | Superseded | — | **ARCHIVE** (tag) |
| `grace-compare/sonnet5-001` | `adcc3b3` | Model-comparison workflow (contained) | Superseded | — | **ARCHIVE** (tag) |
| `grace-eval/run-001/-002/-003` | `353c8a9`/`9f88868`/`8ceed6f` | Eval-harness iterations (contained) | Superseded | — | **ARCHIVE** (tags) |
| `live-gate/run-001` | `de764e5` | P4H CI live-gate bring-up (contained) | Superseded | — | **ARCHIVE** (tag) |
| `claude/recoveryos-greenfield-build-8pns7n` | `36a8165` | none — fully merged into main (`c2a5d29`) | Merged | — | **ARCHIVE/delete** |
| `claude/residence-application-flow-jsesw6` | `34e7edb` | none — fully merged | Merged | — | **ARCHIVE/delete** |
| `claude/supabase-mcp-setup-ep29rp` | `e901b22` | none — fully merged | Merged | — | **ARCHIVE/delete** |
| `claude/recoveryos-greenfield-build-ka6992` | `71fa3ac` | Older sibling of merged greenfield; its resident pages, themes, ThemeSwitcher, Grace-House ADRs all exist on main/tip (VERIFIED file-level) | Superseded; YKY-era | YKY assumptions | **ARCHIVE** (tag; do not merge) |
| `claude/what-is-built-here-3co21c` | `2d47dc8` | 3-file standalone vrcc.app worker (`deploy.sh`/`index.js`/`wrangler.toml`); its own last commit defers the rollout | Superseded by ADR-0014 (one platform, domain-scoped front doors) | Conflicts with one-platform architecture | **ARCHIVE** (tag; do not merge) |

Nothing was merged, deleted, or tagged during this audit.

## C. Conflict Register

1. **CQCX vs YKY — repo governance (the central conflict).** `main` declares YKY canonical
   (`.env.example`, `docs/STATE-OF-THE-SYSTEM.md`, `docs/HANDOFF.md`, `supabase/migrations/0000`,
   `apps/platform/src/main.tsx` fallback, deploy workflow); current governance + live evidence say
   CQCX. Classification: **DRIFT (main is stale)**. Resolved on the stack tip everywhere except
   `.mcp.json`.
2. **`.mcp.json` YKY pointer — on every branch including the tip.** A fresh Claude session using
   the repo's MCP config connects to the *legacy* Supabase project. **DRIFT**, small but
   high-leverage for future sessions.
3. **Two applied-migration histories.** Tip keeps `supabase/migrations/` (YKY history, 0000–0036)
   *and* `supabase/launch/migrations/` (CQCX, 0000–0122). Live CQCX matches the launch line
   (VERIFIED). Risk: future sessions applying the wrong directory. Needs an explicit
   DATA-AUTHORITY doc naming `supabase/launch/migrations` as the only applicable line.
4. **Residence intake — three coexisting models.** (a) authenticated in-app
   `residence_applications` (live, staff-reviewed); (b) EJWRH `public.housing_applications` on
   CQCX (live, anon INSERT-only, outside the launch line); (c) prepared canonical
   `recoveryos.residence_application_intake` (0122 — unapplied, no UI). Convergence designed
   (field-fit matrix in the scorecard) but not executed. **DRIFT acknowledged and contained.**
5. **Participant identity at intake.** Governance requires public submission to create no auth
   users/people/enrollments/residencies. The prepared 0122 + rewritten `workers/api` honor this
   (no provisioning; service-role boundary; RLS with no anon grant — VERIFIED in migration text);
   main's `workers/api` still writes YKY with the old model. Conflict resolves with the merge.
6. **Cloudflare vs historical assumptions.** Main's root `wrangler.jsonc` deploys the platform as
   `gfa-eco-recovery-residence-os`; the stack adds `wrangler.staging.jsonc` → `recoveryos-staging`
   and a gated production-candidate workflow. `vrcc-app` + `virtualrecovery` workers were modified
   2026-08-16 by an unknown actor/process — **UNKNOWN**, must be identified before any domain
   binding. Five `vite-react-template*` workers are clutter (out of scope to delete now).
7. **Domains.** vrcc.app cutover is a deliberately separate Type E gate (not executed);
   recoveryresidence.org/.app roles are proposed governance with no repo binding yet;
   gracehouse4.pages.dev must not remain a system of record. No live routing was changed or
   verified in this audit — current bindings **UNKNOWN**.
8. **Duplicate ADR numbers on main.** Two `adr-0013-*` and two `adr-0014-*` files (from the two
   merged lines). Confusing for governance-by-Git; renumber during the memory phase.
9. **`950143a` (main's lone post-fork commit)** is a YKY-era Phase-0 coaching audit + draft SQL;
   the stack contains the *completed* coaching migration it proposed. Keep as history; mark
   superseded — do not follow.
10. **Stale onboarding docs.** `docs/HANDOFF.md` ("shared brain", 2026-08-04) and
    `docs/STATE-OF-THE-SYSTEM.md` instruct new sessions into YKY-era assumptions. Must be
    superseded, not silently deleted.

## D. Human-Service Workflow Status

Legend: status **at the stack tip** (the line proposed to become canonical) / **on main today**.
"WORKING (repo)" = implemented + gate-tested in the repository; live re-validation is a pending
deploy-gate step (Supabase/Cloudflare MCP confirmed the backend side live; frontend deploy state
UNKNOWN).

**Participant / service intake:**

| Step | Tip | Main | Notes |
|---|---|---|---|
| Public discovery | WORKING (repo) | PARTIAL/DRIFT | Landing, Grace House, directory; public `/support` ladder tip-only |
| Support request / intake | WORKING (repo) | PARTIAL/DRIFT | Anonymous-safe `/support`; authenticated support-request spine → staff claim |
| Account / onboarding | WORKING (repo) | DRIFT (YKY) | Password reset broken on main, fixed at tip (`b1eb4ef`) with regression tests |
| Consent | WORKING (repo) | PARTIAL | Append-only, server-enforced; onboarding capture tip-only |
| Participant (person record) | WORKING | DRIFT (YKY) | `ensure_person_for_current_user`; person ≠ account per ADR-0003 |
| Coach/navigator connection | WORKING (repo) | MISSING | Claim → relationship → threads (P4C/P4E); live-e2e gated in CI |
| Service event | WORKING (repo) | MISSING | `complete_session` → `service_event`; human-confirmed only (ICARE Authority) |
| Follow-up | WORKING (repo) | MISSING | `create_follow_up` + coach/navigator queues |
| Documentation / outcomes | PARTIAL | MISSING | Service events + check-ins recorded; reporting/analytics views basic; dashboards deferred |

**Residence application → move-in:**

| Step | Tip | Main | Notes |
|---|---|---|---|
| Public residence discovery | PARTIAL | PARTIAL | Directory page live-code; canonical `residence_directory_public` view unapplied (0122); listing submissions prepared, no UI |
| Application / referral | PARTIAL | PARTIAL/DRIFT | Authenticated apply WORKING; referral intake + triage WORKING; **anonymous pre-account intake PREPARED but unapplied/unwired**; EJWRH on separate hardened table |
| Staff review | PARTIAL | PARTIAL | `review_residence_application` + queue WORKING; `intakeReview` adapters have **zero UI consumers** (MISSING surface) |
| Accept / waitlist / decline | WORKING (repo) | PARTIAL | `review_residence_application`, `admit_applicant` |
| Account/person linkage | PARTIAL | MISSING | In-app path inherently linked; 0122 `converted_*` linkage designed, unapplied; `withdraw_my_application` RPC unconsumed |
| Move-in | WORKING (repo) | PARTIAL | `admit_applicant` → residency, `assign_bed`, bed board |
| Residency | WORKING (repo) | PARTIAL | Resident portal (documents, passes, grievances, house board, schedule); phases (0022); screenings, incidents, fee ledger, NARR/Iowa trackers |
| Ongoing documentation | PARTIAL | PARTIAL | Incident/grievance/pass/screening digitized; several paper forms not yet workflows |
| Discharge / transition | PARTIAL | MISSING | `discharge_residency` RPC exists in launch line; **no UI/adapter consumer** (VERIFIED by grep) |

Multi-residence: the model is residence-scoped throughout (`residence_id` keys, manager-scoped
RLS, `house_code` mapping in the field-fit matrix; EJWRH + Grace House both modeled). No
Grace-House-only hard-coding found in the canonical entities. QR/link → select residence → apply
→ staff review is the designed 0122 flow; the missing pieces are the apply UI, the staff intake
queue, and the gated application of 0122.

## E. RecoveryOS Minimum Operational Release

The tip's scorecard already defines this correctly; adopted here with the residence-intake
completion added. **Smallest release that stops losing operational documentation:**

1. **Public entry/intake** — landing + `/support` (no account) + support-request spine. *Tip: done (repo).*
2. **Grace House + multi-residence applications** — authenticated apply (done) **+** apply 0122,
   deploy `residence-intake` fn, wire one pre-account apply page with residence selection (Grace
   House, EJWRH, Jerry's House rows in `residences`).
3. **Staff review** — existing applications queue (done) **+** one staff intake-review page over
   `intakeReview.ts`.
4. **Participant onboarding/consent** — done (repo); live-validate at gate.
5. **Coach/navigator assignment** — done (repo).
6. **Service documentation** — done (repo): service events + follow-ups.
7. **Residence move-in/residency** — done (repo): admit → bed → phases → house ops.
8. **Follow-up/outcomes** — follow-up queues done; outcomes = service-event history (sufficient v1).
9. **Basic operational reporting** — existing analytics views + a minimal staff report page (only
   genuinely new build item besides intake UI).

**Explicitly OUT (later):** Grace provider activation (locked OFF), ICARE UI, recovery-capital
visualizations, advanced dashboards, white-label, statewide scaling, domain cutovers
(vrcc.app/recoveryresidence.*), participant-initiated booking, discharge UI (fast-follow),
YKY data archaeology.

## F. Survival Plan (sequence only — NOT executed)

1. **Freeze the evidence.** Tag every branch head listed in section B (`archive/<branch>` tags).
   No deletions. (Prevents loss if branch cleanup happens carelessly later.)
2. **Merge `claude/public-support-onboarding-85u07i` into `main`** via reviewed PR. VERIFIED: no
   overlapping-path conflicts with `950143a`. CI must pass: typecheck, build,
   `check-no-retired-ref`, ICARE governance guard, Grace lock verify. This single merge carries
   the entire stack (all 80 commits, including `a517d5a`) into the canonical line.
3. **Same PR or immediate follow-up:** fix `.mcp.json` → CQCX; mark `docs/HANDOFF.md` +
   `docs/STATE-OF-THE-SYSTEM.md` superseded with banners pointing at the new memory docs;
   renumber the duplicate ADR-0013/0014 files.
4. **Land repository memory** (section G) on main.
5. **Archive branches:** delete the fully-merged and contained branches (tags remain); keep
   `ka6992` and `what-is-built-here` as tags only.
6. **Only then, separately authorized (Type D gate):** staging application of 0122 + edge
   function + gateway with synthetic fixtures; then production application; then the intake UI
   build; then (Type E) domain decisions. None of this is part of reconciliation.

Nothing from `ka6992` or `what-is-built-here-3co21c` needs cherry-picking — supersession was
verified file-by-file for their headline work.

## G. Repository Memory Plan (evaluated; not created yet)

- **`CLAUDE.md`** — adopt the tip's pointer-not-authority file; extend with: canonical project
  refs, "read `docs/operations/CURRENT-STATE.md` first", the never-do list (no YKY writes, no
  participant-data migration, Grace OFF, no real data in tests), and how decisions change (ADR).
- **`docs/architecture/CANONICAL-ARCHITECTURE.md`** — create: one platform, domain-scoped front
  doors (ADR-0014), package/app map, the recoveryos schema as the single system of record.
- **`docs/architecture/DOMAIN-REGISTRY.md`** — create from section-6 intents, explicitly marked
  proposed-vs-bound, with rcoiowa.org / justgraceforaddictions.org out of scope.
- **`docs/architecture/DATA-AUTHORITY.md`** — create: CQCX canonical (launch migration line is
  `supabase/launch/migrations/` only), YKY legacy (running, frozen for new data),
  contact-connect-dashboard deprecated, EJWRH drift record, `supabase/migrations/` = YKY history
  (never apply).
- **`docs/operations/CURRENT-STATE.md`** — create; absorbs and supersedes HANDOFF.md +
  STATE-OF-THE-SYSTEM.md; updated in the same commit as any state-changing work.
- **`docs/operations/RELEASE-GATES.md`** — create; formalize the Type A–E gate vocabulary the
  scorecard already uses.
- **`docs/decisions/`** — keep; add an ADR recording this consolidation (canonical line, branch
  dispositions, supersessions); fix duplicate numbering.
- **`docs/audits/`** — keep; this document and the public-intake convergence audit live here.

## H. Next Action

**Open the consolidation PR merging `claude/public-support-onboarding-85u07i` into `main`
(after tagging all branch heads), with the `.mcp.json` CQCX fix and supersession banners on
HANDOFF/STATE-OF-THE-SYSTEM included.** Everything else — memory docs, branch cleanup, the
Type D staging gate for 0122 — depends on main first becoming the canonical line, and this merge
is verified conflict-free and CI-guarded.
