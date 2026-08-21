-- 0130_goal_domain.sql — P1.3: nullable domain attribution on goals.
--
-- Ratification §18 (P1.3): "Add nullable domain attribution to goals using the ratified
-- model. Keep participant classification optional."
--
-- Deliberate choices:
--   * NULLABLE and optional — a goal with no domain is fully valid forever; classification
--     is a participant choice ("This is about… (optional)"), never a mandatory capture step.
--   * FK to recoveryos.domains(key) — text key, not enum; NO cascade: domain keys are
--     permanent by policy, so a delete attempt should be blocked by the reference.
--   * No RLS change: goals_self (FOR ALL, person-scoped) already governs who may set it.
--   * Domain is a lens, not evidence — nothing here scores, gates, or triggers anything.
--
-- ROLLBACK: alter table recoveryos.goals drop column domain_key;

set search_path = recoveryos, public;

alter table recoveryos.goals
  add column if not exists domain_key text references recoveryos.domains (key);

comment on column recoveryos.goals.domain_key is
  'Optional participant-chosen domain attribution (RATIFIED canon, 0129). NULL is a valid, '
  'permanent state — classification is never required and never inferred.';

notify pgrst, 'reload schema';
