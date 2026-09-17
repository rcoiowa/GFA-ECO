-- 0149_shared_intake_workflow.rollback.sql — exact rollback for the REVISED
-- prepared 0149 (2026-09-15 edition). Run only while no workflow data depends
-- on 0149 structures (lead_contact_events rows, new lead columns in use).
-- Requires the same authority as the apply; record the reason.
--
-- NOT REVERSIBLE: PostgreSQL cannot remove enum values, so 'intake_coordinator'
-- and 'intake_worker' remain in recoveryos.role_key. They stay inert:
-- is_privileged_role deliberately KEEPS covering them after rollback (below),
-- so a later grant of either role to a fixture identity still fails closed.

begin;

-- RPCs
drop function if exists recoveryos.list_intake_assignees();
drop function if exists recoveryos.find_duplicate_leads(bigint);
drop function if exists recoveryos.route_lead(bigint, text, bigint, boolean);
drop function if exists recoveryos.set_lead_status(bigint, text, text, text);
drop function if exists recoveryos.record_lead_contact(bigint, text, text, int, timestamptz, text, text);
drop function if exists recoveryos.assign_lead(bigint, bigint);

-- Contact log
drop trigger if exists lead_contact_events_no_update on recoveryos.lead_contact_events;
drop function if exists recoveryos.lead_contact_events_immutable();
drop table if exists recoveryos.lead_contact_events;

-- leads: restore the 0102-era policies, then remove 0149 structures.
drop policy if exists leads_intake_select on recoveryos.leads;
create policy leads_staff_select on recoveryos.leads for select to authenticated
  using (recoveryos.is_support_staff() or recoveryos.is_admin_staff());
create policy leads_staff_update on recoveryos.leads for update to authenticated
  using (recoveryos.is_support_staff() or recoveryos.is_admin_staff())
  with check (recoveryos.is_support_staff() or recoveryos.is_admin_staff());

drop index if exists recoveryos.leads_wix_submission_id_key;
drop index if exists recoveryos.leads_linked_intake_id_idx;
drop index if exists recoveryos.leads_assignee_status_created_idx;

alter table recoveryos.leads
  drop constraint if exists leads_triage_note_other_check,
  drop constraint if exists leads_response_due_dormant_check;
alter table recoveryos.leads
  drop column if exists wix_submission_id,
  drop column if exists submitted_at,
  drop column if exists organization_inquiry,
  drop column if exists residence_interest,
  drop column if exists response_due_at,
  drop column if exists linked_intake_id,
  drop column if exists triage_classification,
  drop column if exists triage_classification_note;

alter table recoveryos.leads drop constraint if exists leads_status_check;
alter table recoveryos.leads add constraint leads_status_check
  check (status in ('new','contacted','converted','closed'));

-- Helpers
drop function if exists recoveryos.can_work_lead(bigint);
drop function if exists recoveryos.is_intake_worker();
drop function if exists recoveryos.is_intake_coordinator();
drop function if exists recoveryos.is_production_actor();

-- is_privileged_role: deliberately kept COVERING the (unremovable) intake enum
-- values. This is byte-identical to the 0147 version except for the two extra
-- keys and the comment, and is the safe direction (fail closed).
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
  'P0-INV (0147): role keys a test_fixture-classified actor may never exercise. Retains '
  'the 0149R intake keys after 0149 rollback because enum values cannot be removed.';

commit;
notify pgrst, 'reload schema';
