-- Applied live 2026-08-02 as `recoveryos_0015_appointment_request_self` by a
-- parallel session; captured back into the repo during the 2026-08-04
-- reconciliation (renumbered — see docs/migration/live-drift-reconciliation.md).
--
-- Participants may request their own sessions (status 'requested' only).
-- Scheduling/decisions belong to the professional workspaces (Phase 7).
set search_path = recoveryos, public;

create policy appointments_request_self on appointments
  for insert with check (
    person_id = current_person_id()
    and status = 'requested'
    and provider_person_id is null
  );
