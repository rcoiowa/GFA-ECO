# Review — "The Recovery Ecosystem Operating System" blueprint vs. the live platform

Owner uploaded the 75-page "OS Bible" (2026-08-06) asking how it can improve
the app **without overcrowding or breaking what works**. Full feature digest
on file; this is the disposition. Precedence note (directive §3): this is a
vision document — it ranks below verified production architecture; it
inspires, it does not override.

Provenance: the file is a concatenation of several AI-chat-generated
editions (blueprint, master spec, branding, diagrams, epics) with repeated
content, chat artifacts, and internal contradictions (e.g., "not points,
not dopamine hacks" beside Grace Points, streaks, badges, and levels;
"never exploit behavioral vulnerability" beside "TikTok-level engagement…
emotional dopamine loops"). Read as a mood board with some genuinely
excellent ideas — not a build order.

## Already built (the doc validates the current direction — no action)

BARC-10 baseline + trajectory (no scores-as-judgment framing) · ICARE as
the canonical care cycle (ADR-0015) · daily check-in loop (Recovery Pulse
V1) · the 59 slogans wired into check-ins (ADR-0016) · person-first,
shame-free language discipline (docs/language-guide.md) · Supabase Auth +
RLS · granular consent (ADR-0009) · Support Now on every screen · recovery
capital dashboard · resource navigation basics · residence directory +
application. The blueprint and the platform clearly share DNA; most of its
Phase-1 core exists in tested form.

## ADOPT — small, additive, high warmth-per-line-of-code

1. **Microcopy pass (its best material).** The voice examples are superb
   and cost nothing structurally: "Let's take a moment to check in with
   where you are" over "Complete your assessment"; "Your experience
   shifted — let's explore what that means" over score-drop language.
   Apply across Today, check-in, assessments, errors, and empty states.
2. **Ambient daily slogan on Today.** Slogans are already in the check-in
   chain; also surface one quietly on the Today page (non-modal, ambient).
3. **Warmer onboarding arc.** First-name-first welcome, "What brings you
   here today?" with three gentle options, and the **WHY Seed** question —
   one nullable profile field + copy, enriching the existing flow. The WHY
   statement then has a home in My Recovery.
4. **SOS presentation softening.** Keep Support Now exactly where it is
   and keep 988/emergency FIRST (see rejects), but adopt the calm visual
   treatment: soft overlay, no alarm-red, grounding language, warm exit.
5. **Design warmth via tokens.** Selected Cosmic Grace sensibilities —
   warm gold accent, gentle motion (slow ease, no bounce), rounded
   iconography — as token-level adjustments to the existing design system,
   not a rebranding project.
6. **Milestone celebration, effort-framed.** Recovery anniversaries and
   milestone recognition in My Journey — celebration without streaks or
   points (maps to the existing Walls of Honor backlog item).
7. **Coach message tone guidelines** → fold into the language guide now so
   the Phase-9 coach workspace inherits them.

## ROADMAP — good ideas, wrong time (adding now = overcrowding)

- Coach workspace (roster, connection log, milestone feed) — already the
  platform's next phase; the doc's module list is a useful reference.
- Community groups / chat / voice — real ambition, real infrastructure;
  after the coach phase, with moderation designed first.
- Location-aware resource finder with map — extend the existing Resources
  page when there's data to power it.
- The hallway/rooms spatial metaphor — charming as an OPTIONAL immersive
  layer someday (progressive enhancement, full 2D parity per the
  accessibility rules); never as the primary navigation. The route-based
  experience works, is accessible, and ships.
- Grace AI — when built: one Claude-based advisory service per the
  standing Grace AI boundary (educate, encourage, organize, hand off to
  humans). The doc's context-personalization ideas (time of day, recent
  goals) are good input for that future design.

## REJECT — would break what works, or is unsafe

1. **Crisis line demoted below AI.** The doc's SOS flow presents Grace
   first, a peer second, and the crisis line "only after A or B." No. 988
   and emergency services stay first and unmissable; an LLM is never the
   front line of a crisis. (Current Support Now already does this right.)
2. **AI crisis follow-ups, "suicide routing," "de-escalation scripts."**
   Clinical-adjacent roles for a nonclinical companion. Human escalation
   only; Grace may encourage connection, never perform crisis care.
3. **Surveillance-shaped "care": auto-flags on 48h no-login / BARC drop >5
   / AI-generated participant summaries for coaches.** As specced, this is
   monitoring without consent architecture. Anything like it must be
   participant-visible, consent-first, opt-in — designed later, carefully.
4. **Streaks, Grace Points, badges, levels, impact scores.** Directly
   contradicts the platform's own rule ("your practice rests today," never
   streak-broken shame) and the doc's own ethics section. Celebrate
   milestones and anniversaries; skip the point economy.
5. **TikTok-style engagement loops.** The product's success metric is
   connection and stability, not session time.
6. **The parallel tech stack** (Flutter, NestJS, AWS/Cognito, Pinecone,
   Elasticsearch, multi-model OpenAI+Gemini routing). The locked direction
   is React/Vite/Supabase/Cloudflare/Anthropic. Rebuilding infrastructure
   to match a vision doc is how this project got five builds in the first
   place.
7. **"Schema Therapy–inspired" Pattern Room.** A clinical-modality claim
   inside a nonclinical product. Reflective journaling and trigger
   awareness can exist without borrowing clinical branding.
8. **"HIPAA-aware" posture.** Vague. The real posture is already stronger:
   RLS, consent ledger, minimization, and the privacy gate.

## Suggested first slice (one small gate)

Items 1–4 of ADOPT: microcopy pass + ambient slogan + WHY Seed + Support
Now softening. Copy-and-token work, no schema beyond one nullable column,
no new routes — visible warmth with zero risk to the working flows.
