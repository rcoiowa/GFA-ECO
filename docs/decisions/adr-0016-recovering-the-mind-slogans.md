# ADR-0016: _Recovering the Mind_ is the canonical slogan source

Status: Accepted (2026-08-05). **Tagging question resolved 2026-08-05** by
the master source document — see the amendment at the end.

## Context

The 59 recovery slogans exist in three places:

1. **The book** — _Recovering the Mind: 59 Practices for Hope, Healing, and
   Transformation_ © 2026 Thomas DeGarmeaux and Grace For Addictions
   (`docs/source-documents/recovering-the-mind/`). Authored source; carries
   full commentary and a concrete practice for every slogan.
2. **`gfa_slogans_seed.sql v1.0`** — a prior SQL seed (59 slogans, 118 wellness
   domain mappings, 177 VIA strength mappings). Only its summary viewer was
   available; commentaries in it are truncated and practices are absent.
3. **Base44 components** (`SloganLibrary`, `SloganFlashcardDeck`,
   `DailySloganModal`) reading a `slogansData.js` this repo does not have.

ADR-0015 principle 4 commits to slogans as intervention assets linkable to
strengths, goals, barriers, assessments, domains, and actions. Every slogan is
already tagged with an ICARE phase — independent corroboration that ICARE is
the five-stage workflow, not a domain model.

## Decision

**The book is the canonical source for slogan text, commentary, practice,
lead-in points, theme, and the seven-movement structure.** It is imported
verbatim by `scripts/import-slogans.py` into
`packages/recovery-content/src/slogans.generated.ts` — generated, never edited
by hand — following the same pattern as the Grace House document library
(ADR-0012).

The importer asserts on import: exactly 59 slogans, contiguous numbering 1–59,
and a non-empty phase, commentary, and practice for every one. 13,542 words of
commentary imported.

**Attribution stays visible wherever slogans are displayed.** The book is
"all rights reserved"; it is used here by its author within GFA's own platform.
`SLOGAN_ATTRIBUTION` is exported for that purpose.

## Open question: which tagging governs matching

The book and the prior seed disagree on ICARE phase and/or wellness domain for
**41 of 59 slogans** (`docs/content/slogan-tagging-comparison.md`).

| Phase    | Book | Prior seed |
| -------- | ---- | ---------- |
| Identify | 1    | 11         |
| Connect  | 8    | 12         |
| Assess   | 6    | 13         |
| Respond  | 11   | 12         |
| Empower  | 33   | 11         |

This is not a data error — the two answer different questions:

- **The book tags by position in its arc.** Phase is inherited from the seven
  movements, and Points Six and Seven are both Empower, so 33 slogans land
  there. It describes _where in the journey_ a slogan sits.
- **The seed tags by function**, evenly balanced 12/12/12/12/11. It describes
  _which ICARE stage a slogan serves_.

For a matching engine the book's distribution is unusable on its own: a
majority of slogans would surface only in Empower, and Identify would have a
single slogan. The seed's balance looks like a deliberate correction.

**Therefore:** the book's tagging is stored as `icarePhase` (canonical, the
journey position). A separate matching tag is required before slogans are
surfaced by ICARE stage, and it must be an explicit product decision by the
author — not inferred by this codebase. Until that decision, slogans surface by
**wellness domain and theme**, which both sources largely agree on and which
map directly onto the check-in's challenge chips.

## Consequences

- `packages/recovery-content` is the home for VRCC content (slogans now; Brain
  Atlas, Training the Mind, and Tapes We Carry later).
- The Base44 components are a design reference only — different stack
  (framer-motion, shadcn, react-query, base44 SDK). Content and data model
  port; components get rewritten against `@recoveryos/ui`.
- Two carried-over decisions when slogan UI is built: standardize resonance on
  the 1–5 scale used everywhere else (the old modal used 1–10), and treat
  "share to community" as per-item opt-in routed to the existing house board —
  never a default, consistent with the Recovery Pulse privacy posture.
- The book's faith framing is GFA's own. The legacy database already carries an
  `add_faith_reframe_column` migration, indicating an intended toggle; honor it
  rather than stripping or hard-coding either framing.

## Amendment (2026-08-05): the master source settles it

`GFA_59_Slogans_Final.md` arrived and describes itself as "the master source
document for GFA's 59 Recovery Slogans... simultaneously the published book,
the peer coach training curriculum, and the VRCC database seed specification."
It supersedes both the print book and the earlier SQL seed, and it states the
tagging decision outright: **ICARE phases "rebalanced across all five phases"**
— Identify 12, Connect 12, Assess 12, Respond 12, Empower 11.

That is the functional tagging the engine needs, authored deliberately. The
importer now reads this document and **asserts the distribution**, so a source
edit cannot silently reintroduce the skew.

It also supplies what the book did not: a condensed, Grace-ready
commentary per slogan, and **177 VIA character-strength mappings with
rationale** — matching the count the seed specification predicted.

The Enneagram layer (`GFA_Enneagram_Slogan_Map.pdf`) adds **180 slogan↔type
mappings** with relevance weights and contexts, covering all 59 slogans across
all 9 types. Together these form the chain documented in
`docs/architecture/slogan-chain.md`.

Two content findings are recorded rather than silently patched: no slogan is
tagged `Financial` (so the "Finances" barrier chip matches nothing), and slogan
17's own entry disagrees with the trailing seed table on its domain. Both are
content decisions for the author.
