-- RecoveryOS Identity Provisioning (P3A). Applied live as recoveryos_0029_person_provisioning.
-- Idempotent, auditable provisioning of a canonical person from an authenticated user.
--
-- SECURITY BOUNDARY (the core P3A rule):
--   * Creating a people row is DETERMINISTIC identity (auth_user_id is unique, verified).
--   * Granting a role is a SECURITY OPERATION. This function grants ONLY the baseline
--     'participant' role (the same default as ensure_person_for_current_user). It NEVER
--     reads v2_profiles.role or any profile text to grant coach/navigator/manager/admin.
--     Privileged roles must be granted by a separate, explicitly-authorized admin action
--     from verified evidence — never inferred here.
--   * Definer function, revoked from anon/authenticated; only service_role / admins run it.
--
-- Idempotent: returns the existing person if auth_user_id is already provisioned; the
-- participant grant is guarded by NOT EXISTS; the crosswalk is upserted. Safe on retry.

begin;

create or replace function recoveryos.provision_person_from_auth(
  p_auth_user_id uuid,
  p_first_name text,
  p_last_name  text,
  p_v2_profile_id uuid default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_person_id bigint;
  v_created boolean := false;
  v_granted boolean := false;
begin
  if p_auth_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'no_auth_user');
  end if;
  -- must be a real auth user
  if not exists (select 1 from auth.users u where u.id = p_auth_user_id) then
    return jsonb_build_object('ok', false, 'code', 'invalid_source', 'message', 'No such auth user.');
  end if;

  -- idempotent: existing canonical person for this auth user wins
  select id into v_person_id from recoveryos.people where auth_user_id = p_auth_user_id;
  if v_person_id is null then
    insert into recoveryos.people (auth_user_id, first_name, last_name)
    values (p_auth_user_id, coalesce(nullif(trim(p_first_name),''),'Friend'),
                             coalesce(nullif(trim(p_last_name),''),''))
    returning id into v_person_id;
    v_created := true;
    -- baseline profile (mirrors ensure_person_for_current_user)
    insert into recoveryos.person_profiles (person_id, accessibility_preferences, communication_preferences, timezone)
    values (v_person_id, '{}'::jsonb, '{}'::jsonb, 'America/Chicago')
    on conflict (person_id) do nothing;
  end if;

  -- baseline participant role ONLY (never a privileged role from here)
  if not exists (select 1 from recoveryos.role_assignments
                 where person_id = v_person_id and role_key = 'participant' and revoked_at is null) then
    insert into recoveryos.role_assignments (person_id, role_key, granted_at)
    values (v_person_id, 'participant', now());
    v_granted := true;
  end if;

  -- crosswalk (exact — auth_user_id identity is deterministic)
  if p_v2_profile_id is not null then
    insert into recoveryos.v2_identity_map (v2_profile_id, person_id, confidence, mapped_via)
    values (p_v2_profile_id, v_person_id, 'exact', 'provisioned_auth_user_id')
    on conflict (v2_profile_id) do update
      set person_id = excluded.person_id, confidence = 'exact', mapped_via = 'provisioned_auth_user_id';
  end if;

  return jsonb_build_object('ok', true, 'code', 'provisioned', 'person_id', v_person_id,
    'created', v_created, 'granted_participant', v_granted);
end $$;

revoke execute on function recoveryos.provision_person_from_auth(uuid, text, text, uuid) from public, anon, authenticated;

commit;
