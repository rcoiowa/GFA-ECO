# ADR-0013: Recovery Residence is a separate housing platform (R-01a)

**Status:** Superseded by ADR-0014 (same day) · **Date:** 2026-08-04 · **Amends scope of:** ADR-0010/0011 phases 4–8

> Superseded: the owner clarified that §4.6's separation requirement was
> generated text, not a settled decision, and chose one platform with
> domain-scoped front doors. See ADR-0014.

## Context

The RecoveryOS Master Directive (2026-08-04, §4.6) assigns housing
operations to a separate entity and system (Solid Ground Housing Group,
LLC or the owner-approved housing entity), with RecoveryOS owning only a
consent-mediated bridge. This conflicted with built reality: phases 4–8
put a full housing-operations suite (beds, waitlist, applications, fees,
screenings, incidents, passes, chores, grievances, NARR/Iowa compliance)
inside this repository and the canonical Supabase project (R-01 in the
Decision and Reconciliation Register). The "Recovery Residence — Universal
Recovery Housing Platform" prototype demonstrated the housing product as
its own universal offering for any operator.

## Decision

Owner approved **R-01(a)** in writing (2026-08-04, working session):

1. **Recovery Residence** becomes a separate, universal housing platform —
   its own repository, its own Supabase project, targeting the
   `recoveryresidence.app` domain — seeded by the prototype's UX (the
   canonical spec at `sites/gfa-vrcc-residence/index.html`) and using this
   repo's housing-ops code and schema as donor material.
2. **RecoveryOS keeps only the §4.6 bridge**: residence discovery
   (`/recovery-residences`), eligibility information, referral initiation
   with participant-controlled consent, consent-mediated handoff, and
   limited referral status. Shared recovery-support services stay in
   RecoveryOS.
3. **Boundary rules** (restating §4.6 as repo law): housing operational
   records — occupancy, beds, admissions, fees, screenings, incidents,
   grievances, passes, house compliance — live only in Recovery Residence.
   BARC-10 records, reflections, coaching notes, and journals never cross
   the bridge.

## Consequences

- The `residence-application-flow` branch's directory + referral surfaces
  are bridge-scoped and stay; its operator onboarding (migration 0019,
  `/recovery-residences/list-your-residence`) and full application intake
  belong to Recovery Residence and will migrate there. Migrations
  0018–0019 remain **unapplied** to the canonical project.
- Existing housing-ops pages, packages, and schema in this repo are
  frozen as donor material — no new housing-ops features here, and no
  destructive removal until Recovery Residence is live and the carve-out
  runs under §4.2 (dependency audit, rollback, owner authorization).
- RecoveryResidenceOS repo's migration CI must be frozen (R-06); its
  features disposition into Recovery Residence.
- Execution plan: `docs/discovery/r01a-separation-plan.md` (gated RR-0…RR-5).
