-- support_workflow_org_authorization.rollback.sql
--
-- STATUS: PREPARED ONLY. Reverses support_workflow_org_authorization.prepared.sql,
-- restoring the prior live definitions verbatim: claim_support_request (0112),
-- list_open_support_requests (0120), and the three 0026 policies
-- (sr_staff_pool_select, coaching_rel_staff_select, sre_parties_select); and dropping
-- the new *_in_org helpers and handoff_support_request.
--
-- DATA NOTE: this rollback restores FUNCTION/POLICY DEFINITIONS only. It does NOT
-- revert data rows written while the fix was live (e.g., coaching/navigation
-- relationships created with the request's real organization_id instead of 1, or
-- support_requests moved by handoff). Those rows are correct and are intentionally
-- left in place; reverting them would be a data change requiring separate authorization.

set search_path = recoveryos, public;

begin;

-- 1) Restore policies to the 0026 originals.
drop policy if exists sr_staff_pool_select on recoveryos.support_requests;
create policy sr_staff_pool_select on recoveryos.support_requests for select to authenticated
  using (recoveryos.is_support_staff()
         and (status in ('submitted','open') or claimed_by_person_id = recoveryos.current_person_id()
              or recoveryos.is_admin_staff()));

drop policy if exists coaching_rel_staff_select on recoveryos.coaching_relationships;
create policy coaching_rel_staff_select on recoveryos.coaching_relationships for select to authenticated
  using (recoveryos.is_admin_staff());

drop policy if exists sre_parties_select on recoveryos.support_request_events;
create policy sre_parties_select on recoveryos.support_request_events for select to authenticated
  using (exists (select 1 from recoveryos.support_requests s
                 where s.id = support_request_id
                   and (s.person_id = recoveryos.current_person_id()
                        or s.claimed_by_person_id = recoveryos.current_person_id()
                        or recoveryos.is_admin_staff())));

-- 2) Restore list_open_support_requests to the 0120 original (classification only).
create or replace function recoveryos.list_open_support_requests()
returns table (
  support_request_id bigint,
  participant_person_id bigint,
  participant_name text,
  request_type text,
  preferred_modality text,
  created_at timestamptz
) language sql stable security definer set search_path = recoveryos, public as $$
  select s.id, s.person_id, (pp.first_name || ' ' || pp.last_name),
         s.request_type::text, s.preferred_modality::text, s.created_at
  from recoveryos.support_requests s
  join recoveryos.people pp on pp.id = s.person_id
  where s.status in ('submitted','open')
    and s.claimed_by_person_id is null
    and recoveryos.is_support_staff()
    and recoveryos.same_world(s.person_id)
  order by s.created_at;
$$;

-- 3) Restore claim_support_request to the 0112 original (hardcoded organization_id = 1).
create or replace function recoveryos.claim_support_request(p_support_request_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_req recoveryos.support_requests%rowtype;
  v_rel_id bigint;
  v_domain text;
  v_rel_type text;
begin
  if v_me is null then
    return jsonb_build_object('ok', false, 'code', 'unauthenticated');
  end if;

  select * into v_req from recoveryos.support_requests where id = p_support_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'This request is no longer here.');
  end if;

  v_domain := case when v_req.request_type in ('navigation','needs_assessment')
                   then 'navigation' else 'coaching' end;

  if v_domain = 'coaching' and not recoveryos.is_coach_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_eligible',
      'message', 'This request needs a recovery coach.');
  end if;
  if v_domain = 'navigation' and not recoveryos.is_navigator_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_eligible',
      'message', 'This request needs a navigator.');
  end if;

  if v_req.claimed_by_person_id = v_me then
    return jsonb_build_object('ok', true, 'code', 'already_yours', 'message', 'They are already with you.');
  end if;
  if v_req.claimed_by_person_id is not null then
    return jsonb_build_object('ok', false, 'code', 'already_claimed',
      'message', 'Someone else just picked this up. Others may still be waiting for support.');
  end if;
  if v_req.status not in ('submitted','open') then
    return jsonb_build_object('ok', false, 'code', 'not_open', 'message', 'This request is no longer open.');
  end if;

  if v_domain = 'coaching' then
    v_rel_type := case when v_req.request_type = 'peer_support' then 'peer' else 'coach' end;
    select id into v_rel_id from recoveryos.coaching_relationships
      where participant_person_id = v_req.person_id and status='active' and is_primary
      for update;
    if v_rel_id is not null then
      if (select coach_person_id from recoveryos.coaching_relationships where id=v_rel_id) <> v_me then
        return jsonb_build_object('ok', false, 'code', 'participant_has_coach',
          'message', 'They are already connected with another coach.');
      end if;
    else
      begin
        insert into recoveryos.coaching_relationships
          (participant_person_id, coach_person_id, organization_id, started_at,
           status, relationship_type, is_primary, assigned_by_person_id, assignment_source)
        values (v_req.person_id, v_me, 1, current_date,
                'active', v_rel_type, true, v_me, 'request_pickup')
        returning id into v_rel_id;
      exception when unique_violation then
        return jsonb_build_object('ok', false, 'code', 'participant_has_coach',
          'message', 'They were just connected with another coach.');
      end;
    end if;

    update recoveryos.support_requests
      set claimed_by_person_id = v_me, claimed_at = now(), coaching_relationship_id = v_rel_id,
          status = 'claimed', assigned_at = now(), last_actor_person_id = v_me
      where id = p_support_request_id;
  else
    select id into v_rel_id from recoveryos.navigation_relationships
      where participant_person_id = v_req.person_id and status='active' and is_primary
      for update;
    if v_rel_id is not null then
      if (select navigator_person_id from recoveryos.navigation_relationships where id=v_rel_id) <> v_me then
        return jsonb_build_object('ok', false, 'code', 'participant_has_navigator',
          'message', 'They are already connected with another navigator.');
      end if;
    else
      begin
        insert into recoveryos.navigation_relationships
          (participant_person_id, navigator_person_id, organization_id, started_at,
           status, is_primary, assigned_by_person_id, assignment_source)
        values (v_req.person_id, v_me, 1, current_date,
                'active', true, v_me,
                case when v_req.request_type = 'needs_assessment' then 'triage' else 'request_pickup' end)
        returning id into v_rel_id;
      exception when unique_violation then
        return jsonb_build_object('ok', false, 'code', 'participant_has_navigator',
          'message', 'They were just connected with another navigator.');
      end;
    end if;

    update recoveryos.support_requests
      set claimed_by_person_id = v_me, claimed_at = now(), navigation_relationship_id = v_rel_id,
          status = 'claimed', assigned_at = now(), last_actor_person_id = v_me
      where id = p_support_request_id;
  end if;

  insert into recoveryos.support_request_events (support_request_id, event_type, actor_person_id, detail)
    values (p_support_request_id, 'claimed', v_me,
            jsonb_build_object('relationship_id', v_rel_id, 'domain', v_domain));

  return jsonb_build_object('ok', true, 'code', 'claimed', 'relationship_id', v_rel_id,
    'domain', v_domain, 'message', 'They''re with you now.');
end $$;

-- 4) Drop the handoff RPC and the org-scoped helpers (reverse dependency order).
drop function if exists recoveryos.handoff_support_request(bigint, bigint, text);
drop function if exists recoveryos.is_support_staff_in_org(bigint);
drop function if exists recoveryos.is_admin_staff_in_org(bigint);
drop function if exists recoveryos.is_coach_staff_in_org(bigint);
drop function if exists recoveryos.is_navigator_staff_in_org(bigint);
drop function if exists recoveryos.has_role_in_org(recoveryos.role_key, bigint);

commit;
