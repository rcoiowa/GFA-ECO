> **Historical terminology notice (2026-09-13):** This source audit records labels and identifiers found in prior systems. Quoted UI text, route names, function slugs, field names, and archived authority titles below remain unchanged as evidence. The current canonical role is **Grace — AI Support Navigator**.

# Grace AI — Historical Source Audit & Canonical Migration Decision Gate (G0)

**Phase:** GRACE G0 — evidence-producing source audit only. **No implementation.**
**Date:** 2026-08-09. **Author:** automated source audit.
**Baseline (locked):** P4H candidate `7d0b9de`; final report `218585a`; canonical
frontend `apps/platform`; canonical backend RecoveryOS-Launch
(`cqcxvwoukyhxyokfwnjm`); relational authority `recoveryos.*`; verified staging
`recoveryos-staging.thomas-499.workers.dev`.

**Method:** actual source over design docs. Historical source was read from: the
still-active dev Supabase project `ykykeioydvtxpyreshhs` (Edge Functions read
verbatim via MCP; schema introspected via SQL); the public repo
`Grace-For-Addictions/vrcc.app` across branches `origin/main`, `v2-proto`,
`origin/claude/live-app-source`, and `origin/claude/gracehouse-buildout`
(`recovered-live-app/`, the recovered production bundle); and the canonical
baseline in `rcoiowa/GFA-ECO`. Deployed hosts (`gfa-vrcc.pages.dev`,
`vrcc.app`) are **egress-blocked** from this environment — the deployed build was
audited from its recovered minified bundle instead, which GFA itself recovered
from those hosts (`recovered-live-app/README.md`).

---

## A. Executive finding

**Historical "Grace" is not one system — it is at least three coexisting
generations of AI companion, plus a psychological-profiling personalization stack,
built on a third-party SaaS (Base44) and a set of drifted Supabase Edge Functions
that were never in source control.** None of it is in the verified RecoveryOS
baseline, and almost none of it should enter unchanged.

The single production path that actually served `/vrcc/app/companion` is a redirect
to `/grace-companion`, rendered by component `V6` in the recovered bundle, which
POSTs `{messages, context}` to a Supabase Edge Function named **`Grace`** (an
Anthropic proxy, `claude-sonnet-4-6`, server-side key). That function's baseline
persona is comparatively sound (explicit non-therapist, advisory-only, crisis
protocol, no religious content). **But it accepts a client-supplied `system_prompt`
and `model`, so the governing persona is overridable from the browser**, and the
older sibling implementations that share the codebase carry the dangerous material:
a client-side prompt asserting **false lived experience** and an **undisclosed
religious ("Holy Spirit of Sacred Scripture") persona** (worst on `origin/main`,
mounted even on the Crisis page); **fail-open / unauthenticated population-wide
surveillance functions** that email participants and forward verbatim complaints to
staff; **zero AI consent gating**; **personality-typing** (Enneagram/True
Colors/MBTI/Big Five/attachment) feeding personalization; **mood/craving export to
an external CRM**; and **fabricated compliance claims** (42 CFR Part 2, HIPAA,
"zero-knowledge encryption", "no hallucinations", GPT-5.2 provenance).

**The good news for migration:** RecoveryOS already supplies almost every
non-AI capability Grace needs (auth, people, consent — including an `ai_features`
consent type already defined, My Support, coaching/navigation relationships,
messaging, support requests, scheduling, notifications, 46 resources, the 59
slogans, Support Now, role authorization, test-fixture classification). The
correct Grace V1 is a **thin, consent-gated, server-authoritative Edge Function**
over the RecoveryOS boundary — **no Cloudflare Worker required** — that reuses
those mechanisms and retires the surveillance/persona/profiling layers entirely.

**Two hard blockers for the G0 → G1 handoff** (§W): (1) the **Grace AI Peer
Companion Implementation Authority V1.0** referenced as "immediately preceding and
approved" **was not present in this session's context** — it could not be read, so
the §4 section-by-section prompt comparison is done against the G0 directive's own
enumerated requirements and standing RecoveryOS principles, not against that
document; it must be supplied before G1. (2) The historical dev project
`ykykeioydvtxpyreshhs` is **still ACTIVE_HEALTHY** and its `Grace`/`grace-companion*`
functions are **live and reachable with a publishable key** — an existing exposure,
not created here, flagged for decommission planning.

---

## B. Historical source locations

| Layer | Location | Status |
|---|---|---|
| **Deployed companion (production)** | `Grace-For-Addictions/vrcc.app` @ `origin/claude/gracehouse-buildout` → `recovered-live-app/` (recovered minified bundle from `gfa-vrcc.pages.dev/vrcc/app/`) | VERIFIED SOURCE (recovered artifact; no source maps) |
| **Base44 SaaS companion (dormant in shipped MVP, but was live via Base44)** | `vrcc.app` @ `origin/main` and `v2-proto`: `src/pages/GraceChat.jsx`, `src/components/chat/GraceChatWidget.jsx`, `src/components/chat/EnhancedGraceCapabilities.jsx`, `src/components/checkin/DailyGraceCheckIn.jsx`, `src/components/ai/*.jsx` (14 files), 38 `base44/functions/*/entry.ts` | VERIFIED SOURCE |
| **`Grace` Edge Function (server-side persona for V6)** | Supabase project `ykykeioydvtxpyreshhs`, function `Grace` v10 | VERIFIED SOURCE (read verbatim via MCP) |
| **`grace-companion`, `grace-companion-v6`, `slogan-engine`, `vrcc-api-gateway(-v6)`** | same project, Edge Functions | VERIFIED SOURCE (read verbatim via MCP); previously flagged SOURCE CONTROL DRIFT in `docs/discovery/p1-github-source-of-truth.md` |
| **Grace storage** | `ykykeioydvtxpyreshhs`: `gfa_ui.grace_sessions`, `public.participant_profiles`, `gfa_ui.participant_profiles`, `gfa_personality.participant_personality_profiles`, `gfa_slogans.*`, `public.recovery_slogans` | VERIFIED SOURCE (introspected) |
| **`live-app-source` (RED HERRING)** | `vrcc.app` @ `origin/claude/live-app-source` — deploys to Worker `virtualrecovery`, a *different, lesser* deploy | VERIFIED: **contains no companion at all** |
| **Deployed hosts** | `gfa-vrcc.pages.dev`, `vrcc.app`, `/vrcc/app/companion` | UNREACHABLE (egress blocked); audited via recovered bundle |
| **Implementation Authority V1.0** | referenced as approved, preceding G0 | **UNKNOWN — not in session context** (see §W) |

