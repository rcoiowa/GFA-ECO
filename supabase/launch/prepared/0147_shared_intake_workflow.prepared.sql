-- 0147_shared_intake_workflow.prepared.sql — shared six-stage inquiry workflow (leads v2).
--
-- STATUS: PREPARED ONLY, DO NOT APPLY. Lives in supabase/launch/prepared/ (outside the
-- migrations ledger) so routine tooling cannot apply it. Moves to
-- supabase/launch/migrations/0147_shared_intake_workflow.sql only under the activation
-- authorization (docs/plans/intake-activation-plan-2026-09-01.md + the EJWRH
-- application-path build record). APPLY-ORDER RULE: this migration MUST be applied
-- before the updated lead-intake Edge Function is redeployed (the receiver writes the
-- new columns).
--
-- What this adds (all additive; no data destroyed):
--   * leads: six-stage lifecycle (new/assigned/contacted/waiting/scheduled/closed; the
--     legacy 'converted' value remains valid for lineage), explicit residence interest
--     (self-selected only — never inferred), organization/partnership flag, response
--     deadline, Wix idempotency key, link to a converted residence_application_intake
--     record so an inquiry and an application stay ONE thread, never duplicates.
--   * lead_contact_events: shared APPEND-ONLY contact log (responder, time, channel,
--     outcome, minutes, next follow-up). RPC-only writes; no UPDATE/DELETE path exists.
--   * Intake-only roles: intake_coordinator (full queue, assign/reassign) and
--     intake_worker (assigned inquiries only). Least privilege: this migration also
--     NARROWS lead visibility — coaches/navigators lose generic lead access; access is
--     coordinators + admins + the assigned worker. (Deliberate access change, called out
--     in the activation plan; ships only with the authorized apply.)
--   * RPCs (SECURITY DEFINER, {ok,code} envelopes, authorization inside):
--     assign_lead, record_lead_contact, set_lead_status, route_lead,
--     find_duplicate_leads, list_intake_assignees.
--
-- Deadlines encoded here are the PROPOSED values pending executive ratification
-- (standard: 24h to first contact; partnership/organization: 4h acknowledgment).

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- 1) Roles. New enum values are only ever USED after this transaction commits
--    (helpers compare as text precisely so nothing casts the new literals here).
-- ---------------------------------------------------------------------------
alter type role_key add value if not exists 'intake_coordinator';
alter type role_key add value if not exists 'intake_worker';

create or replace function recoveryos.is_intake_coordinator()
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select exists (
    select 1 from recoveryos.role_assignments ra
    where ra.person_id = recoveryos.current_person_id()
      and ra.revoked_at is null
      and ra.role_key::text in ('intake_coordinator','administrator','system_administrator')
  );
$$;

create or replace function recoveryos.is_intake_worker()
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select exists (
    select 1 from recoveryos.role_assignments ra
    where ra.person_id = recoveryos.current_person_id()
      and ra.revoked_at is null
      and ra.role_key::text = 'intake_worker'
  );
$$;

-- May the current person work THIS lead? Coordinator/admin: any; worker: assigned only.
create or replace function recoveryos.can_work_lead(p_lead_id bigint)
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.is_intake_coordinator()
      or exists (select 1 from recoveryos.leads l
                 where l.id = p_lead_id
                   and l.assigned_to_person_id = recoveryos.current_person_id());
$$;

revoke execute on function recoveryos.is_intake_coordinator(), recoveryos.is_intake_worker(),
  recoveryos.can_work_lead(bigint) from public, anon;
grant execute on function recoveryos.is_intake_coordinator(), recoveryos.is_intake_worker(),
  recoveryos.can_work_lead(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) leads: six-stage lifecycle + explicit routing + dedup + deadline columns.
-- ---------------------------------------------------------------------------
alter table recoveryos.leads drop constraint if exists leads_status_check;
alter table recoveryos.leads add constraint leads_status_check
  check (status in ('new','assigned','contacted','waiting','scheduled','closed','converted'));

alter table recoveryos.leads
  add column if not exists wix_submission_id text,
  add column if not exists submitted_at timestamptz,
  add column if not exists organization_inquiry boolean not null default false,
  -- Explicit, self-selected residence/pathway interest. NEVER inferred (from name,
  -- message text, or anything else). 'confirm_route' = the person's selection was
  -- ambiguous/absent and a coordinator must confirm with them.
  add column if not exists residence_interest text not null default 'unspecified'
    check (residence_interest in ('unspecified','grace_house','ejwrh','confirm_route')),
  add column if not exists response_due_at timestamptz,
  add column if not exists linked_intake_id bigint references recoveryos.residence_application_intake(id);

