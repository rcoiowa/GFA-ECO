# RecoveryOS Master Consolidation — Read-Only Baseline & Reconciliation (2026-09-13)

**Baseline timestamp:** 2026-09-13T14:40:04Z (UTC). **Session class:** VERIFY → RECONCILE →
REPORT. **No live mutation of any kind was performed:** no merge, no branch/tag change, no
migration, no Edge Function or Worker deploy, no DNS/zone change, no identity/role change, no
data change. The only writes are the audit documents on the session branch
`claude/reconciliation-packets-consolidate-d5h5ok`.

Companion controlling ledger: `docs/audits/canonical-completion-register-2026-09-13.md`
(register, gate tree, approval packet).

Evidence levels: **LIVE-VERIFIED** (authenticated API/SQL/HTTP observed this session) ·
**DEPLOYMENT-VERIFIED** (CI/deploy run × platform metadata cross-check) · **SOURCE-VERIFIED**
(read from exact commit) · **REPORTED** (prior packet/document, not independently rechecked) ·
**INFERRED** · **UNKNOWN/BLOCKED**.

---

## 1. Sources and systems

**Available and used this session:**

- `rcoiowa/GFA-ECO` — full remote (27 branches fetched at baseline, plus fetch-on-demand),
  all PRs (#1–#8), GitHub Actions run history (264 CI runs, 73 staging deploys, 2
  production-candidate deploys) via GitHub MCP.
- **Supabase CQCX** (`cqcxvwoukyhxyokfwnjm`) — read-only management API + SQL
  (project list, migration ledger, Edge Function inventory, aggregate-only role/classification
  queries; no PII selected). The connection was intermittent this session; every result below
  marked LIVE-VERIFIED was actually returned.
- **Cloudflare Workers** — account Worker inventory (metadata) via MCP. No zone/DNS/Pages API
  available.
- **Public HTTP** (via session proxy) — vrcc.app and both canonical Worker URLs fetched
  read-only, including their JS bundles (backend-ref grep only).
- Repository documentation corpus: all 12 reconciliation packets (see
  `docs/audits/reconciliation-packets-consolidated-2026-09-13.md`), decision records,
  authority documents, prepared migrations, live-drift captures.

**Unavailable / out of scope this session:**

- **YKY (`ykykeioydvtxpyreshhs`)** — deliberately NOT queried (frozen, out of scope by
  directive). Its status ACTIVE_HEALTHY is from the project listing only.
- claude.ai chat transcripts / ChatGPT conversations — not accessible; branch-committed
  records are the practical review surface.
- Cloudflare zone/DNS/Pages/custom-domain APIs — not exposed by available tooling; public-side
  domain facts were established by HTTP fetch instead.
- Supabase connectivity was intermittent; a fresh **security**-advisor pull did succeed late
  in the session (§6). Performance advisors were not re-pulled — the 2026-09-07 triage
  (237 lints) stands as the latest evidence.
- No synchronization packets were submitted in-session; none awaited (`END SYNCHRONIZATION
  PACKETS` marker not applicable — the packet corpus reviewed is the committed one).

## 2. Canonical identity (G0) — LIVE/SOURCE-VERIFIED

