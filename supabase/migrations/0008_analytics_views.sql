-- Canonical analytics views.
-- Unique people served is always a deduplicated person count, never a sum of
-- enrollment counts. Program and residence metrics stay separately attributable.

-- People with any service event in a period (query with date filters).
set search_path = recoveryos, public;

create view analytics_people_served as
select distinct se.person_id
from service_events se;

-- Participation classification per person: vrcc-only, resident-only, or both.
create view analytics_participation_classification as
select
  p.id as person_id,
  exists (
    select 1 from program_enrollments pe
    join programs pr on pr.id = pe.program_id
    where pe.person_id = p.id and pr.key = 'vrcc' and pe.status = 'enrolled'
  ) as is_active_vrcc_participant,
  exists (
    select 1 from residencies r
    where r.person_id = p.id
      and r.residency_status in ('active', 'on_pass', 'transitioning')
  ) as is_active_resident
from people p;

-- Service events with full attribution dimensions for reporting.
create view analytics_service_events as
select
  se.id,
  se.person_id,
  st.key as service_type_key,
  st.category as service_category,
  se.delivery_context,
  se.modality,
  se.organization_id,
  se.program_id,
  se.residence_id,
  se.residency_id,
  se.funding_source_id,
  se.started_at,
  se.ended_at,
  se.outcome_status
from service_events se
join service_types st on st.id = se.service_type_id;

-- Residence occupancy snapshot.
create view analytics_residence_occupancy as
select
  r.id as residence_id,
  r.name as residence_name,
  r.capacity,
  count(res.id) filter (
    where res.residency_status in ('active', 'on_pass', 'transitioning')
  ) as current_residents
from residences r
left join residencies res on res.residence_id = r.id
group by r.id, r.name, r.capacity;
