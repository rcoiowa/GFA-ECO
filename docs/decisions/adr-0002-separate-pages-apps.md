# ADR-0002: Separate Cloudflare Pages projects per experience

**Status:** SUPERSEDED by ADR-0010 (2026-07-29) · **Date:** 2026-07-29

## Context

Experiences could ship as one bundle with route prefixes (`vrcc.app/residence`, …) or as
separate deployments per subdomain.

## Decision

One Cloudflare Pages project per experience (`vrcc.app`, `residence.vrcc.app`,
`staff.recoveryresidence.app`, …), all consuming the same workspace packages.

## Rationale

- Bundle size: participants never download staff tooling.
- Role exposure: a staff-only surface is not even present in the participant bundle.
- Release cycles: residence operations can ship without re-releasing the participant app.
- Reasoning about permissions per surface stays simple.

## Consequences

Cross-experience navigation is by absolute URL. Shared session works because all apps use
the same Supabase project; cookie/session domain configuration is a Phase 8 checklist item.
