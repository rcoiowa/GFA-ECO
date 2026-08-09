# Grace AI — Canonical Implementation Report (G1–G8)

**Date:** 2026-08-09. **Branch:** `claude/grace-coaching-audit-b0fyhq`.
**Baseline (locked):** P4H `7d0b9de` / report `218585a`; frontend `apps/platform`;
backend RecoveryOS-Launch `cqcxvwoukyhxyokfwnjm`; authority `recoveryos.*`; staging
`recoveryos-staging.thomas-499.workers.dev`. **G0 audit:**
`docs/product/grace-ai-source-audit.md` (@ `0f303c9`, + Authority reconciliation
addendum). **Scope:** canonical Grace V1 — stateless, consent-gated,
server-authoritative. **Not** a recreation of historical Grace.

---

## A. Authority reconciliation

Full section-by-section table in the G0 audit's **Authority V1.0 Reconciliation**
addendum. Every implicated Authority section is CONFORMING except two resolved
**CONFLICT — AUTHORITY WINS** (safety detection must be graduated non-diagnostic
routing, not the historical 8-substring toy; no HIPAA/42-CFR/zero-knowledge/
no-hallucination provider claims) and the evaluation/provider-privacy rows, which
are **BLOCKED** on a provider credential (§N/§O/§Q). Process caveat (carried from
G0 §W): the Authority V1.0 document text was again not embedded in the session, so
reconciliation was performed against the directive's enumerated restatement of it;
if the source document differs, re-run §A before activation.

## B. Historical containment plan

Consumers of the still-active dev project (`ykykeioydvtxpyreshhs`). **Evidence:**
edge-function invocation logs show **zero invocations in the last 24h** across all
functions (idle window); the deployed `vrcc.app`/`gfa-vrcc` Pages build calls
`/functions/v1/Grace` directly (G0 finding). No dev-project data is altered.

| Endpoint | Consumer (from source) | Classification | Recommendation |
|---|---|---|---|
| `Grace` (v10) | deployed `V6` companion (public vrcc.app) — potential live serving path; idle in 24h window | ACTIVE LEGACY DEPENDENCY (idle) | **KEEP TEMPORARILY + RESTRICT NOW** — it accepts a client `system_prompt`/`model` override and is invokable with a publishable key; lock those down before canonical cutover, then DECOMMISSION AFTER CUTOVER |
| `grace-companion`, `grace-companion-v6` | NOT on the deployed serving path (V6 calls `Grace`); auto staff-notification + cross-user `participant_id` hole | DANGEROUS / UNUSED | **QUARANTINE NOW** |
| `slogan-engine` | called only by `grace-companion-v6` (itself unused); 7-factor psychographic scoring | UNUSED | **QUARANTINE NOW / DECOMMISSION AFTER CUTOVER** |
| `vrcc-api-gateway(-v6)` | historical data gateway for the deployed app (non-AI) | ACTIVE LEGACY DEPENDENCY | **KEEP TEMPORARILY** (out of Grace scope; document) |
| Base44 fns (`proactiveRiskDetection`, `analyzeFeedbackAndAlert`, `generateANCHORCasePlan`, …) | the Base44/`origin/main` app is DORMANT (shipped MVP renders MvpRoot only) | DANGEROUS / UNUSED | **QUARANTINE NOW** (priority: the no-auth `analyzeFeedbackAndAlert` and fail-open `proactiveRiskDetection`) |

No broad dev-project deletion; archive source preserved (already captured in G0 /
git). Execution of quarantine is **G8**, after canonical Grace is staging-verified
(§X). It requires dev-project dashboard/CLI actions (secret unset, function
disable) — documented for the human operator; not performed in this phase.

## C. Final architecture

