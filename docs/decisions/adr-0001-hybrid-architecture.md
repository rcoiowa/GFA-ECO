# ADR-0001: Hybrid architecture — shared foundation, separate experience shells

**Status:** Accepted · **Date:** 2026-07-29

## Context

RecoveryOS serves at least seven audiences (participants, residents, staff, coaches,
navigators, admins, future partners) whose responsibilities must remain distinct while
their underlying services (identity, consent, recovery engines, analytics) must be shared.
Prior GFA applications suffered from a single oversized dashboard and duplicated features.

## Decision

Build one shared platform (Supabase schema, `packages/*` engines, design system, Worker
gateway) with a separate lightweight app shell per experience. Shells own navigation,
theming, and page composition only. Engines and data access are canonical and shared.

## Consequences

- No experience can quietly accumulate another experience's features.
- New experiences are cheap: a shell is nav + pages over existing packages.
- Requires discipline: any logic appearing in two shells must move to a package.
