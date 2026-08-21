-- LAUNCH 0124 — Booking write integrity (PR #6 review remediation).
--
-- Corrects two defects in functions first defined by 0100_launch_coaching_write.sql.
-- 0100 is ALREADY APPLIED on the live RecoveryOS-Launch project (ledger verified
-- read-only 2026-08-18), so per migration discipline its history is not edited:
-- this additive migration re-creates the two functions with the fixes.
-- (0123 is deliberately skipped: that number identifies the out-of-band
-- housing_applications least-privilege hardening recorded in
-- supabase/live-drift/cqcx/0123_housing_applications_least_privilege.APPLIED.sql.)
--
--   FIX 1 — create_booking_request: a caller could attach ANOTHER participant's
--   support_request_id while booking for their own participant_person_id; the
--   foreign request was linked and later flipped to 'scheduled' by
--   accept_booking_proposal. The function now rejects a non-null
--   p_support_request_id unless that request belongs to p_participant_person_id.
--
--   FIX 2 — propose_booking_times: the current round of proposals was
--   deactivated BEFORE validating the replacement times. Because the RPC
--   reports failure by returning JSON (no exception), the transaction committed
--   and a counter-offer with only past/empty timestamps silently destroyed
--   every time the other party could still accept. Validation now happens
--   first; a no_valid_times failure leaves existing proposals untouched.
--   (counter_propose_booking_times delegates here and inherits the fix.)
--
-- Static regression guard: scripts/verify-booking-integrity.mjs (wired into CI).

begin;

set search_path = recoveryos, public;

-- ---------------------------------------------------------------------------
-- FIX 1 — support-request ownership is enforced server-side before any write.
-- ---------------------------------------------------------------------------
create or replace function recoveryos.create_booking_request(
  p_participant_person_id bigint,
  p_provider_person_id    bigint,
  p_support_request_id    bigint,
  p_service_type_id       bigint,
  p_modality              text,
  p_duration_minutes      int,
  p_note                  text,
  p_starts                timestamptz[]
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel bigint;
  v_bk bigint;
  v_start timestamptz;
  v_dur int := coalesce(p_duration_minutes, 50);
  v_mod recoveryos.service_modality := coalesce(p_modality,'video')::recoveryos.service_modality;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not (
       v_me = p_participant_person_id
    or (v_me = p_provider_person_id and recoveryos.is_support_staff())
    or recoveryos.is_admin_staff()
  ) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  -- A linked support request must belong to the participant being booked for.
  -- Without this, accept_booking_proposal would later mark a FOREIGN person's
  -- request 'scheduled' (cross-participant workflow corruption).
  if p_support_request_id is not null then
    if not exists (
      select 1 from recoveryos.support_requests sr
      where sr.id = p_support_request_id
        and sr.person_id = p_participant_person_id
    ) then
      return jsonb_build_object('ok', false, 'code', 'support_request_mismatch',
        'message', 'That support request does not belong to this participant.');
    end if;
  end if;

  if p_provider_person_id is not null then
    select id into v_rel from recoveryos.coaching_relationships
      where participant_person_id = p_participant_person_id
        and coach_person_id = p_provider_person_id
        and status = 'active'
      order by is_primary desc limit 1;
    if v_rel is null and not recoveryos.is_admin_staff() then
      return jsonb_build_object('ok', false, 'code', 'no_relationship',
        'message', 'A coaching relationship is needed before a session can be booked.');
    end if;
  end if;

  insert into recoveryos.booking_requests
    (support_request_id, participant_person_id, provider_person_id, coaching_relationship_id,
     service_type_id, modality, duration_minutes, status, initiated_by_person_id, note)
  values
    (p_support_request_id, p_participant_person_id, p_provider_person_id, v_rel,
     coalesce(p_service_type_id, 1), v_mod, v_dur, 'open', v_me, nullif(p_note,''))
  returning id into v_bk;

  if p_starts is not null then
    foreach v_start in array p_starts loop
      if v_start > now() then
        insert into recoveryos.booking_proposals
          (booking_request_id, proposed_by_person_id, proposed_start, proposed_end, round, is_active)
        values (v_bk, v_me, v_start, v_start + make_interval(mins => v_dur), 1, true);
      end if;
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'code', 'created', 'booking_request_id', v_bk);
end $$;
revoke execute on function recoveryos.create_booking_request(bigint,bigint,bigint,bigint,text,int,text,timestamptz[]) from public, anon;
grant execute on function recoveryos.create_booking_request(bigint,bigint,bigint,bigint,text,int,text,timestamptz[]) to authenticated;

-- ---------------------------------------------------------------------------
-- FIX 2 — validate replacement times BEFORE deactivating the current round.
-- now() is transaction-stable, so the validation count and the insert loop
-- always agree within one call.
-- ---------------------------------------------------------------------------
create or replace function recoveryos.propose_booking_times(
  p_booking_request_id bigint,
  p_starts timestamptz[]
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_bk recoveryos.booking_requests%rowtype;
  v_round int;
  v_start timestamptz;
  v_n int := 0;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_bk from recoveryos.booking_requests where id = p_booking_request_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_me not in (v_bk.participant_person_id, coalesce(v_bk.provider_person_id,-1))
     and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_bk.status <> 'open' then return jsonb_build_object('ok', false, 'code', 'not_open'); end if;

  -- Reject the counter-offer BEFORE touching the current round: a failed
  -- replacement must leave the other party's acceptable times intact.
  select count(*) into v_n
    from unnest(coalesce(p_starts, array[]::timestamptz[])) as t(ts)
    where t.ts > now();
  if v_n = 0 then
    return jsonb_build_object('ok', false, 'code', 'no_valid_times',
      'message', 'Add at least one future time.');
  end if;

  select coalesce(max(round),0)+1 into v_round from recoveryos.booking_proposals where booking_request_id = v_bk.id;
  update recoveryos.booking_proposals set is_active = false where booking_request_id = v_bk.id and is_active;

  v_n := 0;
  foreach v_start in array p_starts loop
    if v_start > now() then
      insert into recoveryos.booking_proposals
        (booking_request_id, proposed_by_person_id, proposed_start, proposed_end, round, is_active)
      values (v_bk.id, v_me, v_start, v_start + make_interval(mins => v_bk.duration_minutes), v_round, true);
      v_n := v_n + 1;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'code', 'proposed', 'round', v_round, 'count', v_n);
end $$;
revoke execute on function recoveryos.propose_booking_times(bigint,timestamptz[]) from public, anon;
grant execute on function recoveryos.propose_booking_times(bigint,timestamptz[]) to authenticated;

commit;
