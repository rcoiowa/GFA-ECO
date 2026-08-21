-- RecoveryOS Canonical Coaching Domain — RLS + helpers (P2A).
-- Applied live as recoveryos_0026_coaching_domain_rls. The 0025 tables were created
-- RLS-enabled with NO policies (deny-all); this migration grants the minimum access
-- each surface needs. Pattern follows recoveryos 0009: SECURITY DEFINER helper
-- functions (search_path pinned, no cross-table policy joins — the 0020 recursion
-- lesson) + person_id-scoped policies. recoveryos default privileges (0010) already
-- grant select/insert/update to `authenticated` on new tables, so THESE POLICIES ARE
-- THE ONLY GATE.

begin;

-- --------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER, pinned search_path)
-- --------------------------------------------------------------------------
create or replace function recoveryos.is_support_staff()
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.has_role('coach') or recoveryos.has_role('navigator')
      or recoveryos.has_role('program_manager') or recoveryos.has_role('administrator')
      or recoveryos.has_role('system_administrator');
$$;

create or replace function recoveryos.is_admin_staff()
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.has_role('navigator') or recoveryos.has_role('program_manager')
      or recoveryos.has_role('administrator') or recoveryos.has_role('system_administrator');
$$;

-- participants with an ACTIVE coaching relationship to the current coach
create or replace function recoveryos.my_active_participant_ids()
returns setof bigint language sql stable security definer set search_path = recoveryos, public as $$
  select participant_person_id from recoveryos.coaching_relationships
  where coach_person_id = recoveryos.current_person_id() and status = 'active';
$$;

-- conversations the current person belongs to
create or replace function recoveryos.my_conversation_ids()
returns setof bigint language sql stable security definer set search_path = recoveryos, public as $$
  select conversation_id from recoveryos.conversation_members
  where person_id = recoveryos.current_person_id();
$$;

revoke execute on function recoveryos.is_support_staff(), recoveryos.is_admin_staff(),
  recoveryos.my_active_participant_ids(), recoveryos.my_conversation_ids() from public, anon;
grant execute on function recoveryos.is_support_staff(), recoveryos.is_admin_staff(),
  recoveryos.my_active_participant_ids(), recoveryos.my_conversation_ids() to authenticated;

-- --------------------------------------------------------------------------
-- v2_identity_map — self may read own mapping; admin manages
-- --------------------------------------------------------------------------
create policy v2im_self on recoveryos.v2_identity_map for select to authenticated
  using (person_id = recoveryos.current_person_id() or recoveryos.is_admin_staff());

-- --------------------------------------------------------------------------
-- coaching_relationships — extend existing select-only posture with staff reads.
-- (0009 already has coaching_select_involved: participant or coach on the row.)
-- --------------------------------------------------------------------------
create policy coaching_rel_staff_select on recoveryos.coaching_relationships for select to authenticated
  using (recoveryos.is_admin_staff());
-- Writes remain RPC-only (definer). No direct INSERT/UPDATE policy is added.

-- --------------------------------------------------------------------------
-- support_requests
--   participant: own rows; may self-insert as submitted/open, unclaimed.
--   staff: open pool (discovery) + rows assigned to them; admin: all.
--   claim/assign transitions happen through definer RPCs, not direct UPDATE.
-- --------------------------------------------------------------------------
create policy sr_participant_select on recoveryos.support_requests for select to authenticated
  using (person_id = recoveryos.current_person_id());
create policy sr_participant_insert on recoveryos.support_requests for insert to authenticated
  with check (person_id = recoveryos.current_person_id()
              and status in ('submitted','open')
              and claimed_by_person_id is null
              and coaching_relationship_id is null);
create policy sr_participant_cancel on recoveryos.support_requests for update to authenticated
  using (person_id = recoveryos.current_person_id())
  with check (person_id = recoveryos.current_person_id());
create policy sr_staff_pool_select on recoveryos.support_requests for select to authenticated
  using (recoveryos.is_support_staff()
         and (status in ('submitted','open') or claimed_by_person_id = recoveryos.current_person_id()
              or recoveryos.is_admin_staff()));

