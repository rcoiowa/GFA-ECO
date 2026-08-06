# The slogan-to-everything chain

A slogan is the join between what a person reported today and everything else
the system knows about them. That is what makes the 59 an engine rather than a
content library.

```
challenge chip ──► wellness domain ──┐
ICARE stage ─────────────────────────┼──► ranked slogans ──► commentary
Enneagram type + context + weight ───┤                       practice
VIA character strengths ─────────────┘                       reasons ("why am I seeing this?")
```

`recommendSlogans()` in `packages/recovery-content/src/recommend.ts`.

## What each link contributes

| Signal          | Source                                   | Points                    |
| --------------- | ---------------------------------------- | ------------------------- |
| Wellness domain | Check-in challenge chip → SAMHSA domain  | 3                         |
| ICARE stage     | Which stage of the cycle is being served | 2                         |
| Enneagram       | 180 slogan↔type mappings, weight 1–5     | weight × context modifier |
| VIA strength    | 177 strength mappings with rationale     | 1 each                    |
| Recently seen   | The participant's own history            | −12                       |

Context modifiers: `core` 1.0, `growth` 0.8, `stress` 0.8, `wing` 0.6 — a
slogan written _for_ someone's type outranks a stretch.

Every match returns `reasons[]` in plain language, assembled from the signals
that actually fired: _"You named cravings today, and this practice works in the
emotional area of life."_ Nothing is inferred from free text (ADR-0015
principles 5–7); the engine is deterministic, so identical input always
produces identical output — which the tests assert.

## Sources

| Layer                                             | Source                             | Status                       |
| ------------------------------------------------- | ---------------------------------- | ---------------------------- |
| Slogans, commentary, practice, VIA, phase, domain | `GFA_59_Slogans_Final.md` (master) | Imported in full             |
| Enneagram structure                               | `GFA_Enneagram_Slogan_Map.pdf`     | Imported (180 mappings)      |
| Enneagram notes                                   | same PDF                           | **Not imported** — see below |

The master document settles the tagging question left open in ADR-0016: its
ICARE phases are explicitly "rebalanced across all five phases"
(12/12/12/12/11), unlike the book's arc-derived tagging. The importer asserts
that distribution, so a source edit cannot silently skew the engine.

**The Enneagram recommendation notes are not imported.** The PDF's text runs
concatenate without spaces at line breaks (_"the fourth foundation waswritten
for you"_), and guessing word boundaries in participant-facing copy is not
acceptable. The structural mapping — type, weight, context — extracts exactly
and is what the engine runs on. A markdown export of that document, like the
one that exists for the slogans, drops the notes in without rework.

## Coverage gaps, stated rather than hidden

Slogans are tagged across seven of the eight SAMHSA domains:

| Domain        | Slogans |
| ------------- | ------- |
| Emotional     | 19      |
| Intellectual  | 15      |
| Spiritual     | 12      |
| Social        | 7       |
| Occupational  | 3       |
| Physical      | 2       |
| Environmental | 1       |
| **Financial** | **0**   |

Consequences for barrier matching:

- **Cravings, Mental health** (Emotional) and **Family, Relationships,
  Childcare** (Social) match well.
- **Housing, Transportation, Court** all funnel to the single Environmental
  slogan.
- **Finances matches nothing.** `recommendSlogans` returns an empty list rather
  than substituting an unrelated practice; the caller falls back to the daily
  slogan. Closing this is a content decision — write or retag — not a code one.

Also noted: slogan 17 is tagged `Spiritual` in its own entry and `intellectual`
in the trailing seed table. The per-entry tag wins on import.

`domainCoverage()` returns these counts at runtime, and a test asserts them, so
content changes that close the gap are noticed immediately.

## Where it plugs in

Connect and Respond in the Recovery Pulse are the natural mounting points
(`docs/architecture/recovery-pulse.md`): the check-in already collects the
challenge chips and knows which ICARE stage it is in. Enneagram type is
optional and only used when a participant has chosen to share it.

Still to build: the slogan UI (library, flashcards, daily card) rebuilt on
`@recoveryos/ui`, persistence of slogan practice and resonance, and the
"sit with this for 7 days" active-slogan behavior.
