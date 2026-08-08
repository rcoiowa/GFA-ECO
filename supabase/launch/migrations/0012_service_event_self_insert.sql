-- Self-recorded service events: participants may record their own
-- self-directed service events (check-ins, assessments, practices). Provider-
-- and staff-recorded events arrive with the professional workspaces and get
-- their own policies then.
set search_path = recoveryos, public;

create policy service_events_insert_self on service_events
  for insert with check (
    person_id = current_person_id()
    and (provider_person_id is null or provider_person_id = current_person_id())
  );
