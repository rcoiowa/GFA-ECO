# RecoveryOS ICARE Integration Authority v1.0

**Status:** RATIFIED / CANONICAL — controlling implementation authority for ICARE-related
RecoveryOS behavior. · **Date:** 2026-08-14 · **Supersedes for implementation detail:**
`docs/decisions/adr-0015-icare-workflow.md` (ADR-0015 remains the historical decision of record for
the ICARE definition; this document governs implementation).

> This is a **Class 1 — Canonical / Locked Product Authority** document. It is allowed to control
> code. Research sources, historical material, and AI memory do **not** override it. Where any other
> ICARE / emotional-awareness / BARC-10 / rapport document conflicts with this one, **this document
> governs.**

## Source precedence (read this first)

Two hierarchies exist and must never be collapsed:

**Normative authority — what RecoveryOS MUST/SHOULD be:**

1. Ratified GFA / RecoveryOS governance (incl. existing Grace Authority, which is superior where
   stricter — see §7).
2. Explicit current Executive Director decisions.
3. Canonical repository governance (this document; ADR-0015 for the ICARE definition).
4. Tier 2 program-design crosswalks.
5. Research / reference material.
6. Historical material.

**Observed-state authority — what is actually deployed/true now:**

1. Verified live-system evidence.
2. Current deployed artifact / configuration.
3. Current canonical repository implementation.
4. Current documentation.
5. Memory / history.

**Governing rule:** _Governance determines intended behavior. Verified runtime evidence determines
factual claims about current deployed behavior. Runtime drift does not amend governance; it creates
a remediation requirement._ Memory is **not** authority. Research is **not** authority. Historical
material is **not** authority.

---

## 1. ICARE — LOCKED definition

**ICARE = Identify → Connect → Assess → Respond → Empower.** A five-**stage** relational / recovery
**workflow** (per ADR-0015, corroborated by the legacy `gfa_icare.icare_plans` / `icare_steps`
schema).

| Stage            | Meaning                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **I — Identify** | Recognize the participant's current state, strengths, needs, barriers, changes, risks, and opportunities.                        |
| **C — Connect**  | Connect the participant with an appropriate person, relationship, recovery slogan, practice, resource, or support pathway.       |
| **A — Assess**   | Interpret participant-reported, validated, operational, and engagement data while clearly distinguishing among those data types. |
| **R — Respond**  | Provide a proportionate, explainable, and timely response based on the information available.                                    |
| **E — Empower**  | Strengthen agency, confidence, choice, capacity, and movement toward the participant's next healthy step.                        |

ICARE **is not**: five assessment domains · a clinical diagnostic instrument · an automated state
machine · an AI-derived participant status · a BARC-10 scoring construct.

**Locked ICARE rules:**

1. ICARE progression is **participant-centered and human-governed**.
2. Grace MUST NOT determine, infer, advance, or regress ICARE stage, nor imply the system has
   determined someone's stage.
3. BARC-10 MUST NOT determine ICARE stage.
4. Machine-derived emotion or behavioral state MUST NOT determine ICARE stage.
5. If RecoveryOS stores a current ICARE phase/stage, there must be clear **provenance/attribution**
   for who selected or updated it (never a system inference presented as fact).
6. Every feature maps to all five stages or documents explicitly why a stage does not apply
   (review requirement, per ADR-0015).
7. Assessment must produce a response or participant benefit — data collection is never extractive.
8. The governing design test for Respond/Empower is **"What is the most loving next step?"** A
   screen that ends in "thanks for checking in" fails it.

**Implementation status (observed 2026-08-14):** the canonical `recoveryos` schema does **not** yet
persist ICARE stage; the `gfa_icare.*` tables exist only in the legacy schema (archive). Grace
receives an `icarePhase` as **read-only context** and it is currently hardcoded `null`
(`supabase/functions/grace/index.ts`), never inferred. This Authority governs any future
implementation.

---

## 2. Emotional-awareness — LOCKED

Participant emotional awareness is self-directed, reflective, educational, optional (unless a
specific approved program workflow requires an assessment), person-first, and non-diagnostic.

RecoveryOS **MAY** help a participant ask: How do I feel? · How do I know? · What sensations do I
notice, and where? · When did they begin? · What thoughts/interpretations am I noticing? · What
support, if any, would I like?

