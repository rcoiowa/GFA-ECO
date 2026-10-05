-- Thomas DeGarmeaux's October 5 extension: county, role authorization, weekly Hope+Elim and closed CBH circles.
-- No participant identities, clinical records, or automatic delivered occurrences.
alter type recoveryos.role_key add value if not exists 'program_coordinator';
alter table recoveryos.meeting_series
 add column county text check (length(trim(county)) between 1 and 80),
 add column address text,
 add column room text,
 add column participation_access text not null default 'unspecified' check(participation_access in ('public','closed_cbh_clients','unspecified')),
 add column recording_access text not null default 'standard' check(recording_access in ('standard','cbh')),
 add column schedule_frequency text check(schedule_frequency in ('weekly','selected_tuesdays')),
 add column schedule_weekday integer check(schedule_weekday between 0 and 6),
 add column start_time time,
 add column end_time time,
 add column schedule_note text;
alter table recoveryos.meetings
 add column county text check(length(trim(county)) between 1 and 80),
 add column participation_access text check(participation_access in ('public','closed_cbh_clients','unspecified'));
alter table recoveryos.meetings drop constraint circle_occurrence_complete;
alter table recoveryos.meetings
 add constraint circle_occurrence_complete check (series_id is null or (
   residence_id is null and service_type_id is not null and location_name is not null
   and occurrence_status is not null and recorded_by_person_id is not null and recorded_at is not null
   and recording_source in ('facilitator_attested','staff_attested')
   and (ends_at is null or ends_at > starts_at)
   and (occurrence_status <> 'held' or (participant_count is not null and cardinality(facilitator_names) > 0))
   and (occurrence_status = 'held' or participant_count is null)
 ));

comment on column recoveryos.meetings.county is 'County of meeting location, copied from the configured series at recording; not participant residence.';

create function recoveryos_circle_private.can_record(p_series_id bigint) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and recoveryos.current_person_id() is not null and exists (
 select 1 from recoveryos.meeting_series s
 join recoveryos.organizations o on o.id=s.organization_id
 join recoveryos.service_types st on st.id=s.service_type_id
 where s.id=p_series_id and s.is_active and o.is_active and exists (
  select 1 from auth.users u where u.id=auth.uid() and u.deleted_at is null
   and not coalesce(u.is_anonymous,false) and (u.banned_until is null or u.banned_until < now())
 ) and (
  -- The CBH-specific rule supersedes the general role/assignment rule.
  (o.name='Grace For Addictions' and st.key='recovery_circle' and (
   exists(select 1 from recoveryos.role_assignments ra
    where ra.person_id=recoveryos.current_person_id() and ra.revoked_at is null
    and ra.role_key::text = any(case when s.recording_access='cbh' then array['coach','navigator']
      else array['coach','navigator','program_coordinator','residence_staff','residence_manager'] end)
    and (ra.organization_id is null or ra.organization_id=s.organization_id)
    and (ra.program_id is null or exists(select 1 from recoveryos.programs p where p.id=ra.program_id and p.organization_id=s.organization_id))
    and (ra.residence_id is null or exists(select 1 from recoveryos.residences r where r.id=ra.residence_id and r.organization_id=s.organization_id)))
   or (s.recording_access='cbh' and exists(select 1 from auth.users u where u.id=auth.uid()
    and u.email_confirmed_at is not null and lower(u.email) ~ '^[^@]+@graceforaddictions[.]org$'))
  ))
  or (s.recording_access='standard' and exists(select 1 from recoveryos.meeting_facilitator_assignments a
   where a.series_id=s.id and a.person_id=recoveryos.current_person_id() and a.revoked_at is null))
 ));