create unique index if not exists leads_wix_submission_id_key
  on recoveryos.leads (wix_submission_id) where wix_submission_id is not null;

-- Least-privilege visibility (replaces the broad staff policies from 0102).
drop policy if exists leads_staff_select on recoveryos.leads;
drop policy if exists leads_staff_update on recoveryos.leads;
create policy leads_intake_select on recoveryos.leads for select to authenticated
  using (recoveryos.is_intake_coordinator()
         or assigned_to_person_id = recoveryos.current_person_id());
-- No UPDATE policy: every mutation goes through the audited RPCs below.
-- No INSERT policy: inserts come only from the lead-intake Edge Function (service role).

-- ---------------------------------------------------------------------------
-- 3) Shared append-only contact log. RPC-only writes; immutable once written.
-- ---------------------------------------------------------------------------
create table if not exists recoveryos.lead_contact_events (
  id                  bigint generated always as identity primary key,
  lead_id             bigint not null references recoveryos.leads(id),
  responder_person_id bigint not null references recoveryos.people(id),
  occurred_at         timestamptz not null default now(),
  channel             text not null check (channel in ('phone','text','email','in_person','other')),
  outcome             text not null,
  minutes_spent       int check (minutes_spent between 0 and 600),
  next_follow_up_at   timestamptz,
  note                text
);
alter table recoveryos.lead_contact_events enable row level security;
create policy lead_contact_events_select on recoveryos.lead_contact_events
  for select to authenticated using (recoveryos.can_work_lead(lead_id));
-- Append-only by construction: SELECT-only client privileges; no UPDATE/DELETE
-- policies exist anywhere; writes happen inside record_lead_contact (definer).
revoke insert, update, delete on recoveryos.lead_contact_events from authenticated, anon;
grant select on recoveryos.lead_contact_events to authenticated;

-- Immutability guard even for privileged paths.
create or replace function recoveryos.lead_contact_events_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'lead_contact_events is append-only';
end $$;
drop trigger if exists lead_contact_events_no_update on recoveryos.lead_contact_events;
create trigger lead_contact_events_no_update
  before update or delete on recoveryos.lead_contact_events
  for each row execute function recoveryos.lead_contact_events_immutable();

-- ---------------------------------------------------------------------------
-- 4) RPCs.
-- ---------------------------------------------------------------------------

-- Proposed defaults pending ratification: partnership 4h, standard 24h.
create or replace function recoveryos.lead_default_due(p_organization boolean)
returns timestamptz language sql stable set search_path = recoveryos, public as $$
  select now() + case when p_organization then interval '4 hours' else interval '24 hours' end;
$$;

create or replace function recoveryos.assign_lead(p_lead_id bigint, p_assignee_person_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_lead recoveryos.leads;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if not recoveryos.is_intake_coordinator() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  select * into v_lead from recoveryos.leads where id = p_lead_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not exists (select 1 from recoveryos.role_assignments ra
                 where ra.person_id = p_assignee_person_id and ra.revoked_at is null
                   and ra.role_key::text in ('intake_coordinator','intake_worker',
                                             'administrator','system_administrator')) then
    return jsonb_build_object('ok', false, 'code', 'assignee_not_intake_staff');
  end if;
  update recoveryos.leads
     set assigned_to_person_id = p_assignee_person_id,
         status = case when status = 'new' then 'assigned' else status end,
         response_due_at = coalesce(response_due_at, recoveryos.lead_default_due(organization_inquiry)),
         updated_at = now()
   where id = p_lead_id;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'lead.assigned', 'leads', p_lead_id,
          jsonb_build_object('assignee_person_id', p_assignee_person_id));
  return jsonb_build_object('ok', true, 'code', 'assigned');
end $$;

create or replace function recoveryos.record_lead_contact(
  p_lead_id bigint, p_channel text, p_outcome text,
  p_minutes int default null, p_next_follow_up_at timestamptz default null,
  p_note text default null)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_event_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if not recoveryos.can_work_lead(p_lead_id) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if p_outcome is null or length(trim(p_outcome)) = 0 then
    return jsonb_build_object('ok', false, 'code', 'outcome_required');
  end if;
  insert into recoveryos.lead_contact_events
    (lead_id, responder_person_id, channel, outcome, minutes_spent, next_follow_up_at, note)
  values (p_lead_id, v_me, p_channel, left(trim(p_outcome), 500), p_minutes,
          p_next_follow_up_at, nullif(left(coalesce(p_note,''), 2000), ''))
  returning id into v_event_id;
  update recoveryos.leads
     set status = case when status in ('new','assigned') then 'contacted' else status end,
         updated_at = now()
   where id = p_lead_id;
  return jsonb_build_object('ok', true, 'code', 'recorded', 'event_id', v_event_id);
