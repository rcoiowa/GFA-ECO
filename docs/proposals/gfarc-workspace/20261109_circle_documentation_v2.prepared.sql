-- PREPARED ONLY. Do not auto-apply or add to the canonical migration chain.
-- Review notes audience/retention, live metadata and isolated PostgREST acceptance first.
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
  'Append-only Circle documentation through scoped RPCs. Notes are recorder-only while current Circle access remains. No participant records or stories.';
comment on column recoveryos.circle_meeting_documentation.first_time_participant_count is
  'Optional facilitator-attested count of first-time participants within this occurrence, excluding facilitators. NULL is unknown/not collected, not zero. Not unique reach.';

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
  if not recoveryos_circle_private.can_record(p_series_id) then
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
  v_meetings jsonb;
begin
  -- The original workspace provides the current scoped 200-row set. Do not broaden it.
  select coalesce(jsonb_agg(
    entry.value || jsonb_build_object(
      'first_time_participant_count', d.first_time_participant_count,
      'facilitator_notes', case when d.recorded_by_person_id = v_me then d.facilitator_notes else null end
    ) order by entry.ordinality
  ), '[]'::jsonb) into v_meetings
  from jsonb_array_elements(v_workspace->'meetings') with ordinality as entry(value, ordinality)
  left join recoveryos.circle_meeting_documentation d on d.meeting_id = (entry.value->>'id')::bigint;
  return v_workspace || jsonb_build_object(
    'meetings', v_meetings, 'capabilities', jsonb_build_object('circle_documentation_v2', true)
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
