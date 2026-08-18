-- 0120_classification_symmetry.sql — P4H-G1 live-gate finding (applied live
-- as 0120 + 0120b; this file is the consolidated record).
--
-- The open-request pool filtered to production participants only, which had
-- two consequences: (1) test-fixture participants were invisible to every
-- coach/navigator, making fixture-driven E2E structurally impossible; and
-- (2) the INVERSE hole — a test-fixture STAFF account could still see and
-- claim REAL participants, exactly what the fixture discipline forbids.
--
-- Fix: classification symmetry. A viewer sees, and may claim, only requests
-- from their own world: production staff ↔ production participants,
-- fixture staff ↔ fixture participants. Production pools gain protection;
-- gate runs become possible without reclassifying fixtures as production.
-- Evidence exclusion (is_production_person in the P4G aggregates) is
-- unchanged. The pool function keeps its exact frontend contract
-- (support_request_id / participant_person_id / …).

create or replace function recoveryos.same_world(p_person_id bigint)
returns boolean language sql stable security definer
set search_path = recoveryos, public as $$
  select recoveryos.is_production_person(p_person_id)
       = recoveryos.is_production_person(recoveryos.current_person_id());
$$;
revoke execute on function recoveryos.same_world(bigint) from public, anon;
grant execute on function recoveryos.same_world(bigint) to authenticated;

drop function if exists recoveryos.list_open_support_requests();
create function recoveryos.list_open_support_requests()
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
revoke execute on function recoveryos.list_open_support_requests() from public, anon;
grant execute on function recoveryos.list_open_support_requests() to authenticated;

-- claim_support_request: same-world guard right after row lookup; a
-- cross-world id answers not_found (indistinguishable from absence).
do $patch$
declare
  src text;
begin
  select pg_get_functiondef(p.oid) into src
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'recoveryos' and p.proname = 'claim_support_request';
  if src not like '%same_world%' then
    src := replace(src,
      $g$  v_domain := case when v_req.request_type in ('navigation','needs_assessment')$g$,
      $g$  if not recoveryos.same_world(v_req.person_id) then
    return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'This request is no longer here.');
  end if;

  v_domain := case when v_req.request_type in ('navigation','needs_assessment')$g$);
    execute src;
  end if;
end $patch$;
