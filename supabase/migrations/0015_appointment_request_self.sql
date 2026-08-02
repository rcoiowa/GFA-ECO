-- Participants may request their own sessions (status 'requested' only).
-- Scheduling/decisions belong to the professional workspaces (Phase 7).
set search_path = recoveryos, public;

create policy appointments_request_self on appointments
  for insert with check (
    person_id = current_person_id()
    and status = 'requested'
    and provider_person_id is null
  );
