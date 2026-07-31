-- Compliance records itself (Integration Plan §4): daily workflow actions
-- automatically evidence their NARR 3.0 standard. "Staff never think about
-- NARR — they just do their job."
--
-- Each trigger marks the mapped standard 'met' on the residence's tracker
-- with an auto-generated evidence line and a 1-year review horizon. Manual
-- overrides remain possible on the Compliance page; a later manual status
-- simply supersedes the auto-evidence (same upsert row).

set search_path = recoveryos, public;

create or replace function narr_auto_evidence(
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
  insert into narr_compliance (residence_id, standard_id, status, evidence, verified_at, next_review_on)
  values (p_residence_id, v_standard_id, 'met', p_evidence, now(), current_date + interval '1 year')
  on conflict (residence_id, standard_id) do update
    set status = 'met',
        evidence = excluded.evidence,
        verified_at = now(),
        next_review_on = excluded.next_review_on
    where narr_compliance.status in ('in_progress', 'met');
end;
$$;

-- Screenings → 2.F.16.c (drug screening and toxicology protocols)
create or replace function trg_screening_evidence() returns trigger
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_residence_id bigint;
begin
  select residence_id into v_residence_id from residencies where id = new.residency_id;
  perform narr_auto_evidence(v_residence_id, '2.F.16.c',
    'Auto: screening logged ' || to_char(new.collected_at, 'YYYY-MM-DD') || ' (screening #' || new.id || ')');
  return new;
end;
$$;
create trigger screenings_narr_evidence after insert on screenings
  for each row execute function trg_screening_evidence();

-- House meetings → 3.G.23.a (weekly schedule of recovery support services)
create or replace function trg_meeting_evidence() returns trigger
language plpgsql security definer set search_path = recoveryos, public as $$
begin
  if new.residence_id is not null then
    perform narr_auto_evidence(new.residence_id, '3.G.23.a',
      'Auto: house meeting scheduled ' || to_char(new.starts_at, 'YYYY-MM-DD') || ' (meeting #' || new.id || ')');
  end if;
  return new;
end;
$$;
create trigger meetings_narr_evidence after insert on meetings
  for each row execute function trg_meeting_evidence();

-- Attendance recorded → 3.G.23.b (peer support) + 3.I.27 (family indicators)
create or replace function trg_attendance_evidence() returns trigger
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_residence_id bigint;
begin
  if new.status = 'present' then
    select residence_id into v_residence_id from meetings where id = new.meeting_id;
    perform narr_auto_evidence(v_residence_id, '3.G.23.b',
      'Auto: meeting attendance recorded (meeting #' || new.meeting_id || ')');
    perform narr_auto_evidence(v_residence_id, '3.I.27',
      'Auto: house meeting participation documented (meeting #' || new.meeting_id || ')');
  end if;
  return new;
end;
$$;
create trigger attendance_narr_evidence after insert or update on meeting_attendance
  for each row execute function trg_attendance_evidence();

-- Chore completion → 3.I.27 (functionally equivalent family: shared work)
create or replace function trg_chore_evidence() returns trigger
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_residence_id bigint;
  v_prior timestamptz;
begin
  if tg_op = 'UPDATE' then
    v_prior := old.completed_at;
  end if;
  if new.completed_at is not null and v_prior is null then
    select residence_id into v_residence_id from residencies where id = new.residency_id;
    perform narr_auto_evidence(v_residence_id, '3.I.27',
      'Auto: chore completion recorded ' || to_char(new.completed_at, 'YYYY-MM-DD'));
  end if;
  return new;
end;
$$;
create trigger chores_narr_evidence after insert or update on chore_assignments
  for each row execute function trg_chore_evidence();

-- Incident reports → 1.A.4.a (data collection with privacy protected)
create or replace function trg_incident_evidence() returns trigger
language plpgsql security definer set search_path = recoveryos, public as $$
begin
  perform narr_auto_evidence(new.residence_id, '1.A.4.a',
    'Auto: incident documented ' || to_char(new.occurred_at, 'YYYY-MM-DD') || ' (incident #' || new.id || ')');
  return new;
end;
$$;
create trigger incidents_narr_evidence after insert on incidents
  for each row execute function trg_incident_evidence();

-- Fee ledger entries → 1.A.3.b (accounting for resident financial transactions)
create or replace function trg_fee_evidence() returns trigger
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_residence_id bigint;
begin
  select residence_id into v_residence_id from residencies where id = new.residency_id;
  perform narr_auto_evidence(v_residence_id, '1.A.3.b',
    'Auto: fee ledger entry recorded ' || to_char(new.created_at, 'YYYY-MM-DD') || ' (entry #' || new.id || ')');
  return new;
end;
$$;
create trigger fees_narr_evidence after insert on fee_ledger
  for each row execute function trg_fee_evidence();

-- House board → 1.C.7.e (residents heard) for meeting notes,
-- 1.C.8.c (progress celebrated) for milestones
create or replace function trg_board_evidence() returns trigger
language plpgsql security definer set search_path = recoveryos, public as $$
begin
  if new.category = 'meeting_notes' then
    perform narr_auto_evidence(new.residence_id, '1.C.7.e',
      'Auto: meeting notes shared with the house (post #' || new.id || ')');
  elsif new.category = 'milestone' then
    perform narr_auto_evidence(new.residence_id, '1.C.8.c',
      'Auto: milestone celebrated on the house board (post #' || new.id || ')');
  end if;
  return new;
end;
$$;
create trigger board_narr_evidence after insert on house_posts
  for each row execute function trg_board_evidence();

-- Document signatures → the standard each signed document evidences
create or replace function trg_document_evidence() returns trigger
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_key text;
  v_residence_id bigint;
begin
  if new.acknowledged_at is null or old.acknowledged_at is not null then
    return new;
  end if;
  select t.key into v_key
  from document_versions dv join document_templates t on t.id = dv.template_id
  where dv.id = new.document_version_id;
  select residence_id into v_residence_id from residencies where id = new.residency_id;
  if v_residence_id is null then
    return new;
  end if;

  if v_key = 'participant_agreement' then
    perform narr_auto_evidence(v_residence_id, '1.B.5.a', 'Auto: Participant Agreement signed (assignment #' || new.id || ')');
    perform narr_auto_evidence(v_residence_id, '1.A.2.d', 'Auto: non-discrimination terms acknowledged via Participant Agreement');
  elsif v_key = 'fee_schedule_financial_agreement' then
    perform narr_auto_evidence(v_residence_id, '1.A.3.a', 'Auto: Fee Schedule acknowledged before funds accepted (assignment #' || new.id || ')');
    perform narr_auto_evidence(v_residence_id, '1.A.3.c', 'Auto: refund terms acknowledged via Fee Schedule & Financial Agreement');
  elsif v_key = 'code_of_conduct' then
    perform narr_auto_evidence(v_residence_id, '2.F.16.a', 'Auto: substance-free policy acknowledged via Code of Conduct');
    perform narr_auto_evidence(v_residence_id, '1.B.6.c', 'Auto: social media privacy standards acknowledged via Code of Conduct');
  elsif v_key = 'resident_handbook' then
    perform narr_auto_evidence(v_residence_id, '1.C.7.c', 'Auto: resident rights provided and acknowledged via Handbook');
  elsif v_key = 'medication_mat_moud_policy' then
    perform narr_auto_evidence(v_residence_id, '2.F.16.d', 'Auto: medication storage policy acknowledged');
  elsif v_key = 'good_neighbor_policy' then
    perform narr_auto_evidence(v_residence_id, '4.J.30.c', 'Auto: neighbor interaction orientation acknowledged');
  end if;
  return new;
end;
$$;
create trigger documents_narr_evidence after update on document_assignments
  for each row execute function trg_document_evidence();

-- Recovery plans → 3.G.21.a (individualized recovery planning)
create or replace function trg_plan_evidence() returns trigger
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_residence_id bigint;
begin
  select residence_id into v_residence_id
  from residencies
  where person_id = new.person_id
    and residency_status in ('active', 'on_pass', 'transitioning')
  limit 1;
  perform narr_auto_evidence(v_residence_id, '3.G.21.a',
    'Auto: individual recovery plan created (plan #' || new.id || ')');
  return new;
end;
$$;
create trigger plans_narr_evidence after insert on recovery_plans
  for each row execute function trg_plan_evidence();

notify pgrst, 'reload schema';