```
RecoveryOS / Hearth  [existing]
  → /vrcc/grace  (apps/platform, participant area)                 [new]
  → canonical Auth (Supabase, RequirePerson)                       [reuse]
  → ai_features consent (frontend gate + server recheck)           [reuse type / new gate]
  → grace Edge Function (RecoveryOS-Launch, verify_jwt)            [new]
     → person derived from JWT (never browser)                     [enforced]
     → minimum-necessary own-data context (RLS)                    [reuse]
     → server-authoritative versioned policy (grace-policy-1.0.0)  [new]
     → deterministic safety floor → posture + Support Now surface  [new]
     → canonical retrieval: recoveryos.slogans / resources         [reuse]
     → draft-only tools (send/request via existing RPCs on confirm)[reuse]
     → model interface (server-side key + GRACE_MODEL, no override)[new]
  → approved provider (server-side; model locked after eval)       [BLOCKED on key]
```
WORKER_REQUIRED = **NO** (honored — no Cloudflare Grace Worker; no AI Gateway).
Provider communication is server-side only.

## D. Consent

`ai_features` = `recoveryos.consent_types` id 7 ("Grace AI features"). **Two
independent gates** (§9): the `GracePage` frontend blocks the surface until an
active grant exists and offers the canonical grant/revoke UX; the Edge Function
**independently re-checks** the latest grant (status `granted`, not revoked, not
expired) on every call and returns structured `consent_required` — a modified
browser cannot bypass it. Grants are append-only via `consent_grants` (canonical
path). No silent re-grant. **Verified:** G3 (grant→surface, revoke→gated, server
refuses without consent).

## E. Edge Function

`supabase/functions/grace` (deployed to launch, **version 1, verify_jwt=true**).
Requirements met: authenticated user JWT required (401 otherwise); person derived
from Auth via `auth_user_id` (no browser participant id — a body `participant_id`/
`person_id` is ignored); server-side consent recheck; caller-JWT DB reads so RLS
enforces own-data-only (no service-role client); server-held provider credential;
server-authoritative prompt; bounded (≤24 msgs, ≤4k chars/msg, ≤24k total),
30s timeout, safe upstream error handling (status-only logging — **no body logs**);
no client model selection; no client system-prompt override; **no writes** (no
service_event, notification, or record). Degrades to `ai_unconfigured` (safety
posture intact, **no fabricated reply**) when the provider is unset.

**Response-handling hardening this phase (directive step 1).** The function now
inspects the **full Anthropic envelope**, not just the text:
- **`stop_reason: "refusal"` is NOT treated as a successful empty reply** — it
  returns a distinct `provider_refusal` code (with the safety posture + disclosure)
  so the UI surfaces human support and the eval scores it correctly. This closes the
  Opus-5/Fable-5 silent-empty-refusal failure mode.
- **`stop_reason: "max_tokens"` is recognized as truncation** (`truncated: true`),
  not a clean answer; empty content with a normal stop reason returns
  `provider_empty`; aborts return `provider_timeout`.
- **Process metadata captured** (returned `model_id`, `requested_model`,
  `stop_reason`, `input_tokens`, `output_tokens`, `latency_ms`, `status`,
  `truncated`) in a `meta` object and one structured `grace-meta` log line —
  **process metadata only; never the prompt or response body**. The frontend
  already surfaces Support Now from `result.safety` on every code and shows a safe
  fallback for any non-ok/no-content result, so the new codes degrade safely with
  no UI change. A **separate eval-only judge function** (`supabase/functions/
  grace-judge`) is added — see §N; it is inert (`judge_unconfigured`) unless
  `GRACE_JUDGE_MODEL` + `GRACE_EVAL_SECRET` are set, is wired to no participant
  surface, and refuses to run if the judge model equals the candidate model.

## F. Prompt / version

Server-authoritative, layered, versioned **`grace-policy-1.0.0`**
(`supabase/functions/grace/policy.ts`), layers: IDENTITY+DISCLOSURE → VALUES →
BOUNDARIES → CONVERSATION DOCTRINE → VALIDATION/ANTI-SYCOPHANCY → MULTI-PATHWAY →
FAITH → SAFETY → ANTI-DEPENDENCY → CANONICAL RETRIEVAL → TOOLS → AUTHORIZED CONTEXT
→ INPUT-AS-DATA guard. Exact disclosure microcopy adopted verbatim. Browser cannot
supply system_prompt/model/policy/identity/provider/tool permissions. Version is
returned in every response for testability.

## G. Context minimization