| Fact | Value | Evidence |
|---|---|---|
| Canonical repo | `rcoiowa/GFA-ECO` | this session |
| GitHub default branch | `claude/supabase-mcp-setup-ep29rp` (`e901b22`, 4-file setup commit) | `git remote show origin` — **hazard persists** |
| `main` | `4959156` (PR #6 merge, 2026-08-21) — behind the application line | git |
| Application line (PR #7) | head `825bb5c` on `claude/recoveryos-infrastructure-consolidation-2026-09-07`, base `claude/resume-previous-session-hbt3xp` (`5065180`); head **descends from base — fast-forward mergeable, no conflict** | git ancestry check |
| Canonical Supabase | CQCX `cqcxvwoukyhxyokfwnjm`, ACTIVE_HEALTHY | LIVE-VERIFIED |
| CQCX migration ledger | 0000 → **0146** (`20260831001422 0146_ejwrh_document_activation`) + the four captured out-of-line entries (2× EJWRH 2026-08-11, forms/signature + sites-bucket + close-window 2026-08-23) — **matches the repo launch line + `supabase/live-drift/cqcx/` captures exactly; 0147 NOT applied** | LIVE-VERIFIED vs SOURCE |
| CQCX Edge Functions | 7 ACTIVE: `lead-intake` v11, `grace-coaching-canary` v11, `create-meeting` v11, `grace` v14, `grace-judge` v7, **`residence-intake` v2 (verify_jwt=false)**, **`ejwrh` v2 (verify_jwt=false)** | LIVE-VERIFIED |
| Staging Worker `recoveryos-staging` | serves commit **`d7ab99d`** (deploy run 73, 2026-09-02T21:37Z; Worker modified_on 21:38:03 matches). Live page: canonical title, bundle `index-BH4_rnUO.js`, **CQCX-only** | DEPLOYMENT- + LIVE-VERIFIED |
| Production-candidate Worker `gfa-eco-recovery-residence-os` | serves commit **`1542eaf`** (deploy run 2, 2026-09-01T19:36Z; modified_on matches). Live page: canonical title, bundle `index-BtJxM174.js`, **CQCX-only** | DEPLOYMENT- + LIVE-VERIFIED |
| Other Workers | `vrcc-app`, `virtualrecovery` (both modified 2026-08-16, provenance UNKNOWN), `recovery-residence-os` (07-29), 5 `vite-react-template*` scratch. **No `recoveryos-api` Worker exists** | LIVE-VERIFIED (metadata) |

## 3. The two release-blocking live findings

### 3.1 vrcc.app still serves the legacy MVP against the retired backend — LIVE-VERIFIED 2026-09-13

`https://vrcc.app` returns title **"GFA VRCC — Connection Prevents Crisis"** with bundle
`/assets/index-CoFlmJ02.js` — the **same MVP bundle** the 2026-08-04 deployment registry
recorded — and that bundle contains the retired YKY project ref **3 times and the canonical
CQCX ref zero times.** Conclusion: the 2026-08-31 cutover attempt never took public effect
(consistent with the registrar-delegation mismatch recorded in the 08-31 state packet), and
the public front door still registers/authenticates people against the **frozen** YKY
project. This is active drift against governance (§4.4-class exposure: new participant
writes to a retired backend), it is why the legacy YKY cohort kept growing, and it is not
fixable from this session (no zone/DNS authority + explicit STOP gate). **Approval-packet
item A.**

### 3.2 Test-fixture administrator/executive with sign-in — LIVE-VERIFIED 2026-09-13

Aggregate-only queries on CQCX (no PII selected):

- Active role assignments by classification: production — administrator 1, executive 1,
  program_manager 1, coach 2, navigator 2, residence_manager 2, residence_staff 2,
  participant 8, resident 2. test_fixture — **administrator 1, executive 1**, coach 17,
  navigator 1, residence_manager 1, residence_staff 1, resident 1, participant 60.
- **Both fixture administrator/executive people have linked auth accounts**
  (`people.auth_user_id` NOT NULL → sign-in capable): count = 2.

Migration 0120/0120b ("classification symmetry", applied live) world-gates the support-pool
path, and P4G aggregates exclude non-production people (REPORTED). But whether **every**
privileged read path (admin/staff RPCs, SELECT policies, analytics) is world-gated is
**unproven** — the R1 correction design (2026-09-07, PROPOSED) itself names
"production-actor gate across every privileged path" as a P0 requirement, i.e. known
not-yet-implemented. Per the program rules this stays a **release-blocking P0 until either
the fixture admin/exec credentials are revoked/downgraded or the world-gate is proven across
every privileged path with negative tests.** No sign-in test was attempted (no credentials;
probing production authentication is not authorized). **Approval-packet item B.**

## 4. §4 stale-baseline contradictions — dispositions

| # | Historical uncertainty | Current verified state |
|---|---|---|
| 1 | PR #7 draft/open, SHA 825bb5c vs ca80e35 | **OPEN, DRAFT**, head `825bb5c` (base = resume branch, fast-forward mergeable). `ca80e35` is an *ancestor* commit on the same branch (CI run 154); both SHAs were true at different times. CI (run 156) is **success on exactly `825bb5c`**. Whether PR #7 is still the correct vehicle: yes for the app-line consolidation; note its base is the resume branch, not `main` — landing on `main` is a separate, gated step. |
| 2 | CI run 156 green ≠ readiness | Confirmed: run 156 is `ci.yml` on `825bb5c` (guards, typecheck, tests, build). It proves nothing about deployment, migrations, live security, or UAT — those are tracked separately in the register. An independent local re-validation of `825bb5c` was run this session (result in the register, item CCR-D2). |
| 3 | Migration 0147 prepared, ledger tail 0146 | **Both LIVE-VERIFIED true today.** 0147 exists only as `supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql` (+ CI guard `verify-0147-prepared.mjs`). A **recorded executive decision (2026-09-03)** resolves the duplicate-0147 conflict: the canonical-line 0147 governs; `claude/contact-connect-intake-foundation`'s variant is superseded (branch preserved); a reconciliation queue of its unique elements remains open. One design question (lead reopening transition matrix) is explicitly OPEN pending ratification (CI run 155 record). |
| 4 | test_fixture admin + role helpers vs person_classification | See §3.2 — precondition confirmed live; symmetry fix applied for the pool path; full privileged-path proof outstanding. **P0 open.** |
| 5 | R1 ingress hardening / thin gateway | R1 front-door repair **deployed to staging** (`d7ab99d`, run 73): both houses' public applications are real DB-backed forms on the allowlisted directory origin → `residence-intake` → `recoveryos.residence_application_intake`. The further hardening (mandatory Turnstile fail-closed, Origin-required, residence-id validation, generic error envelopes) is **repo-prepared at `20d20c1` on the PR #7 branch, NOT redeployed** — the live `residence-intake` v2 predates it. No thin Cloudflare gateway exists (by decision: R1 fork chose Turnstile-only, no new Worker). Turnstile server-verification gap on two authenticated platform forms recorded OPEN (run 155). |
| 6 | Worker/function drift | Full current inventory in §2, all LIVE-VERIFIED with deploy-run provenance for the two canonical Workers. `vrcc-app`/`virtualrecovery` (2026-08-16) remain UNKNOWN-provenance; `virtualrecovery` presumably answers vrcc.app (UNVERIFIED which of the two/Pages does — but the served build is identified regardless, §3.1). |
| 7 | workers/api, recoveryos-api, residence-intake "not deployed" | `recoveryos-api`: confirmed **no such Worker exists** (live list). `workers/api`: quarantined by PR #7 (SOURCE). `residence-intake`: **stale claim — it IS deployed and ACTIVE (v2)** since ~08-21, updated ~08-31. |
| 8 | PR #6 merged; earlier P0 gates | PR #6 merged into `main` 2026-08-21 (`4959156`, merge commit is ground truth). Its five review findings were remediated (consolidation record addendum). Earlier "closed" P0s that lacked evidence are reopened in the register where contradicted (G2 above being the material one). |
| 9 | Monorepo structure | SOURCE-VERIFIED on the application line: `apps/`, `packages/`, `supabase/`, `scripts/`, `sites/`, `workers/` present; `packages/auth` does **not** exist as named (identity lives in `packages/data-access` + DB); stale references are a docs-cleanup item. |
| 10 | Anonymous access "INSERT-only referrals" | Stale. Current anon surface (SOURCE + ledger): `referrals`-path intake, `residence_application_intake` via the `residence-intake` function boundary (0122 + 0138 containment), EJWRH `public.housing_applications` INSERT-only (0123 hardening APPLIED), lead-intake function. Full fresh grant/policy sweep on live requires the Supabase connector back: **BLOCKED, queued.** |
| 11 | RLS / analytics / SECURITY DEFINER risks | 0125 `analytics_view_security`, 0126 `evidence_integrity`, 0135/0137 self-insert boundary retirement applied (ledger). Fresh security advisors pulled this session: **no ERROR findings** (§6); performance triage stands from 09-07 (237 lints, no mass changes). Negative-test isolation proof outstanding (G3). |
| 12 | Worker redeploys with unknown SHA | Resolved for the two canonical Workers (§2). CI-gate-for-exact-SHA deploy control exists on the PR #7 branch (run 150) — **not yet on any deployed line** until PR #7 lands. |
| 13 | Externally visible facts (phone, rosters, metrics, legal claims) | Not re-verified this session; remain ratification-gated. Known-good: warmline 515-310-DIAL (3425) was the ratified correction (2026-08-04 packet). Nothing new published by this session. |

## 5. Grace naming conflict (new, needs one-line executive confirmation)

The operating directive states Grace's ratified name as "Grace, AI **Supportive** Navigator
unless a later ratified decision is directly evidenced." A later ratified decision IS
directly evidenced: `docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md` (on the
PR #8 branch) records — **Decision date 2026-09-13 · Decision owner: Thomas, Executive
Director · Status: Ratified** — canonical full display name **"Grace — AI Support
Navigator"**, with the canonical participant disclosure quoted verbatim, explicit retirement
of the "companion" labels, human roles unchanged (Peer Recovery Coach, Recovery Ally,
Recovery Navigator), and a naming-only scope (no behavior/consent/safety change; the Grace
provider lock stays OFF and CI-guarded). Per the directive's own escape clause, **"AI Support
Navigator" governs**; the one-word difference in the directive is treated as the superseded
wording. PR #8 (draft, CI green on head `741822d`, plus a full terminology-occurrence audit)
still merges only when the main-update gate opens (approval packet E/F). If this record
misstates the executive's intent, one line from the owner corrects it.

## 6. Fresh CQCX security advisors — LIVE-VERIFIED 2026-09-13

The Supabase security linter returned **no ERROR-level findings**. Complete result:

- INFO ×4 — `rls_enabled_no_policy`: `public.housing_applications` (deny-by-default is the
  0123 design: anon INSERT-only via grant + policy-less read denial), and
  `recoveryos.funding_sources` / `locations` / `organization_relationships` (reference tables,
  deny-by-default). Confirm each is intentional in the G3 negative-test pass; no change made.
- WARN ×1 — **Auth leaked-password protection disabled** (HaveIBeenPwned check off). One
  dashboard toggle; it is a production Auth config change, so it is gated — approval-packet
  item B2.

## 7. What this baseline does NOT establish

- Any UAT, accessibility (WCAG 2.2 AA), or negative-path experience evidence (G8/G13):
  not re-run this session; prior partial evidence only.
- Live consent-revocation behavior proof (G4): implemented + migration-backed (0007, 0140,
  0145 in ledger), negative tests not re-run.
- Backup/restore rehearsal, alert ownership, incident runbook completeness (G11): not
  evidenced anywhere in the reviewed corpus beyond partial operational docs — OPEN.
- Whether `vrcc-app` / `virtualrecovery` Workers can be retired: requires domain/DNS
  authority and the cutover decision (item A).
- YKY-side facts of any kind (deliberately not queried).