$$;
revoke all on function recoveryos_circle_private.can_record(bigint) from public,anon;
grant execute on function recoveryos_circle_private.can_record(bigint) to authenticated;
create or replace function recoveryos_circle_private.workspace() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_me bigint := recoveryos.current_person_id(); v_series jsonb; v_meetings jsonb;
begin
 if auth.uid() is null or v_me is null then raise exception 'unauthenticated' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'location_name',s.location_name,'location_kind',s.location_kind,'timezone',s.timezone,'county',s.county,'address',s.address,'room',s.room,'participation_access',s.participation_access,'schedule_frequency',s.schedule_frequency,'schedule_weekday',s.schedule_weekday,'start_time',s.start_time,'end_time',s.end_time,'schedule_note',s.schedule_note,'facilitators',(
  select coalesce(jsonb_agg(jsonb_build_object('person_id',a.person_id,'name',trim(coalesce(nullif(p.preferred_name,''),p.first_name)||' '||p.last_name)) order by a.person_id),'[]'::jsonb)
  from recoveryos.meeting_facilitator_assignments a join recoveryos.people p on p.id=a.person_id where a.series_id=s.id and a.revoked_at is null
 )) order by s.name),'[]'::jsonb) into v_series
 from recoveryos.meeting_series s where s.is_active and recoveryos_circle_private.can_record(s.id);
 select coalesce(jsonb_agg(to_jsonb(x) order by x.starts_at desc),'[]'::jsonb) into v_meetings from (
 select m.id,m.series_id,m.title,m.starts_at,m.ends_at,m.location_name,m.occurrence_status,m.participant_count,m.facilitator_names,m.total_attendance,m.topic_title,m.topic_category,m.programming_icare_phase,m.programming_domain,m.recorded_at,m.county,m.participation_access
 from recoveryos.meetings m where m.series_id is not null and recoveryos_circle_private.can_record(m.series_id)
 order by m.starts_at desc limit 200) x;
 return jsonb_build_object('series',v_series,'meetings',v_meetings);
end $$;

