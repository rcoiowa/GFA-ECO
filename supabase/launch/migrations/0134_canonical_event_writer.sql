-- 0134_canonical_event_writer.sql — P2.3: one validated internal writer, role-specific wrappers.
--
-- Ratified Option B (P2 ratification §8): role-specific public RPCs converge on ONE internal
-- SECURITY DEFINER writer that owns canonical validation — source, dedupe, attribution,
-- service type, linkages, timestamps. Authorization facts stay in the wrappers, which keep
-- their existing checks verbatim. The internal writer is NEVER a public authenticated RPC
-- (revoked below; preflight step 10 asserts it stays that way).
--
-- Wrapper changes vs 0112/0113/0115:
--   * every wrapper stamps `source` explicitly ('staff_attested' / 'participant_self_reported');
--   * ad-hoc wrappers accept p_dedupe_key (ONE HUMAN ACTION -> ONE KEY; retry-safe);
--     the old exact-started_at equality belts are RETAINED during transition (removed by 0137);
--   * complete_session stops deriving delivery_context from modality (RATIFIED: modality=HOW,
--     delivery_context=setting — a video coaching session is a VRCC service) and drops the
--     coalesce(org,1) fallback: organizational attribution resolves explicitly or the call
--     fails safely ('organization_unresolved'). Historical 'virtual' rows are NOT rewritten.
--   * new record_my_activity: the participant self path (closed 3-type whitelist, provider
--     forced NULL, residence forced NULL, modality self_directed).
--
-- ROLLBACK: drop function recoveryos.record_my_activity(text, recoveryos.delivery_context, timestamptz, uuid);
--           drop function recoveryos.record_navigation_service_event(bigint, recoveryos.service_modality, recoveryos.delivery_context, timestamptz, int, bigint, uuid);
--           drop function recoveryos.record_residence_support_service_event(bigint, recoveryos.service_modality, timestamptz, int, uuid);
--           drop function recoveryos.record_service_event_internal(bigint, bigint, bigint, bigint, bigint, bigint, bigint, recoveryos.delivery_context, recoveryos.service_modality, timestamptz, timestamptz, text, uuid, bigint, bigint, bigint, bigint);
--           then re-run the 0113 complete_session body, the 0112 record_navigation_service_event
--           body, and the 0115 record_residence_support_service_event body (verbatim in those files).

set search_path = recoveryos, public;

