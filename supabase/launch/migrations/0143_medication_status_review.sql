-- 0143_medication_status_review.sql — medication-readiness correction (EJWRH Document
-- Edition & B5 Readiness Gate, 2026-08-24).
--
-- Defect being corrected (identified in the B1–B4 closeout, frontline burden item):
-- an applicant with NO current medications showed medication_items = 'unconfirmed'
-- and could only be admitted through the §9a override path. "Reviewed — no current
-- medications" is a NORMAL SATISFIED intake state, not a deferral.
--
-- Model (three distinguishable states, derived — no fabricated medication rows):
--   not reviewed            -> readiness status 'unconfirmed'  (met=false, overridable)
--   reviewed, none          -> readiness status 'reviewed_none' (met=true)   [NEW record]
--   reviewed, meds recorded -> readiness status 'met'           (met=true)   [items, as before]
--
-- The review is ONE TAP for staff (confirm_no_current_medications), audited, and
-- automatically superseded the moment a real medication item is recorded — the two
-- reviewed states are mutually exclusive and the record never lies.
--
-- ROLLBACK:
--   (re-run the 0142 application_intake_readiness body, verbatim in that file)
--   (re-run the 0141 record_medication_item body, verbatim in that file)
--   drop function recoveryos.confirm_no_current_medications(bigint);
--   drop table recoveryos.medication_status_reviews;

set search_path = recoveryos, public;

-- 1) The review record: evidence that the medication conversation happened and its
--    outcome was "no current medications". Bounded, no narrative, no clinical detail.
create table if not exists recoveryos.medication_status_reviews (
  id bigint generated always as identity primary key,
  person_id bigint not null references recoveryos.people (id) on delete cascade,
  application_id bigint references recoveryos.residence_applications (id),
  outcome text not null default 'no_current_medications'
    check (outcome in ('no_current_medications')),
  reviewed_by_person_id bigint references recoveryos.people (id),
  reviewed_at timestamptz not null default now(),
  superseded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists medication_status_reviews_person_idx
  on recoveryos.medication_status_reviews (person_id) where superseded_at is null;

alter table recoveryos.medication_status_reviews enable row level security;
create policy medication_status_reviews_self_read on recoveryos.medication_status_reviews
  for select to authenticated using (person_id = recoveryos.current_person_id());
create policy medication_status_reviews_staff_read on recoveryos.medication_status_reviews
  for select to authenticated
  using (exists (
    select 1 from recoveryos.residencies r
    where r.person_id = medication_status_reviews.person_id
      and r.residence_id in (select recoveryos.staff_residence_ids())
    union all
    select 1 from recoveryos.residence_applications a
    where a.person_id = medication_status_reviews.person_id
      and a.residence_id in (select recoveryos.staff_residence_ids())));
revoke insert, update, delete on recoveryos.medication_status_reviews from anon, authenticated;

-- 2) The one-tap staff action (audited). Refuses when active medication items exist
--    (the states are exclusive); idempotent when already confirmed.
create or replace function recoveryos.confirm_no_current_medications(p_person_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_id bigint;
  v_application_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not recoveryos.is_platform_admin() and not exists (
       select 1 from recoveryos.residencies r
       where r.person_id = p_person_id
         and r.residence_id in (select recoveryos.staff_residence_ids())
       union all
       select 1 from recoveryos.residence_applications a
       where a.person_id = p_person_id
         and a.residence_id in (select recoveryos.staff_residence_ids())) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if exists (select 1 from recoveryos.residency_medication_items m
             where m.person_id = p_person_id and m.ended_at is null) then
    return jsonb_build_object('ok', false, 'code', 'medication_items_exist',
      'message', 'Active medication items are recorded — the status is already reviewed.');
  end if;
  if exists (select 1 from recoveryos.medication_status_reviews
             where person_id = p_person_id and superseded_at is null) then
    return jsonb_build_object('ok', true, 'code', 'already_confirmed');
  end if;
  select id into v_application_id from recoveryos.residence_applications
    where person_id = p_person_id
      and residence_id in (select recoveryos.staff_residence_ids())
    order by submitted_at desc limit 1;
  insert into recoveryos.medication_status_reviews (person_id, application_id, reviewed_by_person_id)
  values (p_person_id, v_application_id, v_me)
  returning id into v_id;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'medication_status_reviewed', 'medication_status_reviews', v_id,
          jsonb_build_object('person_id', p_person_id, 'outcome', 'no_current_medications'));
  return jsonb_build_object('ok', true, 'code', 'confirmed', 'review_id', v_id);
end $$;
revoke execute on function recoveryos.confirm_no_current_medications(bigint) from public, anon;
grant execute on function recoveryos.confirm_no_current_medications(bigint) to authenticated;