RecoveryOS **MUST NOT**: infer emotion from passive activity · classify emotion from text without
participant request · classify emotion from facial expression, vocal tone, posture, or breathing ·
infer distress/risk from platform engagement patterns · create hidden emotional profiles.

**Governing caveat (must accompany any body/voice/facial/behavioral/physiological content):**
_Body, voice, facial, behavioral, and physiological descriptions represent possible patterns a
person may recognize in themselves. They are not reliable indicators of another person's internal
state and MUST NOT be used by RecoveryOS, Grace, staff forms, or automated systems to conclude how
another person feels._

**Observed:** the only "emotion" surface in code is the SAMHSA **"Emotional" wellness-domain** tag
on slogans + slogan content — a content taxonomy, not emotion detection. Aligned.

---

## 3. Grace AI — LOCKED (existing Grace Authority is superior where stricter)

This Authority does **not** modify: `grace-policy-1.2.0` · the locked model configuration
(`grace-model-lock.json`) · provider-activation state (**remains OFF**) · the stateless posture ·
the transcript-persistence prohibition · the consent gate · the Support Now safety floor · the
no-silent-escalation rules.

Grace remains authenticated, consent-gated, participant-initiated, stateless, advisory,
draft-not-send, minimum-necessary. Grace **may** surface canonical slogans, offer
participant-requested reflection, help reframe, and offer participant-selected support options.

Grace **MUST NOT**: passively monitor · build a risk profile · silently notify staff · autonomously
escalate · create a service event merely from conversation · create a referral merely from
conversation · claim a human action occurred unless system-confirmed · assign ICARE stage.

**Grace conversation ≠ human peer contact · ≠ service event · ≠ completed referral.**

**Observed:** `supabase/functions/grace/policy.ts` and `index.ts` explicitly encode "never score
risk, never write a record, never alert staff"; `icarePhase` is read-only and null. Aligned.

---

## 4. BARC-10 — LOCKED

RecoveryOS treats BARC-10 as: **10 items, each scored 1–6, canonical total = 10–60**, operated as
**one total recovery-capital score**. Individual item responses may be retained as permitted
structured assessment responses.

RecoveryOS **MUST NOT**: calculate BARC subdomain/subscale scores · represent individual items as
validated independent subscales · automatically assign ICARE stage from BARC · automatically
determine service eligibility from BARC · automatically flag clinical risk from BARC · create hidden
risk records from BARC · use an arbitrary **≤35 crisis threshold** · trigger staff alerts or
autonomous workflows from a BARC cutoff.

- The historical **≤35 "crisis-range"** claim is **REJECTED / NOT CANONICAL.**
- The **47** benchmark is **Tier 3 — research-informed reference only.** It may be described as a
  research-informed benchmark associated in some validation literature with established/sustained
  recovery. It **MUST NOT** be presented as a guaranteed prediction, clinical cutoff, access gate,
  automated workflow trigger, diagnosis, or risk classification. Exact source/provenance and
  population are **OPEN** (see §Open Bindings) — do not fabricate provenance.

**Observed:** `packages/domain/src/instruments/barc10.ts` computes a **total only** (no subdomains),
range 10–60; `47` (and reflective boundaries 38/26) drive a **participant-facing "soil" reflection**
(parable-of-the-sower GFA IP) — no access gate, alert, referral, or risk record. There is **no ≤35
logic.** `recoveryCapital.ts` records a completed-assessment service event only. Aligned; one
documentary correction applied to the `47` code comment (§Drift).

---

## 5. Thrive Iowa crosswalk — Tier 2 program-design (not present in code)

