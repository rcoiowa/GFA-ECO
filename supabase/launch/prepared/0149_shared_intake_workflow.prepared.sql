-- 0149_shared_intake_workflow.prepared.sql — shared six-stage inquiry workflow (leads v2).
-- REVISED EDITION (2026-09-15) — classification-aligned. See REVISION RECORD below.
--
-- STATUS: PREPARED ONLY. NOT AUTHORIZED. NOT APPLIED. Lives in supabase/launch/prepared/
-- (outside the migrations ledger) so routine tooling cannot apply it. Moves to
-- supabase/launch/migrations/0149_shared_intake_workflow.sql only under its own explicit
-- activation authorization, which has NOT been granted. The pre-revision edition (PR #7
-- lineage @ 825bb5c1) is REJECTED FOR ACTIVATION AS WRITTEN (executive direction,
-- 2026-09-15): its intake-role helpers read role_assignments directly, bypassing the 0147
-- classification guard, so a test_fixture administrator would regain the whole intake
-- queue. The shared-intake design itself remains the governing direction (2026-09-03
-- supersession decision).
--
-- APPLY-ORDER RULES:
--   1. Requires 0147 (classification authorization isolation) and 0148 (exposure
--      hardening) applied first — this file redefines recoveryos.is_privileged_role,
--      which 0147 introduces, and relies on the guarded recoveryos.has_role.
--   2. This migration MUST be applied before the updated lead-intake Edge Function is
--      redeployed (the receiver writes the new columns).
--
-- REVISION RECORD (vs the 825bb5c1 edition; everything else is content-identical):
--   R1  recoveryos.is_privileged_role gains 'intake_coordinator' and 'intake_worker'
--       so the 0147 has_role guard covers the new roles.
--   R2  New canonical actor predicate recoveryos.is_production_actor() — the single
--       named boundary future policies should use instead of ad-hoc guards.
--   R3  is_intake_coordinator()/is_intake_worker() are REFACTORED to flow through the
--       canonical authorization boundary (recoveryos.has_role / is_platform_admin)
--       instead of reading role_assignments directly. This is the structural fix: any
--       future role predicate built the same way inherits classification awareness.
--   R4  can_work_lead(): the assignment-based arm (which genuinely cannot flow through
--       a role key) carries an explicit is_production_actor() guard.
--   R5  leads_intake_select policy: same guard on its assignment arm.
--   R6  assign_lead(): refuses a test_fixture assignee (assignee_test_fixture_blocked)
--       and requires a production assignee before the role check.
--   R7  list_intake_assignees(): fixture identities are excluded from the picker
--       (mirrors the 0030/0120 production read-model pattern).
--   R8  Enum-literal safety: because R3 uses the new enum literals inside function
--       bodies created in the same transaction that adds the values, the file sets
--       LOCAL check_function_bodies = off for those creations (bodies parse at first
--       call, after commit). The pre-revision edition avoided this with direct text
--       comparison — the exact pattern that caused the bypass.
--
-- Everything below the revision points is byte-faithful to the 825bb5c1 edition,
-- including the ratified response-time policy (dormant response_due_at), decision-1
-- attempted-vs-connected distinction, decision-6 close-time triage classification,
-- the one-thread linked-intake unique index, and reopen rejection pending the
-- transition-matrix ratification.
--
-- ROLLBACK: 0149_shared_intake_workflow.rollback.sql (note: added enum values cannot
-- be removed by PostgreSQL; they remain inert and covered by is_privileged_role).

begin;

-- ---------------------------------------------------------------------------
-- 1) Roles + canonical classification boundary (R1/R2/R3/R8).
-- ---------------------------------------------------------------------------
alter type recoveryos.role_key add value if not exists 'intake_coordinator';
alter type recoveryos.role_key add value if not exists 'intake_worker';