create policy sre_parties_select on recoveryos.support_request_events for select to authenticated
  using (exists (select 1 from recoveryos.support_requests s
                 where s.id = support_request_id
                   and (s.person_id = recoveryos.current_person_id()
                        or s.claimed_by_person_id = recoveryos.current_person_id()
                        or recoveryos.is_admin_staff())));

-- --------------------------------------------------------------------------
-- booking_requests / booking_proposals — the two parties + admin
-- --------------------------------------------------------------------------
create policy br_parties_select on recoveryos.booking_requests for select to authenticated
  using (participant_person_id = recoveryos.current_person_id()
         or provider_person_id = recoveryos.current_person_id()
         or recoveryos.is_admin_staff());
create policy br_participant_insert on recoveryos.booking_requests for insert to authenticated
  with check (participant_person_id = recoveryos.current_person_id()
              or (recoveryos.is_support_staff() and provider_person_id = recoveryos.current_person_id()));

create policy bp_parties_select on recoveryos.booking_proposals for select to authenticated
  using (exists (select 1 from recoveryos.booking_requests b
                 where b.id = booking_request_id
                   and (b.participant_person_id = recoveryos.current_person_id()
                        or b.provider_person_id = recoveryos.current_person_id()
                        or recoveryos.is_admin_staff())));

-- --------------------------------------------------------------------------
-- appointments — existing self policies stay; add provider + staff reads.
-- Confirmation/scheduling transitions are RPC-only (no broad UPDATE policy).
-- --------------------------------------------------------------------------
create policy appt_provider_select on recoveryos.appointments for select to authenticated
  using (provider_person_id = recoveryos.current_person_id() or recoveryos.is_admin_staff());

-- --------------------------------------------------------------------------
-- Messaging — membership-scoped. No relationship-history backdoor: access is by
-- conversation_members, and members are added explicitly (RPC), so ending a
-- relationship does not retroactively grant or revoke message visibility.
-- --------------------------------------------------------------------------
create policy conv_member_select on recoveryos.conversations for select to authenticated
  using (id in (select recoveryos.my_conversation_ids()) or recoveryos.is_admin_staff());
create policy convmem_self_select on recoveryos.conversation_members for select to authenticated
  using (person_id = recoveryos.current_person_id()
         or conversation_id in (select recoveryos.my_conversation_ids())
         or recoveryos.is_admin_staff());
create policy msg_member_select on recoveryos.messages for select to authenticated
  using (conversation_id in (select recoveryos.my_conversation_ids()) or recoveryos.is_admin_staff());
create policy msg_member_insert on recoveryos.messages for insert to authenticated
  with check (sender_person_id = recoveryos.current_person_id()
              and conversation_id in (select recoveryos.my_conversation_ids()));
create policy msg_mark_read on recoveryos.messages for update to authenticated
  using (conversation_id in (select recoveryos.my_conversation_ids()))
  with check (conversation_id in (select recoveryos.my_conversation_ids()));

-- --------------------------------------------------------------------------
-- Notifications — recipient only
-- --------------------------------------------------------------------------
create policy notif_own_select on recoveryos.notifications for select to authenticated
  using (recipient_person_id = recoveryos.current_person_id());
create policy notif_own_update on recoveryos.notifications for update to authenticated
  using (recipient_person_id = recoveryos.current_person_id())
  with check (recipient_person_id = recoveryos.current_person_id());
create policy nd_recipient_select on recoveryos.notification_deliveries for select to authenticated
  using (exists (select 1 from recoveryos.notifications n
                 where n.id = notification_id and n.recipient_person_id = recoveryos.current_person_id()));

-- --------------------------------------------------------------------------
-- follow_ups — participant sees own; assigned staff sees theirs; admin all
-- --------------------------------------------------------------------------
create policy fu_scope_select on recoveryos.follow_ups for select to authenticated
  using (person_id = recoveryos.current_person_id()
         or assigned_person_id = recoveryos.current_person_id()
         or recoveryos.is_admin_staff());

-- --------------------------------------------------------------------------
-- Migration ops — admin/system only
-- --------------------------------------------------------------------------
create policy migstate_admin on recoveryos.migration_state for select to authenticated
  using (recoveryos.is_admin_staff());
create policy backfill_admin on recoveryos.backfill_log for select to authenticated
  using (recoveryos.is_admin_staff());

commit;
notify pgrst, 'reload schema';
