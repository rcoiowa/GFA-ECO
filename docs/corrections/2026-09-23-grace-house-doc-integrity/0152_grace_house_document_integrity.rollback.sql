-- 0152_grace_house_document_integrity.rollback.sql
-- Reverses 0152_grace_house_document_integrity.prepared.sql.
--
-- STATUS: PREPARED ONLY — execution is not authorized here. Runs only under the
-- same separate apply authorization that governs the forward migration, and only
-- to undo a 0152 apply.
--
-- SAFETY MODEL (non-negotiable):
--   * Placeholder editions and their resident acknowledgments are IMMUTABLE
--     historical evidence. This rollback NEVER updates or deletes a placeholder
--     version row, a document_assignments row, or an acknowledged_at value.
--   * The four new full editions (emergency v1.1, curfew v2.1, exit v2.1,
--     grievance v1.1) are removed ONLY while unassigned. If ANY new-version row
--     is referenced by a document_assignments row (assigned or acknowledged),
--     the rollback ABORTS and removes nothing — an acknowledgment against the
--     full edition is itself evidence that must be preserved and adjudicated by
--     a human, not silently discarded.
--   * The seven withdrawn templates are re-activated (is_active=true) to restore
--     the pre-0152 resident/readable surface.
--
-- This rollback restores the template surface and unpublishes the new editions;
-- it does not attempt to reconstruct published_at ordering beyond removing the
-- rows 0152 inserted.

set search_path = recoveryos, public;

-- ============ GUARD: refuse to delete any assigned/acknowledged new edition ============
do $$
declare v_refs int;
begin
  select count(*) into v_refs
  from recoveryos.document_assignments a
  join recoveryos.document_versions dv on dv.id = a.document_version_id
  join recoveryos.document_templates t on t.id = dv.template_id
  join recoveryos.organizations o on o.id = t.organization_id and o.name='Grace For Addictions'
  where (t.key='emergency_response_protocols' and dv.version='1.1')
     or (t.key='curfew_pass_policy'            and dv.version='2.1')
     or (t.key='exit_transition_policy'        and dv.version='2.1')
     or (t.key='grievance_policy_form'         and dv.version='1.1');
  if v_refs <> 0 then
    raise exception 'D0152 ROLLBACK ABORT: % assignment/acknowledgment row(s) reference a 0152 full edition; rollback would destroy evidence. Resolve with a human before removing editions.', v_refs;
  end if;
  raise notice 'D0152 rollback guard passed: no assignments reference the new editions.';
end $$;

-- ============ REVERSE APPLY 1: remove the 4 superseding editions (unassigned only) ============
delete from recoveryos.document_versions dv
using recoveryos.document_templates t, recoveryos.organizations o
where dv.template_id = t.id and t.organization_id = o.id and o.name='Grace For Addictions'
  and (
        (t.key='emergency_response_protocols' and dv.version='1.1')
     or (t.key='curfew_pass_policy'            and dv.version='2.1')
     or (t.key='exit_transition_policy'        and dv.version='2.1')
     or (t.key='grievance_policy_form'         and dv.version='1.1')
  )
  and not exists (select 1 from recoveryos.document_assignments a where a.document_version_id = dv.id);

-- ============ REVERSE APPLY 2 + 3: re-activate the 7 withdrawn templates ============
update recoveryos.document_templates t
set is_active=true
from recoveryos.organizations o
where o.id=t.organization_id and o.name='Grace For Addictions'
  and t.key in (
    'complete_operational_system','code_of_ethics','incident_report_system',
    'change_course_leaders_policy','narr_ii_self_assessment',
    'form_application_prescreening','intake_forms_package'
  )
  and t.is_active=false;

-- ============ ROLLBACK POSTCHECKS ============
do $$
declare v_remaining int; v_reactivated int; v_ph int;
begin
  -- the four new editions must be gone
  select count(*) into v_remaining
  from recoveryos.document_versions dv
  join recoveryos.document_templates t on t.id=dv.template_id
  join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions'
  where (t.key='emergency_response_protocols' and dv.version='1.1')
     or (t.key='curfew_pass_policy'            and dv.version='2.1')
     or (t.key='exit_transition_policy'        and dv.version='2.1')
     or (t.key='grievance_policy_form'         and dv.version='1.1');
  if v_remaining <> 0 then raise exception 'D0152 ROLLBACK POSTCHECK: % new edition(s) still present', v_remaining; end if;

  -- the four placeholders must still exist, untouched
  select count(*) into v_ph
  from recoveryos.document_versions dv
  join recoveryos.document_templates t on t.id=dv.template_id
  join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions'
  where (t.key='emergency_response_protocols' and dv.version='1.0' and dv.content_hash='bd3010c48bc3d809695b96b5a28fd18678a0ba5fb2289f2f8ff8a873c5576a34')
     or (t.key='curfew_pass_policy'            and dv.version='2.0' and dv.content_hash='142fc1e5e53e97c7440ac8519a4d4a42eaf19671654a677de1cf13af2e417bfe')
     or (t.key='exit_transition_policy'        and dv.version='2.0' and dv.content_hash='8e7c46d1866a82c37abfa6e0e37d2b9789b63cdce389da86a4033d10bb88f328')
     or (t.key='grievance_policy_form'         and dv.version='1.0' and dv.content_hash='a56c94ceb2afe712ba9c3c64070c9f8b73300333fb7739439473a24843cb0666');
  if v_ph <> 4 then raise exception 'D0152 ROLLBACK POSTCHECK: placeholder set count % != 4 (placeholders must be preserved unchanged)', v_ph; end if;

  -- the seven withdrawn templates must be active again
  select count(*) into v_reactivated
  from recoveryos.document_templates t
  join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions'
  where t.key in (
      'complete_operational_system','code_of_ethics','incident_report_system',
      'change_course_leaders_policy','narr_ii_self_assessment',
      'form_application_prescreening','intake_forms_package'
    ) and t.is_active=true;
  if v_reactivated <> 7 then raise exception 'D0152 ROLLBACK POSTCHECK: reactivated count % != 7', v_reactivated; end if;

  raise notice 'D0152 rollback OK: 4 editions removed; 4 placeholders preserved; 7 templates reactivated.';
end $$;

notify pgrst, 'reload schema';
