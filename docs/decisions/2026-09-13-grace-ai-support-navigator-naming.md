# Grace role naming decision — AI Support Navigator

- **Decision date:** 2026-09-13
- **Decision owner:** Thomas, Executive Director
- **Status:** Ratified
- **Canonical product identity:** Grace
- **Canonical formal role:** AI Support Navigator
- **Canonical full display name:** Grace — AI Support Navigator
- **Canonical short reference:** Grace

## Decision

Retire “Grace Companion,” “Grace AI Companion,” “Grace — Peer Companion,” “peer companion,” “AI peer companion,” “AI peer-support companion,” and “AI recovery companion” as current human-facing role or product labels.

Use **Grace — AI Support Navigator** where the full identity is needed, **AI support navigator** as the role descriptor, and **Grace** in ordinary short-form references.

Human roles remain distinct and unchanged: **Peer Recovery Coach**, **Recovery Ally**, and **Recovery Navigator**. Grace must never be described in a way that implies lived experience, licensure, clinical authority, or human identity.

## Canonical participant disclosure

> I’m Grace, an AI support navigator—not a human peer, counselor, or crisis service. I can help you slow things down, explore your options, find recovery supports, and choose whether to connect with a real person. You remain in control of what you share and what happens next.

## Scope and non-effects

This is a naming-only decision. It does not change:

- the active `ai_features` consent requirement;
- stateless V1 behavior or the prohibition on persistent transcripts and hidden memory;
- the prohibition on psychographic profiling, hidden risk scoring, passive monitoring, silent alerts, or autonomous escalation;
- participant-controlled connection to real people and the independence of Support Now;
- RLS, permissions, privacy, auditability, data retention, or staff access;
- schemas, migrations, routes, API contracts, Edge Function slugs, database identifiers, analytics keys, or deployment state.

Historical audits may retain prior wording as quoted evidence. Stable technical identifiers may retain legacy strings until a separately approved compatibility migration exists. Those occurrences must not be treated as current participant-facing terminology.

## Implementation boundary

Apply the new name to participant-facing UI, accessibility labels where the role is stated, current documentation, policy/system identity text, tests, evaluations, and training or partner-facing materials. Keep the change isolated from infrastructure PR #7. Do not deploy or merge as part of this decision record.
