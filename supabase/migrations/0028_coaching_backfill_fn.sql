-- RecoveryOS Canonical Coaching Domain — idempotent shadow backfill (P2A).
-- Applied live as recoveryos_0028_coaching_backfill_fn. Defines a rerunnable,
-- non-destructive backfill that projects the live v2_* prototype layer into the
-- canonical shadow tables, keyed by legacy_ref for idempotency.
--
-- SAFETY: additive only. Identity is mapped by the DETERMINISTIC crosswalk
-- (v2_profiles.id == auth.users.id == people.auth_user_id); rows whose people
-- identity is not EXACT/HIGH are SKIPPED and counted, never guessed. Every run
-- writes per-domain reconciliation to recoveryos.backfill_log and returns a
-- summary. Rerunning is safe: legacy_ref NOT EXISTS guards prevent duplicates.
--
-- Admin/service-role only. This is SHADOW population — it does not change any
-- legacy row and does not switch any production read/write.

begin;

create or replace function recoveryos.backfill_coaching_shadow()
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  r jsonb := '{}'::jsonb;
  c_src int; c_map int; c_skip int;
begin
  -- ---- 1. Identity crosswalk ------------------------------------------------
  insert into recoveryos.v2_identity_map (v2_profile_id, person_id, confidence, mapped_via)
  select vp.id, p.id, 'exact', 'auth_user_id'
  from public.v2_profiles vp join recoveryos.people p on p.auth_user_id = vp.id
  on conflict (v2_profile_id) do update
    set person_id = excluded.person_id, confidence = 'exact', mapped_via = 'auth_user_id';

  insert into recoveryos.v2_identity_map (v2_profile_id, person_id, confidence, mapped_via)
  select vp.id, null, 'unmapped', 'no_person_for_auth_user'
  from public.v2_profiles vp
  where not exists (select 1 from recoveryos.people p where p.auth_user_id = vp.id)
  on conflict (v2_profile_id) do nothing;

  select count(*), count(*) filter (where confidence in ('exact','high')),
         count(*) filter (where confidence = 'unmapped')
    into c_src, c_map, c_skip from recoveryos.v2_identity_map;
  insert into recoveryos.backfill_log(domain, source_count, mapped_count, skipped_count, detail)
    values ('identities', (select count(*) from public.v2_profiles), c_map, c_skip,
            jsonb_build_object('unmapped_are_auth_users_without_person_row', true));
  r := r || jsonb_build_object('identities', jsonb_build_object('mapped', c_map, 'unmapped', c_skip));

  -- ---- 2. Relationships (v2_coach_assignments -> coaching_relationships) -----
  insert into recoveryos.coaching_relationships
    (participant_person_id, coach_person_id, organization_id, started_at,
     status, relationship_type, is_primary, assignment_source, legacy_ref)
  select mp.person_id, mc.person_id, 1, a.created_at::date,
         'active','coach', true, 'backfill', a.id
  from public.v2_coach_assignments a
  join recoveryos.v2_identity_map mp on mp.v2_profile_id = a.participant_id and mp.confidence in ('exact','high')
  join recoveryos.v2_identity_map mc on mc.v2_profile_id = a.coach_id and mc.confidence in ('exact','high')
  where a.is_active
    and not exists (select 1 from recoveryos.coaching_relationships cr where cr.legacy_ref = a.id)
    and not exists (select 1 from recoveryos.coaching_relationships cr
                    where cr.participant_person_id = mp.person_id and cr.status='active' and cr.is_primary);
  get diagnostics c_map = row_count;
  select count(*) into c_src from public.v2_coach_assignments where is_active;
  insert into recoveryos.backfill_log(domain, source_count, mapped_count, skipped_count)
    values ('relationships', c_src, c_map, c_src - c_map);
  r := r || jsonb_build_object('relationships', jsonb_build_object('source', c_src, 'mapped', c_map));

  -- ---- 3. Support requests (the "need" half of v2_session_requests) ----------
  insert into recoveryos.support_requests
    (person_id, service_type_id, request_type, focus, preferred_modality, status,
     delivery_context, organization_id, program_id, legacy_ref, created_at)
  select mp.person_id,
         (select id from recoveryos.service_types where key =
            case sr.session_type
              when 'recovery_coach' then 'coaching_session'
              when 'life_coach' then 'coaching_session'
              when 'peer_support' then 'peer_support'
              when 'navigation' then 'navigation'
              when 'needs_assessment' then 'support_request'
              else 'coaching_session' end),
         sr.session_type, nullif(sr.topic,''), sr.mode::text::recoveryos.service_modality,
         case sr.status
           when 'requested' then 'open'
           when 'times_suggested' then 'open'
           when 'counter_proposed' then 'open'
           when 'confirmed' then 'scheduled'
           when 'completed' then 'resolved'
           when 'cancelled' then 'cancelled'
           else 'open' end,
         'vrcc', 1, 1, sr.id, sr.created_at
  from public.v2_session_requests sr
  join recoveryos.v2_identity_map mp on mp.v2_profile_id = sr.participant_id and mp.confidence in ('exact','high')
  where not exists (select 1 from recoveryos.support_requests s where s.legacy_ref = sr.id);
  get diagnostics c_map = row_count;
  select count(*) into c_src from public.v2_session_requests;
  select count(*) into c_skip from public.v2_session_requests sr
    where not exists (select 1 from recoveryos.v2_identity_map mp
                      where mp.v2_profile_id = sr.participant_id and mp.confidence in ('exact','high'));
  insert into recoveryos.backfill_log(domain, source_count, mapped_count, skipped_count, detail)
    values ('support_requests', c_src, c_map, c_skip,
            jsonb_build_object('skipped_reason','participant identity unmapped'));
  r := r || jsonb_build_object('support_requests', jsonb_build_object('source', c_src, 'mapped', c_map, 'skipped_unmapped', c_skip));

  -- ---- 4. Conversations + messages (v2_direct_messages) ---------------------
  --   A conversation exists per (participant, coach) pair; members added explicitly.
  insert into recoveryos.conversations (participant_person_id, coach_person_id, context, legacy_ref)
  select distinct mp.person_id, mc.person_id, 'coaching', null::uuid
  from public.v2_direct_messages d
  join recoveryos.v2_identity_map mp on mp.v2_profile_id = d.participant_id and mp.confidence in ('exact','high')
  join recoveryos.v2_identity_map mc on mc.v2_profile_id = d.coach_id and mc.confidence in ('exact','high')
  where not exists (select 1 from recoveryos.conversations c
                    where c.participant_person_id = mp.person_id and c.coach_person_id = mc.person_id and c.context='coaching');
  -- members
  insert into recoveryos.conversation_members (conversation_id, person_id, member_role)
  select c.id, c.participant_person_id, 'participant' from recoveryos.conversations c
  where not exists (select 1 from recoveryos.conversation_members m where m.conversation_id=c.id and m.person_id=c.participant_person_id);
  insert into recoveryos.conversation_members (conversation_id, person_id, member_role)
  select c.id, c.coach_person_id, 'coach' from recoveryos.conversations c
  where not exists (select 1 from recoveryos.conversation_members m where m.conversation_id=c.id and m.person_id=c.coach_person_id);
  -- messages (only where BOTH endpoints mapped; ambiguous sender => skip)
  insert into recoveryos.messages (conversation_id, sender_person_id, body, read_at, legacy_ref, created_at)
  select c.id, ms.person_id, d.body, d.read_at, d.id, d.created_at
  from public.v2_direct_messages d
  join recoveryos.v2_identity_map mp on mp.v2_profile_id = d.participant_id and mp.confidence in ('exact','high')
  join recoveryos.v2_identity_map mc on mc.v2_profile_id = d.coach_id and mc.confidence in ('exact','high')
  join recoveryos.v2_identity_map ms on ms.v2_profile_id = d.sender_id and ms.confidence in ('exact','high')
  join recoveryos.conversations c on c.participant_person_id=mp.person_id and c.coach_person_id=mc.person_id and c.context='coaching'
  where not exists (select 1 from recoveryos.messages m where m.legacy_ref = d.id);
  get diagnostics c_map = row_count;
  select count(*) into c_src from public.v2_direct_messages;
  insert into recoveryos.backfill_log(domain, source_count, mapped_count, skipped_count)
    values ('messages', c_src, c_map, c_src - c_map);
  r := r || jsonb_build_object('messages', jsonb_build_object('source', c_src, 'mapped', c_map));

  -- ---- 5. Notifications ------------------------------------------------------
  insert into recoveryos.notifications (recipient_person_id, kind, title, body, link_path, read_at, legacy_ref, created_at)
  select mp.person_id, n.kind::text, n.title, n.body, n.link_path, n.read_at, n.id, n.created_at
  from public.v2_notifications n
  join recoveryos.v2_identity_map mp on mp.v2_profile_id = n.recipient_id and mp.confidence in ('exact','high')
  where not exists (select 1 from recoveryos.notifications rn where rn.legacy_ref = n.id);
  get diagnostics c_map = row_count;
  select count(*) into c_src from public.v2_notifications;
  select count(*) into c_skip from public.v2_notifications n
    where not exists (select 1 from recoveryos.v2_identity_map mp
                      where mp.v2_profile_id = n.recipient_id and mp.confidence in ('exact','high'));
  insert into recoveryos.backfill_log(domain, source_count, mapped_count, skipped_count, detail)
    values ('notifications', c_src, c_map, c_skip, jsonb_build_object('skipped_reason','recipient identity unmapped'));
  r := r || jsonb_build_object('notifications', jsonb_build_object('source', c_src, 'mapped', c_map, 'skipped_unmapped', c_skip));

  return r || jsonb_build_object('ran_at', now());
end $$;

revoke execute on function recoveryos.backfill_coaching_shadow() from public, anon, authenticated;

commit;
