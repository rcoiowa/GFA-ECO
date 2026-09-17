-- 0136_reporting_authority.sql — P2.6: service-type deprecations + reporting authority
-- + the two residence reporting lenses.
--
-- Ratified decisions implemented here:
--   * DEPRECATE service types `navigation` (superseded by the wired `resource_navigation`)
--     and `support_request` (a request is an initiating state, not a delivered service; the
--     response creates the real coaching/navigation/peer/residence event). is_active=false,
--     rows kept, history untouched, NO replacement type.
--   * admin_evidence_summary services block gains the reporting-authority split — counts
--     keyed by the semantic authorities (organizationally_attested / participant_reported /
--     system_derived; a partner_confirmed row, should a governed workflow ever exist, buckets
--     under its own source key — never auto-folded into organizational delivery). Complete
--     provenance is established (0133 NOT NULL backfill), so there is NO unclassified bucket.
--     people_served is now explicitly "distinct people with organizationally attested service
--     activity"; participant-reported engagement is its own count — never silently combined.
--   * residence_service_lenses(): the two RATIFIED lenses as aggregate-only staff reads —
--     A. RESIDENCE-DELIVERED SERVICES (residence_id attribution) and B. SERVICES RECEIVED
--     DURING RESIDENCY (person + residency-window join; attribution never mutated). Each
--     lens embeds its operational definition; the lenses are never summed. Aggregate-only
--     keeps row-level RLS unchanged (no widening). Fixture people excluded from both lenses.
--
-- ROLLBACK: update recoveryos.service_types set is_active = true
--             where key in ('navigation','support_request');
--           drop function recoveryos.residence_service_lenses(bigint, int);
--           re-run the 0132 admin_evidence_summary body (verbatim in that file).

set search_path = recoveryos, public;

-- 1) Service-type deprecations (event types only; the support-request WORKFLOW is untouched).
update recoveryos.service_types set is_active = false where key in ('navigation','support_request');
comment on table recoveryos.service_types is
  'Canonical service-type taxonomy. DEPRECATED (P2, is_active=false, rows kept): '
  '''navigation'' — duplicate superseded by the wired ''resource_navigation''; '
  '''support_request'' — a request is an initiating state, never a delivered service (the '
  'human/system response creates the actual coaching/navigation/peer/residence event; no '
  'replacement "responded_to_request" type exists by executive decision). Service type is '
  'never collapsed into Domain.';

-- 2) admin_evidence_summary — 0132 body with ONE change: the services block gains the
--    reporting-authority split (everything else byte-identical to 0132).
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
        -- P2.6 reporting authority: people_served is ORGANIZATIONALLY ATTESTED delivery only;
        -- participant-reported engagement is its own number — never silently combined (§17).
        'people_served', (select count(distinct e.person_id) from recoveryos.service_events e
          where e.source = 'staff_attested' and recoveryos.is_production_person(e.person_id)),
        'people_engaging_participant_reported', (select count(distinct e.person_id)
          from recoveryos.service_events e
          where e.source = 'participant_self_reported' and recoveryos.is_production_person(e.person_id)),
        'events', (select count(*) from recoveryos.service_events e where recoveryos.is_production_person(e.person_id)),
        'events_by_authority', (select coalesce(jsonb_object_agg(authority, cnt), '{}'::jsonb)
          from (select case e.source
                  when 'staff_attested' then 'organizationally_attested'
                  when 'participant_self_reported' then 'participant_reported'
                  else e.source end as authority, count(*) as cnt
                from recoveryos.service_events e
                where recoveryos.is_production_person(e.person_id) group by 1) x),
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

-- 3) The two residence lenses — aggregate-only, staff-of-residence gated, definitions embedded.
create or replace function recoveryos.residence_service_lenses(
  p_residence_id bigint, p_window_days int default 90
) returns jsonb language sql stable security definer set search_path = recoveryos, public as $$
  select case when not (p_residence_id in (select recoveryos.staff_residence_ids())
                        or recoveryos.is_platform_admin())
    then jsonb_build_object('ok', false, 'code', 'not_authorized')
    else jsonb_build_object('ok', true, 'window_days', p_window_days,
      'residence_delivered', (select jsonb_build_object(
        'definition', 'Lens A — services delivered under residence programming: service '
          'events attributed to this residence (residence_id), organizationally attested, '
          'production people only, last ' || p_window_days || ' days.',
        'events', count(*) filter (where se.source = 'staff_attested'),
        'people', count(distinct se.person_id) filter (where se.source = 'staff_attested'),
        'by_authority', coalesce((
          select jsonb_object_agg(a, c) from (
            select case s2.source when 'staff_attested' then 'organizationally_attested'
                                  when 'participant_self_reported' then 'participant_reported'
                                  else s2.source end as a, count(*) as c
            from recoveryos.service_events s2
            where s2.residence_id = p_residence_id
              and s2.started_at >= now() - make_interval(days => p_window_days)
              and recoveryos.is_production_person(s2.person_id)
            group by 1) y), '{}'::jsonb))
        from recoveryos.service_events se
        where se.residence_id = p_residence_id
          and se.started_at >= now() - make_interval(days => p_window_days)
          and recoveryos.is_production_person(se.person_id)),
      'received_during_residency', (select jsonb_build_object(
        'definition', 'Lens B — GFA services received during residency: service events for '
          'people while an enrolled residency at this residence was active (admission through '
          'discharge), whatever program delivered them; residence attribution is NOT mutated; '
          'production people only, last ' || p_window_days || ' days. Never summed with Lens A.',
        'events', count(*),
        'people', count(distinct se.person_id),
        'by_authority', coalesce((
          select jsonb_object_agg(a, c) from (
            select case s2.source when 'staff_attested' then 'organizationally_attested'
                                  when 'participant_self_reported' then 'participant_reported'
                                  else s2.source end as a, count(*) as c
            from recoveryos.service_events s2
            where s2.started_at >= now() - make_interval(days => p_window_days)
              and recoveryos.is_production_person(s2.person_id)
              and exists (select 1 from recoveryos.residencies r
                          where r.person_id = s2.person_id and r.residence_id = p_residence_id
                            and s2.started_at::date >= r.admission_date
                            and (r.discharge_date is null or s2.started_at::date <= r.discharge_date))
            group by 1) y), '{}'::jsonb))
        from recoveryos.service_events se
        where se.started_at >= now() - make_interval(days => p_window_days)
          and recoveryos.is_production_person(se.person_id)
          and exists (select 1 from recoveryos.residencies r
                      where r.person_id = se.person_id and r.residence_id = p_residence_id
                        and se.started_at::date >= r.admission_date
                        and (r.discharge_date is null or se.started_at::date <= r.discharge_date))))
  end;
$$;
revoke execute on function recoveryos.residence_service_lenses(bigint, int) from public, anon;
grant execute on function recoveryos.residence_service_lenses(bigint, int) to authenticated;

notify pgrst, 'reload schema';
