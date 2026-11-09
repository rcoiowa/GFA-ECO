-- PREPARED ONLY. Do not auto-apply or add to the canonical migration chain.
-- Sharing authorized November 9: other authorized GFA staff and leadership.
-- Retention/correction policy, live metadata and isolated PostgREST acceptance remain gates.
-- Existing occurrences, roles, grants, can_record(), v1 RPC and history are preserved.
-- Nullable first-time attendance is not unique reach or an individual outcome.

create table recoveryos.circle_meeting_documentation (
  meeting_id bigint primary key references recoveryos.meetings(id),
  recorded_by_person_id bigint not null references recoveryos.people(id),
  recorded_at timestamptz not null default now(),
  first_time_participant_count integer check (first_time_participant_count between 0 and 10000),
  facilitator_notes text check (
    facilitator_notes is null or
    (length(facilitator_notes) between 1 and 2000 and facilitator_notes = btrim(facilitator_notes, E' \t\n\r\f\v'))
  )
);
alter table recoveryos.circle_meeting_documentation enable row level security;
-- Explicitly remove inherited default privileges, including service_role. RPC only.
revoke all on recoveryos.circle_meeting_documentation from public, anon, authenticated, service_role;
comment on table recoveryos.circle_meeting_documentation is
  'Append-only Circle documentation through scoped RPCs. Notes are visible to the eligible recorder and explicitly GFA-scoped staff/leadership; never email-only or technical-admin-only sharing. No participant records or stories.';
comment on column recoveryos.circle_meeting_documentation.first_time_participant_count is
  'Optional facilitator-attested count of first-time participants within this occurrence, excluding facilitators. NULL is unknown/not collected, not zero. Not unique reach.';

-- Explicit classification is required: the older production helper treats an
-- absent classification row as production. Do not extend that fail-open default.
create function recoveryos_circle_private.documentation_actor() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and recoveryos.current_person_id() is not null
    and exists (select 1 from auth.users u where u.id = auth.uid()
      and u.deleted_at is null and not coalesce(u.is_anonymous, false)
      and (u.banned_until is null or u.banned_until < now()))
    and exists (select 1 from recoveryos.person_classification pc
      where pc.person_id = recoveryos.current_person_id() and pc.classification = 'production')
$$;