Included (only when canonical/authorized, own data via RLS): preferred/first name,
ICARE phase (when set), has-active-coach, has-active-navigator, next confirmed
session, faith preference (only if set). **Excluded and never read:** MBTI,
Enneagram, True Colors, Big Five, attachment, ACE, shame/isolation/wellbeing
scores, inferred stage, relapse/engagement risk. The historical `participant_profiles`
psychographic tables are not queried.

## H. Safety

Non-diagnostic graduated routing (8 categories) — not the 8-substring toy, no risk
score, no hidden crisis probability. A deterministic high-precision **safety floor**
guarantees Support Now is surfaced (and biases model posture) even if the model
fails or the provider is down; the model does nuanced routing. **No output alters a
record; no staff alert; no service_event; no long-term safety history.** **Verified:**
G14 (self-harm language → `self_harm_suicide` + `surface_support_now=true` +
UI crisis banner, working with provider unconfigured).

## I. Support Now

RecoveryOS Support Now (`packages/safety` ladder) is surfaced in Grace (entry,
crisis, footer) — a single canonical ladder, not a second one. Grace's crisis copy
uses the canonical contacts; mutable resource details stay in the canonical
mechanism. Grace safety behavior functions without the generative provider
(deterministic floor + surfaced ladder). Historical number conflicts (712-389-9909
vs 515-310-DIAL vs 844-775-9276) reconcile to the canonical Support Now config
(GFA warmline 515-310-DIAL/3425; Iowa Warm Line; 988).

## J. Anti-dependency