-- 3) Recording a real medication item supersedes any standing "none" review — the
--    0141 body is preserved verbatim except for the single supersede statement.
create or replace function recoveryos.record_medication_item(
  p_person_id bigint, p_name text,
  p_storage_requirement text default 'self_managed',
  p_is_moud boolean default false,
  p_prescriber_on_file boolean default false
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_id bigint;
  v_application_id bigint;
  v_residency_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_storage_requirement not in ('self_managed','secure_storage','staff_count') then
    return jsonb_build_object('ok', false, 'code', 'invalid_storage_requirement');
  end if;
  select id into v_residency_id from recoveryos.residencies
    where person_id = p_person_id and residency_status in ('active','on_pass','transitioning')
      and residence_id in (select recoveryos.staff_residence_ids())
    limit 1;
  if v_residency_id is null then
    select id into v_application_id from recoveryos.residence_applications
      where person_id = p_person_id
        and residence_id in (select recoveryos.staff_residence_ids())
      order by submitted_at desc limit 1;
  end if;
  if v_residency_id is null and v_application_id is null and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  insert into recoveryos.residency_medication_items
    (person_id, application_id, residency_id, name, storage_requirement,
     is_moud, prescriber_on_file, recorded_by_person_id)
  values (p_person_id, v_application_id, v_residency_id, trim(p_name), p_storage_requirement,
          p_is_moud, p_prescriber_on_file, v_me)
  returning id into v_id;
  -- A recorded item makes any standing "no current medications" review stale: supersede it.
  update recoveryos.medication_status_reviews
     set superseded_at = now()
   where person_id = p_person_id and superseded_at is null;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'medication_item_recorded', 'residency_medication_items', v_id,
          jsonb_build_object('person_id', p_person_id, 'storage', p_storage_requirement));
  return jsonb_build_object('ok', true, 'code', 'recorded', 'item_id', v_id);
end $$;

