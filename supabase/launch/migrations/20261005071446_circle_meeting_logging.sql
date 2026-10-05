-- Executive authorization: 2026-10-05 Circle logging request. Additive B1 slice.
-- Aggregate attendance is not unique reach, individual service_events, or outcomes.
create schema if not exists recoveryos_circle_private;
revoke all on schema recoveryos_circle_private from public, anon;
grant usage on schema recoveryos_circle_private to authenticated;

create table recoveryos.meeting_series (
 id bigint generated always as identity primary key,
 organization_id bigint not null references recoveryos.organizations(id),
 service_type_id bigint not null references recoveryos.service_types(id),
 name text not null check (length(trim(name)) between 1 and 160),
 location_name text not null check (length(trim(location_name)) between 1 and 160),
 location_kind text not null check (location_kind in ('community','virtual','hybrid')),
 timezone text not null default 'America/Chicago',
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(organization_id,name,location_name)
);
create table recoveryos.meeting_facilitator_assignments (
 series_id bigint not null references recoveryos.meeting_series(id),
 person_id bigint not null references recoveryos.people(id),
 assigned_by_person_id bigint not null references recoveryos.people(id),
 assigned_at timestamptz not null default now(),
 revoked_at timestamptz,
 primary key(series_id,person_id)
);
create index meeting_facilitator_person_idx on recoveryos.meeting_facilitator_assignments(person_id,series_id) where revoked_at is null;
alter table recoveryos.meeting_series enable row level security;
alter table recoveryos.meeting_facilitator_assignments enable row level security;
revoke all on recoveryos.meeting_series,recoveryos.meeting_facilitator_assignments from public,anon,authenticated;

alter table recoveryos.meetings
 add column series_id bigint references recoveryos.meeting_series(id),
 add column service_type_id bigint references recoveryos.service_types(id),
 add column location_name text,
 add column location_kind text,
 add column occurrence_status text check (occurrence_status in ('scheduled','held','cancelled')),
 add column participant_count integer check (participant_count between 0 and 10000),
 add column facilitator_names text[],
 add column total_attendance integer generated always as (participant_count + cardinality(facilitator_names)) stored,
 add column topic_title text,
 add column topic_category text,
 add column programming_icare_phase text check (programming_icare_phase in ('Identify','Connect','Assess','Respond','Empower')),
 add column programming_domain text,
 add column recorded_by_person_id bigint references recoveryos.people(id),
 add column recorded_at timestamptz,
 add column recording_source text,
 add constraint circle_occurrence_complete check (series_id is null or (
   residence_id is null and service_type_id is not null and location_name is not null
   and occurrence_status is not null and recorded_by_person_id is not null and recorded_at is not null
   and recording_source = 'facilitator_attested'
   and (ends_at is null or ends_at > starts_at)
   and (occurrence_status <> 'held' or (participant_count is not null and cardinality(facilitator_names) > 0))
   and (occurrence_status = 'held' or participant_count is null)
 ));
create unique index circle_occurrence_once on recoveryos.meetings(series_id,starts_at) where series_id is not null;
comment on column recoveryos.meetings.programming_icare_phase is 'Human-selected meeting content classification only; never participant stage or outcome.';
comment on column recoveryos.meetings.participant_count is 'Aggregate participant attendances excluding facilitators. Not unique reach or completed peer connections.';

-- Legacy public community-meeting visibility must not expose the new records.
-- RPC-only reads/writes for Circle rows; existing meeting policies still apply to legacy rows.
create policy circle_occurrences_rpc_only on recoveryos.meetings as restrictive
 for all to anon,authenticated using (series_id is null) with check (series_id is null);

create function recoveryos_circle_private.workspace() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_me bigint := recoveryos.current_person_id(); v_series jsonb; v_meetings jsonb;
begin
 if auth.uid() is null or v_me is null then raise exception 'unauthenticated' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'location_name',s.location_name,'location_kind',s.location_kind,'timezone',s.timezone,'facilitators',(
  select coalesce(jsonb_agg(jsonb_build_object('person_id',a.person_id,'name',trim(coalesce(nullif(p.preferred_name,''),p.first_name)||' '||p.last_name)) order by a.person_id),'[]'::jsonb)
  from recoveryos.meeting_facilitator_assignments a join recoveryos.people p on p.id=a.person_id where a.series_id=s.id and a.revoked_at is null
 )) order by s.name),'[]'::jsonb) into v_series
 from recoveryos.meeting_series s where s.is_active and exists(select 1 from recoveryos.meeting_facilitator_assignments a where a.series_id=s.id and a.person_id=v_me and a.revoked_at is null);
 select coalesce(jsonb_agg(to_jsonb(x) order by x.starts_at desc),'[]'::jsonb) into v_meetings from (
 select m.id,m.series_id,m.title,m.starts_at,m.ends_at,m.location_name,m.occurrence_status,m.participant_count,m.facilitator_names,m.total_attendance,m.topic_title,m.topic_category,m.programming_icare_phase,m.programming_domain,m.recorded_at
 from recoveryos.meetings m where m.series_id is not null and exists(select 1 from recoveryos.meeting_facilitator_assignments a where a.series_id=m.series_id and a.person_id=v_me and a.revoked_at is null)
 order by m.starts_at desc limit 200) x;
 return jsonb_build_object('series',v_series,'meetings',v_meetings);
