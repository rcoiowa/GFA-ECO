# ADR-0015: ICARE is the care and action workflow

Status: Accepted (2026-08-04) — owner-specified, corroborated by the live schema.

> **Superseded for implementation detail (2026-08-14):** the controlling ICARE implementation
> authority is now `docs/product/recoveryos-icare-integration-authority-v1.0.md`. This ADR remains
> the historical decision of record for the ICARE **definition** (Identify → Connect → Assess →
> Respond → Empower, a workflow — not assessment domains), which the Authority preserves unchanged.
> Where this ADR and the Authority differ on implementation rules, the Authority governs.

## Context

ICARE had never been written down in this repository. In its absence a prior
session described it as a five-**domain** assessment (Identity, Connection,
Agency, Resilience, Engagement). That is wrong.

The organization's Executive Director specified ICARE as a five-**stage care
and action workflow**, and the live database corroborates it:
`gfa_icare.icare_plans` carries `identify_completed`, `connect_completed`,
`assess_completed`, `respond_completed`, `empower_completed`, and
`gfa_icare.icare_steps` carries `strength_identified`, `goal_set`,
`action_taken`, `barrier_encountered`, `slogan_applied`, and
`wellness_domain_id`. The architecture below was modeled years ago and never
brought to life.

## Decision

**ICARE is the orchestration model for the whole ecosystem — a workflow, not a
five-domain assessment.**

| Stage            | Meaning                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **I — Identify** | Recognize the participant's current state, strengths, needs, barriers, changes, risks, and opportunities.                        |
| **C — Connect**  | Connect the participant with an appropriate person, relationship, recovery slogan, practice, resource, or support pathway.       |
| **A — Assess**   | Interpret participant-reported, validated, operational, and engagement data while clearly distinguishing among those data types. |
| **R — Respond**  | Provide a proportionate, explainable, and timely response based on the information available.                                    |
| **E — Empower**  | Strengthen agency, confidence, choice, capacity, and movement toward the participant's next healthy step.                        |

### Binding principles

1. **Workflow, not assessment.** ICARE orchestrates; it does not score.
2. **Every feature maps to all five stages**, or documents explicitly why a
   stage does not apply. This is a review requirement, not a suggestion.
3. **Assessment must produce a response or participant benefit.** Data
   collection must never become extractive: if we ask, we give something back.
4. **The 59 recovery slogans are intervention assets**, linkable to identified
   strengths, goals, barriers, assessment results, wellness domains, and
   recommended actions — not static content.
5. **Recommendations must be explainable** from the underlying participant
   data. Every adaptive response can answer "Why am I seeing this?" in plain
   language.
6. **Data provenance stays distinguishable** at all times among: self-reported,
   validated instrument, observed engagement, staff-entered, and
   system-generated inference.
7. **Inferences are labeled as inferences.** Never presented as diagnoses,
   verified facts, or clinical conclusions.
8. **Participant agency, consent, privacy, dignity, and nonclinical boundaries
   govern the entire workflow**, and outrank any analytic ambition.
9. **"What is the most loving next step?"** is the governing design test for
   Respond and Empower. A screen that ends in "thanks for checking in" fails it.
10. **"Connection Prevents Crisis"** means connection is simultaneously an
    outcome signal and a core intervention — it is measured _and_ offered.
11. **`gfa_icare.icare_plans` / `icare_steps` are evidence of intended
    architecture.** Schema changes are additive and migration-safe; the legacy
    structures are not destroyed.

## Consequences

- The daily check-in is implemented as one ICARE cycle rather than a form:
  Identify (pulse) → Connect (slogan/practice/person) → Assess (rules against
  history) → Respond (encouragement, resource, or Support Now) → Empower
  (intention or next step). See `docs/architecture/recovery-pulse.md`.
- A participant-facing composite recovery score is prohibited (principle 7 +
  8). Trajectory work, when it comes, is for staff and aggregate reporting and
  is explicitly a novel, unvalidated instrument — BARC-10 remains the validated
  measure.
- Inference-bearing UI carries a "Why am I seeing this?" affordance.
- Any feature review may be rejected on ICARE-mappability grounds alone.

## Alternatives considered

- **ICARE as five assessment domains** — rejected: contradicts the owner's
  specification and the live schema, and would have produced a second scoring
  instrument competing with BARC-10.
- **Leaving ICARE undefined** — rejected: the absence of this document is
  exactly how the misinterpretation entered the codebase.