-- This is the narrow operational-note sharing authorized on November 9, not a
-- generic participant-narrative or technical-admin entitlement. No roles granted.
create function recoveryos_circle_private.can_read_shared_notes(p_series_id bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select recoveryos_circle_private.documentation_actor() and exists (
    select 1 from recoveryos.meeting_series s
    join recoveryos.organizations o on o.id = s.organization_id
    join recoveryos.service_types st on st.id = s.service_type_id
    join recoveryos.role_assignments ra on ra.person_id = recoveryos.current_person_id()
    where s.id = p_series_id and s.is_active and o.is_active
      and o.name = 'Grace For Addictions' and st.key = 'recovery_circle'
      and ra.revoked_at is null
      and ra.role_key::text = any (
        case when s.recording_access = 'cbh' then
          array['coach','navigator','program_manager','administrator','executive']
        else array['coach','navigator','program_coordinator','residence_staff',
          'residence_manager','program_manager','administrator','executive'] end
      )
      -- Explicit GFA scope on this same assignment. Global-only does not qualify.
      and (ra.organization_id is not null or ra.program_id is not null or ra.residence_id is not null)
      and (ra.organization_id is null or ra.organization_id = s.organization_id)
      and (ra.program_id is null or exists (select 1 from recoveryos.programs p
        where p.id = ra.program_id and p.organization_id = s.organization_id))
      and (ra.residence_id is null or exists (select 1 from recoveryos.residences r
        where r.id = ra.residence_id and r.organization_id = s.organization_id))
  )
$$;

create function recoveryos_circle_private.record_documented_occurrence(
  p_series_id bigint, p_starts_at timestamptz, p_ends_at timestamptz, p_status text,
  p_participant_count integer, p_facilitator_names text[], p_topic_title text,
  p_topic_category text, p_icare_phase text, p_domain text,
  p_first_time_participant_count integer, p_facilitator_notes text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_notes text := nullif(btrim(p_facilitator_notes, E' \t\n\r\f\v'), '');
  v_result jsonb;
  v_id bigint;
  v_document recoveryos.circle_meeting_documentation%rowtype;
begin
  if auth.uid() is null or v_me is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;
  -- Classification changes serialize with this new documentation write.
  perform 1 from recoveryos.person_classification where person_id = v_me for share;
  if not recoveryos_circle_private.documentation_actor() or
    not recoveryos_circle_private.can_record(p_series_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_first_time_participant_count is not null and (
    p_status is distinct from 'held' or p_participant_count is null or
    p_first_time_participant_count < 0 or p_first_time_participant_count > p_participant_count
  ) then
    raise exception 'invalid_first_time_count' using errcode = '22023';
  end if;
  if length(v_notes) > 2000 then
    raise exception 'invalid_facilitator_notes' using errcode = '22023';
  end if;

  -- Reuse the reviewed current policy, validation, identity/role locks, provenance,
  -- county snapshots and unique series/start-time key. Both writes are one transaction.
  v_result := recoveryos_circle_private.record_occurrence(
    p_series_id, p_starts_at, p_ends_at, p_status, p_participant_count,
    p_facilitator_names, p_topic_title, p_topic_category, p_icare_phase, p_domain
  );
  if not (v_result->>'ok')::boolean then return v_result; end if;
  v_id := (v_result->>'meeting_id')::bigint;
  if v_result->>'code' = 'recorded' then
    insert into recoveryos.circle_meeting_documentation(
      meeting_id, recorded_by_person_id, first_time_participant_count, facilitator_notes
    ) values (v_id, v_me, p_first_time_participant_count, v_notes);
    return v_result;
  end if;

  select * into v_document from recoveryos.circle_meeting_documentation where meeting_id = v_id;
  if found then
    -- Never compare another recorder's text: identical/different guesses have the
    -- same conflict response. No notes or counts are returned by the write RPC.
    if v_document.recorded_by_person_id <> v_me or
      row(v_document.first_time_participant_count, v_document.facilitator_notes)
      is distinct from row(p_first_time_participant_count, v_notes) then
      return jsonb_build_object('ok', false, 'code', 'duplicate_conflict', 'meeting_id', v_id);
    end if;
  elsif p_first_time_participant_count is not null or v_notes is not null then
    -- A retry must not silently append details to historical/v1 records.
    return jsonb_build_object('ok', false, 'code', 'duplicate_conflict', 'meeting_id', v_id);
  end if;
  return v_result;
end $$;

create function recoveryos_circle_private.documented_workspace() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_workspace jsonb := recoveryos_circle_private.workspace();
  v_me bigint := recoveryos.current_person_id();
  v_actor boolean := recoveryos_circle_private.documentation_actor();
  v_meetings jsonb;
  v_read_only jsonb;
begin
  -- Original writable series remain untouched. Leadership can read documentation
  -- without acquiring recording access; no mutation of can_record() or v1 RPC.
  select coalesce(jsonb_agg(to_jsonb(x) order by x.name), '[]'::jsonb) into v_read_only from (
    select s.id, s.name, s.location_name, s.location_kind, s.timezone, s.county,
      s.address, s.room, s.participation_access, s.schedule_frequency,
      s.schedule_weekday, s.start_time, s.end_time, s.schedule_note, '[]'::jsonb as facilitators
    from recoveryos.meeting_series s
    where recoveryos_circle_private.can_read_shared_notes(s.id)
      and not recoveryos_circle_private.can_record(s.id)
  ) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.starts_at desc, x.id desc), '[]'::jsonb)
  into v_meetings from (
    select m.id, m.series_id, m.title, m.starts_at, m.ends_at, m.location_name,
      m.occurrence_status, m.participant_count, m.facilitator_names, m.total_attendance,
      m.topic_title, m.topic_category, m.programming_icare_phase, m.programming_domain,
      m.recorded_at, m.county, m.participation_access,
      case when v_actor then d.first_time_participant_count else null end as first_time_participant_count,
      case when v_actor and (
        (d.recorded_by_person_id = v_me and recoveryos_circle_private.can_record(m.series_id))
        or recoveryos_circle_private.can_read_shared_notes(m.series_id)
      ) then d.facilitator_notes else null end as facilitator_notes
    from recoveryos.meetings m
    left join recoveryos.circle_meeting_documentation d on d.meeting_id = m.id
    where m.id in (select (entry->>'id')::bigint from jsonb_array_elements(v_workspace->'meetings') entry)
      or (d.meeting_id is not null and recoveryos_circle_private.can_read_shared_notes(m.series_id))
    order by m.starts_at desc, m.id desc limit 200
  ) x;
  return v_workspace || jsonb_build_object(
    'meetings', v_meetings, 'readOnlySeries', v_read_only,
    'capabilities', jsonb_build_object('circle_documentation_v2', v_actor)
  );
end $$;

create function recoveryos.record_circle_meeting_v2(
  p_series_id bigint, p_starts_at timestamptz, p_ends_at timestamptz, p_status text,
  p_participant_count integer, p_facilitator_names text[], p_topic_title text,
  p_topic_category text, p_icare_phase text, p_domain text,
  p_first_time_participant_count integer, p_facilitator_notes text
) returns jsonb language sql security invoker set search_path = '' as $$
  select recoveryos_circle_private.record_documented_occurrence(
    p_series_id, p_starts_at, p_ends_at, p_status, p_participant_count,
    p_facilitator_names, p_topic_title, p_topic_category, p_icare_phase, p_domain,
    p_first_time_participant_count, p_facilitator_notes
  )
$$;
create or replace function recoveryos.get_my_circle_workspace() returns jsonb
language sql security invoker set search_path = '' as $$
  select recoveryos_circle_private.documented_workspace()
$$;

-- Narrow function grants only. Do not alter schema/default/table privileges or roles.
revoke all on function
  recoveryos_circle_private.documentation_actor(),
  recoveryos_circle_private.can_read_shared_notes(bigint),
  recoveryos_circle_private.record_documented_occurrence(bigint,timestamptz,timestamptz,text,integer,text[],text,text,text,text,integer,text),
  recoveryos_circle_private.documented_workspace(),
  recoveryos.record_circle_meeting_v2(bigint,timestamptz,timestamptz,text,integer,text[],text,text,text,text,integer,text)
from public, anon, authenticated, service_role;
grant execute on function
  recoveryos_circle_private.record_documented_occurrence(bigint,timestamptz,timestamptz,text,integer,text[],text,text,text,text,integer,text),
  recoveryos_circle_private.documented_workspace(),
  recoveryos.record_circle_meeting_v2(bigint,timestamptz,timestamptz,text,integer,text[],text,text,text,text,integer,text)
to authenticated;
notify pgrst, 'reload schema';