end $$;

create function recoveryos_circle_private.record_occurrence(
 p_series_id bigint,p_starts_at timestamptz,p_ends_at timestamptz,p_status text,
 p_participant_count integer,p_facilitator_names text[],p_topic_title text,
 p_topic_category text,p_icare_phase text,p_domain text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me bigint := recoveryos.current_person_id(); v_s recoveryos.meeting_series%rowtype;
 v_id bigint; v_names text[]; v_existing recoveryos.meetings%rowtype;
begin
 if auth.uid() is null or v_me is null then raise exception 'unauthenticated' using errcode='42501'; end if;
 -- Lock the assignment: a concurrent revocation cannot race a write.
 perform 1 from recoveryos.meeting_facilitator_assignments a where a.series_id=p_series_id and a.person_id=v_me and a.revoked_at is null for share;
 if not found then raise exception 'not_authorized' using errcode='42501'; end if;
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
 insert into recoveryos.meetings(organization_id,title,starts_at,ends_at,series_id,service_type_id,location_name,location_kind,occurrence_status,participant_count,facilitator_names,topic_title,topic_category,programming_icare_phase,programming_domain,recorded_by_person_id,recorded_at,recording_source)
 values(v_s.organization_id,v_s.name,p_starts_at,p_ends_at,v_s.id,v_s.service_type_id,v_s.location_name,v_s.location_kind,p_status,p_participant_count,v_names,nullif(trim(p_topic_title),''),nullif(trim(p_topic_category),''),p_icare_phase,nullif(trim(p_domain),''),v_me,now(),'facilitator_attested')
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

-- Explicit, revocable functional assignment. No role or residence grant is made.
create function recoveryos_circle_private.assign_facilitator(p_series_id bigint,p_person_id bigint,p_active boolean)
 returns void language plpgsql security definer set search_path = '' as $$
declare v_me bigint := recoveryos.current_person_id();
begin
 if auth.uid() is null or v_me is null or not recoveryos.is_platform_admin() then raise exception 'not_authorized' using errcode='42501'; end if;
 if p_active is null then raise exception 'active_required' using errcode='22023'; end if;
 if p_active then
 insert into recoveryos.meeting_facilitator_assignments(series_id,person_id,assigned_by_person_id) values(p_series_id,p_person_id,v_me)
 on conflict(series_id,person_id) do update set assigned_by_person_id=v_me,assigned_at=now(),revoked_at=null;
 else update recoveryos.meeting_facilitator_assignments set revoked_at=now() where series_id=p_series_id and person_id=p_person_id; end if;
end $$;

create function recoveryos.get_my_circle_workspace() returns jsonb language sql security invoker set search_path='' as $$select recoveryos_circle_private.workspace()$$;
create function recoveryos.record_circle_meeting(p_series_id bigint,p_starts_at timestamptz,p_ends_at timestamptz,p_status text,p_participant_count integer,p_facilitator_names text[],p_topic_title text default null,p_topic_category text default null,p_icare_phase text default null,p_domain text default null)
 returns jsonb language sql security invoker set search_path='' as $$select recoveryos_circle_private.record_occurrence(p_series_id,p_starts_at,p_ends_at,p_status,p_participant_count,p_facilitator_names,p_topic_title,p_topic_category,p_icare_phase,p_domain)$$;
create function recoveryos.assign_circle_facilitator(p_series_id bigint,p_person_id bigint,p_active boolean) returns void language sql security invoker set search_path='' as $$select recoveryos_circle_private.assign_facilitator(p_series_id,p_person_id,p_active)$$;
revoke all on all functions in schema recoveryos_circle_private from public,anon;
grant execute on all functions in schema recoveryos_circle_private to authenticated;
revoke all on function recoveryos.get_my_circle_workspace(),recoveryos.record_circle_meeting(bigint,timestamptz,timestamptz,text,integer,text[],text,text,text,text),recoveryos.assign_circle_facilitator(bigint,bigint,boolean) from public,anon;
grant execute on function recoveryos.get_my_circle_workspace(),recoveryos.record_circle_meeting(bigint,timestamptz,timestamptz,text,integer,text[],text,text,text,text),recoveryos.assign_circle_facilitator(bigint,bigint,boolean) to authenticated;
notify pgrst,'reload schema';