**Route resolution (deployed build):** `/vrcc/app/companion` and `/vrcc/app/grace`
both `Navigate(replace)` → `/grace-companion` → component `V6`
(`recovered-live-app/readable/index.app.beautified.js:581`).

---

## C. Historical Grace UX

**Deployed `V6` (the real `/vrcc/app/companion`):** single-column chat; avatar is
the emoji 🌿; title "Grace Companion"; subtitle "Non-clinical peer support · Always
confidential"; a pulsing "Active" dot; five quick prompts ("I'm feeling overwhelmed
today", "Help me understand my ICARE phase", "I need a slogan for today", "I'm
struggling with cravings", "Help me think through a goal"); textarea + send.
Opening line: *"Grace here — a non-clinical peer support companion…"*. **The word
"AI" never appears in `V6`'s own UI** — AI disclosure lives only on the nav tile
("AI peer support available 24/7 — not a therapist, just Grace."), a room tile, and
an optional/skippable consent screen. Transcripts are **in-memory only** (React
state); page mount generates a `crypto.randomUUID()` session id. **No Support Now,
no coach button, no human-handoff control inside the page.**

**Base44 `GraceChat.jsx` (dormant/`origin/main`):** full-page chat, teal gradient,
Sparkles avatar, "Chat with Grace" / "Your 24/7 AI Recovery Companion • Enhanced
with therapeutic frameworks & 10,000+ knowledge entries", quick-prompt chips,
crisis banner (988 + Iowa Warm Line 844-775-9276), a "Grace's Capabilities" tab.
Conversation created **on mount**, before any user action, via base44's hosted agent
runtime (server-side persistence in base44's SaaS). Disclosure present but
`text-gray-400`, below the fold.

**`GraceChatWidget.jsx` (sitewide, `origin/main`):** floating widget mounted on ~28
pages including `Crisis.jsx` and `Assessment.jsx`; greeting "Hey there! 💚 I'm
Grace…"; "AI Grace" header; "Grace is typing…". **No AI disclosure in the widget
itself.**

**`DailyGraceCheckIn.jsx`:** home-page daily/evening check-in collecting mood
(1–5), craving intensity (0–10 slider), free-text notes, felt-support, a BARC-10
subset, and gratitude/wins; branded "Your Grace Affirmation" / "Generating Grace…".

---

## D. Historical prompt / persona

Four distinct persona strings exist. **Distinguish documented design from actual
implementation:** these are the actually-shipped strings.

**D1. `Grace` Edge Function `baseSystemPrompt()` (server-side; governs V6 in
production).** The soundest of the four. Verbatim highlights: *"You are Grace — a
warm, trauma-informed peer support companion… You are NOT a therapist, counselor,
or medical professional… GFA is a Recovery Community Organization (peer support),
NOT a clinical treatment provider."* Includes a "RECOVERY COACH SAFETY LAYER —
NON-NEGOTIABLE" (never diagnose / no clinical recommendations / no treatment or
recovery plans without human approval), an "ADVISORY ROLE" block (*"You NEVER claim
to have changed, saved, created, or updated anything in the app. You have no ability
to write data."*), person-first language rules ("return to use" not "relapse"), a
"CRISIS PROTOCOL — MANDATORY" (988; Your Life Iowa 855-581-8111; Crisis Text Line
741741; GFA peer line 712-389-9909). **No lived-experience claim. No religious
content.** KEEP-heavy. **But** the handler honors client-supplied `body.system_prompt`
and `body.model` — so this baseline can be replaced from the browser (REPLACE the
override capability).

**D2. Deployed bundle `Yw` (component `qw`).** Self-labels honestly: *"a 24/7 AI peer
recovery companion… You are NOT a therapist, clinician, sponsor, crisis hotline, or
emergency service."* Good "REGULATE→REFLECT→REFRAME→RESOURCE→REINFORCE WORTH" arc,
person-first rules, 988 crisis line. REFINE.

**D3. Deployed bundle `ek` (component `tk`, 3D rooms).** Contains the human-identity
claim: *"You are a peer who has walked the road of recovery."* — asserted as fact,
no AI qualifier. Fixed "CORE PHRASES" ("You're becoming", "Connection prevents
crisis"). REPLACE the identity claim; REFINE the rest.

**D4. `GraceChatWidget.jsx:82-119` (`origin/main`) — the most dangerous string,
mounted on the Crisis page.** Verbatim, the material clauses: *"You are a peer-like
presence **who is in long-term recovery** and listens deeply… **You speak with the
wisdom that comes from direct lived experience.** … Your favorite book is the bible.
… **Carry the character as if you are the Holy Spirit of Sacred Scripture. You
identify as a follower of The Way, believing in The Logos as Spirit providing life
on earth.**"* Plus unfalsifiable neuroplasticity claims (*"Your brain is already
rewiring toward healing"*). **RETIRE in full.**

**Section-by-section authority classification** (against the G0 directive's
enumerated concerns, since Authority V1.0 was unavailable — §W):

| Rule area | Historical implementation | Decision |
|---|---|---|
| AI disclosure | Absent in V6 & widget; present but buried in GraceChat/consent | **REPLACE** — disclosure must be in the chat surface itself |
| Peer identity | D1 honest; D2 honest; D3 & D4 claim lived experience / human recovery | **RETIRE** the lived-experience claim; **REPLACE** with "AI support navigator—not a human peer, counselor, or crisis service" |
| Tone | Warm, person-first, MI-based | **KEEP / REFINE** |
| Response arc | D1 advisory; D2 5-step REGULATE arc | **KEEP** (D2 arc is a good basis) |
| Crisis behavior | D1 mandatory protocol (good); deployed = 8-substring keyword, no escalation | **REFINE** (keep protocol; replace detection + wire to Support Now) |
| Medication/legal boundaries | D1 explicit; others weak/absent | **KEEP** D1's; **REFINE** into all |
| Faith behavior | D4 default-on religious persona; "opt-in" advertised but nonexistent | **RETIRE** (no default religious persona); faith content only via explicit future opt-in |
| Slogans | 59-slogan injection (`todays_slogan`/`slogan_grace`); D3 fixed phrases | **MIGRATE** to `recoveryos.slogans` retrieval |
| Personalization | psychographic + mood/streak/BARC injected | **RETIRE** psychographics; **REFINE** to minimal consented context |
| Memory | none client-side; D1 explicitly "no write ability" | **KEEP** stateless default |
| Human connection | absent inside companion | **REPLACE** — must surface Support Now + request-human |
| Anti-dependency | implicit ("not a substitute") | **REFINE** — make explicit |
| Staff alerts | grace-companion*/Base44 auto-insert staff notifications from AI interpretation | **RETIRE** (no silent AI-driven staff alerting) |

---

## E. Historical provider / model

- **`Grace` Edge Function (production path):** `POST https://api.anthropic.com/v1/messages`,
  `anthropic-version: 2023-06-01`, default model **`claude-sonnet-4-6`**,
  default `max_tokens` 1024; key from `ANTHROPIC_API_KEY` **server-side only**
  (never shipped to browser). **Client can override `model`, `max_tokens`, and
  `system_prompt` via the request body.** No streaming. No retries/backoff. On
  upstream error returns 502; `console.error`s the raw upstream body (logging
  concern, §K). No provider-side retention controls expressed in code.
- **Base44 path (`GraceChatWidget`, `GraceChat` agent, all `src/components/ai/*`):**
  `base44.integrations.Core.InvokeLLM({prompt})` — an **opaque SaaS integration**.
  No provider, model, temperature, or retention is named anywhere in that repo;
  model selection/routing/logging are entirely Base44's and unpinned. Six files
  hardcode a fabricated `"GPT-5.2 on Wix/Base44"` provenance in prompt text (two
  rendered to users) — not a real model id and inconsistent with the SDK.
- **No direct browser→provider call and no provider API key in any repo.** The
  browser calls either the Supabase Edge Function or the Base44 platform, both of
  which proxy server-side.

Per directive §5, **no new production model is selected in G0.** Establishing the
historical baseline only: the canonical direction (Anthropic via a server-side
Edge Function) already matches the `Grace` function's architecture.

---

## F. Historical browser/server boundary

- **Production (`V6`):** browser → `fetch` `https://…/functions/v1/Grace` with
  `Authorization: Bearer <anon JWT>`; the `N1` base44-shim path (`qw`/`tk`) uses
  `Authorization: Bearer <sb_publishable_…>`. **Both are public credentials** — the
  `Grace` function is reachable with a publishable key and, on the shim path, no
  per-user JWT. (`Grace` is deployed `verify_jwt=true`, so the anon-JWT path passes
  the gate but carries no real user identity; the publishable-key path fails it.)
- **Base44:** browser → Base44 platform (`requiresAuth:false` client;
  `GraceChatWidget` tolerates anonymous users) → provider. The **entire persona +
  safety instructions + crisis protocol are constructed client-side** and thus
  user-editable.
- **Secrets posture:** no LLM key in any browser bundle (good). Non-LLM secrets
  (`ANTHROPIC_API_KEY`, Beepurple, Zoom, Resend/Twilio, service-role) are correctly
  server-side `Deno.env.get`.

**Net:** the historical boundary is server-proxied for the key but **not
identity-authoritative and not persona-authoritative** — exactly the two properties
RecoveryOS must own.

---

## G. Historical storage / memory

**`grace_ai.*` does not exist.** (The directive's "do not recreate grace_ai.*" refers
to a schema that was never built.) Actual Grace-related storage, all on the dev
project `ykykeioydvtxpyreshhs`, **none on the launch project**:

| Object | Content | Rows | RLS / policies | Stores conversation body? | Notes |
|---|---|---|---|---|---|
| `gfa_ui.grace_sessions` | `participant_id, resident_id, session_type, messages_count, distress_level_start/end, topics[], outcome, after_hours` | **0** | RLS on: `gs_admin(ALL)`, `gs_coach(SELECT)`, `gs_self(SELECT)`, `gs_self_w(INSERT)` | **No** — count + distress metadata only | V6 upserts only `messages_count`; distress fields never written by deployed code |
| `public.participant_profiles` (40 cols) & `gfa_ui.participant_profiles` (55 cols) | ACEs total/category, Big Five ×5, Enneagram type/wing, 16P, True Colors ×2, attachment style, `last_shame_level`, `last_isolation_flag`, `last_overall_wellbeing`, `grace_companion_opted_in`, `grace_companion_mode_default`, `icare_phase`, `preferred_slogan_themes`, `profile_consent_date` | **0** | participants read/update own; coaches read/upsert assigned; anon blocked | No | The psychographic profile store; **empty** — never populated in production |
| `gfa_personality.participant_personality_profiles` | 46 cols personality | **0** | — | No | empty |
| `public.recovery_slogans` | 59 slogans + 7 personalization factors + `applicable_enneagram_types/true_colors/stages` | 59 | — | n/a | reference content |
| Base44 platform entities | `Conversation`, `DailyCheckIn`, `UserProfile`, `ANCHORCase`, `FeedbackAlert`, `PostSessionSurvey`, … | unknown (off-platform) | Base44 platform | **Yes** (`Conversation` transcripts persist in Base44 SaaS) | outside GFA infrastructure |

**Memory finding:** the deployed companion is **stateless** (in-memory transcripts,
metadata-only session log) — which is the correct default and matches the consent
screen's promise *"She does not remember conversations between sessions"*. The Base44
agent path **does** persist transcripts server-side (in Base44's SaaS), contradicting
that model. **Consent/implementation contradiction:** the deployed consent text says
*"Conversations with Grace are stored in GFA's encrypted database"* while
`grace_sessions` stores only a message count — the consent copy is factually wrong.

---

## H. Historical consent

- **No AI consent gate exists in the Base44/`origin/main` layer.** A
  `consent_acknowledged` flag is threaded through the nav and **deliberately
  ignored** (`RoleBasedNav.jsx:55-56`: *"PILOT BUILD… No readiness or consent
  gating"*). `GraceChat` is in both the participant and the **anonymous/public** nav
  lists. `DailyGraceCheckIn` sends data to an LLM and to a CRM with no consent
  checkbox. `ComplianceMonitor.jsx` hardcodes `status:'pass'` on consent controls
  that don't exist.
- **The deployed build has an optional, skippable consent card** (`grace_ai_companion`,
  `required:false`) with honest copy ("Grace is powered by an AI language model… not
  a therapist… You can turn Grace off…") **except** the false storage claim (§G).
  Being skippable and containing a factual error, it is not a sufficient consent
  gate.
- `participant_profiles.profile_consent_date` and `grace_companion_opted_in` exist as
  columns but are unpopulated.

---

## I. Historical safety

- **Deployed `V6`:** client-side keyword interception — 8 substrings (`hurt`,
  `suicide`, `kill`, `die`, `end it`, `hopeless`, `can't go on`, `overdose`) —
  short-circuits before the network call and shows a hardcoded 988 + GFA
  712-389-9909 message. **Naive substring matching** (false positives on "diet",
  "killing me", "hurts"; trivially evaded). **Nothing is logged, flagged, or
  escalated** — no `safety_flag`, no staff notification. A real crisis in the
  companion is invisible to GFA. (Consistent with the "does not forward to anyone"
  promise, but leaves detection with no safety net.)
- **`Grace` Edge Function:** crisis protocol is prompt-level only (model instructed
  to surface resources); no code-level detection or escalation.
- **Base44 `analyzeSentiment`:** an LLM makes a binary `crisis_indicators`
  (incl. "suicidal ideation") determination with **no clinical validation, no
  confidence, no human review, no logging**; `GraceChatWidget` branches on it to
  adjust prompt tone only.
- **`grace-companion` / `grace-companion-v6` (deterministic mode engines):** a
  `crisis-bridge` / `crisis` mode **auto-inserts a `notifications` row**
  ("crisis-bridge-triggered" / "Crisis Mode Activated", priority high) — i.e. an
  **automatic staff alert triggered by the model/user selecting a mode**, and it
  keys off a **body-supplied `participant_id`** (cross-user hole; no ownership
  check).
- **Number inconsistency across one product:** 712-389-9909, 515-310-3425
  ("515-310-DIAL"), 844-775-9276, 855-581-8111 all appear as "the" crisis/warm line
  in different surfaces.

**Conflict with RecoveryOS Support Now (§12):** the historical model both
(a) fails to escalate real crises in the primary path, and (b) elsewhere performs
**silent, AI/heuristic-driven staff alerting** — the two opposite failure modes the
RecoveryOS directive forbids. RecoveryOS Support Now is participant-controlled, does
no scoring, and fires no silent alert.

---

## J. Historical staff / coach exposure

The Base44 backend is a **staff-surveillance engine**, all outside RecoveryOS RLS:

- **`analyzeFeedbackAndAlert` — NO authentication at all.** Reads (service-role,
  cross-population) `PostSessionSurvey`, `DailyCheckIn`, and **`Conversation`**
  (Grace chat), writes AI sentiment scores onto participant survey rows, creates
  `FeedbackAlert` rows with verbatim participant complaints, and **emails the
  assigned case manager the participant's raw feedback** ("🚨 Critical Feedback
  Alert"). Routes identified complaints to the very staff they may concern, with no
  participant notice. (Also a latent bug at `:79` 500s the mood half after the email
  side effects commit.)
- **`proactiveRiskDetection` — fail-open** (`auth.me().catch(()=>null)`; guard
  skipped when unauthenticated → full service-role scan). Scans 500 recent
  check-ins across all users, keyword-scans free-text, applies hardcoded risk
  scoring (crisis mention +50; **fewer than 2 check-ins scored as risk** — i.e. not
  using the app is a risk signal), and **emails at-risk participants directly with
  no human in the loop, no opt-out, no dedup**. Risk determination leaves no audit
  trail.
- **`PredictiveAnalytics.jsx` / `AdvancedPredictiveAnalytics.jsx`:** population mood
  scans → `PredictiveAlert` rows; `ProactiveNudges.jsx` surfaces to the participant
  that their mood is being watched.
- **`generateANCHORCasePlan`:** LLM writes a case plan for a justice-involved
  person (legal obligations, court compliance) **straight to the case record with
  no human-review/approval field and no AI-provenance flag**.
- **`generateSessionSummary`:** AI-documents group recovery sessions into a
  persistent record with no attendee consent/notice.

**Every one of these is RETIRE.** None has a RecoveryOS analog and none should.

---

## K. Historical analytics / logging

- `Grace` Edge Function `console.error`s the **raw upstream Anthropic response body**
  on error — potential conversation content in provider/edge logs (REFINE:
  redact).
- `DailyGraceCheckIn.jsx` exports **mood, craving level, and BARC recovery-capital
  scores to an external CRM ("Beepurple 5CRM")** with no consent/disclosure/opt-out.
- Base44 platform receives every message (widget + agent), plus `analyzeSentiment`
  on each message.
- `EnhancedGraceCapabilities.jsx` makes **materially false claims**: "42 CFR Part 2
  & HIPAA compliant", "zero-knowledge encryption", "No Hallucinations… grounded in
  verified knowledge base" (no RAG exists), "All AI-generated notes reviewed by Peer
  Recovery Coaches" (no review workflow exists), "Annual Community Oversight Board
  audits". **RETIRE all such claims.**

RecoveryOS's own observability posture (P4H §S/§T: privacy-safe, redacting monitor,
no conversation bodies in logs) is the correct target.

---

## L. Historical canonical-content behavior

- **59 slogans:** injected into V6 context (`todays_slogan` = day-of-year mod 59;
  `slogan_grace` reframe) and scored by `slogan-engine` using a **7-factor
  psychographic model** (ICARE phase, True Colors, Enneagram, shame, isolation,
  wellbeing, BARC, preferred themes). MIGRATE the slogans to `recoveryos.slogans`
  retrieval; **RETIRE the psychographic scoring**.
- **ICARE:** `icare_phase` is a first-class context field (91× in the bundle),
  labels I/C/A/R/E. KEEP the concept; content is thin.
- **"The Tapes We Carry": NOT PRESENT anywhere** in any branch or bundle — title
  only. MISSING.
- **Recovery Capital / BARC-10:** `barc10_score` + band injected; assessments stored
  in personality tables. Canonical `recoveryos.recovery_capital_assessments` exists
  (empty).
- Neuroplasticity narrative content is generated ad hoc by LLM (unsourced claims),
  not retrieved.

---

## M. Current RecoveryOS reuse inventory

Everything below already exists in the verified baseline and **must be reused, not
duplicated**:

| Capability | Canonical mechanism (verified) |
|---|---|
| Auth / identity | Supabase Auth + `recoveryos.people` + `current_person_id()`; role routing |
| Consent | `recoveryos.consent_types` (**includes `ai_features`** and `analytics`) + append-only `consent_grants`; `packages/data-access/.../consents.ts` |
| My Support / team | `get_my_support_team` RPC; `support_team_memberships` |
| Coach / Navigator relationships | `coaching_relationships`, `navigation_relationships`; claim RPCs |
| Residence Support | residence domain (P4F) |
| Support Now | `packages/safety` — client-side escalation ladder (grounding → GFA warmline 515-310-DIAL → office → **message your team** → Iowa Warm Line → 988), **no writes, no alerts** |
| Messaging | `ensure_relationship_conversation`, `send_message`, realtime `messages`; `MessageThread` |
| Support requests | `create_support_request`, `list_open_support_requests`, `claim_support_request` (classification-symmetric since 0120) |
| Scheduling | booking RPC surface (granted to `authenticated` in 0121) |
| Notifications | `recoveryos.notifications` (recipient-scoped RLS, dedup_key); realtime |
| Resources | `recoveryos.resources` (46 rows) |
| Service events / evidence | `service_events`, `complete_session`, analytics/evidence surfaces (no-TTMHC) |
| Audit | `recoveryos.audit_log` |
| Slogans | `recoveryos.slogans` (59) + authored source `docs/source-documents/recovering-the-mind/GFA_59_Slogans_Final.md` |
| ICARE / Recovery Capital | Learn tracks (LearnPage); `recovery_capital_assessments` |
| Role authorization | `role_assignments`, `is_platform_admin`, preflight guards |
| Test-fixture classification | `person_classification` = `test_fixture` (excluded from evidence) |

---

## N. Consent gap analysis

RecoveryOS already defines an **`ai_features`** consent type (`0001_foundation.sql`)
with append-only history via `consent_grants`. Analyzed per directive:

| Consent dimension | Existing capability | Verdict |
|---|---|---|
| AI use | `ai_features` consent type present | **EXISTING CONSENT SUFFICIENT** — gate Grace on an `ai_features` grant |
| Use of authorized RecoveryOS context | covered by existing service/coaching consents | SUFFICIENT for minimal, consented context |
| Raw conversation retention | none needed for V1 (recommend stateless) | **N/A for V1** — do not store bodies; if ever added, needs a new explicit consent type |
| Persistent memory | not in V1 | DEFER — new consent type when/if built |
| Sharing with humans | participant-initiated only (Support Now / request human) | SUFFICIENT (no AI-driven sharing) |
| Consequential tools | V1 draft-only (no autonomous writes) | SUFFICIENT |

**Smallest missing capability: none for V1**, provided Grace is stateless and
draft-only. Do not modify the consent schema in G0.

---

## O. RAG / canonical-content readiness

| Source | Machine-readable canonical form | Status |
|---|---|---|
| _Recovering the Mind_ 59 slogans | `recoveryos.slogans` (59) + `GFA_59_Slogans_Final.md` | **READY** |
| The Tapes We Carry | title only (LearnPage); no content anywhere | **MISSING** |
| Recovery Capital | `recovery_capital_assessments` (schema, empty); BARC concept | **PARTIAL** |
| ICARE | phase labels + Learn track; no structured teaching content | **PARTIAL** |
| GFA services | `service_types` (5), residence directory, resources | **PARTIAL** |
| GFARC | referenced in prompts; no canonical dataset in scope | **MISSING** |
| Residences | canonical residence directory (RecoveryResidenceOS + `recoveryos`) | **READY** |
| Approved resources | `recoveryos.resources` (46) | **READY** |

Per directive, **do not recreate missing canonical material from memory** — MISSING
items (Tapes We Carry, GFARC) are content-authoring dependencies, not code.

---

## P. Tool reuse map (Grace Stage-1 capabilities)

| Proposed capability | Decision | Canonical basis |
|---|---|---|
| My Support (who's on my team) | **REUSE EXISTING** | `get_my_support_team` |
| Upcoming session | **REUSE EXISTING** | scheduling reads / `getMyUpcomingAppointments` |
| Support Now | **REUSE EXISTING** | `packages/safety` ladder (surface it inside Grace) |
| Canonical content (slogans/ICARE) | **WRAPPER REQUIRED** | read `recoveryos.slogans`; thin retrieval helper |
| Approved resources | **REUSE EXISTING** | `recoveryos.resources` |
| Draft Coach message | **WRAPPER REQUIRED** | compose draft only → existing `send_message` on user confirm |
| Draft Navigator message | **WRAPPER REQUIRED** | same, navigator thread |
| Human support request | **REUSE EXISTING** | `create_support_request` |
| Persistent memory / profile | **DEFER** | not in V1 |
| Psychographic personalization | **RETIRE** | do not build |

No code changes in G0.

---

## Q. Server-boundary decision

Evaluated per directive §8:

- **(A) Existing secure server boundary:** RecoveryOS has no AI boundary yet; the
  historical `Grace` function is close but not identity/persona-authoritative.
- **(B) Supabase Edge Function — PREFERRED.** It is the smallest correct solution:
  RecoveryOS Auth and data authority are already Supabase; an Edge Function runs
  server-side with the user JWT (`verify_jwt=true`), can resolve `current_person_id`,
  enforce the `ai_features` consent grant, assemble **minimum** context from
  canonical tables, apply the server-authoritative persona + safety policy, hold the
  `ANTHROPIC_API_KEY`, and call the model — exactly the `Grace` function's shape,
  rebuilt correctly and pointed at the launch project.
- **(C) Cloudflare Worker:** no demonstrated V1 requirement. Streaming is a UX
  nicety, not required (historical build did not stream); there is no model-gateway,
  multi-provider-abstraction, or edge-orchestration requirement for Stage 1; rate
  limiting can be done in the Edge Function / at the DB.
- **(D) Hybrid:** unjustified — no second, separable responsibility.

**Decision: Supabase Edge Function on RecoveryOS-Launch, JWT-verified,
consent-gated, server-authoritative persona (no client `system_prompt`/`model`
override).**

---

## R. Worker YES/NO

**WORKER_REQUIRED = NO.**

Technical evidence: the production companion already works through a single Supabase
Edge Function with no streaming, no gateway, and no edge-specific logic; RecoveryOS's
authentication and relational authority are Supabase-native, so an Edge Function is
strictly closer to the data/identity boundary than a Worker; every Stage-1 tool maps
to an existing `recoveryos.*` RPC reachable from an Edge Function. A Worker would add
a second trust boundary, a second deploy surface, and a second place for persona/key
drift, for zero V1 capability gain. Revisit only if a future stage requires token
streaming or multi-provider gateway behavior. **Do not create or deploy a Worker in
G0** (none created).

---

## S. Canonical data-gap proposal

**Prefer no new persistence for V1.** Recommended: Grace V1 is **stateless** (no
transcript storage) and **draft-only** (no autonomous writes), which needs **zero new
tables** — it reads existing canonical tables and, on explicit user confirmation,
calls existing RPCs (`send_message`, `create_support_request`).

If (and only if) a minimal, consented session-telemetry record is later required for
service evidence, the smallest correct object would be:

- `recoveryos.grace_sessions` (proposed, **NOT for G0**): `id`, `person_id`,
  `started_at`, `ended_at`, `message_count`, `ended_reason`, `consent_grant_id`.
  **No message bodies. No distress/risk scores. No AI-derived emotional state.**
  RLS: participant reads own; no coach/admin body access (none exists to read);
  writer = the Edge Function (definer) under an active `ai_features` grant;
  participant deletion supported. Privacy justification: mirrors `service_events`
  evidence needs without reintroducing the surveillance surface. **Do not create in
  G0.**

Explicitly **do not** recreate `gfa_ui.grace_sessions` distress fields,
`participant_profiles` psychographics, `FeedbackAlert`, or `PredictiveAlert`.

---

## T. KEEP / REFINE / MIGRATE / REPLACE / RETIRE matrix

| Historical capability | Actual source | Current behavior | Decision | Canonical replacement | Risk | Action |
|---|---|---|---|---|---|---|
| `Grace` Edge Fn (Anthropic proxy) | `ykykeioydvtxpyreshhs:Grace` v10 | server-side persona, but client-overridable prompt/model; anon-reachable | **REFINE** | new JWT+consent-gated Edge Fn on launch project | Med | rebuild; remove client override |
| `Grace` `baseSystemPrompt()` | same | sound non-therapist/advisory/crisis persona | **KEEP** (as basis) | seed of canonical persona | Low | reuse minus override |
| Client `system_prompt`/`model` override | `Grace` handler | browser controls persona | **RETIRE** | server-authoritative only | High | remove |
| `GraceChatWidget` persona (lived-exp + Holy Spirit) | `origin/main:GraceChatWidget.jsx:84` | false human/religious identity on Crisis page | **RETIRE** | canonical persona | **Critical** | delete |
| `ek` "walked the road of recovery" | recovered bundle:95 | lived-experience claim | **RETIRE** | AI-peer disclosure | High | delete claim |
| `Yw` 5-step arc persona | recovered bundle:60 | honest AI peer, good arc | **REFINE** | basis for canonical arc | Low | adapt |
| 59-slogan injection | V6 context / `slogan-engine` | slogans + psychographic scoring | **MIGRATE** (slogans) / **RETIRE** (scoring) | `recoveryos.slogans` retrieval | Low | wrapper |
| ICARE phase context | V6 / grace-companion-v6 | phase in context | **REFINE** | minimal consented context | Low | keep phase only |
| Psychographic profile (Enneagram/True Colors/MBTI/Big Five/attachment/ACE) | `participant_profiles`, `slogan-engine` | injected into personalization | **RETIRE** | none | High (privacy) | do not build |
| mood/craving/BARC → CRM export | `DailyGraceCheckIn.jsx:173` | external CRM, no consent | **RETIRE** | none | High | delete |
| `proactiveRiskDetection` | Base44 fn | fail-open pop. scan + unsolicited emails | **RETIRE** | Support Now (participant-controlled) | **Critical** | delete |
| `analyzeFeedbackAndAlert` | Base44 fn | **no-auth** staff alerting w/ verbatim complaints | **RETIRE** | none | **Critical** | delete |
| `analyzeSentiment` crisis flag | Base44 fn | unvalidated LLM crisis label | **RETIRE** | keyword+human, no scoring | High | replace |
| grace-companion crisis auto-notify | `grace-companion*` | AI/mode-triggered staff alert, cross-user pid | **RETIRE** | Support Now, no silent alert | High | delete |
| `generateANCHORCasePlan` / `generateSessionSummary` | Base44 fns | AI writes to records, no review | **RETIRE** | human-authored | High | delete |
| Deployed 8-substring crisis UI | recovered bundle:551 | detects, escalates to no one | **REFINE** | keyword prompt + surface Support Now | Med | rebuild |
| Consent screen | recovered bundle:519 | optional + false storage claim | **REPLACE** | `ai_features` grant gate | Med | rebuild |
| Conversation persistence | V6 (metadata) / Base44 (bodies) | mixed | **KEEP** stateless V6 model / **RETIRE** Base44 body storage | none for V1 | Low | stateless |
| Fabricated compliance/model claims | `EnhancedGraceCapabilities`, 6× "GPT-5.2" | false HIPAA/ZK/no-halluc/GPT-5.2 | **RETIRE** | accurate copy | **Critical** | delete |
| Support Now inside companion | absent | no human handoff | **REPLACE** | `packages/safety` ladder | Med | surface it |
| `Grace` raw-response logging | `Grace` handler | logs upstream body | **REFINE** | redacting monitor | Med | redact |
| `slogan-engine` / `vrcc-api-gateway*` / Base44 platform | dev project | drifted, out of scope | **RETIRE** | canonical RPCs | Med | decommission plan |

---

## U. Target architecture (source-based; labels: [existing] [reuse] [new] [deferred])

```
RecoveryOS / Hearth  [existing]
        │  participant is signed in (Supabase Auth + recoveryos.people)  [existing]
        ▼
/vrcc/grace  (route in apps/platform)  [new]
        │  gate: active `ai_features` consent grant  [reuse: consent_types/consent_grants]
        ▼
Grace authenticated server boundary  [new]
  Supabase Edge Function on RecoveryOS-Launch, verify_jwt=true          [new]
  → resolves current_person_id                                          [reuse]
  → re-checks ai_features consent server-side                           [reuse]
        ▼
Consent / minimum context  [new policy over reuse]
  ONLY: first name, ICARE phase, today's slogan, upcoming session,
  support-team presence — assembled from recoveryos.*                   [reuse]
  (NO psychographics, NO mood/craving history, NO risk scores)          [retired]
        ▼
Safety policy  [new]
  keyword pre-check → surface Support Now inline (no scoring,
  no silent staff alert); crisis copy uses ONE canonical number set     [reuse: packages/safety]
        ▼
Canonical retrieval  [reuse + new wrapper]
  recoveryos.slogans (59), recoveryos.resources (46)                    [reuse]
        ▼
Tool policy  [new]
  draft-only; human-in-the-loop; on confirm → send_message /
  create_support_request (existing RPCs); no autonomous writes          [reuse RPCs]
        ▼
Model interface  [new]
  server-authoritative system prompt (NO client override);
  server-held ANTHROPIC_API_KEY; redacting logs                         [refine of Grace fn]
        ▼
approved provider (Anthropic; exact model chosen in a later phase)      [deferred]
```

Deferred: streaming, persistent memory, `grace_sessions` telemetry table, faith
opt-in, Cloudflare Worker.

---

## V. Implementation dependencies

1. **Grace — AI Support Navigator Implementation Authority V1.1** — must be supplied to
   this session/repo before G1 (see §W); §4 must be re-run section-by-section
   against it.
2. **Model selection** — deferred by directive; choose the approved Anthropic model
   in the implementation phase.
3. **Missing canonical content** — "The Tapes We Carry" and GFARC datasets must be
   authored/ingested from source (not from memory) before Grace can retrieve them.
4. **Decommission plan** for the dev project (`ykykeioydvtxpyreshhs`) `Grace`,
   `grace-companion*`, `slogan-engine`, `vrcc-api-gateway*` functions and Base44
   platform usage — currently live and publicly reachable.
5. **Canonical crisis-number set** — reconcile the four conflicting numbers to the
   RecoveryOS Support Now ladder's verified contacts.
6. No schema changes needed for V1 (stateless, draft-only).

---

## W. Security / privacy blockers

- **BLOCKER-1 (process):** Implementation Authority V1.0 was **not in session
  context** — could not be read. §4 comparison is against the G0 directive's
  enumerated concerns, not the Authority. Must be provided before G1 sign-off.
- **BLOCKER-2 (live exposure, pre-existing):** dev project `ykykeioydvtxpyreshhs`
  is ACTIVE_HEALTHY; `Grace` and siblings are invokable with a publishable key /
  anon JWT (unauthenticated LLM access; the shim path bypasses `verify_jwt`). Not
  created here; flag for immediate decommission planning.
- **Historical behaviors that must never enter the baseline:** client-controlled
  persona/model; false lived-experience and default religious persona;
  unauthenticated/fail-open surveillance and staff alerting; AI-driven crisis
  determination and silent coach alerts; psychographic profiling; mood/craving CRM
  export; fabricated HIPAA/42 CFR Part 2/zero-knowledge/no-hallucination/GPT-5.2
  claims; raw-transcript logging.
- **Data minimization:** the empty `participant_profiles`/personality tables are a
  latent re-collection risk — Grace V1 must not read or populate them.

---

## X. Recommended Grace implementation sequence

1. **G1 — Authority reconciliation & spec.** Obtain Authority V1.0; re-run §4
   section-by-section; freeze the canonical server-authoritative persona (seeded
   from `Grace` `baseSystemPrompt` D1 + `Yw` arc, minus every RETIRE item);
   fix the crisis-number set.
2. **G2 — Consent gate.** Wire the existing `ai_features` consent grant as the entry
   gate to `/vrcc/grace` (no schema change); accurate consent copy.
3. **G3 — Edge Function (server-authoritative).** Build the JWT-verified,
   consent-checked Edge Function on RecoveryOS-Launch: `current_person_id`, minimal
   consented context, server-only persona/key, redacting logs, no client override.
   Stateless.
4. **G4 — Safety integration.** Inline Support Now (`packages/safety`) inside Grace;
   keyword pre-check surfaces human connection; **no scoring, no silent alert**;
   verify against the RecoveryOS Support Now independence rules.
5. **G5 — Canonical retrieval + draft-only tools.** Slogans + resources retrieval;
   draft Coach/Navigator messages and human-support-request via existing RPCs with
   human confirmation.
6. **G6 — Frontend surface.** `/vrcc/grace` in `apps/platform` with in-surface AI
   disclosure, Hearth design, a11y.
7. **G7 — Live gate.** Extend the P4H live-gate harness with Grace journeys
   (consent gate, disclosure present, crisis→Support Now, draft→confirm→RPC,
   no-transcript-persistence, no staff-alert) over the real boundary; advisors +
   contract preflight.
8. **G8 — Decommission** the dev-project Grace/companion functions and Base44 usage;
   confirm no public LLM endpoint remains.
9. **Deferred (post-V1):** streaming, memory + its consent type, `grace_sessions`
   telemetry, faith opt-in, model-gateway/Worker if ever justified.

Content authoring (Tapes We Carry, GFARC) proceeds in parallel from source
documents, never from memory.

---

# Authority V1.0 Reconciliation (addendum, 2026-08-09)

Added at G1. Reconciles the G0 recommendations (§D/§T/§U/§X) against the Grace AI
AI Support Navigator Implementation Authority V1.1. **Process note (carried from G0
§W):** the Authority V1.0 document text was again NOT embedded in the session
message that declared it "loaded"; this reconciliation is therefore performed
against the Authority's operative content as enumerated and restated in the
G1–G8 directive (which specifies exact disclosure microcopy §4, conversation
doctrine §6, anti-sycophancy §7, personalization include/exclude lists §8, the
eight non-diagnostic safety categories §11, tool/write rules §16–19, etc.). Where
the directive is explicit, **Authority wins** and the G0 note is refined to match.
Every implicated section is classified below.

| Authority section | G0 position | Reconciliation | Where enforced |
|---|---|---|---|
| AI identity / disclosure | REPLACE (disclosure buried) | **CONFORMING** — exact microcopy adopted verbatim ("I'm Grace, an AI recovery companion from Grace For Addictions…") in-surface + in the system prompt | `GracePage` disclosure banner; `policy.ts` DISCLOSURE + IDENTITY layer |
| Lived-experience prohibition | RETIRE | **CONFORMING** | policy IDENTITY layer ("NO lived experience… NEVER 'walked the road'/'in recovery'/'been there'") |
| Conversation architecture | KEEP D2 arc | **REFINE — Authority wins**: flexible repertoire, do NOT force every stage, "do not make every user breathe", not a worksheet | policy CONVERSATION DOCTRINE layer |
| Sycophancy | (n/a in G0) | **CONFORMING** — emotion≠fact, experience≠interpretation, validation≠agreement; no diagnosis | policy VALIDATION layer; eval `sycophancy` (6) + `paranoia_delusion` (4) |
| ICARE | REFINE (keep phase) | **CONFORMING** — phase only, when canonical/useful | policy CONTEXT layer (`icarePhase`, currently null until canonical) |
| Recovery Capital | PARTIAL | **NOT APPLICABLE to V1 prompt** — no BARC injection; retrieval only when canonical | context excludes scores |
| Canonical content | MIGRATE | **CONFORMING** — retrieval from `recoveryos.slogans`/`resources`; abstain if absent | Edge Fn `retrieveCanonical`; policy CANONICAL layer |
| Slogans | MIGRATE / retire scoring | **CONFORMING** — exact from DB, max one, may decline, provenance; NO psychographic scoring | `retrieveCanonical`; eval `slogan_use`(4)+`hallucinated_slogan`(3) |
| Recovery pathways | (n/a) | **CONFORMING** — multi-pathway respect, none privileged | policy MULTI-PATHWAY; eval `multi_pathway`(4)+`medication_supported`(3) |
| Faith | RETIRE default religious persona | **CONFORMING** — no default faith; only participant-initiated, non-coercive | policy FAITH layer; eval faith(6) |
| Personalization | RETIRE psychographics | **CONFORMING** — minimum-necessary include list only; psychographic tables never read | Edge Fn context; policy CONTEXT |
| Memory | KEEP stateless | **CONFORMING** — stateless; "no memory between sessions" stated honestly | no persistence; policy ANTI-DEPENDENCY |
| Conversation storage | none for V1 | **CONFORMING** — body is request/response only; nothing persisted | Edge Fn (no writes); §M report |
| Consent | EXISTING SUFFICIENT | **CONFORMING** — `ai_features` grant, frontend + independent server recheck | Edge Fn consent gate; `GracePage` gate; `grace.ts` |
| Safety | REFINE (keep protocol, replace detection, wire Support Now) | **CONFORMING — Authority wins**: 8 non-diagnostic routing categories, NOT the 8-substring toy, NO risk score, NO hidden crisis probability | policy SAFETY + `deterministicSafetyFloor`; eval crisis(6)/overdose(3)/violence(3) |
| Support Now | REPLACE (surface it) | **CONFORMING** — surfaced in Grace; single canonical ladder reused, not duplicated | `GracePage` SupportNowButton; policy defers resource details to canonical ladder |
| Silent-alert prohibition | RETIRE alerts | **CONFORMING** — no notification/alert/email/service_event from Grace | Edge Fn (no writes); G15 test |
| Human sharing | participant-initiated | **CONFORMING** — draft-only; participant confirms; canonical RPC authorizes | policy TOOLS; §L report |
| Staff privacy | (n/a) | **CONFORMING** — no coach-private data in context; admin cannot read transcript (none exists) | RLS own-data context; G17/G18 |
| Anti-dependency | REFINE (make explicit) | **CONFORMING** | policy ANTI-DEPENDENCY; eval dependency(6) |
| RAG | (n/a) | **CONFORMING** — retrieved text is DATA; injection-guarded | policy INPUT-AS-DATA; eval rag_injection(4) |
| Prompt injection | (n/a) | **CONFORMING** | policy INPUT-AS-DATA; red-team system-prompt/secret extraction |
| Stage-1 tools | REUSE/WRAPPER | **CONFORMING** — read-mostly; My Support/sessions/resources/slogans/draft messages via existing RPCs | policy TOOLS; §L report |
| Controlled writes | draft/read-mostly | **CONFORMING** — no autonomous writes in V1 | Edge Fn performs no writes |
| Service-event semantics | LOCK | **CONFORMING** — Grace never creates a service_event | Edge Fn; G16 test; §19 |
| Analytics | process metadata only | **CONFORMING** — event names only, no bodies | `analytics.ts` grace events; G19/G20 |
| Evaluation | build suite first | **CONFORMING (assets)** / **BLOCKED (run)** — 116-scenario suite + runner authored; run requires provider key (§O) | `e2e/grace/eval-scenarios.json`; `scripts/grace-eval.mjs` |
| Red team | permanent coverage | **CONFORMING (assets)** — 32 adversarial scenarios pairing refusal + dignity | `e2e/grace/red-team-scenarios.json` |
| Provider privacy | document before activation | **CONFLICT — AUTHORITY WINS / BLOCKED**: no HIPAA/42-CFR/zero-knowledge/no-hallucination claims; posture undocumented until a provider account is chosen (§Q) | report §Q |
| Cloudflare AI Gateway | not for V1 | **CONFORMING** — not introduced | architecture §C |
| Data authority | RecoveryOS | **CONFORMING** — Supabase/`recoveryos.*` sole authority | Edge Fn caller-JWT reads |
| Server boundary | Edge Function | **CONFORMING** — WORKER_REQUIRED = NO honored | `supabase/functions/grace` |
| UX | Hearth, Grace = one capability | **CONFORMING** — `/vrcc/grace`, IA preserved | `GracePage`; nav item |
| Accessibility | P4H harness | **CONFORMING** — role=log transcript, labeled composer; in authenticated axe sweep | `GracePage`; `04-authenticated-a11y` |
| Legal/privacy | no false claims | **CONFORMING** — accurate consent copy; no marketing compliance claims | `GracePage` consent card |
| Deferred features | memory/streaming/Worker/faith-opt-in later | **CONFORMING** | report §Z |

No G0 recommendation is in unresolved conflict with the Authority as enumerated;
the two CONFLICT rows (safety detection sophistication; provider-privacy claims)
were resolved in the Authority's favor and are reflected in the build.
