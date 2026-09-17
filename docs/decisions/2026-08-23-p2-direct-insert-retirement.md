# Executive Decision — P2 Direct-Insert Retirement Gate

**Date:** 2026-08-23  
**Status:** RATIFIED — current explicit executive decision  
**Scope:** P2 service-event participant self-record cutover only

## Decision

The P2 requirement to observe **14 consecutive days of zero participant direct inserts** before applying migration `0137_self_insert_retirement` is superseded.

Migration 0137 may proceed immediately once the replacement RPC path and existing P2 controls are verified and the live CQCX evidence shows **zero production-person direct self-inserts**.

This decision removes the **elapsed-time requirement only**. It does not weaken provenance, RLS, idempotency, least privilege, fixture exclusion, or the requirement to verify the canonical frontend path before real participant use.

## Basis

The 14-day window was a conservative rollout condition intended to protect active participants from an old frontend continuing to use the direct table-insert path.

GFA leadership confirmed on 2026-08-23 that there are **no live participants currently using RecoveryOS** and that the observed participant self-record activity was executive/test activity.

Fresh read-only CQCX verification immediately before this decision found:

- `service_events` production-person events: **0**;
- production-person participant self-records with `dedupe_key IS NULL` (the old direct-insert fingerprint): **0**;
- the only two `participant_self_reported` service events are non-production fixture/test records;
- migrations `0133` through `0136` are live in canonical CQCX.

CQCX does contain three person records currently classified `production` with active `participant` role assignments. They have **no production service-event activity**. Their classification is a separate current-state reconciliation item and is not evidence of live participant use.

## Conditions for 0137

Before applying 0137:

1. Canonical project remains `cqcxvwoukyhxyokfwnjm` (RecoveryOS-Launch / CQCX).
2. `0134_canonical_event_writer`, `0135_self_insert_boundary`, and `0136_reporting_authority` remain live.
3. Production-person direct self-insert count remains zero.
4. The migration must drop only the compatibility direct-insert policy, require explicit provenance on every new service event, and remove the two obsolete exact-timestamp transition belts.
5. The internal service-event writer remains non-callable by `public`, `anon`, and `authenticated`.
6. Post-apply RLS/RPC/preflight verification must pass.
7. The canonical frontend using `record_my_activity` must be the build deployed before RecoveryOS is opened to real participant use.

## Superseded condition

Superseded from `docs/plans/p2-implementation-plan.md` P2.5:

> Gate: zero direct inserts for 14 consecutive days.

Replacement gate:

> Gate: current executive confirmation of no live participant use + fresh CQCX verification of zero production-person direct self-inserts + successful post-apply controls.

## Rationale

The original waiting period protected continuity during a live-client migration. With no live participant traffic to preserve, elapsed time adds delay without adding meaningful safety. The deterministic controls are the relevant protection now.

## Revisit trigger

Revisit this decision only if evidence appears that a live participant-facing build still depends on direct `service_events` insertion, or if production-person direct inserts are observed before cutover completion.
