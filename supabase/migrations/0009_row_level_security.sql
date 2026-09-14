-- Row-level security. Route guards are navigation only; this file is the
-- actual authorization boundary.
--
-- Phase 1 scope: self-access for participants/residents plus scoped staff
-- read access. Professional relationship-based access (coach/navigator) and
-- full staff operations policies land with Phases 5-6 and must be reviewed
-- before those workspaces ship.

-- Helpers -----------------------------------------------------------------

set search_path = recoveryos, public;

create or replace function current_person_id()
returns bigint
language sql stable security definer set search_path = recoveryos, public as $$
  select id from people where auth_user_id = auth.uid();
$$;

create or replace function has_role(target_role role_key)
returns boolean
language sql stable security definer set search_path = recoveryos, public as $$
  select exists (
    select 1 from role_assignments ra
    where ra.person_id = current_person_id()
      and ra.role_key = target_role
      and ra.revoked_at is null
  );
$$;

-- Staff scope: residences where the current person holds an unrevoked
-- residence-scoped staff/manager role.
create or replace function staff_residence_ids()
returns setof bigint
language sql stable security definer set search_path = recoveryos, public as $$
  select ra.residence_id from role_assignments ra
  where ra.person_id = current_person_id()
    and ra.role_key in ('residence_staff', 'residence_manager')
    and ra.residence_id is not null
    and ra.revoked_at is null;
$$;

-- Provision person + profile + participant role on first sign-in (idempotent).
create or replace function ensure_person_for_current_user(
  p_first_name text,
  p_last_name text
) returns people
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  result people;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into result from people where auth_user_id = auth.uid();
  if found then
    return result;
  end if;

  insert into people (auth_user_id, first_name, last_name)
  values (auth.uid(), p_first_name, p_last_name)
  returning * into result;

  insert into person_profiles (person_id) values (result.id);
  insert into role_assignments (person_id, role_key) values (result.id, 'participant');
  insert into audit_log (actor_person_id, action, entity_table, entity_id)
  values (result.id, 'person.provisioned', 'people', result.id);

  return result;
end;
$$;

revoke all on function ensure_person_for_current_user(text, text) from public;
grant execute on function ensure_person_for_current_user(text, text) to authenticated;

-- Enable RLS everywhere ---------------------------------------------------

alter table people enable row level security;
alter table person_profiles enable row level security;
alter table contact_methods enable row level security;
alter table organizations enable row level security;
alter table organization_relationships enable row level security;
alter table locations enable row level security;
alter table programs enable row level security;
alter table funding_sources enable row level security;
alter table role_assignments enable row level security;
alter table program_enrollments enable row level security;
alter table residences enable row level security;
alter table residence_units enable row level security;
alter table residence_rooms enable row level security;
alter table residence_beds enable row level security;
alter table residence_applications enable row level security;
alter table residencies enable row level security;
alter table bed_assignments enable row level security;
alter table service_types enable row level security;
alter table service_events enable row level security;
alter table recovery_plans enable row level security;
alter table goals enable row level security;
alter table action_steps enable row level security;
alter table check_ins enable row level security;
alter table recovery_capital_assessments enable row level security;
alter table coaching_relationships enable row level security;
alter table navigation_relationships enable row level security;
alter table support_team_memberships enable row level security;
alter table appointments enable row level security;
alter table meetings enable row level security;
alter table meeting_attendance enable row level security;
alter table residence_chores enable row level security;
alter table chore_assignments enable row level security;
alter table curfew_schedules enable row level security;
alter table curfew_exceptions enable row level security;
alter table passes enable row level security;
alter table screenings enable row level security;
alter table incidents enable row level security;
alter table grievances enable row level security;
alter table consent_types enable row level security;
alter table consent_grants enable row level security;
alter table document_templates enable row level security;
alter table document_versions enable row level security;
alter table document_assignments enable row level security;
alter table audit_log enable row level security;

-- Self-access policies ----------------------------------------------------

create policy people_select_self on people
  for select using (auth_user_id = auth.uid());
create policy people_update_self on people
  for update using (auth_user_id = auth.uid());

create policy person_profiles_self on person_profiles
  for all using (person_id = current_person_id());

create policy contact_methods_self on contact_methods
  for all using (person_id = current_person_id());

create policy role_assignments_select_self on role_assignments
  for select using (person_id = current_person_id());