-- R1: the 0147 privileged-role vocabulary now covers the intake roles, so the
-- guarded has_role() is classification-aware for them from the moment they exist.
create or replace function recoveryos.is_privileged_role(target_role recoveryos.role_key)
returns boolean
language sql immutable as $$
  select target_role::text in (
    'coach', 'navigator', 'residence_staff', 'residence_manager',
    'program_manager', 'administrator', 'executive', 'system_administrator',
    'intake_coordinator', 'intake_worker'
  );
$$;
comment on function recoveryos.is_privileged_role(recoveryos.role_key) is
  'P0-INV (0147, extended by 0149R): role keys a test_fixture-classified actor may never '
  'exercise. participant and resident stay non-privileged.';

-- R2: the canonical actor-classification predicate. New policies and helpers use
-- THIS name, not ad-hoc is_test_fixture(current_person_id()) expressions.
create or replace function recoveryos.is_production_actor()
returns boolean
language sql stable security definer set search_path = recoveryos, public as $$
  select not recoveryos.is_test_fixture(recoveryos.current_person_id());
$$;
revoke execute on function recoveryos.is_production_actor() from public, anon;
grant execute on function recoveryos.is_production_actor() to authenticated;
comment on function recoveryos.is_production_actor() is
  'Canonical boundary (0149R): true when the current person is not test_fixture-classified. '
  'Use this in any authorization arm that does not already flow through has_role().';

-- R3/R8: helpers flow through the canonical guarded boundary. The new enum
-- literals appear inside these bodies, created in the transaction that adds the
-- values — so body parsing is deferred to first call (after commit).
set local check_function_bodies = off;

create or replace function recoveryos.is_intake_coordinator()
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.has_role('intake_coordinator') or recoveryos.is_platform_admin();
$$;

create or replace function recoveryos.is_intake_worker()
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.has_role('intake_worker');
$$;

set local check_function_bodies = on;

-- R4: coordinator/admin arms flow through the boundary above; the assignment arm
-- cannot (assignment is not a role key), so it carries the canonical guard.
create or replace function recoveryos.can_work_lead(p_lead_id bigint)
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.is_intake_coordinator()
      or (recoveryos.is_production_actor()
          and exists (select 1 from recoveryos.leads l
                      where l.id = p_lead_id
                        and l.assigned_to_person_id = recoveryos.current_person_id()));
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
  add column if not exists linked_intake_id bigint references recoveryos.residence_application_intake(id),
  -- Decision 6 (as confirmed with modification, 2026-09-07): set by the first
  -- authorized human triage act (recorded at close). NULL = not yet human-classified.
  -- 'other' = a LEGITIMATE inquiry that is neither recovery support nor partnership
  -- (speaker invitation, training request, family general information, media/research,
  -- resource table, ...) — never forced into a nonqualified value.
  add column if not exists triage_classification text
    check (triage_classification in ('qualified_recovery_support','organization_partnership',
                                     'other','spam','duplicate','test',
                                     'unrelated_solicitation','other_nonqualified')),
  -- Short optional note permitted only with 'other' (what kind of legitimate inquiry
  -- it was). No classification requires narrative.
  add column if not exists triage_classification_note text;

comment on column recoveryos.leads.response_due_at is
  'DORMANT (2026-09-05 decision 3): business-time targets govern operationally, but no '
  'writer computes this until GFA''s authoritative operating calendar is ratified. Never '
  'derive overdue state from assumed hours; surface age since receipt instead.';

comment on column recoveryos.leads.triage_classification is
  'Administrative measurement/routing classification recorded by the closing human '
  'triage act (2026-09-05 decision 6, confirmed with modification 2026-09-07). NOT a '
  'clinical assessment, diagnosis, participant label, or determination of the '
  'legitimacy of a person''s need. qualified_recovery_support = sufficiently related to '
  'GFA recovery-support work to enter the qualified-inquiry measurement layer — it does '
  'NOT mean service was delivered, the person became a participant, eligibility was '
  'established, or human connection occurred. other = legitimate inquiry outside '
  'recovery support and partnership (community reach), distinct from the nonqualified '
  'values. duplicate closes the redundant record while the original submission/event '
  'evidence is retained untouched (append-only; never deleted or silently merged). '
  'NULL = not yet human-classified.';

