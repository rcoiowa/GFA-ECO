-- LAUNCH 0106 — Remove the last transition-era artifact from the launch baseline.
--
-- recoveryos.migration_state was created by an early canonical migration (0001-era) and is
-- pure migration bookkeeping: it tracked per-domain stage during the dev-era v2→canonical
-- transition. The launch architecture has exactly one authority (canonical) and no
-- transition to track. Directive: do not bootstrap migration_state.

drop table if exists recoveryos.migration_state;
