# ADR-0012 — Canonical residence document library as code

**Status:** accepted (2026-07-30)

## Context

NARR 3.0 Level II certification and the Iowa HHS Recovery Housing
Checklist require a complete written document set — resident agreement,
rights, policies, forms — that residents sign at move-in and that the
operator produces as certification evidence. These documents must stay in
lockstep across three surfaces: the in-app signing flow, printable
packets/binders, and the database's signature records. They must also obey
the platform's language standard (person-first, trauma-aware,
neuro-informed, grace-based — `docs/language-guide.md`).

## Decision

The documents are **authored once, as versioned TypeScript modules** in
`packages/residence-content` (typed metadata + markdown body + NARR/Iowa
compliance references). Everything else is generated:

- `pnpm generate:residence-docs` emits `supabase/seed/documents_seed.sql`
  (idempotent upserts into `document_templates`/`document_versions`) and
  the printable set in `docs/residence-documents/`.
- The app renders the same package directly for the document library, and
  uses DB rows only for signature state (`document_assignments`, via
  `ensure_my_document_assignments()` + a self-acknowledge RLS policy,
  migration 0013).
- Document bodies are immutable per version; changing a document means
  bumping its `version`, which re-assigns signatures where required.

## Consequences

- One source of truth; no drift between what a resident signed, what's
  printed, and what certification reviewers see.
- Content changes are code-reviewed, including language-guide review.
- Generated files are committed but never hand-edited.
- Residence-specific facts (fee amounts, times, addresses) remain fill-in
  fields on the printed/signed copies until a per-residence configuration
  layer lands (future phase); the canonical text stays org-wide.