create policy program_enrollments_select_self on program_enrollments
  for select using (person_id = current_person_id());

create policy residencies_select_self on residencies
  for select using (person_id = current_person_id());

create policy service_events_select_self on service_events
  for select using (person_id = current_person_id());

create policy recovery_plans_self on recovery_plans
  for all using (person_id = current_person_id());

create policy goals_self on goals
  for all using (person_id = current_person_id());

create policy action_steps_self on action_steps
  for all using (
    exists (select 1 from goals g where g.id = goal_id and g.person_id = current_person_id())
  );

create policy check_ins_select_self on check_ins
  for select using (person_id = current_person_id());
create policy check_ins_insert_self on check_ins
  for insert with check (person_id = current_person_id());

create policy rca_select_self on recovery_capital_assessments
  for select using (person_id = current_person_id());
create policy rca_insert_self on recovery_capital_assessments
  for insert with check (person_id = current_person_id());

create policy appointments_select_self on appointments
  for select using (person_id = current_person_id());

create policy consent_grants_select_self on consent_grants
  for select using (person_id = current_person_id());
create policy consent_grants_insert_self on consent_grants
  for insert with check (person_id = current_person_id());

create policy document_assignments_select_self on document_assignments
  for select using (person_id = current_person_id());

create policy support_team_select_self on support_team_memberships
  for select using (person_id = current_person_id() or member_person_id = current_person_id());

create policy coaching_select_involved on coaching_relationships
  for select using (
    participant_person_id = current_person_id() or coach_person_id = current_person_id()
  );

create policy navigation_select_involved on navigation_relationships
  for select using (
    participant_person_id = current_person_id() or navigator_person_id = current_person_id()
  );

-- Reference data readable by any signed-in user ---------------------------

create policy service_types_read on service_types
  for select using (auth.uid() is not null);
create policy consent_types_read on consent_types
  for select using (auth.uid() is not null);
create policy programs_read on programs
  for select using (auth.uid() is not null);
create policy organizations_read on organizations
  for select using (auth.uid() is not null);
create policy residences_read on residences
  for select using (auth.uid() is not null);
create policy meetings_read on meetings
  for select using (
    residence_id is null
    or residence_id in (select residence_id from residencies
                        where person_id = current_person_id()
                          and residency_status in ('active','on_pass','transitioning'))
    or residence_id in (select staff_residence_ids())
  );

-- Residence-scoped resident self-access -----------------------------------

create policy chore_assignments_self on chore_assignments
  for select using (
    exists (select 1 from residencies r
            where r.id = residency_id and r.person_id = current_person_id())
  );

create policy passes_self_select on passes
  for select using (
    exists (select 1 from residencies r
            where r.id = residency_id and r.person_id = current_person_id())
  );
create policy passes_self_request on passes
  for insert with check (
    status = 'requested'
    and exists (select 1 from residencies r
                where r.id = residency_id and r.person_id = current_person_id())
  );

create policy curfew_exceptions_self on curfew_exceptions
  for select using (
    exists (select 1 from residencies r
            where r.id = residency_id and r.person_id = current_person_id())
  );

create policy curfew_schedules_read on curfew_schedules
  for select using (
    residence_id in (select residence_id from residencies
                     where person_id = current_person_id()
                       and residency_status in ('active','on_pass','transitioning'))
    or residence_id in (select staff_residence_ids())
  );

-- Residence staff scoped access (Phase 5 expands to full operations) ------

create policy residencies_staff_select on residencies
  for select using (residence_id in (select staff_residence_ids()));

create policy residence_applications_staff on residence_applications
  for select using (residence_id in (select staff_residence_ids()));

create policy screenings_staff on screenings
  for all using (
    exists (select 1 from residencies r
            where r.id = residency_id
              and r.residence_id in (select staff_residence_ids()))
  );

create policy incidents_staff on incidents
  for all using (residence_id in (select staff_residence_ids()));

create policy grievances_involved on grievances
  for select using (
    filed_by_person_id = current_person_id()
    or residence_id in (select staff_residence_ids())
  );
create policy grievances_file_self on grievances
  for insert with check (filed_by_person_id = current_person_id());

-- Audit: append via definer functions only; admins review in Phase 7.
create policy audit_log_no_direct_read on audit_log
  for select using (has_role('system_administrator'));
