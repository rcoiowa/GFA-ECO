> **Historical terminology notice (2026-09-13):** "Companion"-based Grace labels and identifiers below are preserved as dated evidence. The current canonical identity is **Grace — AI Support Navigator** (`docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`).

# Component Preservation List

The strongest implementations identified for extraction, by category. Source paths are
under `source-builds/` (gitignored intake clones).

## Data / domain logic (strongest overall: Recovery Residence OS)

- `recovery-residence-os/supabase/migrations/*` — policy engine, documents & signatures,
  residence operations, function hardening, house board. The most disciplined schema
  work in any source build; primary input for Phase 8 reconciliation with the canonical
  target model.
- `recovery-residence-os/src/policy/` — client-side policy mirror.
- Live-DB `gfa_ui` consent_records design (insert-only, 42 CFR-style) — matches
  canonical ADR-0009; carries real history to migrate.

## Recovery tools

- `vrcc-current/src/mvp/Barc10.jsx` — working BARC-10 instrument flow.
- `vrcc-current/src/mvp/SupportNow.jsx` — prior Support Now; compare escalation copy
  against canonical `packages/safety` ladder during content review.
- `contact-connect-dashboard/src/pages/DailyCheckIn.jsx`, `GoalsMilestones.jsx`,
  `Referrals.jsx` — strongest participant-facing workflow UX of the Base44-family
  builds.

## Experiential design (GFA Connection)

- Virtual-building orientation concepts: lobby arrival, front desk (guided support),
  kiosk (self-service), basement (Recovering the Mind), garden (recovery capital
  growth), Des Moines neighborhood (local resources), Walls of Honor.
  Preserved as design language and an optional orientation layer — not literal
  primary navigation.
- Voice: "A place — not an app", "Connection Prevents Crisis",
  "No Shame. No Stigma. Just Grace."

## Grace House brand & content (grace-harbor-16)

- About / Services / Contact copy for the public residence page.
- GraceCompanion interaction patterns for the shared Grace AI surface.

## Explicitly not preserved as-is

- Base44 SDK dependence (`@base44/sdk`) — retired with the legacy page set.
- The ~60-page equal-weight navigation of legacy vrcc.app.
- Gamification/team-challenge mechanics pending feature governance (engagement-pattern
  and dignity review).
