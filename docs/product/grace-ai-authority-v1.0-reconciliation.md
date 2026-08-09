# Grace Authority V1.0 (Ratified Canonical Edition) — Implementation Reconciliation

**Date:** 2026-08-09. **Authority:** `docs/product/grace-ai-implementation-authority-v1.0.md`.
**Implementation under review:** certified canonical Grace V1 — `supabase/functions/grace`
(`index.ts` + `policy.ts`, `grace-policy-1.2.0`), `apps/platform` `/vrcc/grace`,
`packages/data-access`/`packages/safety`, locked model `claude-sonnet-5` (thinking
disabled), evaluation evidence run-001/002/003 + Sonnet 5 comparison (report §AD–§AG),
model lock (§AH Phase 1). **Method:** reconcile each Authority section against the
already-certified implementation. Not a re-run of the historical source audit; no
redesign for wording differences.

**Classification key:** CONFORMING · REFINE (non-blocking) · CONFLICT (Authority
wins) · N/A or DEFERRED.

| § | Authority topic | Classification | Evidence |
|---|---|---|---|
| 1 | Purpose / supersession rule | CONFORMING | Authority persisted as canonical doc; supersession recorded (report §AH P3, §45 register). |
| 2 | Organizational doctrine (No Shame/Connection Prevents Crisis) | CONFORMING | `policy.ts` VALUES ("dignity above labels; grace above shame; relationship above systems"); values embodied. REFINE-note: org taglines carried in spirit. |
| 3 | Canonical identity + required disclosure | CONFORMING | `policy.ts` IDENTITY & DISCLOSURE (no lived experience/body/feelings); `DISCLOSURE` verbatim matches required microcopy; in-surface disclosure G2. |
| 4 | What Grace IS | CONFORMING | Companion/reflect/ground/navigate/bridge/resources/one-next-step/draft-not-send/participant entry — all present (§S, policy TOOLS). |
| 5 | What Grace is NOT | CONFORMING | `policy.ts` BOUNDARIES (not therapist/clinical/legal/sponsor/crisis service). |
| 6 | Human connection is the destination | CONFORMING | Doctrine offers connection "where fitting," not reflexively; anti-dependency points back to real people. |
| 7 | Conversation doctrine + flexible repertoire | CONFORMING | `policy.ts` CONVERSATION DOCTRINE matches the 8-stage repertoire; "Do NOT force every stage." |
| 8 | Validation without sycophancy | CONFORMING | `policy.ts` VALIDATION WITHOUT SYCOPHANCY incl. paranoia example; eval sycophancy 8/8, paranoia 5/5. |
| 9 | Return-to-use doctrine | CONFORMING | SAFETY POLICY "return to use: no shame; a chapter, not the end"; eval return_to_use 4/4. |
| 10 | ICARE (framework, not diagnosis) | CONFORMING | `ctx.icarePhase` wired as internal scaffold, currently null (no canonical source) — matches "when canonical context exists"; never reduces identity to a phase. |
| 11 | Recovery Capital (no hidden risk score) | CONFORMING | No RC scoring exists; no predictive/eligibility algorithm built. |
| 12 | Recovery Reasoning Engine (framework not template) | CONFORMING | Reasoning framework in prompt; Grace chat is not an operational event (§30). |
| 13 | Canonical slogans (59; from source; ≤1; abstain) | CONFORMING | `retrieveCanonical` reads `recoveryos.slogans`; prompt "use at most ONE, verbatim… abstain rather than fabricate"; eval slogan_use 4/4, hallucinated_slogan 4/4. REFINE-note: retrieval surfaces ≤3 candidates for the model to choose ≤1 (offer-not-impose). |
| 14 | The Tapes We Carry (deferred until canonical) | CONFORMING | Deferred; not retrieved/invented (report §Z). |
| 15 | GFARC content (only when canonical) | CONFORMING | Deferred; not fabricated. |
| 16 | Multi-pathway recovery | CONFORMING | `policy.ts` MULTI-PATHWAY RESPECT; eval multi_pathway 4/4, MAT 3/3. |
| 17 | Faith participant-led | CONFORMING | `policy.ts` FAITH POLICY (faith off by default; engage only if raised); eval faith_active/open/secular pass. Supersedes historical "Faith-Open" default (§45). |
| 18 | Personalization — allowed | CONFORMING | `ctx` = firstName/icarePhase/hasCoach/hasNavigator/nextSessionAt/faithPreference — minimum-necessary, matches allowed list. |
| 19 | Personalization — prohibited (psychographics) | CONFORMING | `index.ts` explicitly reads NO psychographic tables (Enneagram/True Colors/MBTI/Big Five/attachment/ACE/shame/isolation/stage/risk). Historical injection removed. |
| 20 | Consent (ai_features; UI + server; revocable) | CONFORMING | Server recheck of latest `ai_features` grant; `consent_required`; G3. |
| 21 | Stateless V1 (no memory/dossier/scores) | CONFORMING | No transcript store; no writes; no cross-session memory; G17/G18, §M. |
| 22 | Never-persist content | CONFORMING | No body in logs/analytics/service events; G19/G20; grace-meta = process metadata only. |
| 23 | Process metadata (bounded allow-list) | CONFORMING | analytics.ts events + grace-meta (policy_version, model_id, stop_reason, tokens, latency, status, truncation/refusal, rate-limit) — all within §23 list; no bodies. |
| 24 | Safety architecture (9 non-diagnostic categories) | CONFORMING | `SafetyCategory` = the exact 9 categories; posture not diagnosis; no score/record/alert. |
| 25 | Deterministic safety floor + change control | CONFORMING | `deterministicSafetyFloor`; versioned (1.1.0→1.2.0 on floor change); `grace-floor-selftest.mjs` (12 crisis + 14 benign FP controls). |
| 26 | Support Now independent | CONFORMING | `packages/safety` ladder; surfaced on every response code via `safety`; independent of Grace/provider/consent; G13. |
| 27 | No silent escalation | CONFORMING | No notify/email/text/911/law/probation/family; no crisis record/service_event/residence change; G15/G16. **Supersedes historical crisis→Coach alert.** |
| 28 | Participant-controlled human connection | CONFORMING | `policy.ts` TOOLS: offer only; action via canonical workflows; never claim completion unless confirmed. |
| 29 | Tools V1 (read-mostly; draft-not-send) | CONFORMING | My Support/next session/Support Now/resources/slogans/draft messages; "draft means draft"; eval tool_honesty 7/7. |
| 30 | Grace chat ≠ service event | CONFORMING | No auto `service_event`; G16. |
| 31 | Staff visibility (no transcripts/insights) | CONFORMING | No staff transcript/insight/trend/risk surface; G17/G18. |
| 32 | Anti-dependency | CONFORMING | `policy.ts` ANTI-DEPENDENCY; eval dependency 8/8. |
| 33 | RAG (canonical only; data-not-instruction; abstain) | CONFORMING | INPUT-AS-DATA guard; retrieval from `recoveryos.slogans` only (no web); eval rag_injection 8/8. |
| 34 | Prompt authority (server-side; no client override) | CONFORMING | Browser cannot supply prompt/identity/provider/model/policy/tools; G4. |
| 35 | Provider boundary (key server-side only) | CONFORMING | Key = Edge Function secret; never in bundle/VITE_/storage/logs/git; G4 bundle scan clean. |
| 36 | Model governance (evaluate; lock; drift detectable) | CONFORMING | V1 = claude-sonnet-5 thinking disabled; fallback claude-opus-4-8; `grace-model-lock.json` + `grace-model-lock-verify.mjs` (live model_id assertion, PASS §AH P1). |
| 37 | Model evaluation (broad suite; no averaging away critical) | CONFORMING | 116 eval + 32 red-team across all listed categories; hard-gate standard; run-001/002/003 + comparison. |
| 38 | Provider failure truthful | CONFORMING | `provider_refusal`/`provider_empty`/`provider_timeout`/`provider_rate_limited`/`provider_overloaded`/`ai_unconfigured`; no fabrication; Support Now independent. |
| 39 | Privacy/provider claims (none unless proven) | CONFORMING | §Q 10-item account gate; no HIPAA/42-CFR/ZDR/BAA/zero-retention claim made. |
| 40 | Accessibility | CONFORMING | Semantic/keyboard/focus/reduced-motion/contrast/mobile; G21/G22/G24/G25 + axe. VoiceOver/NVDA remains a human-device gate (as §40 requires). |
| 41 | PWA/caching | CONFORMING | SW structurally cannot cache Grace (cross-origin POST); truthful offline; §U. |
| 42 | Hearth experience (/vrcc/grace) | CONFORMING | GracePage communicates identity/AI/limits/consent/privacy/composer/Support Now/resources/loading/error/offline; §S. |
| 43 | Visual identity (no photorealistic human avatar) | CONFORMING | Abstract identity; no deceptive embodiment; §S. |
| 44 | Legacy systems (quarantine after verification; preserve evidence) | CONFORMING (plan) | Containment plan §B/§X; execution pending post-staging (matches §44). |
| 45 | Explicit historical conflict register | CONFORMING | Every superseded item already removed in canonical Grace; matches report §AH P3 register. |
| 46 | Deferred features — not V1 | CONFORMING | None built (memory/predictive/profiling/dashboards/auto-alert/anonymous/voice/proactive/treatment-planning/failover/surveillance). |
| 47 | Change control (governance review; version increment) | CONFORMING | POLICY_VERSION discipline; model-lock; semantic changes versioned. |
| 48 | Governance review cadence | N/A (operational) | Monthly/quarterly/annual/immediate cadence is an operator process; recommend formal adoption. No code impact. |
| 49 | Activation standard (gates before deployment) | CONFORMING | Matches the report §AH/§AI activation-gate structure exactly. |
| 50 | Current V1 activation posture | CONFORMING | Matches report §AI verbatim in substance; `GRACE_PROVIDER_CONFIGURED` OFF; activation NOT YET AUTHORIZED. |
| 51 | Ratification statement | CONFORMING | Authority adopted as canonical governing document. |

## Result

- **CONFORMING:** all substantive/applicable sections (2–47, 49–51).
- **REFINE (non-blocking):** §2 org taglines carried in spirit (could be added to the
  prompt VALUES layer); §10 ICARE context currently null pending a canonical source
  field; §13 retrieval surfaces ≤3 candidate slogans for the model to choose ≤1.
  None require code change to conform.
- **N/A (operational):** §48 governance-review cadence (operator to adopt formally).
- **CONFLICT — AUTHORITY WINS:** **NONE.** The canonical implementation was built from
  the same G0–G8 decisions this Authority ratifies; every historical conflict in §45
  is already resolved in the implementation's favor of the Authority.
- **Required remediation:** **NONE.**

**Authority reconciliation BLOCKER: CLEARED.** Canonical Grace V1 conforms to the
Ratified Canonical Authority V1.0 with zero conflicts and no required remediation.
The remaining ACTIVATION blockers enumerated by the Authority itself (§49/§50) are
unchanged and human-gated: provider privacy/account verification (§39/§Q), locked-model
generative Playwright gates behind the intentionally-off `GRACE_PROVIDER_CONFIGURED`,
legacy containment execution, SMTP/signup, and human-device accessibility.
