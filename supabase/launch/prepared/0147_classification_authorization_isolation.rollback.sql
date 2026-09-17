-- 0147_classification_authorization_isolation.rollback.sql
--
-- Exact rollback for prepared migration 0147. Restores every touched function
-- to its pre-0147 definition, captured verbatim (pg_get_functiondef) from the
-- isolated Postgres 16 replay of launch 0001–0146 on 2026-09-14, and drops the
-- helper introduced by 0147.
--
-- WARNING: rolling back RESTORES THE P0 VULNERABILITY (test_fixture actors
-- with privileged role assignments satisfy production privileged predicates
-- again). Running this against CQCX requires the same explicit apply authority
-- as 0147 itself, and the reason must be recorded.

begin;

CREATE OR REPLACE FUNCTION recoveryos.has_role(target_role recoveryos.role_key)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'recoveryos', 'public'
AS $function$
  select exists (
    select 1 from role_assignments ra
    where ra.person_id = current_person_id()
      and ra.role_key = target_role
      and ra.revoked_at is null
  );
$function$;
comment on function recoveryos.has_role(recoveryos.role_key) is null;

CREATE OR REPLACE FUNCTION recoveryos.staff_residence_ids()
 RETURNS SETOF bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'recoveryos', 'public'
AS $function$
  select ra.residence_id from role_assignments ra
  where ra.person_id = current_person_id()
    and ra.role_key in ('residence_staff', 'residence_manager')
    and ra.residence_id is not null
    and ra.revoked_at is null;
$function$;

CREATE OR REPLACE FUNCTION recoveryos.is_residence_manager_of(p_residence_id bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'recoveryos', 'public'
AS $function$
  select exists (
    select 1 from recoveryos.role_assignments ra
    where ra.person_id = recoveryos.current_person_id()
      and ra.role_key = 'residence_manager'
      and ra.residence_id = p_residence_id
      and ra.revoked_at is null);
$function$;

CREATE OR REPLACE FUNCTION recoveryos.trg_lead_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'recoveryos', 'public'
AS $function$
declare r record; v_name text;
begin
  begin
    v_name := coalesce(nullif(trim(coalesce(NEW.first_name,'') || ' ' || coalesce(NEW.last_name,'')), ''), NEW.email, 'Someone');
    for r in
      select distinct ra.person_id from recoveryos.role_assignments ra
      where ra.revoked_at is null and ra.role_key::text in ('administrator','coach','navigator')
    loop
      perform recoveryos.emit_notification(r.person_id, 'general', 'New website lead',
        v_name || ' reached out through the website.', '/admin/leads',
        'lead:' || NEW.id || ':' || r.person_id);
    end loop;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'lead_notify_failed', 'leads', NEW.id, jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $function$;

CREATE OR REPLACE FUNCTION recoveryos.trg_listing_submission_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'recoveryos', 'public'
AS $function$
declare r record;
begin
  begin
    for r in
      select distinct ra.person_id from recoveryos.role_assignments ra
      where ra.revoked_at is null
        and ra.role_key::text in ('administrator','system_administrator')
    loop
      perform recoveryos.emit_notification(r.person_id, 'general', 'New residence listing submission',
        coalesce(NEW.residence_name,'A residence') || ' asked to be listed in the directory.',
        '/admin/directory/submissions', 'listing:' || NEW.id || ':' || r.person_id);
    end loop;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'listing_notify_failed', 'residence_listing_submissions', NEW.id,
            jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $function$;

CREATE OR REPLACE FUNCTION recoveryos.trg_application_intake_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'recoveryos', 'public'
AS $function$
declare r record; v_residence text;
begin
  begin
    select name into v_residence from recoveryos.residences where id = NEW.residence_id;
    for r in
      select distinct ra.person_id from recoveryos.role_assignments ra
      where ra.revoked_at is null
        and (ra.residence_id = NEW.residence_id
             or ra.role_key::text in ('navigator','program_manager','administrator','system_administrator'))
    loop
      perform recoveryos.emit_notification(r.person_id, 'general', 'New housing application',
        'A new application came in for ' || coalesce(v_residence,'a residence') || '.',
        '/residences/applications/intake', 'appintake:' || NEW.id || ':' || r.person_id);
    end loop;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'application_intake_notify_failed', 'residence_application_intake', NEW.id,
            jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $function$;

CREATE OR REPLACE FUNCTION recoveryos.grant_role_assignment(p_person_id bigint, p_role recoveryos.role_key, p_organization_id bigint DEFAULT NULL::bigint, p_program_id bigint DEFAULT NULL::bigint, p_residence_id bigint DEFAULT NULL::bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'recoveryos', 'public'
AS $function$
declare
  v_me bigint := recoveryos.current_person_id();
  v_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not exists (select 1 from recoveryos.people where id = p_person_id) then
    return jsonb_build_object('ok', false, 'code', 'person_not_found');
  end if;

  -- Authority: platform admin for anything; residence managers only for
  -- residence_staff/resident WITHIN their own residence.
  if not recoveryos.is_platform_admin() then
    if p_role in ('residence_staff','resident') and p_residence_id is not null
       and recoveryos.is_residence_manager_of(p_residence_id) then
      null; -- authorized within scope
    else
      return jsonb_build_object('ok', false, 'code', 'not_authorized');
    end if;
  end if;
  -- Privilege tier: only a system administrator creates system administrators.
  if p_role = 'system_administrator' and not recoveryos.has_role('system_administrator') then
    return jsonb_build_object('ok', false, 'code', 'privilege_tier',
      'message', 'Only a system administrator can grant that role.');
  end if;
  -- Scope validation.
  if p_role in ('residence_staff','residence_manager','resident') and p_residence_id is null then
    return jsonb_build_object('ok', false, 'code', 'residence_scope_required');
  end if;
  if p_residence_id is not null
     and not exists (select 1 from recoveryos.residences where id = p_residence_id) then
    return jsonb_build_object('ok', false, 'code', 'residence_not_found');
  end if;

  if exists (select 1 from recoveryos.role_assignments
             where person_id = p_person_id and role_key = p_role
               and residence_id is not distinct from p_residence_id
               and program_id is not distinct from p_program_id
               and revoked_at is null) then
    return jsonb_build_object('ok', true, 'code', 'already_granted');
  end if;

  insert into recoveryos.role_assignments
    (person_id, role_key, organization_id, program_id, residence_id, granted_by_person_id)
  values (p_person_id, p_role, coalesce(p_organization_id, 1), p_program_id, p_residence_id, v_me)
  returning id into v_id;

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'role.granted', 'role_assignments', v_id,
          jsonb_build_object('person_id', p_person_id, 'role', p_role, 'residence_id', p_residence_id));

  return jsonb_build_object('ok', true, 'code', 'granted', 'assignment_id', v_id);
end $function$;

drop function if exists recoveryos.is_privileged_role(recoveryos.role_key);

commit;
notify pgrst, 'reload schema';
