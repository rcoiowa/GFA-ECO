-- support_workflow_org_authorization.prepared.sql
--
-- STATUS: PREPARED ONLY — APPLICATION IS NOT AUTHORIZED. Prepared for review on a
-- dedicated branch; no CQCX mutation, no apply, no deploy, no production permission
-- change is authorized by this artifact. Promotion/apply is separately gated
-- (prepared -> apply / Gate B / Gate C).
--
-- PLACEMENT: this lives in supabase/launch/proposed/ (OFF the Gate-A manifest, which
-- locks supabase/launch/prepared/ to an exact set) and OUTSIDE supabase/launch/
-- migrations/ (the applied lineage). The live ledger uses timestamp-named migrations
-- (20261005*). On apply this becomes a timestamp-named migration; see README
-- "Migration mapping" for the 0150/0151/0152 reconciliation.
--
-- PURPOSE: close the support-workflow tenant-isolation gaps reported live 2026-10-12:
--   F1 hardcoded organization_id = 1 in claim_support_request()
--   F2 role checks (has_role / is_*_staff) are not organization-scoped
--   F3 support-request staff visibility has no organization predicate
--   F4 administrator visibility reads across organizations (is_admin_staff)
--   F5 same_world() compares production classification, not organization (tenancy)
-- while PRESERVING: RLS-enabled posture, residence-staff residence scoping, revoked-role
-- denial, test-fixture privilege exclusion, anon denial, and the 0120 classification
-- (same_world) checks — tenancy is added ON TOP of classification, not instead of it.
--
-- DESIGN DECISIONS (defaults chosen; each is flagged in README for the lead to confirm):
--   D1 null-org role assignment = PLATFORM scope and does NOT, by itself, grant
--      participant-record access in any organization. Participant-record access
--      requires an EXPLICIT org-matching role assignment. This is the "separate
--      platform administration from participant-record access" requirement.
--   D2 a support_request with organization_id IS NULL cannot be claimed (returns
--      'org_unresolved') and is invisible to the staff pool. Legacy null-org or
--      org-mismatched rows are a RECONCILIATION item (README) — this migration does
--      NOT reassign them automatically.
--   D3 cross-organization work happens only through an EXPLICIT, logged handoff
--      (handoff_support_request), performed by an admin in the request's current org.
--   D4 appointments has no organization column; its cross-org admin read is NOT
--      rewritten here (would require guessing an org source). Flagged as a decision.

set search_path = recoveryos, public;

begin;

-- ============================================================================
-- 1) Organization-scoped authorization helpers (new; additive)
--    Global has_role()/is_*_staff() are preserved for platform administration;
--    these *_in_org variants gate participant-record access.
-- ============================================================================

-- Org-scoped role check. Requires an EXPLICIT org match (D1): a null-org
-- (platform) assignment does NOT satisfy it. Preserves revocation + the 0147
-- test-fixture privilege exclusion, and the program/residence-in-org constraints
-- (pattern mirrors 20261005092358_circle_county_access_schedule).
create or replace function recoveryos.has_role_in_org(target_role recoveryos.role_key, p_org_id bigint)
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select p_org_id is not null and exists (
    select 1 from recoveryos.role_assignments ra
    where ra.person_id = recoveryos.current_person_id()
      and ra.role_key = target_role
      and ra.revoked_at is null
      and ra.organization_id = p_org_id
      and (ra.program_id is null
           or exists (select 1 from recoveryos.programs p
                      where p.id = ra.program_id and p.organization_id = p_org_id))
      and (ra.residence_id is null
           or exists (select 1 from recoveryos.residences r
                      where r.id = ra.residence_id and r.organization_id = p_org_id))
  )
  and not (
    recoveryos.is_privileged_role(target_role)
    and recoveryos.is_test_fixture(recoveryos.current_person_id())
  );
$$;
comment on function recoveryos.has_role_in_org(recoveryos.role_key, bigint) is
  'Org-scoped role check for participant-record access. Null-org assignments do NOT satisfy it (platform administration is separate). Preserves revocation + test-fixture privilege exclusion.';

create or replace function recoveryos.is_support_staff_in_org(p_org_id bigint)
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.has_role_in_org('coach', p_org_id)
      or recoveryos.has_role_in_org('navigator', p_org_id)
      or recoveryos.has_role_in_org('program_manager', p_org_id)
      or recoveryos.has_role_in_org('administrator', p_org_id)
      or recoveryos.has_role_in_org('system_administrator', p_org_id);
