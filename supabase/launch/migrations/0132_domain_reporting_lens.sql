-- 0132_domain_reporting_lens.sql — P1.6: the domain lens beside existing reporting.
--
-- Ratification §18 (P1.6): "Add domain-level reporting views alongside existing reporting.
-- Ensure every aggregate is classified on the evidence ladder."
--
-- Re-creates recoveryos.admin_evidence_summary() (base body: 0117:597-679, unchanged apart
-- from ONE addition) with `needs_by_domain` inside the navigation block — a JOIN through
-- recoveryos.domain_subcategories -> recoveryos.domains over the SAME rows needs_by_category
-- already counts. Nothing is replaced: needs_by_category stays byte-identical beside it.
--
-- Evidence-ladder classification (docs/architecture/domain-vocabulary-v1.0.md §ladder):
-- needs_by_domain counts IDENTIFIED needs — ACTIVITY-level evidence, exactly like
-- needs_by_category. It must never be read as connection or outcome; resolution counts
-- keep that distinction (needs_resolved / connected are the higher-rung aggregates).
-- The cross-cutting subcategory (identification_documents) rolls up under 'cross_cutting',
-- never silently absorbed into a domain.
--
-- ROLLBACK: re-run the 0117:597-679 create-or-replace body (drops the needs_by_domain key);
--           grants unchanged either way.

set search_path = recoveryos, public;

