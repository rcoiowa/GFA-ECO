-- 0137_self_insert_retirement.sql — P2.5 closeout: retire direct participant inserts.
--
-- Executive decision 2026-08-23:
-- docs/decisions/2026-08-23-p2-direct-insert-retirement.md supersedes only the original
-- 14-day elapsed-time telemetry requirement. The replacement gate is current confirmation
-- of no live participant use + zero production-person direct self-inserts + deterministic
-- post-apply verification. Provenance, RLS, idempotency, least privilege, and rollback remain.
--
-- This migration:
--   1) ABORTS if any production-person direct self-insert fingerprint exists;
--   2) drops the compatibility service_events_insert_self policy;
--   3) tightens the provenance guard so every INSERT must carry explicit source;
--   4) removes the exact-started_at transition belts from navigation/residence wrappers;
--   5) reasserts client-wrapper and internal-writer privilege boundaries;
--   6) verifies the retired path is absent before commit.
--
-- The participant self-record path remains recoveryos.record_my_activity(...), which stamps
-- participant_self_reported and routes through record_service_event_internal(...).
--
-- ROLLBACK (only if required before real participant traffic):
--   A) restore the 0135 compatibility policy service_events_insert_self;
--   B) restore the transition-stamping guard body from 0133;
--   C) restore the two timestamp-equality belts from 0134.
-- Exact prior definitions remain preserved in migrations 0133-0135 and Git history.

set search_path = recoveryos, public;

-- ---------------------------------------------------------------------------
-- 0) Replacement gate: do not retire the direct path if production-person direct
--    self inserts exist. Fixture/test records are intentionally excluded.
-- ---------------------------------------------------------------------------
do $$
declare
  v_production_direct bigint;
begin
  select count(*) into v_production_direct
  from recoveryos.service_events se
  where se.source = 'participant_self_reported'
    and se.dedupe_key is null
    and recoveryos.is_production_person(se.person_id);

  if v_production_direct <> 0 then
    raise exception
      'P2 0137 ABORT: % production-person direct self-insert service event(s) exist; reconcile before retirement',
      v_production_direct;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1) Retire the compatibility direct table-insert path.
-- ---------------------------------------------------------------------------
drop policy if exists service_events_insert_self on recoveryos.service_events;

-- ---------------------------------------------------------------------------
-- 2) Provenance guard is now strict: every writer must stamp source explicitly.
--    UPDATE immutability remains unchanged.
-- ---------------------------------------------------------------------------
create or replace function recoveryos.service_events_provenance_guard()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
begin
  if tg_op = 'UPDATE' then
    if new.source is distinct from old.source
       or new.dedupe_key is distinct from old.dedupe_key then
      raise exception 'service_events.source and dedupe_key are immutable';
    end if;
    return new;
  end if;

  if new.source is null then
    raise exception 'service event rejected: explicit provenance source is required';
  end if;

  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 3) Navigation attestation: idempotency is now dedupe-key based only.
--    Distinct real contacts at the same timestamp remain representable.
-- ---------------------------------------------------------------------------
create or replace function recoveryos.record_navigation_service_event(
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
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;

  select * into v_rel from recoveryos.navigation_relationships
    where participant_person_id = p_person_id
      and navigator_person_id = v_me
      and status = 'active'
    order by is_primary desc
    limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Navigation service is recorded within an active navigation relationship.');
  end if;

  if p_referral_id is not null and not exists (
    select 1 from recoveryos.navigation_referrals
    where id = p_referral_id and person_id = p_person_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'referral_mismatch');
  end if;

  select id into v_service_type
  from recoveryos.service_types
  where key = 'resource_navigation';

  return recoveryos.record_service_event_internal(
    p_person_id, v_service_type, v_me, v_rel.organization_id, null,
    null, null, p_delivery_context, p_modality, p_started_at,
    case when p_duration_minutes is not null
         then p_started_at + make_interval(mins => p_duration_minutes) end,
    'staff_attested', p_dedupe_key, null, null, v_rel.id, p_referral_id);
end $$;

-- ---------------------------------------------------------------------------
-- 4) Residence support attestation: same dedupe-key-only retirement.
-- ---------------------------------------------------------------------------
create or replace function recoveryos.record_residence_support_service_event(
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
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;

  select * into v_res from recoveryos.residencies
    where person_id = p_person_id
      and residency_status in ('active','on_pass','transitioning')
    limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'no_active_residency');
  end if;

  if v_res.residence_id not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Residence support is recorded by staff at the person''s residence.');
  end if;

  select organization_id into v_org
  from recoveryos.residences
  where id = v_res.residence_id;

  v_org := coalesce(v_org, recoveryos.resolve_sole_organization());
  if v_org is null then
    return jsonb_build_object('ok', false, 'code', 'organization_unresolved');
  end if;

  select id into v_service_type
  from recoveryos.service_types
  where key = 'residence_recovery_support';

  return recoveryos.record_service_event_internal(
    p_person_id, v_service_type, v_me, v_org, null,
    v_res.residence_id, v_res.id, 'recovery_residence', p_modality, p_started_at,
    case when p_duration_minutes is not null
         then p_started_at + make_interval(mins => p_duration_minutes) end,
    'staff_attested', p_dedupe_key, null, null, null, null);