$$;

create or replace function recoveryos.is_admin_staff_in_org(p_org_id bigint)
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.has_role_in_org('navigator', p_org_id)
      or recoveryos.has_role_in_org('program_manager', p_org_id)
      or recoveryos.has_role_in_org('administrator', p_org_id)
      or recoveryos.has_role_in_org('system_administrator', p_org_id);
$$;

create or replace function recoveryos.is_coach_staff_in_org(p_org_id bigint)
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.has_role_in_org('coach', p_org_id)
      or recoveryos.has_role_in_org('administrator', p_org_id)
      or recoveryos.has_role_in_org('system_administrator', p_org_id);
$$;

create or replace function recoveryos.is_navigator_staff_in_org(p_org_id bigint)
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.has_role_in_org('navigator', p_org_id)
      or recoveryos.has_role_in_org('administrator', p_org_id)
      or recoveryos.has_role_in_org('system_administrator', p_org_id);
$$;

revoke execute on function
  recoveryos.has_role_in_org(recoveryos.role_key, bigint),
  recoveryos.is_support_staff_in_org(bigint),
  recoveryos.is_admin_staff_in_org(bigint),
  recoveryos.is_coach_staff_in_org(bigint),
  recoveryos.is_navigator_staff_in_org(bigint)
  from public, anon;
grant execute on function
  recoveryos.has_role_in_org(recoveryos.role_key, bigint),
  recoveryos.is_support_staff_in_org(bigint),
  recoveryos.is_admin_staff_in_org(bigint),
  recoveryos.is_coach_staff_in_org(bigint),
  recoveryos.is_navigator_staff_in_org(bigint)
  to authenticated;

-- ============================================================================
-- 2) F1+F2: claim_support_request — resolve org from the request (no hardcode);
--    require the claiming staff to hold the domain role IN the request's org.
--    (Full replacement of the 0112 definition; only org handling changes.)
-- ============================================================================
create or replace function recoveryos.claim_support_request(p_support_request_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_req recoveryos.support_requests%rowtype;
  v_rel_id bigint;
  v_domain text;
  v_rel_type text;
  v_org bigint;
begin
  if v_me is null then
    return jsonb_build_object('ok', false, 'code', 'unauthenticated');
  end if;

  select * into v_req from recoveryos.support_requests where id = p_support_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'This request is no longer here.');
  end if;

  -- F1: organization is the request's own organization, never a hardcoded value.
  v_org := v_req.organization_id;
  if v_org is null then
    -- D2: a request with no organization cannot be claimed; it must be reconciled first.
    return jsonb_build_object('ok', false, 'code', 'org_unresolved',
      'message', 'This request is not assigned to an organization yet; an administrator must set it before it can be claimed.');
  end if;

  v_domain := case when v_req.request_type in ('navigation','needs_assessment')
                   then 'navigation' else 'coaching' end;

  -- F2: eligibility is org-scoped — the claimer must hold the domain role IN v_org.
  if v_domain = 'coaching' and not recoveryos.is_coach_staff_in_org(v_org) then
    return jsonb_build_object('ok', false, 'code', 'not_eligible',
      'message', 'This request needs a recovery coach in its organization.');
  end if;
  if v_domain = 'navigation' and not recoveryos.is_navigator_staff_in_org(v_org) then
    return jsonb_build_object('ok', false, 'code', 'not_eligible',
      'message', 'This request needs a navigator in its organization.');
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
        values (v_req.person_id, v_me, v_org, current_date,
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
        values (v_req.person_id, v_me, v_org, current_date,
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
            jsonb_build_object('relationship_id', v_rel_id, 'domain', v_domain, 'organization_id', v_org));

  return jsonb_build_object('ok', true, 'code', 'claimed', 'relationship_id', v_rel_id,
    'domain', v_domain, 'message', 'They''re with you now.');
end $$;

-- ============================================================================
-- 3) F3+F5: list_open_support_requests — add org tenancy ON TOP of same_world.
--    (Full replacement of the 0120 definition; classification check preserved.)
-- ============================================================================
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
    and s.organization_id is not null
    and recoveryos.is_support_staff_in_org(s.organization_id)   -- F3/F5: tenancy
    and recoveryos.same_world(s.person_id)                      -- preserved: classification
  order by s.created_at;
$$;

-- ============================================================================
-- 4) F3+F4: organization-scoped RLS policies (replace broad is_*_staff reads).
--    Participant self-access policies (sr_participant_select/insert/cancel,
--    coaching_select_involved) are unchanged.
-- ============================================================================

