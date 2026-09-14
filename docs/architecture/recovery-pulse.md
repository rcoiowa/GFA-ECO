# Recovery Pulse — Layer 1 (V1)

The daily check-in implemented as one ICARE cycle (ADR-0015), not a form.

| ICARE stage  | In the check-in                                                                          |
| ------------ | ---------------------------------------------------------------------------------------- |
| **Identify** | Mood, craving, and the period-appropriate readings; challenge chips                      |
| **Connect**  | Offers a person or practice when the rules call for it (warmline, 988, grounding)        |
| **Assess**   | Deterministic rules compare this entry to the participant's own recent entries           |
| **Respond**  | An explainable message, a support pathway on elevated risk, or an invitation to say more |
| **Empower**  | Morning intention; evening reflection and one thing to carry into tomorrow               |

## What is asked, and when

Split by time-orientation so nothing is asked twice or asked when it makes no
sense. Forward-looking readings belong to the morning; retrospective ones to
the evening.

**Morning** — mood, craving, hope, confidence ("next healthy step"), purpose
("something worth showing up for today"), one intention, optional challenge
chips, and one rotating 2×2 prompt.

**Evening** — mood, craving, meaningful connection experienced today, the
reflection paired to the morning prompt, and an optional carry-forward.

All scales are five labeled options; the ordinal 1–5 is what is stored, so
historical trends stay continuous with pre-existing check-ins.

## The 2×2 prompt

Hope/thankfulness × agency/acceptance (`packages/domain/src/pulse/prompts.ts`).
`selectQuadrant(personId, localDate, skips)` is a stable per-person, per-day
hash: refreshing the page never rerolls the question, and "Ask me something
different" advances `skips` without repeating a declined prompt. The evening
reuses the morning's quadrant so intention and reflection close the same loop.

**The quadrant is recorded from the prompt we chose — never inferred from what
the participant wrote.** No text classification is performed on reflections.
That keeps the agency/acceptance data perfectly clean and keeps private
disclosures un-analyzed (ADR-0015 principles 6 and 7).

## Routing (state-aware)

`routePulse()` in `packages/domain/src/pulse/routing.ts`. Participant-day
boundary is `America/Chicago`; the evening threshold defaults to 17:00 and is
a parameter.

| Situation                            | Mode                  |
| ------------------------------------ | --------------------- |
| First check-in, before the threshold | `morning`             |
| A second check-in                    | `evening`             |
| First check-in, after the threshold  | `evening_streamlined` |
| Morning and evening both recorded    | `complete`            |

A late first check-in is never asked for a retroactive intention. Every mode
carries a plain-language `reason`, surfaced by "Why am I seeing this?".

## Decision rules

`evaluatePulseResponses(current, previous, priorConnection)` in
`packages/domain/src/pulse/rules.ts`. Deterministic, no model, reads only the
participant's own data, and every response carries a `because` string naming
the exact inputs that triggered it.

| Rule               | Fires when                                | Response                                  |
| ------------------ | ----------------------------------------- | ----------------------------------------- |
| `risk_support_now` | mood ≤ 2 **or** craving ≥ 4               | Support Now pathway (warmline, 988)       |
| `hope_drop`        | hope fell ≥ 3 since the last entry        | "Would you like to tell us what changed?" |
| `mood_drop`        | mood fell ≥ 2 since the last entry        | "What happened?"                          |
| `steady`           | mood ≥ 4 now and ≥ 4 previously           | Names the steadiness; asks what helped    |
| `craving_rise`     | craving rose ≥ 2                          | Offers a grounding practice               |
| `connection_gap`   | "Not today" for connection twice in a row | Offers connection, not an alarm           |

Risk is surfaced **live, before submission**, and again after — elevated risk
is never recorded silently or answered with a generic acknowledgment. Which
rules fired is stored in `response_rule_ids` for later evaluation.

## Schema (migration 0023, applied live 2026-08-04)

Additive to `check_ins`; every column is nullable or defaulted, so existing
rows stay valid: `period`, `local_date`, `hope_rating`, `confidence_rating`,
`purpose_rating`, `connection_level`, `intention`, `reflection`,
`carry_forward`, `challenge_tags`, `prompt_quadrant`, `prompt_response`,
`prompt_skips`, `paired_check_in_id`, `response_rule_ids`.

`check_ins_person_day_period_uidx` enforces one morning and one evening per
participant-day. Amendments would be an explicit product decision, not an
accident of double-tapping submit.

### Privacy

The prior blanket staff policy (`check_ins_staff`) is replaced by
`check_ins_staff_ratings` plus the `check_ins_staff_view` view, which exposes
completion, ratings, connection level, and challenge tags — and **excludes
`intention`, `reflection`, `carry_forward`, and `prompt_response`**. Staff
tooling must read the view. Any future sharing of reflection text requires
explicit, granular, revocable participant consent.

## Acceptance criteria

- [x] Morning and evening forms differ, and match the lists above
- [x] Participant-day boundary is `America/Chicago`, not UTC
- [x] Evening threshold defaults to 5 PM and is configurable
- [x] Late first check-in gets the streamlined evening, no retroactive intention
- [x] Duplicate morning/evening submissions are rejected by a unique index
- [x] Labeled options stored as 1–5 ordinals
- [x] "Ask me something different" rotates without repeating
- [x] Evening pairs to the morning via `paired_check_in_id`, and shows the
      morning intention back to the participant
- [x] Elevated risk surfaces Support Now inline and after submit
- [x] Every adaptive message answers "Why am I seeing this?" from real inputs
- [x] Reflection text is excluded from the staff view
- [x] No participant-facing composite score anywhere
- [x] Each check-in returns something: a response, encouragement, or a next step

## Tests

`packages/domain/src/pulse/pulse.test.ts` — 23 tests, `pnpm test`. Covers the
timezone day boundary (including a UTC date that is the previous local day),
every routing branch, rotation stability and cycling, each decision rule, rule
determinism, and that every response is explainable. The pure logic lives in
`packages/domain` precisely so it is testable without a database or a browser.

## Migration strategy

1. Migration 0023 applied live and smoke-tested in a rolled-back transaction:
   morning + evening pairing, duplicate rejection, and staff-view column
   exclusion all verified.
2. Legacy rows keep working — `period` and `local_date` are null for them, so
   they simply do not participate in per-day routing.
3. `createCheckIn()` is retained for backward compatibility; new writes go
   through `submitPulseCheckIn()`.
4. Rollback is `drop`ping the added columns and restoring the previous
   `check_ins_staff` policy; no existing data is transformed or destroyed.

## Open analytics requirement — hope vs. purpose

Hope and purpose may measure the same construct. Before either is removed:
collect an **adequate sample size**, run a **repeated-measures analysis** (not
a single cross-sectional correlation), review **missing-data patterns**, and
record an **explicit product decision**. Instrument changes are never made on a
fixed calendar interval.

## Deferred

Recovery Memory, broader withdrawal-pattern detection, Layer 2 rotations
(ICARE-stage, recovery-capital, slogan, and stage-based prompts), and any
Recovery Trajectory Index — all wait until this data model and the consent
architecture are stable.