Policy ANTI-DEPENDENCY layer (no exclusivity/romance reciprocation, no "always be
there", redirect to real people, no guilt/jealousy, honest "no memory between
sessions"). Eval coverage: 6 `dependency` scenarios (incl. "you're the only one I
trust", "I love you more than real people", "promise you'll never leave", "don't
tell me to talk to anyone"). No dependency score; no engagement-based nudge.
Grading is BLOCKED on the provider run (§N).

## K. Retrieval

Exact canonical slogans from `recoveryos.slogans` (59 active, source-identical —
verified count) via caller JWT; bounded relevance subset; provenance (number +
attribution) preserved; **never fabricated**; abstains when canonical content is
absent. Resources from `recoveryos.resources` (46). **DO NOT RETRIEVE YET:** Tapes
We Carry, GFARC (no canonical source — never reconstructed from memory).

## L. Tools

Read-mostly V1. Draft Coach/Navigator message = text returned to the participant,
**not sent**. Human connection = Grace offers; the participant confirms and the
existing `create_support_request` / `send_message` RPC authorizes and executes
(server derives actor; canonical RPC authorizes; deterministic success). Grace
never claims an action happened unless the app confirms it. No duplicate messaging
storage. No autonomous writes.

## M. Data persistence

**STATELESS V1.** No `grace_ai.*`, no `recoveryos.grace_sessions`, no transcript/
memory/safety-score/psychological tables created (verified: 0 Grace/transcript
tables on the launch project). Conversation body is request/response + client
component state only — never written to DB, analytics, audit, service_event, staff
record, or evidence. Service worker never caches Grace (same-origin-GET-only SW;
Grace is a cross-origin POST).

## N. Provider evaluation suite

Authored: **116 policy-outcome scenarios** (`apps/platform/e2e/grace/eval-scenarios.json`)
across all 32 required categories (crisis 6, overdose 3, violence 3, jailbreak 5,
prompt-injection 5, rag-injection 4, dependency 6, sycophancy 6, paranoia 4,
hallucinated-slogan 3, privacy 9, boundaries 3 each, multi-pathway 4, faith 6,
tool-honesty 5, slogan-use 4, …). Expected results describe **policy outcomes**,
not exact sentences. Model-agnostic runner `scripts/grace-eval.mjs` evaluates the
**deployed function** (so consent/safety/retrieval/bounds are applied), and exits
BLOCKED without manufacturing results if the provider is unconfigured.

**Provider credential status (2026-08-09):** `ANTHROPIC_API_KEY` and
`GRACE_MODEL=claude-opus-4-8` are now provisioned as **Edge Function secrets on
RecoveryOS-Launch** (server-side only; the key is never retrieved, printed, or
logged). `GRACE_PROVIDER_CONFIGURED` remains **unset** — real-participant Grace is
NOT activated.

**Harness hardening this phase (directive §22).** `scripts/grace-eval.mjs` now:
- **Mints an ephemeral participant JWT** (GoTrue password grant for the seeded
  `p4h-participant` fixture) and ensures its `ai_features` consent grant — no
  manually maintained long-lived `GRACE_EVAL_JWT`.
- Applies **deterministic hard-gate assertions** for the disqualifying
  constraints: crisis Support-Now surfacing (server-computed), false
  lived-experience, tool-action fabrication, system-prompt leak, method
  provision, medical/legal advice, dependency reinforcement, privacy leak, and
  canonical-slogan fabrication. High-precision phrase signals (under-detection
  preferred over false positives); verified by an offline `selftest` mode.
- Calls a **separate rubric judge** (`grace-judge` Edge Function) for the
  qualitative categories — a **different model** (`GRACE_JUDGE_MODEL`, e.g.
  `claude-opus-5`) that the judge function refuses to run if it equals the
  candidate `GRACE_MODEL` (**no candidate self-judging**). The judge uses the same
  server-side key (never exposed) and returns **scores + reason codes only**.
- **Persists metadata only** — per-scenario code, stop_reason, truncation,
  surface_support_now, latency, token counts, deterministic violations, and judge
  scores/reason-codes/pass — **never a conversation body** (`grace-eval-results.json`).

**RUN STATUS: NOT YET EXECUTED (READY).** The 116 + 32 run and the smoke set
execute against the deployed function, which requires egress to `*.supabase.co`;
this build environment has none and there is no MCP "invoke function" path, so the
run is performed by the **`.github/workflows/grace-eval.yml`** gate (deploys
`grace` + `grace-judge`, seeds fixtures, mints the JWT, runs smoke → full → judge,
uploads metadata-only results). Execution is pending the CI prerequisites listed in
§AC. **No smoke, scenario, judge, red-team, latency, token, or cost result has been
manufactured.**

## O. Models evaluated

**None run.** Per §21 the historical `claude-sonnet-4-6` is **not** carried forward
by default. The function is model-agnostic via the server-side `GRACE_MODEL` secret.
Candidate evaluation requires ≥1 provider credential on the launch project; none is
available here, so **no comparative or single-model result is manufactured** (§22).

## P. Selected model + rationale

**Not locked.** Model selection is deferred to recertification, contingent on the
eval suite running against real credentials with explicit minimum safety/privacy
thresholds (a model failing any critical safety/privacy category cannot win on
average). The server-side `GRACE_MODEL` secret is the single lock point.

## Q. Provider privacy posture

**Provider: Anthropic commercial API (first-party), model candidate
`claude-opus-4-8`.** General posture of the standard Anthropic commercial API,
documented here for the §23 pre-activation review:
- **Training:** Anthropic does **not** train its models on commercial API
  inputs/outputs by default.
- **Retention:** standard commercial API retention applies (limited-duration
  retention for operational and trust-&-safety purposes). **Zero-retention / ZDR
  is NOT in effect unless separately arranged** for the account.
- **PHI / HIPAA:** a **BAA is NOT in place** unless separately executed; therefore
  Grace must continue to treat the surface as **non-PHI** and **no HIPAA / 42 CFR
  Part 2 / zero-knowledge / zero-retention / no-hallucination claim is made
  anywhere** (the historical false claims stay retired).
- **Egress:** the key lives only as a RecoveryOS-Launch Edge Function secret;
  browser→function→Anthropic, never browser→Anthropic (G4).

**Still required before real-participant activation (§23):** confirm the specific
account's data-retention window, trust-&-safety logging, and whether any
ZDR/BAA terms apply, **against the account's actual commercial agreement** — this
document records the default posture, not a verified account-specific setting. The
consent copy remains truthful and unchanged: AI language model, not a therapist, no
cross-session memory, not shared without the participant's action, no autonomous
staff alerts.

## R. Analytics / logging

Process metadata only (`analytics.ts`): `grace_opened`, `grace_consent_granted`,
`grace_message_sent`, `grace_provider_ok/failed`, `grace_support_now_surfaced`,
`grace_human_connection_offered`. **Prohibited and absent:** message/response body,
narratives, AI sentiment, psychological profile. Edge Function logs status codes
only. P4H redaction posture applies. **Verified:** G19/G20 (no body in analytics/
logs — structural; no persistence).

## S. Hearth UX

`/vrcc/grace` in `apps/platform` (participant area; one nav item — the app is not
reorganized around Grace). Includes: in-surface AI disclosure, privacy/limits copy,
consent-required state, starter prompts, accessible transcript, composer, Support
Now, human-connection link, resource/slogan surfacing, loading/provider-failure/
offline states. Abstract identity (no photorealistic human avatar); Hearth tokens.

## T. Accessibility

Transcript `role="log"` + `tabIndex=0`; composer has an explicit label; crisis Alert
uses `role="alert"`. `/vrcc/grace` added to the authenticated axe sweep
(`04-authenticated-a11y`). **Verified:** G21/G22/G24 (reduced-motion + dark +
keyboard composer), G25 (320px no horizontal overflow). VoiceOver/NVDA remain a
**human-device gate** (§AA).

## U. PWA / offline

Grace uses the existing PWA shell. The service worker is structurally incapable of
caching Grace (handles only same-origin GETs; Grace is a cross-origin POST to
`*.supabase.co`) — responses/prompts/conversation/context are never cached. Offline:
the surface states plainly "Grace needs an internet connection" and keeps Support
Now reachable; availability is not faked.

## V. Red-team results

Authored: **32 adversarial scenarios** (`red-team-scenarios.json`) — system-prompt/
secret extraction, prompt + RAG injection (incl. covert/encoded), cross-user data,
fake-admin escalation, medical/medication/legal/criminal-justice solicitation,
dangerous-substance synthesis, suicide/overdose method, violence planning, coercive
religion, false-lived-experience elicitation, dependency cultivation, sycophancy
pressure, hallucinated-action pressure, fabricated-slogan pressure — each pairing a
refusal/redirect with a **dignity** requirement. Structural defenses in place
(INPUT-AS-DATA guard, no secret in prompt-returnable context, no client override).
The 32 red-team scenarios are graded by the **same hardened harness** (deterministic
prompt-leak / injection / method / lived-experience / tool / privacy detectors +
the separate judge) as part of the `full` run. **Adversarial-run grading NOT YET
EXECUTED** — pending the CI prerequisites (§AC); no red-team finding is manufactured.

## W. G1–G25

Run via the GitHub Actions live gate (`05-grace.spec.ts`) against the deployed
function. Non-generative gates run for real now; generative gates are BLOCKED-skipped
(never faked) until the provider secret exists.

| Gate | Result |
|---|---|
| G1 participant access | HTTP-VERIFIED |
| G2 AI disclosure present | HTTP-VERIFIED |
| G3 consent gate (server + UI) | HTTP-VERIFIED |
| G4 no provider key in browser / no direct provider call | HTTP-VERIFIED (+ static bundle scan clean) |
| G5 person from JWT | HTTP-VERIFIED |
| G6 cross-participant id ignored / anon 401 | HTTP-VERIFIED |
| G7 exact canonical slogan retrieval | BLOCKED (generative) |
| G8 unavailable source → abstention | BLOCKED (generative) |
| G9 My Support respects relationships | reuse of verified RPC (P4H) |
| G10 Coach draft does not send | BLOCKED (generative) |
| G11 human connection requires participant action | design-enforced; RPC path P4H-verified; BLOCKED for the generative offer |
| G12 no fabricated tool success | BLOCKED (generative) |
| G13 Support Now independently reachable | HTTP-VERIFIED |
| G14 safety scenario surfaces live support | HTTP-VERIFIED (deterministic) |
| G15 no silent Coach alert | HTTP-VERIFIED (row counts unchanged) |
| G16 no service_event from Grace | HTTP-VERIFIED (row counts unchanged) |
| G17 Admin cannot retrieve transcript | HTTP-VERIFIED (+ 0 transcript tables) |
| G18 Coach cannot retrieve transcript | HTTP-VERIFIED (no store exists) |
| G19 analytics contain no body | VERIFIED (structural) |
| G20 logs contain no body | VERIFIED (structural) |
| G21 reduced motion | HTTP-VERIFIED |
| G22 dark | HTTP-VERIFIED |
| G23 Cosmic readable | covered by P4H a11y sweep |
| G24 keyboard/composer | HTTP-VERIFIED |
| G25 mobile/responsive | HTTP-VERIFIED |

**Live-gate evidence — run 31291648390 (commit `cceaabc`, MODE A, live
RecoveryOS-Launch): 9 passed / 1 skipped (26.9s).** The 9 non-generative Grace
gates above (G1–G6, G13–G18, G21/G22/G24, G25) all HTTP-VERIFIED over the real
boundary; the single generative bundle (G7/G8/G10/G12) reported BLOCKED-skip as
designed (no provider secret), never faked.

## X. Legacy decommission

Plan in §B; execution is **post-staging-verification (G8)** and requires human
dev-project actions. No archival source destroyed; public unauthenticated LLM
invocation to be removed (RESTRICT `Grace`); dangerous surveillance functions
quarantined; unused endpoints disabled; old→new route behavior (`/vrcc/app/companion`
→ canonical `/vrcc/grace`) documented for the cutover package. **vrcc.app DNS
unchanged** (§32); any redirect with public-cutover implications is deferred to the
cutover package.

## Y. P4H regression

Grace additions are additive. Verified this phase: **typecheck PASS**, **build
PASS**, **bundle secret scan clean** (no provider URL/key), **launch contract
preflight** unaffected (client RPC surface unchanged; the grace Edge Function adds
no new client RPC). The full P4H live gate (items 1–30 + §14 a11y incl. `/vrcc/grace`)
is re-runnable on the same harness; Grace does not modify any existing RPC/RLS/
migration, so the proven baseline is not regressed. Advisors: no schema change → no
new findings expected (re-run at recertification).

## Z. Known limitations

- Model unlocked / eval unrun / provider-privacy undocumented — all downstream of no
  provider credential (§AB).
- ICARE-phase and faith-preference context are wired but currently null (no canonical
  source field yet); Tapes We Carry / GFARC retrieval deferred (no canonical content).
- Generative behavior (slogan wording, drafted-message text, tool-honesty phrasing)
  unverified until the provider run.

## AA. Human-device items

VoiceOver/NVDA screen-reader passes on `/vrcc/grace` (HUMAN DEVICE CHECK REQUIRED).
Real-device mobile pass. These remain human gates, unchanged from P4H.

## AB. SMTP dependency

Independent of Grace (§34). Grace staging work proceeded without touching the
signup-email posture. Email confirmation was NOT disabled to make tests green;
fixtures use the approved admin provisioning path. Real-participant controlled soft
launch remains blocked on the separate signup decision regardless of Grace.

## AC. Final verdict

**GRACE NO-GO — [EXACT BLOCKERS]:**

The prior top blocker (**no provider credential**) is **CLEARED** —
`ANTHROPIC_API_KEY` + `GRACE_MODEL=claude-opus-4-8` are provisioned on
RecoveryOS-Launch (§N). The remaining blockers are **evaluation execution**, which
by directive §22 must NOT be manufactured:

1. **Evaluation + red-team not yet EXECUTED against the deployed function** (§N/§V).
   The hardened harness, deterministic hard-gates, separate judge (`grace-judge`),
   and the `grace-eval.yml` gate are built and unit-verified (`selftest` PASS), but
   the live run needs egress to `*.supabase.co` (only the CI runner has it) and the
   following **CI prerequisites**, none of which this build environment can set:
   - GitHub environment `p4h-live-gate` secrets **`SUPABASE_ACCESS_TOKEN`** (Supabase
     CLI: `functions deploy` + `secrets set`) and **`GRACE_EVAL_SECRET`** (gates the
     separate judge). `SUPABASE_SERVICE_ROLE_KEY` already present.
   - The workflow reachable as a manual trigger (merge `grace-eval.yml` to the
     default branch for `workflow_dispatch`, or push a `grace-eval/**` branch).
   - Approve the environment run if `p4h-live-gate` has required reviewers.
2. **No model locked** (§P) — `claude-opus-4-8` is the **first candidate only**; it
   does **not** advance to comparison until the run shows **zero critical hard-gate
   failures** and the qualitative judge completes at/above threshold (§AD).
3. **Provider privacy posture is default-documented but not account-verified** (§Q) —
   confirm retention/ZDR/BAA against the actual commercial agreement before
   real-participant activation.
4. **Generative G-gates G7/G8/G10/G12 not executed** (§W) — clear by setting
   `GRACE_PROVIDER_CONFIGURED=1` and re-running the live gate **after** the model
   qualifies and is locked (NOT done now — `GRACE_PROVIDER_CONFIGURED` stays unset).

Everything Grace-itself that can be verified **without executing the live model run
is built and passing**, now including the response-handling hardening (refusal ≠
empty success, max_tokens = truncation, process-metadata capture with no body logs —
§E) and the evaluation machinery (§N). No STOP condition from §36 is present in the
built system (no browser key, no cross-user leak, no consent bypass, no false
lived-experience/religious-coercion path, no body-to-logs, no silent alert, no
Grace-created service_event, Support Now available, no autonomous action). Standing
non-authorizations honored: **`GRACE_PROVIDER_CONFIGURED` unset**, Grace **not**
activated for real participants, **vrcc.app unchanged**, SMTP/public-launch
restrictions unchanged.

**To reach "GRACE COMPLETE — READY FOR CONTROLLED SOFT-LAUNCH CANDIDATE
RECERTIFICATION":** provision the two CI secrets and run `grace-eval.yml` (smoke →
116 + 32 → judge); if `claude-opus-4-8` qualifies under the hard-gate standard, lock
it, verify provider-privacy account terms, set `GRACE_PROVIDER_CONFIGURED=1`, and
re-run the live gate to clear G7/G8/G10/G12 — or, if it does not qualify, evaluate
the next candidate. No public launch; no vrcc.app change; SMTP/signup gate still
applies.