-- support_requests staff pool: own claimed rows always; open pool only to support
-- staff IN the row's org; admin reads only within the row's org. Null-org rows are
-- invisible to staff (D2) until reconciled.
drop policy if exists sr_staff_pool_select on recoveryos.support_requests;
create policy sr_staff_pool_select on recoveryos.support_requests for select to authenticated
  using (
    claimed_by_person_id = recoveryos.current_person_id()
    or (status in ('submitted','open') and recoveryos.is_support_staff_in_org(organization_id))
    or recoveryos.is_admin_staff_in_org(organization_id)
  );

-- coaching_relationships staff read: org-scoped admin (participant/coach still covered
-- by 0009 coaching_select_involved).
drop policy if exists coaching_rel_staff_select on recoveryos.coaching_relationships;
create policy coaching_rel_staff_select on recoveryos.coaching_relationships for select to authenticated
  using (recoveryos.is_admin_staff_in_org(organization_id));

-- support_request_events: parties + org-scoped admin (via parent request's org).
drop policy if exists sre_parties_select on recoveryos.support_request_events;
create policy sre_parties_select on recoveryos.support_request_events for select to authenticated
  using (exists (select 1 from recoveryos.support_requests s
                 where s.id = support_request_id
                   and (s.person_id = recoveryos.current_person_id()
                        or s.claimed_by_person_id = recoveryos.current_person_id()
                        or recoveryos.is_admin_staff_in_org(s.organization_id))));

-- NOTE (D4): appointments / booking_requests / booking_proposals still use the
-- global is_admin_staff() for cross-party admin reads. appointments has no
-- organization column, so org-scoping it requires an agreed org source (provider's
-- org, or an added column). Deliberately NOT rewritten here — see README "Decisions".

-- ============================================================================
-- 5) D3: explicit, logged cross-organization handoff.
--    An admin IN the request's current org may move an unclaimed/open request to
--    another organization; the move is recorded as a support_request_event.
-- ============================================================================
create or replace function recoveryos.handoff_support_request(
  p_support_request_id bigint, p_target_org_id bigint, p_reason text
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_req recoveryos.support_requests%rowtype;
begin
  if v_me is null then
    return jsonb_build_object('ok', false, 'code', 'unauthenticated');
  end if;
  if p_target_org_id is null or not exists (select 1 from recoveryos.organizations o where o.id = p_target_org_id) then
    return jsonb_build_object('ok', false, 'code', 'bad_target_org');
  end if;

  select * into v_req from recoveryos.support_requests where id = p_support_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  -- Authorization: admin IN the request's current organization.
  if v_req.organization_id is null or not recoveryos.is_admin_staff_in_org(v_req.organization_id) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Only an administrator in this request''s organization can hand it off.');
  end if;
  if v_req.organization_id = p_target_org_id then
    return jsonb_build_object('ok', true, 'code', 'noop', 'message', 'Already in that organization.');
  end if;
  if v_req.status not in ('submitted','open','claimed') then
    return jsonb_build_object('ok', false, 'code', 'not_handoffable',
      'message', 'Only an open or claimed request can be handed off.');
  end if;

  update recoveryos.support_requests
    set organization_id = p_target_org_id,
        status = 'open',
        claimed_by_person_id = null, claimed_at = null,
        coaching_relationship_id = null, navigation_relationship_id = null,
        assigned_at = null, last_actor_person_id = v_me
    where id = p_support_request_id;

  insert into recoveryos.support_request_events (support_request_id, event_type, actor_person_id, detail)
    values (p_support_request_id, 'handoff', v_me,
            jsonb_build_object('from_organization_id', v_req.organization_id,
                               'to_organization_id', p_target_org_id,
                               'reason', nullif(trim(coalesce(p_reason,'')), '')));

  return jsonb_build_object('ok', true, 'code', 'handed_off',
    'from_organization_id', v_req.organization_id, 'to_organization_id', p_target_org_id);
end $$;

revoke execute on function recoveryos.handoff_support_request(bigint, bigint, text) from public, anon;
grant execute on function recoveryos.handoff_support_request(bigint, bigint, text) to authenticated;

commit;

-- APPLY NOTE: on authorized apply, promote this file to a timestamp-named migration
-- in supabase/launch/migrations/ (e.g., 20261012NNNNNN_support_workflow_org_authorization.sql)
-- per the live ledger convention, after the 0150/0151 numbering reconciliation in README.
