-- RECOVERED from live project ykykeioydvtxpyreshhs on 2026-08-07 (grace-coaching audit).
-- Applied live as migration 20260807090730 `vrcc_coaching_engine_v1_cron` by a prior
-- session that did not commit it to any repository. PROTOTYPE LAYER — see
-- docs/migration/live-drift-reconciliation.md. Verbatim text follows.
-- (Despite the v1_triggers comment saying "Worker cron", the sweep actually runs as a
-- pg_cron job inside the database — verified live: cron.job row `vrcc-session-reminders`.)

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('vrcc-session-reminders', '*/5 * * * *', $$SELECT public.v2_sweep_session_reminders()$$);
