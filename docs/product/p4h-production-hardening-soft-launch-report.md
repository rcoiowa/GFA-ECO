# P4H — Production Hardening & Soft-Launch Verification Report

**Verdict (§35, stated up front): NO-GO — SOFT LAUNCH BLOCKED.**
Everything implementable in this execution environment was implemented and verified; the gate's
defining evidence — the real-browser → real-HTTPS → RecoveryOS-Launch checklist — could not be
executed because **this environment's organizational egress policy denies HTTPS CONNECT to
`cqcxvwoukyhxyokfwnjm.supabase.co:443` (403)**. Per the directive's own standard ("No simulated
confidence"), items that require that boundary are marked BLOCKED with their exact remedy, not
inferred. The complete harness to run them is built, committed, and self-documenting.

Blockers and responsible layers are enumerated in §AG.

---

## A. Hearth baseline

Preserved intact from commit `baa8314`: token architecture, appearance modes, atmospheres,
motion, registers, 134 tests, contrast gate. No domain architecture was reopened. This phase
added hardening layers only (PWA, harnesses, monitoring, advisor fixes).

## B. PWA

**Implemented and browser-verified locally (production build on localhost + preinstalled
Chromium):**
- `manifest.webmanifest`: name/short_name (VRCC), description, `standalone`, start_url/scope `/`,
  Hearth theme colors (`#6540A5` light / `#141019` dark via media-scoped meta tags), 192/512 +
  maskable icons (generated from the committed SVG mark via `scripts/generate-icons.mjs`).
- `public/sw.js` service worker: app-shell precache; hashed `/assets/*` cache-first; navigations
  network-first with cached-shell offline fallback; standard waiting-based update lifecycle
  (no mid-session forced takeover), old cache generations pruned on activate.
- **Private-data cache policy is structural**: the worker returns before `respondWith` for any
  non-GET or any cross-origin request — every Supabase Auth/PostgREST/RPC/Realtime call passes
  untouched, so message bodies, Pulse data, assessments, residence records, application answers,
  and consent data can never be cached by it. A spec asserts these properties on the shipped file.
- Playwright-verified: manifest served/parsed/complete, all icons 200, SW registers and reaches
  `activated`, and with the network cut the shell still opens (offline-aware truth: the in-app
  OfflineNotice then reports connectivity honestly). Install-prompt eligibility criteria
  (manifest + SW + icons) all verified; the OS-level install dialog itself is a human-device item.

## C. Accessibility — automated

New permanent harness: `@playwright/test` + `@axe-core/playwright` on the preinstalled Chromium
(`apps/platform/e2e/a11y.spec.ts`), wired to the production build. Coverage: seven public/auth
routes × light + dark, Cosmic atmosphere, landmark/heading structure, keyboard completion to
submit, reduced-motion collapse (computed animation duration ≤0.001s), 320px reflow, 200%-zoom
equivalent. WCAG 2.2 AA tags enforced; serious/critical violations fail the suite.

**Findings were fixed, not just reported:** (1) in-text links relied on color alone
(`hover:underline`) — now persistently underlined platform-wide; (2) landing header navigation
overflowed ≤412px viewports — restructured (secondary links collapse, sign-in/get-started always
visible); (3) residence-directory cards overflowed at 320px (unbroken contact strings) — fixed
with `min-w-0`/`break-words`. Suite result: **50/50 passing.**
Authenticated-workspace axe scans are part of the `live` project (BLOCKED here — §J).

## D. Accessibility — manual

- **Keyboard**: public flows verified in-browser via the harness (tab order, visible focus,
  skip link, submit reachability). Authenticated flows: BLOCKED with the live gate.