A BARC-10 ↔ Thrive Iowa mapping may be retained **only** as a **Tier 2 program-design heuristic** to
support human conversation/navigation (e.g. "this response may suggest an area the participant wants
to explore"). It is **NOT** validated psychometric equivalence. Do not encode "BARC item X = Thrive
domain Y" as scientific truth. No crosswalk may auto-trigger eligibility, referral, risk flags,
staff notification, participant nudges, or case status.

Every such crosswalk must carry: _RecoveryOS operational crosswalk — program-design inference, not
validated equivalence._

**Observed:** the program "Thrive Iowa" is **not referenced** in the repository (only the ordinary
word "thrive" in conduct prose). No crosswalk exists in code. This section governs any future one.

---

## 6. Rapport / physiology / tonality — Tier 3 human-training curriculum

Matching, mirroring, crossover, pacing, tonality/posture/breathing awareness are **educational
interpersonal skills** for coach/navigator training. They **MUST NOT** become automated scoring,
emotion detection, trust/engagement scoring, deception detection, risk scoring, or surveillance, and
**MUST NOT** appear in staff forms that claim another person's internal state.

Train staff to: **notice → remain curious → ask → let the participant define their experience** —
never observe → infer → classify.

**Observed:** no rapport/tonality scoring exists in code. Aligned.

---

## 7. Service-event & reporting authority — LOCKED

Verified human/system-confirmed actions are the operational reporting authority (completed
peer-support session, actual referral, actual navigation interaction, completed assessment,
completed follow-up, verified resource connection, human-documented action). Do **not** inflate
Grace interactions, page views, content opens, passive events, or draft recommendations into service
delivery. Reporting must remain **evidence-honest**.

---

## 8. Language boundary — LOCKED

RecoveryOS uses person-first, stigma-reducing, peer-recovery language. Clinical/legal/source
terminology may appear **only** for direct quotation, law/regulation, external interoperability,
research discussion, or explicit boundary statements — with context making clear RecoveryOS is not
adopting it as its own characterization.

Prefer: participant · person · return to use · recovery plan · support option · reflection prompt ·
recovery capital · Engagement. Avoid as internal GFA labeling: patient · addict · relapse · clinical
risk score · diagnostic assessment · behavioral surveillance.

---

## 9. Hope Hub / external integration — OPEN (Tier 3, not canon)

Speculative external-system architecture is **not** canonized. Unless independently verified by a
current executed agreement + technical evidence, the following stay **OPEN / Tier 3**: Hope Hub
operator/ownership · SSO architecture · OAuth vs SAML · account binding · FERPA/COPPA assertions ·
Thrive Iowa workflow responsibilities · cross-platform data ownership · geographic rollout · state
funding assumptions. A concept may be mineable without becoming product authority.

**Observed:** "Hope Hub" is **not referenced** in the repository. Nothing to canonize.

---

## 10. Data provenance & inference labeling — LOCKED

Data provenance stays distinguishable at all times among: self-reported · validated instrument ·
observed engagement · staff-entered · system-generated inference. Inferences are **labeled as
inferences** — never presented as diagnoses, verified facts, or clinical conclusions. Recommendations
must be explainable from participant data ("Why am I seeing this?" in plain language). A
participant-facing composite recovery score is **prohibited**.

---

## 11. Change control

- This document is the primary ICARE implementation authority. Changing a **locked** rule requires a
  new ratified decision and a version bump here (v1.1, v2.0, …), with a reviewable diff.
- The machine-checkable subset of these locks is pinned in `icare-implementation-lock.json` and
  verified by `scripts/icare-lock-verify.mjs`; prohibited-behavior regressions are caught by
  `scripts/check-icare-governance.mjs`. Both run in CI.
- ADR-0015 remains the historical decision of record; it points here for implementation detail.

---

## Appendix A — Document Disposition Matrix

Classification taxonomy: **CANONICAL — LOCKED** (Class 1) · **CANONICAL — TIER 2 CROSSWALK**
(Class 2) · **RESEARCH — MINEABLE** (Class 3) · **ARCHIVE — SUPERSEDED** (Class 4) · **REMOVE**
(Class 5) · **OPEN — HUMAN DECISION REQUIRED**.

| Artifact                                                        | Path                                                            | Classification                 | Canonical?       | Mineable? | Drive code?       | Memory   | Disposition                                  | Supersedes / superseded by            | Banner                | Action taken           | Remaining                                                  |
| --------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------ | ---------------- | --------- | ----------------- | -------- | -------------------------------------------- | ------------------------------------- | --------------------- | ---------------------- | ---------------------------------------------------------- |
| ICARE Integration Authority v1.0                                | `docs/product/recoveryos-icare-integration-authority-v1.0.md`   | Class 1                        | **Yes**          | —         | **Yes**           | pointer  | CANONICAL — LOCKED                           | supersedes ADR-0015 for impl detail   | —                     | Created                | Ratify future versions on change                           |
| ADR-0015 ICARE workflow                                         | `docs/decisions/adr-0015-icare-workflow.md`                     | Class 1 (definition of record) | Yes (definition) | —         | Definition only   | pointer  | CANONICAL (historical decision)              | superseded-for-impl-by this Authority | forward-pointer added | Edited (pointer note)  | none                                                       |
| BARC-10 instrument                                              | `packages/domain/src/instruments/barc10.ts`                     | Class 1 (governed code)        | governed         | —         | Yes               | —        | CANONICAL — LOCKED (total-only)              | governed by §4                        | —                     | Comment corrected (47) | none                                                       |
| ICARE source-mining index                                       | `docs/research/icare/README.md`                                 | Class 3 index                  | No               | Yes       | No                | —        | RESEARCH — MINEABLE                          | —                                     | banner                | Created                | populate as sources arrive                                 |
| grace-policy-1.2.0 + Grace Authority docs                       | `supabase/functions/grace/policy.ts`, `docs/product/grace-ai-*` | Class 1 (Grace)                | Yes              | —         | Yes               | existing | CANONICAL — LOCKED (superior where stricter) | —                                     | —                     | Referenced (unchanged) | none                                                       |
| Recovering-the-Mind slogans source                              | `docs/source-documents/recovering-the-mind/`                    | Class 3                        | No               | Yes       | No (content only) | —        | RESEARCH — MINEABLE                          | —                                     | —                     | Left as-is             | optional banner                                            |
| Emotional-awareness / rapport / interoception curricula         | _(named in directive; not present in repo)_                     | Class 3                        | No               | Yes       | No                | —        | OPEN — NOT PRESENT                           | —                                     | —                     | Noted absent           | ingest under `docs/research/icare/` when provided          |
| "August 13 Research and Analysis Report", Hope Hub architecture | _(named in directive; not present in repo)_                     | Class 4/OPEN                   | No               | Yes       | No                | —        | OPEN — NOT PRESENT                           | —                                     | —                     | Noted absent           | archive under `docs/research/icare/archive/` when provided |

No artifact met the **Class 5 (REMOVE)** narrow rule (byte-identical/useless duplicate). Nothing was
deleted.

## Appendix B — Source-binding matrix (controlling requirements)

| Requirement (this Authority)                         | Source support                                         | Governance status         | Implementation effect                    |
| ---------------------------------------------------- | ------------------------------------------------------ | ------------------------- | ---------------------------------------- |
| ICARE = Identify→Connect→Assess→Respond→Empower      | ADR-0015 (owner-specified + legacy schema)             | SOURCE-CONFIRMED          | Locked definition; lock JSON + CI        |
| ICARE is a workflow, not assessment domains          | ADR-0015 (rejects the domains reading)                 | GOVERNANCE-CORRECTED      | Lock forbids the domains framing         |
| Grace never assigns/infers ICARE stage               | grace policy/index (`icarePhase=null`, read-only)      | SOURCE-CONFIRMED          | Aligned; CI guard                        |
| BARC-10 = single 10–60 total, no subdomains          | `barc10.ts` (total-only)                               | SOURCE-CONFIRMED          | Aligned; lock + CI                       |
| ≤35 crisis threshold rejected                        | not present in code                                    | SOURCE-CONFIRMED (absent) | CI guard prevents introduction           |
| 47 = research-informed reference only, no automation | `barc10.ts` used it for reflection; comment overstated | GOVERNANCE-CORRECTED      | Comment softened; CI guard on automation |
| No passive emotion/behavioral inference              | absent in code                                         | SOURCE-CONFIRMED (absent) | CI guard                                 |
| No silent Grace staff alerts / autonomous escalation | grace policy ("never alert staff")                     | SOURCE-CONFIRMED          | Aligned; CI guard                        |
| Service events are human/system-confirmed only       | `recoveryCapital.ts` records completed assessment      | SOURCE-CONFIRMED          | Aligned                                  |
| Thrive Iowa crosswalk = Tier 2, not equivalence      | program not in repo                                    | UNSUPPORTED (absent)      | Governs future crosswalk                 |
| Hope Hub architecture = OPEN                         | not in repo                                            | UNRESOLVED                | No canonization                          |
| BARC-10 licensing/permission to use                  | not evidenced in repo                                  | UNRESOLVED                | Open binding (§below)                    |