comment on column recoveryos.leads.triage_classification_note is
  'Optional short note accompanying triage_classification = ''other'' only (what kind '
  'of legitimate inquiry). Never required; other classifications carry no narrative.';

-- Protect privileged/import paths as well as the RPC surface. response_due_at remains
-- dormant until a separately ratified operating calendar ships in a later migration.
do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_triage_note_other_check'
      and conrelid = 'recoveryos.leads'::regclass
  ) then
    alter table recoveryos.leads add constraint leads_triage_note_other_check
      check (
        triage_classification_note is null
        or (
          triage_classification = 'other'
          and length(trim(triage_classification_note)) between 1 and 300
        )
      );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_response_due_dormant_check'
      and conrelid = 'recoveryos.leads'::regclass
  ) then
    alter table recoveryos.leads add constraint leads_response_due_dormant_check
      check (response_due_at is null);
  end if;
end
$constraints$;

create unique index if not exists leads_wix_submission_id_key
  on recoveryos.leads (wix_submission_id) where wix_submission_id is not null;
-- UNIQUE: an application intake is ONE thread — it may be linked from at most one
-- inquiry (design review 2026-09-07; enforces the "one thread, never duplicates"
-- doctrine at the schema layer, not just in RPC logic).
create unique index if not exists leads_linked_intake_id_idx
  on recoveryos.leads (linked_intake_id) where linked_intake_id is not null;
create index if not exists leads_assignee_status_created_idx
  on recoveryos.leads (assigned_to_person_id, status, created_at desc)
  where assigned_to_person_id is not null;

-- Least-privilege visibility (replaces the broad staff policies from 0102).
-- R5: the assignment arm carries the canonical classification guard.
drop policy if exists leads_staff_select on recoveryos.leads;
drop policy if exists leads_staff_update on recoveryos.leads;
drop policy if exists leads_intake_select on recoveryos.leads;
create policy leads_intake_select on recoveryos.leads for select to authenticated
  using ((select recoveryos.is_intake_coordinator())
         or (assigned_to_person_id = (select recoveryos.current_person_id())
             and (select recoveryos.is_production_actor())));
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
  -- Decision 1: inquiry received -> contact ATTEMPTED -> human CONNECTION established
  -- are distinct facts. An attempt is never represented as a connection.
  contact_kind        text not null default 'attempted'
                        check (contact_kind in ('attempted','connected')),
  outcome             text not null,
  minutes_spent       int check (minutes_spent between 0 and 600),
  next_follow_up_at   timestamptz,
  note                text
);
create index if not exists lead_contact_events_lead_occurred_idx
  on recoveryos.lead_contact_events (lead_id, occurred_at desc);
create index if not exists lead_contact_events_responder_idx
  on recoveryos.lead_contact_events (responder_person_id);

alter table recoveryos.lead_contact_events enable row level security;
drop policy if exists lead_contact_events_select on recoveryos.lead_contact_events;
create policy lead_contact_events_select on recoveryos.lead_contact_events
  for select to authenticated using ((select recoveryos.can_work_lead(lead_id)));
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

