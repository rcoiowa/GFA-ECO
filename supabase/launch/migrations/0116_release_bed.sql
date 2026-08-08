-- 0116_release_bed.sql — P4F: the one bed operation 0115 left without an RPC.
-- The Bed Board's "Release bed" action previously updated bed_assignments
-- directly; that policy is gone, so releasing gets the same server-authoritative
-- treatment as assigning: residence-scoped staff, idempotent, audited.

create or replace function recoveryos.release_bed(p_assignment_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_a recoveryos.bed_assignments%rowtype;
  v_residence bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_a from recoveryos.bed_assignments where id = p_assignment_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  select residence_id into v_residence from recoveryos.residencies where id = v_a.residency_id;
  if v_residence not in (select recoveryos.staff_residence_ids()) and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_a.released_at is not null then
    return jsonb_build_object('ok', true, 'code', 'already_released');
  end if;
  update recoveryos.bed_assignments set released_at = now() where id = p_assignment_id;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'residency.bed_released', 'bed_assignments', p_assignment_id, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'code', 'released');
end $$;

revoke execute on function recoveryos.release_bed(bigint) from public, anon;
grant execute on function recoveryos.release_bed(bigint) to authenticated;
