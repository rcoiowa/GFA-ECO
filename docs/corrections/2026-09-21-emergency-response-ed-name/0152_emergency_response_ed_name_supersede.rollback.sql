-- 0152_emergency_response_ed_name_supersede.rollback.sql
-- Rollback for the D28 v1.1 supersession. Reversible WITHOUT deleting evidence.
-- Safe only while v1.1 carries no assignments (assignments are immutable evidence).
-- Effect: v1.1 is unpublished and removed; v1.0 remains the latest published edition.
-- v1.0 is never touched by this rollback.

set search_path = recoveryos, public;

do $$
declare v_tpl bigint; v_asg int;
begin
  select t.id into v_tpl
  from recoveryos.document_templates t
  join recoveryos.organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
  where t.key = 'emergency_response_protocols';
  if v_tpl is null then
    raise exception 'D28 ROLLBACK: template not found';
  end if;

  select count(*) into v_asg
  from recoveryos.document_assignments a
  join recoveryos.document_versions dv on dv.id = a.document_version_id
  where dv.template_id = v_tpl and dv.version = '1.1';
  if v_asg > 0 then
    raise exception 'D28 ROLLBACK BLOCKED: v1.1 has % assignment(s) — immutable evidence, do not delete', v_asg;
  end if;

  update recoveryos.document_versions set published_at = null
   where template_id = v_tpl and version = '1.1';
  delete from recoveryos.document_versions
   where template_id = v_tpl and version = '1.1' and published_at is null;

  raise notice 'D28 ROLLBACK OK: v1.1 removed; v1.0 restored as latest published.';
end $$;

notify pgrst, 'reload schema';