-- ---------------------------------------------------------------------------
-- 1) The internal writer. Not callable by clients — wrappers only.
-- ---------------------------------------------------------------------------
create or replace function recoveryos.record_service_event_internal(
  p_person_id bigint,
  p_service_type_id bigint,
  p_provider_person_id bigint,
  p_organization_id bigint,
  p_program_id bigint,
  p_residence_id bigint,
  p_residency_id bigint,
  p_delivery_context recoveryos.delivery_context,
  p_modality recoveryos.service_modality,
  p_started_at timestamptz,
  p_ended_at timestamptz,
  p_source text,
  p_dedupe_key uuid,
  p_appointment_id bigint default null,
  p_coaching_relationship_id bigint default null,
  p_navigation_relationship_id bigint default null,
  p_navigation_referral_id bigint default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_existing bigint;
  v_event_id bigint;
begin
  -- Canonical validation. Authorization is the calling wrapper's job; semantics are ours.
  if p_source is null or p_source not in
     ('participant_self_reported','staff_attested','partner_confirmed','system_derived') then
    return jsonb_build_object('ok', false, 'code', 'invalid_source');
  end if;
  if p_source = 'partner_confirmed' then
    -- RESERVED: no approved partner-confirmation workflow exists (ratification §2.C).
    return jsonb_build_object('ok', false, 'code', 'source_reserved');
  end if;
  if p_organization_id is null then
    return jsonb_build_object('ok', false, 'code', 'organization_unresolved',
      'message', 'Organizational attribution could not be established.');
  end if;
  if not exists (select 1 from recoveryos.service_types
                 where id = p_service_type_id and is_active) then
    return jsonb_build_object('ok', false, 'code', 'invalid_service_type');
  end if;
  if p_started_at is null or p_started_at > now() + interval '5 minutes' then
    return jsonb_build_object('ok', false, 'code', 'invalid_started_at');
  end if;
  -- Residence attribution is complete or absent, never partial (0005 CHECK is the backstop).
  if p_residency_id is not null and p_residence_id is null then
    return jsonb_build_object('ok', false, 'code', 'incomplete_residence_attribution');
  end if;

  -- Idempotency: one human action -> one key, scoped to the acting owner.
  if p_dedupe_key is not null then
    select id into v_existing from recoveryos.service_events
      where coalesce(provider_person_id, person_id)
              = coalesce(p_provider_person_id, p_person_id)
        and dedupe_key = p_dedupe_key;
    if v_existing is not null then
      return jsonb_build_object('ok', true, 'code', 'already_recorded',
                                'service_event_id', v_existing);
    end if;
  end if;

  begin
    insert into recoveryos.service_events
      (person_id, service_type_id, provider_person_id, organization_id, program_id,
       residence_id, residency_id, delivery_context, modality, started_at, ended_at,
       source, dedupe_key, appointment_id, coaching_relationship_id,
       navigation_relationship_id, navigation_referral_id)
    values
      (p_person_id, p_service_type_id, p_provider_person_id, p_organization_id, p_program_id,
       p_residence_id, p_residency_id, p_delivery_context, p_modality, p_started_at,
       p_ended_at, p_source, p_dedupe_key, p_appointment_id, p_coaching_relationship_id,
       p_navigation_relationship_id, p_navigation_referral_id)
    returning id into v_event_id;
  exception when unique_violation then
    -- Raced retry on the dedupe index or the appointment index: same action, one row.
    select id into v_event_id from recoveryos.service_events
      where (p_dedupe_key is not null
             and coalesce(provider_person_id, person_id)
                   = coalesce(p_provider_person_id, p_person_id)
             and dedupe_key = p_dedupe_key)
         or (p_appointment_id is not null and appointment_id = p_appointment_id)
      limit 1;
    return jsonb_build_object('ok', true, 'code', 'already_recorded',
                              'service_event_id', v_event_id);
  end;

  return jsonb_build_object('ok', true, 'code', 'recorded', 'service_event_id', v_event_id);
end $$;

-- Single-organization resolution helper: explicit, never a hard-coded id. Returns NULL
-- (callers fail safely) when attribution is genuinely ambiguous.
create or replace function recoveryos.resolve_sole_organization()
returns bigint language sql stable security definer set search_path = recoveryos, public as $$
  select case when count(*) = 1 then min(id) end from recoveryos.organizations;
$$;

-- ---------------------------------------------------------------------------
-- 2) complete_session — provider (or platform admin) attests a confirmed session.
--    Same signature as 0113; authorization checks unchanged.
-- ---------------------------------------------------------------------------
create or replace function recoveryos.complete_session(
  p_appointment_id bigint, p_duration_minutes int default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_a recoveryos.appointments%rowtype;
  v_existing bigint;
  v_ends timestamptz;
  v_org bigint;
  v_result jsonb;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_a from recoveryos.appointments where id = p_appointment_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_a.provider_person_id <> v_me and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  select id into v_existing from recoveryos.service_events where appointment_id = v_a.id;
  if v_a.status = 'completed' and v_existing is not null then
    return jsonb_build_object('ok', true, 'code', 'already_completed', 'service_event_id', v_existing);
  end if;
  if v_a.status not in ('confirmed','completed') then
    return jsonb_build_object('ok', false, 'code', 'not_completable',
      'message', 'Only a confirmed session can be marked complete.');
  end if;
  if v_a.starts_at > now() then
    return jsonb_build_object('ok', false, 'code', 'not_started_yet',
      'message', 'This session hasn''t started yet.');
  end if;

  v_ends := case when p_duration_minutes is not null
                 then v_a.starts_at + make_interval(mins => p_duration_minutes)
                 else coalesce(v_a.ends_at, v_a.starts_at + interval '50 minutes') end;

  -- Organizational attribution: explicit, never coalesce(...,1). Fail safely.
  v_org := coalesce(v_a.organization_id, recoveryos.resolve_sole_organization());
  if v_org is null then
    return jsonb_build_object('ok', false, 'code', 'organization_unresolved');
  end if;

  update recoveryos.appointments set status = 'completed', updated_at = now() where id = v_a.id;

  -- delivery_context = program setting (RATIFIED): a coaching session is a VRCC service
  -- whatever its channel. Modality carries HOW, untouched. Historical 'virtual' rows stand.
  v_result := recoveryos.record_service_event_internal(
    v_a.person_id, v_a.service_type_id, v_a.provider_person_id, v_org, v_a.program_id,
    null, null, 'vrcc'::recoveryos.delivery_context, v_a.modality,
    v_a.starts_at, v_ends, 'staff_attested', null,
    v_a.id, v_a.coaching_relationship_id, null, null);

  if (v_result->>'ok')::boolean and v_result->>'code' = 'recorded' then
    return jsonb_build_object('ok', true, 'code', 'completed',
                              'service_event_id', v_result->'service_event_id');
  end if;
  if v_result->>'code' = 'already_recorded' then
    return jsonb_build_object('ok', true, 'code', 'already_completed',
                              'service_event_id', v_result->'service_event_id');
  end if;
  return v_result;
end $$;

-- ---------------------------------------------------------------------------
-- 3) record_navigation_service_event — navigator attestation within an active
--    navigation relationship. Adds p_dedupe_key (old signature dropped —
--    PostgREST overload safety); authorization checks unchanged.
-- ---------------------------------------------------------------------------
drop function if exists recoveryos.record_navigation_service_event(
  bigint, recoveryos.service_modality, recoveryos.delivery_context, timestamptz, int, bigint);