- **Screen reader (VoiceOver/NVDA)**: **BLOCKED — HUMAN DEVICE VERIFICATION REQUIRED.** Exact
  human checklist: with VoiceOver (Safari/iOS) and NVDA (Firefox/Windows), complete — sign-in;
  bottom-nav orientation ("Primary" landmark announced, current page conveyed); Connect ask →
  "We've got your request" announced via `role=status`; Messages (composer labeled "Message
  {name}", incoming attribution "X said", unread counts); scheduling accept; Support Now from
  any participant surface (≤2 stops); appearance switch; offline banner announcement.
- Forced-colors/high-contrast: structural readiness only (borders accompany all fills; state
  never color-only); behavioral pass on a Windows device remains on the human checklist.

## E. Mobile

`e2e/mobile.spec.ts`: 5 viewports (320/390/412/768/1280) × 5 public routes — no horizontal
scroll, visible ≥44px primary action, Veil fallback (solid `bg-surface-raised` asserted where
`backdrop-filter` is unsupported). All passing after the two overflow fixes (§C). Authenticated
surfaces (composer + keyboard, sheets, bed board, admin cards): specs exist in the live project;
BLOCKED here.

## F. Performance

Baseline after Hearth + PWA (production build):
- Entry JS 611.9 kB (171.5 gzip); CSS 36.5 kB (7.78 gzip); lazy areas: Resident 465.4 (142.2),
  Participant 246.9 (70.7), Staff 49.5 (13.2), Admin 35.5 (9.6), Navigator 25.7 (6.9).
- PWA adds ~1.3 kB HTML/SW + ~49 kB static icons (cached, off critical path). No new runtime
  JS dependencies in the app bundle (Playwright/axe/sharp are dev-only).
- Localhost render: DOMContentLoaded 147 ms, full load 149 ms (backend-independent shell).
- Cosmic remains static imagery (no runtime cost beyond paint); no looping animation anywhere;
  animations are transform/opacity only.
- Real-network Core Web Vitals and API waterfalls: measured at the staging deployment (§G) —
  BLOCKED here. Known consideration (not a launch blocker at cohort scale): the 611 kB entry
  chunk warrants a vendor-split pass post-soft-launch.

## G. Verification deployment

**BLOCKED — not created.** Requirements recorded: protected (non-public, access-restricted)
static deployment of `apps/platform/dist` (Cloudflare Pages preview or equivalent) pointing at
RecoveryOS-Launch via `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (publishable only), with
`VITE_RELEASE` set to the commit SHA; record URL/commit/build/config/restrictions in this
report's next revision. This environment can neither push a deployment (no Cloudflare deploy
credentials/tooling authorized here) nor verify one (egress denied). It must NOT replace vrcc.app.

## H. Fixture identities

Defined and documented (`docs/product/p4h-e2e-runbook.md`): `p4h-participant/coach/navigator/
residence-manager/residence-staff/resident/admin/executive/operator@fixtures.recoveryos.test`
plus per-run timestamped signup identities; admin bootstrap via the real invitation RPC;
**every fixture classified `test_fixture` in `person_classification`**, keeping gate runs out of
`admin_evidence_summary` (the fixture-exclusion mechanism is the P4G one, already DB-verified).
No automated verification runs against real participant records.

## I. Browser E2E harness

Built: Playwright config with `local` and `live` projects, preinstalled-Chromium pinning,
trace/screenshot on failure, semantic selectors (roles/labels/text), multi-context multi-user
support, serial dependency ordering, and an auto-fixture that makes every live spec self-skip
with the message "BLOCKED — live HTTP gate requires egress to *.supabase.co and
RECOVERYOS_E2E_LIVE=1". 69 tests total (50 local + 19 live). The live specs were authored
without a reachable backend; first live run is expected to need selector bring-up (traces make
that fast) — stated plainly, not hidden.

## J. HTTP checklist 1–31

| # | Item | Status |
|---|---|---|
| 1–30 | full matrix (auth → coaching → navigation → residence → governance) | **BLOCKED** — Environment (egress policy denies `*.supabase.co`); specs authored and mapped in the runbook |
| 31 | launch preflight + advisors rerun | **PARTIAL**: preflight **PASS** live after 0118; security advisor 3×INFO all ACCEPTED/INTENTIONAL; performance advisor real findings fixed (§P/§Q). Final rerun still required after items 1–30 run and any fixes land |

No item is claimed HTTP-VERIFIED. The DB-verified evidence from P4B–P4G stands but is
explicitly not a substitute.

## K. Failure/fix log (this phase)

1. In-text color-only links (UI layer) → persistent underlines; axe regression test now guards.
2. Landing nav overflow ≤412px (UI) → responsive header; viewport tests guard.
3. Directory card overflow at 320px (UI) → `min-w-0` + `break-words`; viewport tests guard.
4. `auth_rls_initplan` ×10 (RLS/Database) → migration 0118 initplan rewrites; advisor is the guard.
5. Playwright treated the live helper as a test file (harness) → testMatch narrowed + auto-fixture.

## L. Realtime verification

**BLOCKED** (Environment): websocket evidence cannot be produced without egress. The live spec
observes actual `supabase` websocket frames, asserts cross-user delivery, absence of duplicate
bubbles, and reconnect refetch. SQL inference is not claimed as realtime proof.

## M. Polling status

**Retained, unchanged.** Directive §16 conditions retirement on checklist #9 passing; it has not
run. The 15–20 s messaging/notification polling remains the delivery guarantee.

## N. Reminder cron

**NOT ACTIVATED.** §17's prerequisites (HTTP-verified auth, scheduling, appointment creation,
notification creation, routing, realtime delivery) are unmet in this environment, so the
conditional authorization does not trigger. Engine remains DB-VERIFIED; 0104 remains READY.
Activation procedure + observation protocol are encoded in the runbook ("After the gate passes").

## O. External delivery

**OFF.** Nothing configured, nothing sent. Readiness assessment: in-app notifications are the
verified channel; SMS/email require provider selection, consent flows, and a separate
verification gate — recommended as its own post-soft-launch phase.

## P. Supabase security advisor

Run post-fixes (live project): **3 findings, all INFO** — `rls_enabled_no_policy` on
`funding_sources`, `locations`, `organization_relationships`. Classification:
**ACCEPTED / INTENTIONAL** — deny-all reference tables (RLS on, no policies = fail-closed);
verified no client code reads them (definer RPCs aggregate `funding_sources` server-side).
No BLOCKER, no FIX-class security findings. SECURITY DEFINER/search_path/anon posture is
additionally preflight-guarded.

## Q. Supabase performance advisor

248 findings triaged: **FIX** — 10 `auth_rls_initplan` WARNs (per-row `auth.uid()`
re-evaluation) rewritten with the initplan pattern, plus 18 covering indexes added on hot-path
foreign keys (messaging/scheduling/navigation/service evidence) — migration
`0118_performance_hardening.sql`, applied live, preflight re-PASSED.
**ACCEPTED** — 94 `multiple_permissive_policies` WARNs (the layered per-domain policy design;
consolidation is a deliberate post-soft-launch optimization, not a sweep) and 37 `unused_index`
INFOs (pre-traffic database). Nothing was blindly applied.

## R. Secrets/environment audit

- Tracked env files: only `.env.example` (publishable anon key — client-safe by design, RLS is
  the boundary). No `sb_secret`/service-role/JWT material anywhere in tracked source.
- Build output: no sourcemaps emitted; the single `service_role`-shaped match in the bundle is
  supabase-js's own key-prefix validation string, not a credential.
- Service-role usage exists only server-side: Cloudflare Worker (via `wrangler secret put`,
  never in `wrangler.toml`) and Edge Functions (platform-injected env). Browser client uses
  publishable credentials only (`main.tsx`).
- Environment matrix: local dev (`.env.local`, untracked) → staging (§G, VITE_* at build,
  publishable only) → production (same shape; cutover-gated). Cloudflare dashboard variable
  review is listed on the staging-deployment checklist since it is not reachable from here.

## S. Observability

Implemented (`src/lib/monitor.ts`): global crash + unhandled-rejection capture, TanStack
query/mutation failure capture (query-key scope + error), release identity (`VITE_RELEASE`),
current route path. **Structural redaction**: quoted free text, emails, and long digit runs are
scrubbed and length hard-capped before any event exists — message bodies/Pulse narrative/notes
can never transit. Sink is pluggable and OFF (in-memory buffer + DEV console) until a
destination is explicitly approved; 4 unit tests pin the redaction behavior.

## T. Logging/privacy audit

Repo-wide sweep of `console.*`/analytics/logging: 3 sites found. `analytics.ts` DEV-only event
names (process-only, pre-existing tests guard vocabulary); `StaffTodayPage` raw error log →
rerouted through the redacting monitor; `serviceEvents.ts` attribution warning logs operational
metadata only (kept). Analytics payloads remain ids/timestamps/booleans; notification previews
remain content-free.

## U. Auth verification through browser

**BLOCKED** (Environment) — signup/login/logout/reset/expiry/refresh/revocation-mid-session are
items 1, 3, 24–26 of the live suite. Authority chain (auth.users → people → role_assignments,
never editable user metadata) is unchanged and DB-verified from P4A/P4G.

## V. Public surfaces

Local browser verification: landing, directory, Grace House, list-your-residence, sign-in,
register, forgot-password render clean (axe, keyboard, viewports); page HTML contains no private
data (static shell + public reference content only; no applicant/resident enumeration is
possible client-side — anon grants are INSERT-only on `referrals`, preflight-guarded). Errors
are humane (no SQL/RPC vocabulary rendered). Rate/abuse controls on anonymous intake: none
beyond Supabase defaults — recorded as a soft-launch observation item and Worker-layer
candidate; not a blocker for an invited cohort.

## W. Support Now

Component level: pill button, 44px+ target, keyboard focusable, `shadow-raised` prominence,
present in participant/resident shells and on the public landing (988 call/text CTA); Grace AI
is not a crisis responder anywhere. Full flow placement/escalation across authenticated
surfaces: live-project item (BLOCKED), plus on the human review checklist.

## X. Evidence HTTP reconciliation

**BLOCKED** over HTTP (Environment). The identical deltas were DB-verified in P4G
(request/claim/T1/T4a/served/referral≠connected/unresolved-retained, exact ±1 assertions,
rolled back). The runbook's §27 procedure re-proves them through the browser with fixture
workflows and before/after `admin_evidence_summary` snapshots (fixtures excluded by
classification).

## Y. T0–T4b

Definitions and instrumentation unchanged (T0 request, T1 first coach message, T2 claim,
T3 relationship, T4a two-way, T4b attested service). No renames.

## Z. TTMHC

**NOT APPROVED — not calculated, not displayed, not renamed.** The Evidence page states this
explicitly; the live suite asserts the label's absence (item 29).

## AA. Hearth human UX review

Structured pass over locally-renderable surfaces (screenshots via the harness across light/dark/
Cosmic/five viewports): orientation and action comprehension on public + auth pages read
clearly; purple register reads calm rather than clinical; unread indicators are quiet; Cosmic
maintains readability on opaque cards; no motion feels decorative (only the approved moments
exist). Items requiring authenticated surfaces and real humans (My Support relational feel,
Residence home-vs-compliance, Admin operations-vs-surveillance, unread pressure over time)
are carried on the §48 observation list for the soft-launch cohort — no redesigns made from a
single subjective pass. Findings log for V1.1: none blocking; consider a vendor-chunk split
(§F) and an in-product increased-contrast toggle (carried from the experience report).

## AB. Soft-launch readiness

**Plan prepared; execution gated on §AG blockers.** Cohorts: (1) staff — platform admin, 1–2
coaches, navigator, residence manager/staff (real accounts via the real invitation flow — not
fixtures); (2) invited participants — a small intentional cohort after staff week one. No broad
outreach. Observation plan (§31): daily review of monitor buffer/sink (signup failures, failed
RPC scopes), claim-time and evidence-counter accuracy via `/admin` (already aggregate-only),
messaging delivery spot-checks, realtime reconnect behavior, audit-log anomalies, accessibility
feedback channel. All observation is product-reliability telemetry — no participant
surveillance; the monitor's structural redaction applies to everything captured.

## AC. Known defects

None open in what was executed (all found defects fixed — §K). Known limitations: live-gate
selector bring-up expected on first run (§I); anonymous-intake rate limiting deferred (§V);
entry-chunk size optimization deferred (§F).

## AD. Cutover package (prepared — NOT executed)

- **Candidate commit**: this branch's HEAD after this report merges; deploy `apps/platform/dist`.
- **Prerequisites before the cutover decision**: §AG blockers cleared → E2E 1–31 HTTP-VERIFIED →
  polling retirement (only after item 9) → cron activated + one observed clean cycle → staff
  cohort soft launch stable ≥1–2 weeks → evidence counters reconciled.
- **DNS/Cloudflare plan**: point `vrcc.app` (and `www`) at the verified deployment; keep the
  legacy production reachable at a fallback hostname until rollback window closes; preserve
  existing `recoveryresidence.org/.app` and Grace House host mappings (ADR-0014 host-homes
  already in the app).
- **Redirects**: legacy `/app/*` paths already redirect in-app; external deep links unchanged.
- **Rollback**: DNS revert to the prior origin (TTL ≤300s pre-staged); the launch DB is
  independent of DNS, and the archive project (`ykykeioydvtxpyreshhs`) remains untouched as the
  pre-launch system of record. No destructive step exists in the cutover, so rollback is pure
  routing.
- **Archive disposition recommendation**: retain, unmodified, through at least 90 days
  post-cutover; revisit with a separate authorization.
- **First hour**: sign-in, Connect ask→claim round-trip with a staff account, message round-trip,
  notification arrival, admin operations page, monitor sink empty of new crash scopes, Supabase
  logs clean.
- **First 24 h**: signup funnel, claim times, realtime reconnects, cron cycle correctness,
  evidence counters vs. reality, audit-log review, error rates by release tag.
- **Explicit note**: public cutover requires its own authorization; nothing in this phase
  performed or scheduled it.

## AE. Rollback plan

Application: redeploy previous build (static hosting, instant). Database: launch migrations are
additive-only through 0118; no destructive rollbacks exist or are needed; cron (if ever active)
is disabled by unscheduling — data intact. DNS: revert per §AD. Monitoring: release identity in
every monitor event distinguishes old/new builds during the window.

## AF. Final gates (§34)

| Gate | Result |
|---|---|
| `pnpm -r typecheck` | PASS |
| `pnpm -r test` | PASS — **138 tests** (77 domain, 44 platform, 17 content) |
| `pnpm -r build` | PASS |
| `node scripts/contrast-check.mjs` | **CONTRAST GATE PASS** |
| `launch_contract_check.sql` (live) | **PASS** (re-run after 0118) |
| Browser E2E — `local` project | **PASS 50/50** |
| Browser E2E — `live` project | 19/19 self-skip **BLOCKED** (honest, not green-washed) |
| Accessibility automated | PASS (within `local`) |
| Manual accessibility | keyboard/public VERIFIED · screen reader **HUMAN DEVICE CHECK REQUIRED** |

## AG. Final verdict

**NO-GO — SOFT LAUNCH BLOCKED.**

Exact blockers and responsible layers:

1. **HTTP/E2E checklist items 1–30 not executed** — *Environment*: org egress policy answers
   403 to CONNECT for `cqcxvwoukyhxyokfwnjm.supabase.co:443`. Remedy: run
   `RECOVERYOS_E2E_LIVE=1 pnpm exec playwright test --project=live` from any machine/CI with
   ordinary egress, or recreate this remote environment with a network policy allowing
   `*.supabase.co` (runbook: `docs/product/p4h-e2e-runbook.md`).
2. **Realtime live websocket proof** — *Environment* (same cause); polling therefore correctly
   retained.
3. **Reminder cron 0104** — *dependent on 1–2*: prerequisites not HTTP-verified, so the
   conditional activation authorization does not trigger. Remains READY — NOT ACTIVATED.
4. **Protected staging deployment** — *Deployment/Environment*: not creatable or verifiable from
   here; required for real-network performance numbers and the recorded verification URL.
5. **Manual assistive-tech review** — *Human device*: VoiceOver/NVDA checklist in §D.

Non-environmental engineering blockers: **none** — every defect found by the executed gates was
fixed and regression-guarded. Once items 1–2 run green (and 3–5 complete), the controlled
soft-launch cohort in §AB can proceed without further build work, and the §AD cutover package
becomes decision-ready.

---

# P4H-G1 addendum — CI live gate & Cloudflare staging (2026-08-08)

The verification boundary was moved to GitHub Actions per the P4H-G1 directive. Status of each
G1 concern:

**Configuration drift (G1 §1–3) — CORRECTED.** `deploy-staging.yml` was building against the
retired `ykykeioydvtxpyreshhs` project and triggering only on a dead branch. It now targets the
current build branch, builds with repository-variable-driven publishable config whose fallback
is the canonical RecoveryOS-Launch project (`cqcxvwoukyhxyokfwnjm`) — drift back to a retired
project is no longer possible silently — and stamps `VITE_RELEASE` with the commit SHA.

**Cloudflare target audit (G1 §4) — RESOLVED.** Account inventory: `gfa-eco-recovery-residence-os`
is the production-candidate Worker (dashboard git builds converge there; future cutover target —
untouched), and a pre-existing non-production **`recoveryos-staging`** Worker (created
2026-08-02) is the staging target, addressed via the new `wrangler.staging.jsonc` so staging
deploys can never clobber the production candidate. vrcc.app untouched.

**Staging deployment (G1 §10, Phase B) — DEPLOYED.** Run 31283060679 (commit `92c649d`)
built with RecoveryOS-Launch config and deployed to `recoveryos-staging` successfully
(2026-08-08T23:02Z; exact workers.dev URL in that run's deploy step log; `CLOUDFLARE_API_TOKEN`
already existed as repo config). **Protection posture — DOCUMENTED LIMITATION:** the Worker is
reachable at an unlisted workers.dev URL with no Cloudflare Access policy; adding Access
requires a human dashboard action (Zero Trust → Access → protect the workers.dev route). Per
G1 §5 this does not block the backend gate (MODE A runs against a runner-local build).

**Live gate workflow (G1 §6) — BUILT, EXECUTED, FAIL-FAST AS DESIGNED.**
`.github/workflows/live-gate.yml`: manual-only (workflow_dispatch + a deliberate
`live-gate/<n>` trigger-branch path, needed because workflow_dispatch registration requires the
file on the repository default branch, which was deliberately not touched). It seeds `p4h-*`
fixtures server-side (service key, per-run masked password — nothing committed), builds against
RecoveryOS-Launch, serves the production build on the runner (MODE A) or targets
`P4H_E2E_BASE_URL` (MODE B), runs the live suite, uploads traces. Supporting pieces: migration
`0119_service_role_grants.sql` (applied live — standard server-only service_role table grants;
client authorization unchanged), `scripts/seed-e2e-fixtures.mjs` (idempotent; classifies every
synthetic identity `test_fixture`), Playwright config gains CI-runner browser fallback and the
external-base-URL mode without touching the proven `local` project.

**Execution evidence:** run 31283117272 (branch `live-gate/run-001`, commit `de764e5`) reached
the egress-capable runner, resolved canonical config, and stopped exactly at the designed
guard: **the `SUPABASE_SERVICE_ROLE_KEY` repository secret does not exist.** A follow-up
workflow_dispatch (now registered) queued successfully — the dispatch path works too.

**Chronic CI failure fixed (found during G1):** every CI run had failed for weeks on a
pnpm version conflict (`pnpm/action-setup` pin vs `packageManager`); removed the pin — CI can
go green again.

**Items G1 §9 (gate items 1–30), §12 (realtime/polling), §13 (cron), §14 (authenticated
accessibility), §11/Phase C (deployed-artifact verification):** NOT EXECUTED — all gated behind
the single missing secret below. Cron remains READY — NOT ACTIVATED; polling retained; external
delivery OFF; no DNS changes; human-device VoiceOver/NVDA items unchanged.

## G1 verdict

**P4H LIVE GATE NO-GO — [BLOCKER: missing `SUPABASE_SERVICE_ROLE_KEY` repository secret]**

Exactly one human action unblocks the entire gate: add the launch project's service-role key as
a GitHub Actions **repository secret** named `SUPABASE_SERVICE_ROLE_KEY`
(github.com/rcoiowa/GFA-ECO → Settings → Secrets and variables → Actions → New repository
secret; optionally also `P4H_E2E_PASSWORD` for a fixed fixture password — otherwise each run
generates and masks its own). The key is used only by the server-side fixture seeder and never
reaches the browser or the built artifact. After the secret exists, the gate runs via the
Actions tab ("Live HTTP gate" → Run workflow on `claude/grace-coaching-audit-b0fyhq`) or by
asking this session to dispatch it; first-run selector bring-up then proceeds per the runbook,
followed by realtime→polling→cron→authenticated-accessibility→Phase C in the directive's order.
The residual `live-gate/run-001` branch is an inert trigger artifact (identical history; the
push credential cannot delete remote branches).