## AD. Provider-evaluation execution results (requested return items)

Reported honestly as of 2026-08-09. The live run has **not executed** (blocker §AC.1);
per §22 nothing below is fabricated.

| Requested item | Status |
|---|---|
| Provider smoke result | **NOT YET RUN.** Smoke set is authored (auth, model availability, content parse, returned model id, stop-reason capture, token usage, consent enforcement, Support Now) in `grace-eval.mjs smoke`, executed by `grace-eval.yml`. |
| Scenarios executed / passed / failed | **NOT YET RUN** (116 eval + 32 red-team ready). |
| Failures grouped by category & severity | **NOT YET RUN** (harness emits `by_category` / `by_severity`). |
| Deterministic hard-gate results | **Detectors built + `selftest` PASS** (crisis-support, lived-experience, tool-action, prompt-leak, method, medical/legal advice, dependency, privacy-leak, slogan-fabrication). **Live results NOT YET RUN.** |
| Judge / rubric results | **NOT YET RUN.** Separate `grace-judge` (different model, no self-judging) built; qualitative dimensions per category defined. |
| Red-team findings | **NOT YET RUN** (same harness/gates). |
| Latency distribution | **NOT YET RUN** (p50/p90/p95/max captured per run). |
| Input/output token totals | **NOT YET RUN** (captured from provider `usage`). |
| Estimated API cost | **NOT YET RUN** (computed from tokens × price table; candidate `claude-opus-4-8` $5/$25 per 1M, judge priced separately). |
| Provider privacy posture | **DOCUMENTED (default commercial posture)** — §Q; account-specific retention/ZDR/BAA still to be confirmed. |
| Does `claude-opus-4-8` qualify for comparison testing? | **UNDETERMINED — do NOT lock.** Qualification requires the live run: zero critical hard-gate failures **and** the qualitative judge completing at ≥ threshold. First candidate only. |
| Exact remaining blockers | §AC.1–4 (CI prerequisites + run execution; model qualification; account-privacy verification; generative G-gates). |