create function recoveryos.record_navigation_service_event(
  p_person_id bigint,
  p_modality recoveryos.service_modality default 'phone',
  p_delivery_context recoveryos.delivery_context default 'vrcc',
  p_started_at timestamptz default now(),
  p_duration_minutes int default null,
  p_referral_id bigint default null,
  p_dedupe_key uuid default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel recoveryos.navigation_relationships%rowtype;
  v_service_type bigint;
  v_existing bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_rel from recoveryos.navigation_relationships
    where participant_person_id = p_person_id and navigator_person_id = v_me and status = 'active'
    order by is_primary desc limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Navigation service is recorded within an active navigation relationship.');
  end if;
  if p_referral_id is not null and not exists
     (select 1 from recoveryos.navigation_referrals where id = p_referral_id and person_id = p_person_id) then
    return jsonb_build_object('ok', false, 'code', 'referral_mismatch');
  end if;

  select id into v_service_type from recoveryos.service_types where key = 'resource_navigation';

  -- Transition belt (removed by 0137): same navigator, same instant, same person = one event.
  select id into v_existing from recoveryos.service_events
    where person_id = p_person_id and provider_person_id = v_me
      and service_type_id = v_service_type and started_at = p_started_at;
  if v_existing is not null then
    return jsonb_build_object('ok', true, 'code', 'already_recorded', 'service_event_id', v_existing);
  end if;

  return recoveryos.record_service_event_internal(
    p_person_id, v_service_type, v_me, v_rel.organization_id, null,
    null, null, p_delivery_context, p_modality, p_started_at,
    case when p_duration_minutes is not null
         then p_started_at + make_interval(mins => p_duration_minutes) end,
    'staff_attested', p_dedupe_key, null, null, v_rel.id, p_referral_id);
end $$;

-- ---------------------------------------------------------------------------
-- 4) record_residence_support_service_event — residence staff attestation.
--    Adds p_dedupe_key (old signature dropped); authorization checks unchanged;
--    org resolved from the residence, fail-safe (no coalesce(...,1)).
-- ---------------------------------------------------------------------------
drop function if exists recoveryos.record_residence_support_service_event(
  bigint, recoveryos.service_modality, timestamptz, int);

