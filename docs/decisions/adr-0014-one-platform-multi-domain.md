# ADR-0014: One platform, domain-scoped front doors

**Status:** Accepted · **Date:** 2026-08-04 · **Supersedes:** ADR-0013

## Context

ADR-0013 (earlier the same day) approved carving Recovery Residence out
into a separate repository and Supabase project, implementing §4.6 of the
Master Directive. The owner then clarified three facts that invalidate
that reading:

1. The directive's HousingOps-separation clause was **generated text, not
   a settled organizational decision** — there is no operating separate
   housing entity today.
2. The near-term goal is **Grace House working end-to-end** (find → apply
   → accept → bed → onboarding), not standing up a second platform.
3. The intended shape is **vrcc.app as the hub** with each experience
   _also_ reachable directly on its own domain for people who don't come
   in through the hub: `vrcc.app`, `recoveryresidence.org`,
   `recoveryresidence.app`, and a Grace House landing.

Splitting repos/databases would double the operational surface (two auth
systems, two person models, a consent bridge) for a small organization,
and would delay the Grace House goal. Extraction from a well-bounded
module later is cheap; premature separation is expensive daily.

## Decision

1. **One repository (GFA-ECO), one Supabase project, one deployment** —
   ADR-0010's route-separated platform stands. Recovery Residence is a
   **bounded experience inside the platform**, not a separate system: the
   `/recovery-residences/*` public surfaces plus the staff housing-ops
   area, progressively adopting the prototype's UX (triage dashboard,
   check-in flag loop, admit-from-waitlist, furlough lifecycle) and its
   visual identity/tone.
2. **Domain-scoped front doors on the same deployment.** The platform
   Worker gets multiple custom domains; the SPA selects its front door by
   hostname:
   - `vrcc.app` → community-center landing (hub)
   - `recoveryresidence.org` → public housing directory (`/recovery-residences`)
   - `recoveryresidence.app` → operator entrance (`/recovery-residences/list-your-residence`)
   - Grace House landing → `/recovery-residences/grace-house` (vanity
     domain or subdomain = pure redirect; gracehouse4.pages.dev remains
     the document set until the portal library is primary)
3. **Boundary discipline is kept in software, not infrastructure**: the
   residence experience keeps its own route subtree, RLS scope
   (`staff_residence_ids()`), and schema tables, so a future extraction
   (if a separate legal entity becomes real) is a module lift, not a
   rewrite. §4.6's data rules still apply as policy: coaching notes,
   BARC-10, and journals never render in residence-staff surfaces.
4. Migrations 0018–0019 are **cleared for application** once database
   access exists (they are additive and now boundary-consistent).

## Consequences

- `docs/discovery/r01a-separation-plan.md` is superseded; its RR-3 engine
  list survives as the feature backlog for the in-platform residence
  experience.
- RecoveryResidenceOS repo: still freeze + fold in (unchanged from R-06).
- The critical path to the owner's goal is now: merge branches → establish
  `main` + CI → apply 0018–0019 → deploy platform to staging → bind
  domains → cut over vrcc.app (Phase 14 checklist).
