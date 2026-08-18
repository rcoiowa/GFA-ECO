-- LAUNCH 0104 — Schedule the canonical reminder dispatcher.
--
-- Applied ONLY after the 0101 reminder engine is verified on the launch project (seed /
-- reschedule / cancel / dispatch semantics). Runs every 5 minutes, mirroring the retired v2
-- cadence. Delivery is in-app canonical notifications only; external channels remain OFF.
--
-- NOTE: this file is intentionally NOT part of the automatic bootstrap order applied before
-- verification. Apply it as the final step of the launch-foundation runbook.

create extension if not exists pg_cron;

select cron.schedule(
  'recoveryos-appointment-reminders',
  '*/5 * * * *',
  $$select recoveryos.process_appointment_reminders(50);$$
);