end $$;

-- ---------------------------------------------------------------------------
-- 5) Reassert least privilege. Internal helpers remain non-client-callable;
--    approved wrappers remain authenticated-only.
-- ---------------------------------------------------------------------------
revoke all on function recoveryos.record_service_event_internal(
  bigint, bigint, bigint, bigint, bigint, bigint, bigint,
  recoveryos.delivery_context, recoveryos.service_modality, timestamptz, timestamptz,
  text, uuid, bigint, bigint, bigint, bigint) from public, anon, authenticated;
revoke all on function recoveryos.resolve_sole_organization() from public, anon, authenticated;

revoke execute on function
  recoveryos.record_navigation_service_event(bigint, recoveryos.service_modality, recoveryos.delivery_context, timestamptz, int, bigint, uuid),
  recoveryos.record_residence_support_service_event(bigint, recoveryos.service_modality, timestamptz, int, uuid),
  recoveryos.record_my_activity(text, recoveryos.delivery_context, timestamptz, uuid)
from public, anon;

grant execute on function
  recoveryos.record_navigation_service_event(bigint, recoveryos.service_modality, recoveryos.delivery_context, timestamptz, int, bigint, uuid),
  recoveryos.record_residence_support_service_event(bigint, recoveryos.service_modality, timestamptz, int, uuid),
  recoveryos.record_my_activity(text, recoveryos.delivery_context, timestamptz, uuid)
to authenticated;

-- ---------------------------------------------------------------------------
-- 6) In-migration postconditions. Fail atomically if retirement is incomplete.
-- ---------------------------------------------------------------------------
do $$
declare
  v_guard text;
  v_nav text;
  v_res text;
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'recoveryos'
      and tablename = 'service_events'
      and cmd = 'INSERT'
  ) then
    raise exception 'P2 0137 FAIL: a direct service_events INSERT policy still exists';
  end if;

  select p.prosrc into v_guard
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'recoveryos'
    and p.proname = 'service_events_provenance_guard';

  if v_guard is null or v_guard not like '%explicit provenance source is required%'
     or v_guard like '%new.source :=%' then
    raise exception 'P2 0137 FAIL: provenance guard is not in strict explicit-source mode';
  end if;

  select p.prosrc into v_nav
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'recoveryos'
    and p.proname = 'record_navigation_service_event';

  select p.prosrc into v_res
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'recoveryos'
    and p.proname = 'record_residence_support_service_event';

  if v_nav like '%service_type_id = v_service_type and started_at = p_started_at%'
     or v_res like '%service_type_id = v_service_type and started_at = p_started_at%' then
    raise exception 'P2 0137 FAIL: exact-timestamp transition belt still present';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'recoveryos'
      and p.proname in ('record_service_event_internal','resolve_sole_organization')
      and (has_function_privilege('anon', p.oid, 'EXECUTE')
        or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
  ) then
    raise exception 'P2 0137 FAIL: internal event writer/helper executable by client role';
  end if;
end $$;

notify pgrst, 'reload schema';