-- No deadline-derivation function ships (decision 3): business-time computation is
-- deferred until the GFA operating calendar is ratified. When it is, the calendar-aware
-- function + a policy for populating the dormant response_due_at arrive as their own
-- reviewed migration — no schema change needed here.

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
  -- R6: a lead (production PII) is never assigned to a test-classified identity.
  if recoveryos.is_test_fixture(p_assignee_person_id) then
    return jsonb_build_object('ok', false, 'code', 'assignee_test_fixture_blocked',
      'message', 'Inquiries cannot be assigned to a test-classified identity.');
  end if;
  if not exists (select 1 from recoveryos.role_assignments ra
                 where ra.person_id = p_assignee_person_id and ra.revoked_at is null
                   and ra.role_key::text in ('intake_coordinator','intake_worker',
                                             'administrator','system_administrator')) then
    return jsonb_build_object('ok', false, 'code', 'assignee_not_intake_staff');
  end if;
  update recoveryos.leads
     set assigned_to_person_id = p_assignee_person_id,
         status = case when status = 'new' then 'assigned' else status end,
         -- response_due_at deliberately untouched (dormant; decision 3).
         updated_at = now()
   where id = p_lead_id;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'lead.assigned', 'leads', p_lead_id,
          jsonb_build_object('assignee_person_id', p_assignee_person_id));
  return jsonb_build_object('ok', true, 'code', 'assigned');
end $$;

-- 'contacted' stage = at least one human contact ATTEMPT is on record (a human
-- response). Whether a connection was ESTABLISHED is read from the events'
-- contact_kind, never from the stage (decision 1).
create or replace function recoveryos.record_lead_contact(
  p_lead_id bigint, p_channel text, p_outcome text,
  p_minutes int default null, p_next_follow_up_at timestamptz default null,
  p_note text default null, p_contact_kind text default 'attempted')
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_event_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if not recoveryos.can_work_lead(p_lead_id) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  -- Explicit existence check: a coordinator passes can_work_lead for ANY id, so the
  -- FK alone would surface a raw SQL error here ({ok,code} envelope discipline).
  if not exists (select 1 from recoveryos.leads where id = p_lead_id) then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  if p_outcome is null or length(trim(p_outcome)) = 0 then
    return jsonb_build_object('ok', false, 'code', 'outcome_required');
  end if;
  if p_channel is null
     or p_channel not in ('phone','text','email','in_person','other') then
    return jsonb_build_object('ok', false, 'code', 'invalid_channel');
  end if;
  if p_contact_kind is null or p_contact_kind not in ('attempted','connected') then
    return jsonb_build_object('ok', false, 'code', 'invalid_contact_kind');
  end if;
  if p_minutes is not null and (p_minutes < 0 or p_minutes > 600) then
    return jsonb_build_object('ok', false, 'code', 'invalid_minutes');
  end if;
  insert into recoveryos.lead_contact_events
    (lead_id, responder_person_id, channel, contact_kind, outcome, minutes_spent,
     next_follow_up_at, note)
  values (p_lead_id, v_me, p_channel, p_contact_kind, left(trim(p_outcome), 500), p_minutes,
          p_next_follow_up_at, nullif(left(coalesce(p_note,''), 2000), ''))
  returning id into v_event_id;
  update recoveryos.leads
     set status = case when status in ('new','assigned') then 'contacted' else status end,
         updated_at = now()
   where id = p_lead_id;
  return jsonb_build_object('ok', true, 'code', 'recorded', 'event_id', v_event_id);
end $$;