create or replace function recoveryos_circle_private.record_occurrence(
 p_series_id bigint,p_starts_at timestamptz,p_ends_at timestamptz,p_status text,
 p_participant_count integer,p_facilitator_names text[],p_topic_title text,
 p_topic_category text,p_icare_phase text,p_domain text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me bigint := recoveryos.current_person_id(); v_s recoveryos.meeting_series%rowtype;
 v_id bigint; v_names text[]; v_existing recoveryos.meetings%rowtype;
begin
 if auth.uid() is null or v_me is null then raise exception 'unauthenticated' using errcode='42501'; end if;
 -- Serialize against role/assignment revocation and verified-email changes.
 perform 1 from auth.users where id=auth.uid() for share;
 perform 1 from recoveryos.role_assignments where person_id=v_me for share;
 perform 1 from recoveryos.meeting_facilitator_assignments where series_id=p_series_id and person_id=v_me for share;
 if not recoveryos_circle_private.can_record(p_series_id) then raise exception 'not_authorized' using errcode='42501'; end if;
 select * into v_s from recoveryos.meeting_series where id=p_series_id and is_active;
 if not found then raise exception 'circle_unavailable' using errcode='22023'; end if;
 if p_status is null or p_status not in ('held','cancelled') or p_starts_at is null or not isfinite(p_starts_at)
 or p_starts_at > now() or (p_ends_at is not null and (not isfinite(p_ends_at) or p_ends_at <= p_starts_at or p_ends_at > now())) then
 raise exception 'invalid_date_or_status' using errcode='22023'; end if;
 select array_agg(trim(n) order by ord) into v_names from unnest(p_facilitator_names) with ordinality as t(n,ord) where nullif(trim(n),'') is not null;
 if p_status='held' and (p_participant_count is null or p_participant_count not between 0 and 10000 or coalesce(cardinality(v_names),0) not between 1 and 30) then
 raise exception 'attendance_required' using errcode='22023'; end if;
 if p_status='cancelled' and p_participant_count is not null then raise exception 'cancelled_has_no_attendance' using errcode='22023'; end if;
 if exists(select 1 from unnest(v_names) n where length(n)>160) or (select count(distinct lower(n)) from unnest(v_names) n) <> cardinality(v_names)
 or length(p_topic_title)>240 or length(p_topic_category)>120 or length(p_domain)>80
 or (p_icare_phase is not null and p_icare_phase not in ('Identify','Connect','Assess','Respond','Empower')) then raise exception 'invalid_details' using errcode='22023'; end if;
 insert into recoveryos.meetings(organization_id,title,starts_at,ends_at,series_id,service_type_id,location_name,location_kind,occurrence_status,participant_count,facilitator_names,topic_title,topic_category,programming_icare_phase,programming_domain,recorded_by_person_id,recorded_at,recording_source,county,participation_access)
 values(v_s.organization_id,v_s.name,p_starts_at,p_ends_at,v_s.id,v_s.service_type_id,v_s.location_name,v_s.location_kind,p_status,p_participant_count,v_names,nullif(trim(p_topic_title),''),nullif(trim(p_topic_category),''),p_icare_phase,nullif(trim(p_domain),''),v_me,now(),'staff_attested',v_s.county,v_s.participation_access)
 on conflict(series_id,starts_at) where series_id is not null do nothing returning id into v_id;
 if v_id is null then
  select * into v_existing from recoveryos.meetings where series_id=p_series_id and starts_at=p_starts_at;
  if row(v_existing.ends_at,v_existing.occurrence_status,v_existing.participant_count,v_existing.facilitator_names,v_existing.topic_title,v_existing.topic_category,v_existing.programming_icare_phase,v_existing.programming_domain)
   is distinct from row(p_ends_at,p_status,p_participant_count,v_names,nullif(trim(p_topic_title),''),nullif(trim(p_topic_category),''),p_icare_phase,nullif(trim(p_domain),'')) then
   return jsonb_build_object('ok',false,'code','duplicate_conflict','meeting_id',v_existing.id);
  end if;
  return jsonb_build_object('ok',true,'code','already_recorded','meeting_id',v_existing.id);
 end if;
 return jsonb_build_object('ok',true,'code','recorded','meeting_id',v_id);
end $$;


-- Location/schedule configuration is separately maintained from delivered-service evidence.
update recoveryos.meeting_series s set county='Polk',address='2500 University Ave, Des Moines, IA 50311',
 room='3rd Floor, Room #306',participation_access='public',schedule_frequency='weekly',schedule_weekday=2,
 start_time='18:30',end_time='19:30',schedule_note='Every Tuesday, 6:30–7:30 PM (America/Chicago)'
 from recoveryos.organizations o,recoveryos.service_types st
 where s.organization_id=o.id and o.name='Grace For Addictions' and s.service_type_id=st.id
 and st.key='recovery_circle' and s.location_name='Hope+Elim';
insert into recoveryos.meeting_series(organization_id,service_type_id,name,location_name,location_kind,county,address,participation_access,recording_access,schedule_frequency,schedule_weekday,schedule_note)
 select o.id,st.id,'Grace For Addictions Recovery Circle (GFARC) — '||v.setting,
 'Clive Behavioral Health (CBH) — '||v.setting,'community','Polk','1450 NW 114th Street, Clive, IA 50325',
 'closed_cbh_clients','cbh','selected_tuesdays',2,'Selected Tuesdays each month; dates and times coordinated with CBH. Closed — CBH clients only, not open to the general public.'
 from recoveryos.organizations o cross join recoveryos.service_types st cross join (values('Outpatient'),('Inpatient')) v(setting)
 where o.name='Grace For Addictions' and st.key='recovery_circle'
 on conflict(organization_id,name,location_name) do nothing;
-- Backfill location county/access for the already documented Hope+Elim occurrence; counts and evidence remain unchanged.
update recoveryos.meetings m set county=s.county,participation_access=s.participation_access
 from recoveryos.meeting_series s where m.series_id=s.id and s.location_name='Hope+Elim' and s.county='Polk';
notify pgrst,'reload schema';