end $$;

create or replace function recoveryos.set_lead_status(p_lead_id bigint, p_status text)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare v_me bigint := recoveryos.current_person_id();
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if p_status not in ('new','assigned','contacted','waiting','scheduled','closed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  if not recoveryos.can_work_lead(p_lead_id) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  update recoveryos.leads set status = p_status, updated_at = now() where id = p_lead_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if p_status = 'closed' then
    insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
    values (v_me, 'lead.closed', 'leads', p_lead_id, '{}'::jsonb);
  end if;
  return jsonb_build_object('ok', true, 'code', 'status_set');
end $$;

create or replace function recoveryos.route_lead(
  p_lead_id bigint, p_residence_interest text,
  p_linked_intake_id bigint default null)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare v_me bigint := recoveryos.current_person_id();
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if not recoveryos.is_intake_coordinator() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if p_residence_interest not in ('unspecified','grace_house','ejwrh','confirm_route') then
    return jsonb_build_object('ok', false, 'code', 'invalid_residence_interest');
  end if;
  update recoveryos.leads
     set residence_interest = p_residence_interest,
         linked_intake_id = coalesce(p_linked_intake_id, linked_intake_id),
         updated_at = now()
   where id = p_lead_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'lead.routed', 'leads', p_lead_id,
          jsonb_build_object('residence_interest', p_residence_interest,
                             'linked_intake_id', p_linked_intake_id));
  return jsonb_build_object('ok', true, 'code', 'routed');
end $$;

-- Duplicate check: same email or phone within 30 days. Advisory only — a human
-- decides; nothing merges automatically. Minimal disclosure (ids + timestamps).
create or replace function recoveryos.find_duplicate_leads(p_lead_id bigint)
returns jsonb language plpgsql stable security definer set search_path = recoveryos, public as $$
declare
  v_lead recoveryos.leads;
  v_dupes jsonb;
begin
  if not recoveryos.can_work_lead(p_lead_id) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  select * into v_lead from recoveryos.leads where id = p_lead_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', l.id, 'status', l.status, 'created_at', l.created_at)), '[]'::jsonb)
    into v_dupes
  from recoveryos.leads l
  where l.id <> v_lead.id
    and l.created_at > now() - interval '30 days'
    and ((v_lead.email is not null and lower(l.email) = lower(v_lead.email))
      or (v_lead.phone is not null and l.phone = v_lead.phone));
  return jsonb_build_object('ok', true, 'code', 'checked', 'duplicates', v_dupes);
end $$;

-- Assignable intake staff (coordinators need a picker; minimal fields).
create or replace function recoveryos.list_intake_assignees()
returns jsonb language sql stable security definer set search_path = recoveryos, public as $$
  select case when not recoveryos.is_intake_coordinator()
    then jsonb_build_object('ok', false, 'code', 'not_authorized')
    else jsonb_build_object('ok', true, 'code', 'listed', 'assignees',
      coalesce((select jsonb_agg(distinct jsonb_build_object(
                  'person_id', pe.id, 'first_name', pe.first_name, 'last_name', pe.last_name))
                from recoveryos.role_assignments ra
                join recoveryos.people pe on pe.id = ra.person_id
                where ra.revoked_at is null
                  and ra.role_key::text in ('intake_coordinator','intake_worker')), '[]'::jsonb))
  end;
$$;

revoke execute on function
  recoveryos.assign_lead(bigint, bigint),
  recoveryos.record_lead_contact(bigint, text, text, int, timestamptz, text),
  recoveryos.set_lead_status(bigint, text),
  recoveryos.route_lead(bigint, text, bigint),
  recoveryos.find_duplicate_leads(bigint),
  recoveryos.list_intake_assignees(),
  recoveryos.lead_default_due(boolean)
from public, anon;
grant execute on function
  recoveryos.assign_lead(bigint, bigint),
  recoveryos.record_lead_contact(bigint, text, text, int, timestamptz, text),
  recoveryos.set_lead_status(bigint, text),
  recoveryos.route_lead(bigint, text, bigint),
  recoveryos.find_duplicate_leads(bigint),
  recoveryos.list_intake_assignees()
to authenticated;

notify pgrst, 'reload schema';