create or replace function recoveryos.admin_evidence_summary()
returns jsonb language sql stable security definer set search_path = recoveryos, public as $$
  select case when not (recoveryos.is_platform_admin() or recoveryos.has_role('executive'))
    then jsonb_build_object('ok', false, 'code', 'not_authorized')
    else jsonb_build_object('ok', true,
      'funnel', (select jsonb_build_object(
        'requests', count(*),
        'claimed', count(*) filter (where s.claimed_at is not null),
        'still_waiting', count(*) filter (where s.status in ('submitted','open') and s.claimed_by_person_id is null),
        'median_minutes_to_claim', round(coalesce((percentile_cont(0.5) within group
            (order by extract(epoch from (s.claimed_at - s.created_at)) / 60)
            filter (where s.claimed_at is not null))::numeric, 0)),
        'p90_minutes_to_claim', round(coalesce((percentile_cont(0.9) within group
            (order by extract(epoch from (s.claimed_at - s.created_at)) / 60)
            filter (where s.claimed_at is not null))::numeric, 0)))
        from recoveryos.support_requests s where recoveryos.is_production_person(s.person_id)),
      'relationships', (select jsonb_build_object(
        'coaching_established', count(*) filter (where true),
        'coaching_active', count(*) filter (where cr.status = 'active'),
        'responded_t1', count(*) filter (where exists (
            select 1 from recoveryos.conversations c
            join recoveryos.messages m on m.conversation_id = c.id
            where c.coaching_relationship_id = cr.id and m.sender_person_id = c.coach_person_id)),
        'two_way_t4a', count(*) filter (where exists (
            select 1 from recoveryos.conversations c
            join recoveryos.messages m on m.conversation_id = c.id
            where c.coaching_relationship_id = cr.id and m.sender_person_id = c.coach_person_id)
          and exists (
            select 1 from recoveryos.conversations c
            join recoveryos.messages m on m.conversation_id = c.id
            where c.coaching_relationship_id = cr.id and m.sender_person_id = c.participant_person_id)))
        from recoveryos.coaching_relationships cr
        where recoveryos.is_production_person(cr.participant_person_id)),
      'navigation', (select jsonb_build_object(
        'needs', (select count(*) from recoveryos.navigation_needs n where recoveryos.is_production_person(n.person_id)),
        'needs_by_category', (select coalesce(jsonb_object_agg(need_category, cnt), '{}'::jsonb)
          from (select need_category, count(*) as cnt from recoveryos.navigation_needs n
                where recoveryos.is_production_person(n.person_id) group by 1) x),
        -- P1.6 domain lens (ACTIVITY-level: identified needs, same rows as needs_by_category,
        -- rolled up through the ratified subcategory -> domain mapping; cross-cutting stays
        -- visible as its own line, never absorbed).
        'needs_by_domain', (select coalesce(jsonb_object_agg(domain_key, cnt), '{}'::jsonb)
          from (select coalesce(d.key, 'cross_cutting') as domain_key, count(*) as cnt
                from recoveryos.navigation_needs n
                left join recoveryos.domain_subcategories sc on sc.key = n.need_category
                left join recoveryos.domains d on d.key = sc.domain_key
                where recoveryos.is_production_person(n.person_id) group by 1) x),
        'needs_resolved', (select count(*) from recoveryos.navigation_needs n
          where n.status = 'resolved' and recoveryos.is_production_person(n.person_id)),
        'needs_partially_resolved', (select count(*) from recoveryos.navigation_needs n
          where n.status = 'partially_resolved' and recoveryos.is_production_person(n.person_id)),
        'needs_unresolved', (select count(*) from recoveryos.navigation_needs n
          where n.status = 'unresolved' and recoveryos.is_production_person(n.person_id)),
        'referrals', (select count(*) from recoveryos.navigation_referrals r where recoveryos.is_production_person(r.person_id)),
        'warm_handoffs', (select count(*) from recoveryos.navigation_referrals r
          where r.referral_type = 'warm_handoff' and recoveryos.is_production_person(r.person_id)),
        'connected', (select count(*) from recoveryos.navigation_referrals r
          where r.status = 'connected' and recoveryos.is_production_person(r.person_id)),
        'participant_declined', (select count(*) from recoveryos.navigation_referrals r
          where r.status = 'participant_declined' and recoveryos.is_production_person(r.person_id)),
        'partner_unavailable', (select count(*) from recoveryos.navigation_referrals r
          where r.status = 'partner_unavailable' and recoveryos.is_production_person(r.person_id)))),
      'residence', (select jsonb_build_object(
        'applications', (select count(*) from recoveryos.residence_applications a where recoveryos.is_production_person(a.person_id)),
        'decisions', (select coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb)
          from (select status, count(*) as cnt from recoveryos.residence_applications a
                where recoveryos.is_production_person(a.person_id) group by 1) x),
        'active_residencies', (select count(*) from recoveryos.residencies r
          where r.residency_status in ('active','on_pass','transitioning')
            and recoveryos.is_production_person(r.person_id)),
        'capacity', (select coalesce(sum(capacity), 0) from recoveryos.residences),
        'median_length_of_stay_days', (select round(coalesce((percentile_cont(0.5) within group
            (order by (r.discharge_date - r.admission_date)))::numeric, 0))
          from recoveryos.residencies r
          where r.discharge_date is not null and r.admission_date is not null
            and recoveryos.is_production_person(r.person_id)))),
      'services', (select jsonb_build_object(
        'people_served', (select count(distinct e.person_id) from recoveryos.service_events e
          where recoveryos.is_production_person(e.person_id)),
        'events', (select count(*) from recoveryos.service_events e where recoveryos.is_production_person(e.person_id)),
        'by_type', (select coalesce(jsonb_object_agg(t.name, x.cnt), '{}'::jsonb)
          from (select service_type_id, count(*) as cnt from recoveryos.service_events e
                where recoveryos.is_production_person(e.person_id) group by 1) x
          join recoveryos.service_types t on t.id = x.service_type_id),
        'funding_attributed', (select count(*) from recoveryos.service_events e
          where e.funding_source_id is not null and recoveryos.is_production_person(e.person_id)),
        'funding_unattributed', (select count(*) from recoveryos.service_events e
          where e.funding_source_id is null and recoveryos.is_production_person(e.person_id)))))
  end;
$$;
revoke execute on function recoveryos.admin_evidence_summary() from public, anon;
grant execute on function recoveryos.admin_evidence_summary() to authenticated;

notify pgrst, 'reload schema';
