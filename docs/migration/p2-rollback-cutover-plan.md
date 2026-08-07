# P2 Rollback / Cutover Plan (deliverable O)

**Date:** 2026-08-07. P2 is additive shadow — fully reversible. Cutover is P3+, gated and
explicitly authorized.

## Rollback (P2 is reversible with zero legacy impact)

Because P2 only added `recoveryos` tables/columns/functions and populated shadow rows,
rollback is: drop the new objects. No legacy `v2_*`/`mvp_*` row was changed, so legacy
behavior is unaffected either way.

Per-migration rollback (each file carries its own notes):
- `0028`: `drop function recoveryos.backfill_coaching_shadow();`
- `0027`: drop the three RPCs.
- `0026`: drop the added policies + helper functions.
- `0025`: drop the new tables (`v2_identity_map`, `support_requests`,
  `support_request_events`, `booking_requests`, `booking_proposals`, `conversations`,
  `conversation_members`, `messages`, `notifications`, `notification_deliveries`,
  `follow_ups`, `migration_state`, `backfill_log`); drop the added
  `coaching_relationships` / `appointments` columns; restore the original
  `appointments_status_check` (the pre-P2 5-value set). Shadow data is discarded with the
  tables — it is a projection, authoritative nowhere.

Shadow data can also simply be truncated (`truncate` the new tables) to re-run backfill
from scratch without dropping schema — the backfill is idempotent and re-derives everything.

## Cutover state machine (P3+, per domain, gated)

Tracked in `recoveryos.migration_state`. A domain advances only after its gate passes.

```
CANONICAL_SHADOW   (now) — canonical populated by one-way backfill; legacy authoritative
      │  gate: parity report green for the domain + identity cohort provisioned
      ▼
CANONICAL_PARITY   — canonical == legacy proven on live data (not just synthetic)
      │  gate: explicit authorization (per the P1/P2 rule: no cutover without sign-off)
      ▼
CANONICAL_READ     — reads served from canonical; writes still dual-checked against legacy
      │  gate: read soak clean; no parity drift observed
      ▼
CANONICAL_WRITE    — writes go to canonical; one-way projection canonical→legacy if any
      │             legacy consumer remains
      ▼
LEGACY_READ_ONLY   — legacy tables frozen (no new writes), kept for any straggler reader
      │  gate: unidentified drift client resolved (P8) + no attributed legacy caller
      ▼
LEGACY_RETIRED     — legacy objects dropped (schema cleanup)
```

## Preconditions that must hold before ANY cutover (not before P2)

1. **Parity on live data**, per domain — currently blocked for relationships/support
   requests/notifications by the identity cohort gap (§ below), proven on synthetic
   mapped data only.
2. **Identity provisioning** — the 8 unmapped v2 auth users get canonical `people` rows
   (via `ensure_person_for_current_user` on next canonical sign-in, or an authorized
   admin person-backfill). Until then their coaching data cannot migrate; do not guess.
3. **Unidentified drift client resolved** — belongs to the LEGACY_RETIRED gate (P8), not
   earlier. Its existence blocks dropping legacy structures, not building canonical ones.
4. **Explicit authorization** — per the standing rule, no production read/write cutover
   without the parity report supporting it and a human go-ahead.

## What P2 did NOT do (by design)

No `v2_*`/`mvp_*` drop, rename, or column removal; no production read/write cutover; no
React migration; no external SMS/email; no bidirectional sync triggers; no destructive or
guessed identity mapping. All of that is later phases, gated as above.
