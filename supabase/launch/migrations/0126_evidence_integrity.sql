-- 0126_evidence_integrity.sql — evidence-integrity corrections (P0-4, 2026-08-21).
--
-- Two defects from the Relational Operations audit, both about numbers claiming more than the
-- underlying record supports. No product enhancement is mixed in; both changes are
-- `create or replace` with the prior bodies preserved below for one-statement rollback.
--
-- DEFECT 1 — admin_operations_summary().unreviewed_incidents was the only counter without a
-- test-fixture filter, so fixture incidents inflate a real admin attention item. `incidents`
-- has no person_id; the filter routes through the optional residency_id → residencies.person_id.
-- Residence-only incidents (residency_id IS NULL) remain counted — they concern the house, not a
-- fixture person.
--
-- DEFECT 2 — narr_auto_evidence() stamped `verified_at = now()` while leaving
-- verified_by_person_id NULL: one logged fee/screening/chore row became "standard met,
-- VERIFIED" with no verifier. Auto-evidence may claim MET with an evidence line; VERIFICATION
-- is a human act recorded by the Compliance page (which sets verified_by_person_id). The
-- replacement stops writing verified_at/verified_by entirely and — critically — the UPDATE arm
-- no longer overwrites an existing human verification timestamp.
--
-- ROLLBACK: re-run the "PRIOR BODY" blocks at the end of this file (commented; copy verbatim).

set search_path = recoveryos, public;

create or replace function recoveryos.admin_operations_summary()
returns jsonb language sql stable security definer set search_path = recoveryos, public as $$
  select case when not recoveryos.is_platform_admin()
    then jsonb_build_object('ok', false, 'code', 'not_authorized')
    else jsonb_build_object('ok', true,
      'open_support_requests', (select count(*) from recoveryos.support_requests s
          where s.status in ('submitted','open') and s.claimed_by_person_id is null
            and recoveryos.is_production_person(s.person_id)),
      'oldest_open_request_hours', (select coalesce(round(extract(epoch from (now() - min(s.created_at))) / 3600), 0)
          from recoveryos.support_requests s
          where s.status in ('submitted','open') and s.claimed_by_person_id is null
            and recoveryos.is_production_person(s.person_id)),
      'open_navigation_requests', (select count(*) from recoveryos.support_requests s
          where s.status in ('submitted','open') and s.claimed_by_person_id is null
            and s.request_type in ('navigation','needs_assessment')
            and recoveryos.is_production_person(s.person_id)),
      'overdue_follow_ups', (select count(*) from recoveryos.follow_ups f
          where f.status = 'open' and f.due_at < now()
            and recoveryos.is_production_person(f.person_id)),
      'sessions_today', (select count(*) from recoveryos.appointments a
          where a.status in ('confirmed','scheduled')
            and (a.starts_at at time zone coalesce(a.timezone,'America/Chicago'))::date
                = (now() at time zone 'America/Chicago')::date
            and recoveryos.is_production_person(a.person_id)),
      'open_referral_loops', (select count(*) from recoveryos.navigation_referrals r
          where r.status in ('initiated','contact_attempted','not_connected')
            and recoveryos.is_production_person(r.person_id)),
      'unresolved_needs', (select count(*) from recoveryos.navigation_needs n
          where n.status in ('identified','in_progress','unresolved')
            and recoveryos.is_production_person(n.person_id)),
      'residence_applications_waiting', (select count(*) from recoveryos.residence_applications a
          where a.status in ('submitted','in_review')
            and recoveryos.is_production_person(a.person_id)),
      'active_residencies', (select count(*) from recoveryos.residencies r
          where r.residency_status in ('active','on_pass','transitioning')
            and recoveryos.is_production_person(r.person_id)),
      'unreviewed_incidents', (select count(*) from recoveryos.incidents i
          where i.reviewed_at is null
            and (i.residency_id is null or exists (
              select 1 from recoveryos.residencies res
              where res.id = i.residency_id
                and recoveryos.is_production_person(res.person_id)))),
      'pending_invitations', (select count(*) from recoveryos.staff_preauthorizations p
          where p.consumed_at is null and p.revoked_at is null
            and (p.expires_at is null or p.expires_at > now())))
  end;
$$;
revoke execute on function recoveryos.admin_operations_summary() from public, anon;
grant execute on function recoveryos.admin_operations_summary() to authenticated;

create or replace function recoveryos.narr_auto_evidence(
  p_residence_id bigint,
  p_code text,
  p_evidence text
) returns void
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_standard_id bigint;
begin
  if p_residence_id is null then
    return;
  end if;
  select id into v_standard_id from narr_standards where code = p_code;
  if v_standard_id is null then
    return;
  end if;
  -- Auto-evidence claims MET with an evidence line. It never claims VERIFICATION:
  -- verified_at / verified_by_person_id are written only by a human on the
  -- Compliance page, and an existing human verification is never overwritten here.
  insert into narr_compliance (residence_id, standard_id, status, evidence, next_review_on)
  values (p_residence_id, v_standard_id, 'met', p_evidence, current_date + interval '1 year')
  on conflict (residence_id, standard_id) do update
    set status = 'met',
        evidence = excluded.evidence,
        next_review_on = excluded.next_review_on
    where narr_compliance.status in ('in_progress', 'met');
end;
$$;

notify pgrst, 'reload schema';

-- =============================================================================================
-- PRIOR BODIES (rollback material — copy verbatim to restore pre-0126 behavior)
-- =============================================================================================
-- PRIOR admin_operations_summary (0117): identical to the body above except:
--   'unreviewed_incidents', (select count(*) from recoveryos.incidents i where i.reviewed_at is null),
--
-- PRIOR narr_auto_evidence (0017):
--   insert into narr_compliance (residence_id, standard_id, status, evidence, verified_at, next_review_on)
--   values (p_residence_id, v_standard_id, 'met', p_evidence, now(), current_date + interval '1 year')
--   on conflict (residence_id, standard_id) do update
--     set status = 'met',
--         evidence = excluded.evidence,
--         verified_at = now(),
--         next_review_on = excluded.next_review_on
--     where narr_compliance.status in ('in_progress', 'met');