-- 4) Readiness: the medication item gains the third state. The 0142 body is preserved
--    verbatim except for the medication block.
create or replace function recoveryos.application_intake_readiness(p_application_id bigint)
returns jsonb language plpgsql stable security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_app recoveryos.residence_applications%rowtype;
  v_items jsonb := '[]'::jsonb;
  v_blocking jsonb;
  v_t record;
  v_met boolean;
  v_reviewed_none boolean;
  v_sig_count int := 0;
  v_has_screening boolean;
  v_supervision_applies boolean;
  v_accommodation_raised boolean;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_app from recoveryos.residence_applications where id = p_application_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_app.person_id <> v_me
     and v_app.residence_id not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_care_operations_staff()
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  -- Signature documents (required_before_admission, non-overridable).
  for v_t in
    select t.key, t.name
    from recoveryos.document_templates t
    join recoveryos.residences r on r.id = v_app.residence_id
     and r.organization_id = t.organization_id
    where t.is_active and t.requires_signature
      and (t.residence_id is null or t.residence_id = v_app.residence_id)
      and exists (select 1 from recoveryos.document_versions dv
                  where dv.template_id = t.id and dv.published_at is not null)
    order by t.key
  loop
    v_sig_count := v_sig_count + 1;
    select exists (
      select 1 from recoveryos.document_assignments a
      join recoveryos.document_versions dv on dv.id = a.document_version_id
      join recoveryos.document_templates t2 on t2.id = dv.template_id
      where a.person_id = v_app.person_id and t2.key = v_t.key and a.signed_at is not null
    ) into v_met;
    v_items := v_items || jsonb_build_object(
      'key', 'sign:' || v_t.key, 'label', 'Sign: ' || v_t.name,
      'class', 'required_before_admission',
      'status', case when v_met then 'met' else 'missing' end,
      'met', v_met, 'overridable', false);
  end loop;

  -- §5a boundary: a residence with NO assignable signature edition (EJWRH until its
  -- document edition is ratified) surfaces ONE explicit non-overridable placeholder.
  if v_sig_count = 0 then
    v_items := v_items || jsonb_build_object(
      'key', 'signature_documents', 'label', 'Residence document edition (signature set)',
      'class', 'required_before_admission',
      'status', 'pending_document_edition',
      'met', false, 'overridable', false);
  end if;

  -- Acknowledgment documents (required_for_intake_completion, non-overridable).
  for v_t in
    select t.key, t.name
    from recoveryos.document_templates t
    join recoveryos.residences r on r.id = v_app.residence_id
     and r.organization_id = t.organization_id
    where t.is_active and t.requires_acknowledgment and not t.requires_signature
      and (t.residence_id is null or t.residence_id = v_app.residence_id)
      and exists (select 1 from recoveryos.document_versions dv
                  where dv.template_id = t.id and dv.published_at is not null)
    order by t.key
  loop
    select exists (
      select 1 from recoveryos.document_assignments a
      join recoveryos.document_versions dv on dv.id = a.document_version_id
      join recoveryos.document_templates t2 on t2.id = dv.template_id
      where a.person_id = v_app.person_id and t2.key = v_t.key and a.acknowledged_at is not null
    ) into v_met;
    v_items := v_items || jsonb_build_object(
      'key', 'ack:' || v_t.key, 'label', 'Acknowledge: ' || v_t.name,
      'class', 'required_for_intake_completion',
      'status', case when v_met then 'met' else 'missing' end,
      'met', v_met, 'overridable', false);
  end loop;

  -- Screening consent (required_before_admission, non-overridable).
  select exists (
    select 1 from recoveryos.consent_grants g
    join recoveryos.consent_types ct on ct.id = g.consent_type_id
    where g.person_id = v_app.person_id and ct.key = 'residence_screening'
      and g.status = 'granted' and g.revoked_at is null
      and (g.expires_at is null or g.expires_at > now())
  ) into v_has_screening;
  v_items := v_items || jsonb_build_object(
    'key', 'screening_consent', 'label', 'Screening consent (current grant)',
    'class', 'required_before_admission',
    'status', case when v_has_screening then 'met' else 'missing' end,
    'met', v_has_screening, 'overridable', false);

  -- Emergency contact (required_for_intake_completion, non-overridable: immediate safety).
  select exists (
    select 1 from recoveryos.emergency_contacts c
    where c.person_id = v_app.person_id and c.is_active
  ) into v_met;
  v_items := v_items || jsonb_build_object(
    'key', 'emergency_contact', 'label', 'Emergency contact on file',
    'class', 'required_for_intake_completion',
    'status', case when v_met then 'met' else 'missing' end,
    'met', v_met, 'overridable', false);

  -- Medication status (conditionally_required): THREE derived states —
  --   'met'           active medication items recorded;
  --   'reviewed_none' staff reviewed and confirmed no current medications (satisfied);
  --   'unconfirmed'   conversation not yet recorded (unmet, overridable deferral).
  select exists (
    select 1 from recoveryos.residency_medication_items m
    where m.person_id = v_app.person_id and m.ended_at is null
  ) into v_met;
  select exists (
    select 1 from recoveryos.medication_status_reviews
    where person_id = v_app.person_id and superseded_at is null
  ) into v_reviewed_none;
  v_items := v_items || jsonb_build_object(
    'key', 'medication_items', 'label', 'Medication status reviewed per medication policy',
    'class', 'conditionally_required',
    'status', case when v_met then 'met'
                   when v_reviewed_none then 'reviewed_none'
                   else 'unconfirmed' end,
    'met', v_met or v_reviewed_none, 'overridable', true);

  -- Accommodation review (conditionally_required only when a need is raised; OVERRIDABLE).
  v_accommodation_raised := nullif(trim(coalesce(v_app.answers->>'accommodation_needs','')), '') is not null;
  if v_accommodation_raised then
    v_items := v_items || jsonb_build_object(
      'key', 'accommodation', 'label', 'Accommodation need reviewed with staff',
      'class', 'conditionally_required',
      'status', 'needs_staff_review', 'met', false, 'overridable', true);
  else
    v_items := v_items || jsonb_build_object(
      'key', 'accommodation', 'label', 'Accommodation need reviewed with staff',
      'class', 'not_applicable', 'status', 'not_applicable',
      'met', true, 'overridable', false);
  end if;

  -- Supervision coordination (conditionally_required only when coordination applies).
  v_supervision_applies := lower(coalesce(v_app.answers->>'supervision_coordination','')) = 'yes';
  if v_supervision_applies then
    select exists (
      select 1 from recoveryos.supervision_coordination_records s
      join recoveryos.consent_grants g on g.id = s.consent_grant_id
      where s.person_id = v_app.person_id and s.is_active
        and g.status = 'granted' and g.revoked_at is null
        and (g.expires_at is null or g.expires_at > now())
    ) into v_met;
    v_items := v_items || jsonb_build_object(
      'key', 'supervision', 'label', 'Supervision coordination authorized + contact on file',
      'class', 'conditionally_required',
      'status', case when v_met then 'met' else 'missing' end,
      'met', v_met, 'overridable', true);
  else
    v_items := v_items || jsonb_build_object(
      'key', 'supervision', 'label', 'Supervision coordination authorized + contact on file',
      'class', 'not_applicable', 'status', 'not_applicable',
      'met', true, 'overridable', false);
  end if;

  select coalesce(jsonb_agg(i->>'key'), '[]'::jsonb) into v_blocking
  from jsonb_array_elements(v_items) i
  where (i->>'met')::boolean = false;

  return jsonb_build_object('ok', true,
    'application_id', p_application_id,
    'complete', jsonb_array_length(v_blocking) = 0,
    'items', v_items,
    'blocking_unmet', v_blocking);
end $$;

notify pgrst, 'reload schema';