create function recoveryos.record_residence_support_service_event(
  p_person_id bigint,
  p_modality recoveryos.service_modality default 'in_person',
  p_started_at timestamptz default now(),
  p_duration_minutes int default null,
  p_dedupe_key uuid default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_res recoveryos.residencies%rowtype;
  v_org bigint;
  v_service_type bigint;
  v_existing bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_res from recoveryos.residencies
    where person_id = p_person_id and residency_status in ('active','on_pass','transitioning')
    limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'no_active_residency');
  end if;
  if v_res.residence_id not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Residence support is recorded by staff at the person''s residence.');
  end if;

  select organization_id into v_org from recoveryos.residences where id = v_res.residence_id;
  v_org := coalesce(v_org, recoveryos.resolve_sole_organization());
  if v_org is null then
    return jsonb_build_object('ok', false, 'code', 'organization_unresolved');
  end if;
  select id into v_service_type from recoveryos.service_types where key = 'residence_recovery_support';

  -- Transition belt (removed by 0137).
  select id into v_existing from recoveryos.service_events
    where person_id = p_person_id and provider_person_id = v_me
      and service_type_id = v_service_type and started_at = p_started_at;
  if v_existing is not null then
    return jsonb_build_object('ok', true, 'code', 'already_recorded', 'service_event_id', v_existing);
  end if;

  return recoveryos.record_service_event_internal(
    p_person_id, v_service_type, v_me, v_org, null,
    v_res.residence_id, v_res.id, 'recovery_residence', p_modality, p_started_at,
    case when p_duration_minutes is not null
         then p_started_at + make_interval(mins => p_duration_minutes) end,
    'staff_attested', p_dedupe_key, null, null, null, null);
end $$;

-- ---------------------------------------------------------------------------
-- 5) record_my_activity — the participant self path (RATIFIED closed whitelist).
--    The participant records what THEY did; never "GFA delivered this service".
-- ---------------------------------------------------------------------------
create or replace function recoveryos.record_my_activity(
  p_service_type_key text,
  p_delivery_context recoveryos.delivery_context default 'vrcc',
  p_started_at timestamptz default now(),
  p_dedupe_key uuid default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_service_type bigint;
  v_org bigint;
  v_program bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_service_type_key not in ('daily_check_in','recovery_capital_assessment','recovery_practice') then
    return jsonb_build_object('ok', false, 'code', 'not_self_recordable',
      'message', 'Only your own activities can be self-recorded.');
  end if;
  select id into v_service_type from recoveryos.service_types
    where key = p_service_type_key and is_active;
  if v_service_type is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_service_type');
  end if;

  v_org := recoveryos.resolve_sole_organization();
  if v_org is null then
    return jsonb_build_object('ok', false, 'code', 'organization_unresolved');
  end if;
  if p_delivery_context = 'vrcc' then
    select id into v_program from recoveryos.programs where key = 'vrcc';
  end if;

  return recoveryos.record_service_event_internal(
    v_me, v_service_type, null, v_org, v_program,
    null, null, p_delivery_context, 'self_directed', p_started_at, p_started_at,
    'participant_self_reported', p_dedupe_key, null, null, null, null);
end $$;

-- ---------------------------------------------------------------------------
-- 6) Grants — least privilege. The internal writer is NEVER client-callable.
-- ---------------------------------------------------------------------------
revoke all on function recoveryos.record_service_event_internal(
  bigint, bigint, bigint, bigint, bigint, bigint, bigint,
  recoveryos.delivery_context, recoveryos.service_modality, timestamptz, timestamptz,
  text, uuid, bigint, bigint, bigint, bigint) from public, anon, authenticated;
revoke all on function recoveryos.resolve_sole_organization() from public, anon, authenticated;

revoke execute on function
  recoveryos.complete_session(bigint, int),
  recoveryos.record_navigation_service_event(bigint, recoveryos.service_modality, recoveryos.delivery_context, timestamptz, int, bigint, uuid),
  recoveryos.record_residence_support_service_event(bigint, recoveryos.service_modality, timestamptz, int, uuid),
  recoveryos.record_my_activity(text, recoveryos.delivery_context, timestamptz, uuid)
from public, anon;
grant execute on function
  recoveryos.complete_session(bigint, int),
  recoveryos.record_navigation_service_event(bigint, recoveryos.service_modality, recoveryos.delivery_context, timestamptz, int, bigint, uuid),
  recoveryos.record_residence_support_service_event(bigint, recoveryos.service_modality, timestamptz, int, uuid),
  recoveryos.record_my_activity(text, recoveryos.delivery_context, timestamptz, uuid)
to authenticated;

notify pgrst, 'reload schema';