-- Closing carries the human triage classification (decision 6, confirmed with
-- modification 2026-09-07): required on close so nonqualified records never silently
-- blend into qualified-recovery-request measures, with 'other' for legitimate
-- inquiries outside recovery support/partnership. A short optional note is permitted
-- only with 'other'; no classification requires narrative. Classification is rejected
-- on non-close moves.
-- Status transitions (interim rule, 2026-09-08): the COMPLETE lead-status transition
-- matrix — including whether and how a closed inquiry may reopen — is PROPOSED in
-- docs/decisions/proposals/2026-09-08-lead-status-transition-matrix.md and is NOT
-- ratified. Until it is, this function encodes only the uncontested subset:
--   * transitions among the five active stages (new/assigned/contacted/waiting/
--     scheduled) are free-form human acts;
--   * any active stage -> closed requires the human triage classification;
--   * closed -> closed re-records the classification (correction path, audited);
--   * closed -> any active stage is REJECTED ({ok:false, code:'reopen_not_ratified'})
--     rather than silently allowed with a stale classification — reopening ships only
--     with the ratified matrix;
--   * the legacy 'converted' value is never a target here (conversion has its own path).
create or replace function recoveryos.set_lead_status(
  p_lead_id bigint, p_status text, p_close_classification text default null,
  p_close_note text default null)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_prior_status text;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if p_status not in ('new','assigned','contacted','waiting','scheduled','closed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  if not recoveryos.can_work_lead(p_lead_id) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  select status into v_prior_status
    from recoveryos.leads where id = p_lead_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_prior_status = 'closed' and p_status <> 'closed' then
    return jsonb_build_object('ok', false, 'code', 'reopen_not_ratified',
      'message', 'Reopening a closed inquiry ships only with the ratified transition matrix.');
  end if;
  if p_status = 'closed' then
    if p_close_classification is null
       or p_close_classification not in ('qualified_recovery_support','organization_partnership',
                                         'other','spam','duplicate','test',
                                         'unrelated_solicitation','other_nonqualified') then
      return jsonb_build_object('ok', false, 'code', 'classification_required',
        'message', 'Closing an inquiry records the human quality determination.');
    end if;
    if p_close_note is not null and p_close_classification <> 'other' then
      return jsonb_build_object('ok', false, 'code', 'note_only_with_other',
        'message', 'The classification note accompanies ''other'' only.');
    end if;
  elsif p_close_classification is not null or p_close_note is not null then
    return jsonb_build_object('ok', false, 'code', 'classification_only_on_close');
  end if;
  update recoveryos.leads
     set status = p_status,
         triage_classification = case when p_status = 'closed' then p_close_classification
                                      else triage_classification end,
         triage_classification_note = case when p_status = 'closed'
                                           then nullif(left(trim(coalesce(p_close_note,'')), 300), '')
                                           else triage_classification_note end,
         updated_at = now()
   where id = p_lead_id;
  if p_status = 'closed' then
    insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
    values (v_me, 'lead.closed', 'leads', p_lead_id,
            jsonb_build_object('triage_classification', p_close_classification,
                               'reclassification', v_prior_status = 'closed'));
  end if;
  return jsonb_build_object('ok', true, 'code', 'status_set');
end $$;

-- Linking rules (design review 2026-09-07/08, awaiting ratification before promotion):
-- a linked intake must EXIST, may accompany only an explicit residence selection
-- ('grace_house'/'ejwrh'), and must belong to that residence (canonical seed ids:
-- Grace House = 1, EJWRH = 2 — the same pinned mapping the EJWRH Edge Function uses).
-- The unique partial index keeps an intake linked from at most one inquiry; the
-- violation surfaces as {ok:false, code:'intake_already_linked'}, never a SQL error.
-- CONSISTENCY: changing residence_interest can never silently preserve a link that
-- no longer matches the selected residence — such a call is rejected, and removing a
-- link is its own EXPLICIT, audited act (p_unlink => 'lead.unlinked'), never a side
-- effect of another change.
create or replace function recoveryos.route_lead(
  p_lead_id bigint, p_residence_interest text,
  p_linked_intake_id bigint default null,
  p_unlink boolean default false)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_lead recoveryos.leads;
  v_intake_residence_id bigint;
  v_expected_residence_id bigint;
  v_new_link bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if not recoveryos.is_intake_coordinator() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if p_residence_interest not in ('unspecified','grace_house','ejwrh','confirm_route') then
    return jsonb_build_object('ok', false, 'code', 'invalid_residence_interest');
  end if;
  if p_unlink and p_linked_intake_id is not null then
    return jsonb_build_object('ok', false, 'code', 'unlink_conflicts_with_link',
      'message', 'Pass either a new linked intake or unlink, not both.');
  end if;
  select * into v_lead from recoveryos.leads where id = p_lead_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  v_expected_residence_id := case p_residence_interest
                               when 'grace_house' then 1
                               when 'ejwrh' then 2
                               else null end;
  if p_linked_intake_id is not null then
    if v_expected_residence_id is null then
      return jsonb_build_object('ok', false, 'code', 'interest_required_for_link',
        'message', 'Linking an application requires an explicit residence selection.');
    end if;
    select residence_id into v_intake_residence_id
      from recoveryos.residence_application_intake where id = p_linked_intake_id;
    if not found then
      return jsonb_build_object('ok', false, 'code', 'intake_not_found');
    end if;
    if v_intake_residence_id <> v_expected_residence_id then
      return jsonb_build_object('ok', false, 'code', 'intake_residence_mismatch');
    end if;
    v_new_link := p_linked_intake_id;
  elsif p_unlink then
    v_new_link := null;
  else
    -- No link change requested: an EXISTING link must stay consistent with the
    -- newly selected interest. Reject rather than silently keeping a mismatch;
    -- the coordinator unlinks first (explicit act) or routes to the matching house.
    if v_lead.linked_intake_id is not null then
      select residence_id into v_intake_residence_id
        from recoveryos.residence_application_intake where id = v_lead.linked_intake_id;
      if v_expected_residence_id is null or v_intake_residence_id <> v_expected_residence_id then
        return jsonb_build_object('ok', false, 'code', 'link_conflicts_with_interest',
          'message', 'This inquiry is linked to an application at another residence. Unlink it first, or route to the matching residence.');
      end if;
    end if;
    v_new_link := v_lead.linked_intake_id;
  end if;
  begin
    update recoveryos.leads
       set residence_interest = p_residence_interest,
           linked_intake_id = v_new_link,
           updated_at = now()
     where id = p_lead_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'intake_already_linked',
      'message', 'That application is already linked to another inquiry.');
  end;
  if p_unlink and v_lead.linked_intake_id is not null then
    insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
    values (v_me, 'lead.unlinked', 'leads', p_lead_id,
            jsonb_build_object('unlinked_intake_id', v_lead.linked_intake_id,
                               'residence_interest', p_residence_interest));
  end if;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'lead.routed', 'leads', p_lead_id,
          jsonb_build_object('residence_interest', p_residence_interest,
                             'linked_intake_id', v_new_link));
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
-- R7: fixture identities never appear in the picker (production read model,
-- same pattern as 0030 list_active_coaches / 0120 pool symmetry evidence rule).
create or replace function recoveryos.list_intake_assignees()
returns jsonb language sql stable security definer set search_path = recoveryos, public as $$
  select case when not (select recoveryos.is_intake_coordinator())
    then jsonb_build_object('ok', false, 'code', 'not_authorized')
    else jsonb_build_object('ok', true, 'code', 'listed', 'assignees',
      coalesce((select jsonb_agg(distinct jsonb_build_object(
                  'person_id', pe.id, 'first_name', pe.first_name, 'last_name', pe.last_name))
                from recoveryos.role_assignments ra
                join recoveryos.people pe on pe.id = ra.person_id
                where ra.revoked_at is null
                  and ra.role_key::text in ('intake_coordinator','intake_worker')
                  and recoveryos.is_production_person(pe.id)), '[]'::jsonb))
  end;
$$;

revoke execute on function
  recoveryos.assign_lead(bigint, bigint),
  recoveryos.record_lead_contact(bigint, text, text, int, timestamptz, text, text),
  recoveryos.set_lead_status(bigint, text, text, text),
  recoveryos.route_lead(bigint, text, bigint, boolean),
  recoveryos.find_duplicate_leads(bigint),
  recoveryos.list_intake_assignees()
from public, anon;
grant execute on function
  recoveryos.assign_lead(bigint, bigint),
  recoveryos.record_lead_contact(bigint, text, text, int, timestamptz, text, text),
  recoveryos.set_lead_status(bigint, text, text, text),
  recoveryos.route_lead(bigint, text, bigint, boolean),
  recoveryos.find_duplicate_leads(bigint),
  recoveryos.list_intake_assignees()
to authenticated;

commit;
notify pgrst, 'reload schema';
