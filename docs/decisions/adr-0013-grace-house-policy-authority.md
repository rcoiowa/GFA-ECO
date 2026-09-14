# ADR-0013: Grace House documents are the policy authority

**Status:** Accepted · **Date:** 2026-08-02

## Context

The owner supplied the complete Grace House document set (20 documents, indexed
at `docs/content-intake/grace-house/INDEX.md`): operational system, resident
handbook, participant agreement, intake forms, and the policy suite (conduct,
ethics, curfew/pass, screening, MAT/MOUD, fees, incidents, grievance, emergency,
return-to-use, exit, good neighbor, NARR II/HHS alignment, partner program).

## Decision

These documents are the **authority** for residence behavior in the platform.
Where the build previously guessed, it now follows policy:

1. **Support Now** contacts are the verified GFA office (515-220-8771) and
   warmline (515-310-DIAL / 3425), closing the ADR-0007 placeholder gap.
2. **Phase model** (migration 0016): `residencies.phase` 1/2/3 drives curfew
   ceilings and screening cadence per GH-CURFEW-001 v3.0 and the screening
   policy — replacing the per-residence fixed curfew. Policy values live in
   `packages/domain/src/residence/phases.ts` so resident and staff surfaces can
   never disagree. `employment_curfew_exceptions` models the single permitted
   exception (verified work schedule on file with the House Manager).
3. **Resident Rights & Responsibilities v2.0** replaces the placeholder draft,
   seeded verbatim from the Operational System, including the external
   advocacy contacts (Iowa Civil Rights Commission, Iowa Protection & Advocacy,
   HUD Fair Housing) and the no-retaliation guarantee.

## Language commitments taken from policy

- A **return to use is a medical and recovery event**, not a moral failure and
  not automatic discharge. Product language and staff workflows must offer
  individualized support pathways, never a punitive default.
- **MAT/MOUD is fully supported** and never a barrier to admission; no surface
  may disparage it or treat it as a compliance exception.
- Fees are a **program participation fee model**, explicitly not
  landlord-tenant. Financial screens must not use lease/rent framing.
- Admissions outcomes are **admit / waitlist (numbered) / refer**, Fair Housing
  Act compliant, with two eligibility pathways (recovery and family).

## Consequences

The `VRCC_RecoveryResidence_Hub_IntegrationPlan` document is treated as a guide
only, per the owner: its schema and current-state claims are not authoritative
and do not override the canonical model in `supabase/migrations`.
