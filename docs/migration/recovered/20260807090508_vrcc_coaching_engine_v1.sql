-- RECOVERED from live project ykykeioydvtxpyreshhs on 2026-08-07 (grace-coaching audit).
-- Applied live as migration 20260807090508 `vrcc_coaching_engine_v1` by a prior session
-- that did not commit it to any repository (see docs/migration/live-drift-reconciliation.md).
-- PROTOTYPE LAYER (public schema, v2_* tables) — NOT part of the canonical recoveryos
-- migration chain. Do not re-apply to fresh environments; kept verbatim as the record
-- of what is live. Verbatim text follows.

-- VRCC Coaching Engine v1 — ADDITIVE ONLY
-- Extends v2 layer: claim/assign flow, time negotiation, DMs, reminders.

-- 1) Enum extensions
ALTER TYPE v2_session_status ADD VALUE IF NOT EXISTS 'counter_proposed';
ALTER TYPE v2_session_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE v2_notification_kind ADD VALUE IF NOT EXISTS 'session_confirmed';
ALTER TYPE v2_notification_kind ADD VALUE IF NOT EXISTS 'session_reminder';
ALTER TYPE v2_notification_kind ADD VALUE IF NOT EXISTS 'session_starting';
ALTER TYPE v2_notification_kind ADD VALUE IF NOT EXISTS 'coach_assigned';
ALTER TYPE v2_notification_kind ADD VALUE IF NOT EXISTS 'new_message';
