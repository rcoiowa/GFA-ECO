-- 0142_intake_conversion_readiness.sql — Gate B3: intake conversion + derived readiness +
-- readiness-gated admission.
--
-- Implements the RATIFIED §3/§9/§9a model (docs/plans/gate-b-ejwrh-intake-architecture.md,
-- ratified 2026-08-24; implementation authorized B1–B4 only):
--   * NO parallel persisted state machine: readiness is DERIVED at read time from documents
--     (0139), consents (0140), and conditional intake data (0141). Nothing here stores a
--     checklist row.
--   * convert_application_intake is the DELIBERATE staff action closing the
--     intake -> person -> canonical application chain. It never creates auth users or
--     people; the participant account path stays plain signup +
--     ensure_person_for_current_user (traced, no invitation change needed).
--   * admit_applicant REMAINS the deliberate human admission action (manager/admin gated,
--     approved-only, one-live-residency arbiter, bed logic, role grant, audit — the 0115
--     body is preserved verbatim) and GAINS the readiness gate with the ratified NARROW
--     AUDITED OVERRIDE: override only when every unmet item is overridable; each override
--     records actor, timestamp, exact unmet items, reason, a concrete follow_ups obligation,
--     and an audit_log event. Approval never creates residency.
--
-- §9a six-class taxonomy (classes carried on every readiness item):
--   required_for_intake_completion | required_before_admission | conditionally_required |
--   recommended | deferred_with_follow_up | not_applicable
-- ("deferred_with_follow_up" is the class an override CONFERS — it exists as the follow_ups
--  row + audit event, never as persisted checklist state.)
--
-- Non-overridable (strict branch — legal/safety uncertainty resolves to NON-overridable,
-- never inferred lenient): every signature document; every acknowledgment document;
-- screening consent; emergency contact; the pending-document-edition placeholder.
-- Overridable (data-entry-deferrable only): medication confirmation, accommodation review,
-- supervision coordination.
--
-- ROLLBACK:
--   drop function recoveryos.admit_applicant(bigint, bigint, date, boolean, text);
--   drop function recoveryos.application_intake_readiness(bigint);
--   drop function recoveryos.convert_application_intake(bigint, bigint, boolean);
--   (then re-create admit_applicant(bigint, bigint, date) from 0115 verbatim, with its
--    revoke-from-public/anon + grant-to-authenticated.)

set search_path = recoveryos, public;

-- ---------------------------------------------------------------------------
-- 1) convert_application_intake — deliberate staff conversion of a pre-account
--    intake row into the canonical residence_applications record, with a
--    duplicate-identity warning gate (p_confirm) so two people never silently
--    merge and one person never silently forks.
-- ---------------------------------------------------------------------------
create or replace function recoveryos.convert_application_intake(
  p_intake_id bigint, p_person_id bigint, p_confirm boolean default false
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_i recoveryos.residence_application_intake%rowtype;
  v_app_id bigint;
  v_intake_email text;
  v_person_email text;
  v_other_person bigint;
  v_warnings text[] := '{}';
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_i from recoveryos.residence_application_intake where id = p_intake_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;

  if v_i.residence_id not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_care_operations_staff()
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  if v_i.status = 'converted' then
    return jsonb_build_object('ok', true, 'code', 'already_converted',
      'person_id', v_i.converted_person_id, 'application_id', v_i.converted_application_id);
  end if;
  if v_i.status in ('declined','closed') then
    return jsonb_build_object('ok', false, 'code', 'intake_closed',
      'message', 'A declined or closed intake is not convertible; reopen it by review first.');
  end if;

  if not exists (select 1 from recoveryos.people where id = p_person_id) then
    return jsonb_build_object('ok', false, 'code', 'person_not_found');
  end if;

  -- Duplicate-identity warning gate: compare the intake email against the chosen
  -- person's login email, and look for a DIFFERENT person holding the intake email.
  v_intake_email := lower(nullif(trim(coalesce(v_i.applicant_email, '')), ''));
  select lower(u.email) into v_person_email
  from recoveryos.people p join auth.users u on u.id = p.auth_user_id
  where p.id = p_person_id;
  if v_intake_email is not null then
    if v_person_email is not null and v_person_email <> v_intake_email then
      v_warnings := v_warnings || 'email_mismatch';
    end if;
    select p.id into v_other_person
    from recoveryos.people p join auth.users u on u.id = p.auth_user_id
    where lower(u.email) = v_intake_email and p.id <> p_person_id
    limit 1;
    if v_other_person is not null then
      v_warnings := v_warnings || 'email_matches_other_person';
    end if;
  end if;
  if array_length(v_warnings, 1) is not null and not p_confirm then
    return jsonb_build_object('ok', false, 'code', 'confirm_required',
      'warnings', to_jsonb(v_warnings),
      'message', 'Identity signals do not line up; re-run with p_confirm after verifying this is the same person.');
  end if;

  -- Never fork application state: an open canonical application at this residence
  -- is LINKED, not duplicated.
  select id into v_app_id from recoveryos.residence_applications
  where person_id = p_person_id and residence_id = v_i.residence_id
    and status in ('submitted','in_review','approved','waitlisted')
  order by submitted_at desc limit 1;

  if v_app_id is null then
    insert into recoveryos.residence_applications (person_id, residence_id, status, answers)
    values (p_person_id, v_i.residence_id, 'submitted',
            coalesce(v_i.answers, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
              'applicant_phone', v_i.applicant_phone,
              'preferred_contact', v_i.preferred_contact,
              'referral_source', v_i.referral_source,
              'consent_to_contact', v_i.consent_to_contact,
              'converted_from_intake', v_i.id)))
    returning id into v_app_id;
  end if;

  update recoveryos.residence_application_intake
     set status = 'converted', converted_person_id = p_person_id,
         converted_application_id = v_app_id,
         reviewed_at = now(), reviewed_by_person_id = v_me
   where id = p_intake_id;

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'application_intake_converted', 'residence_application_intake', p_intake_id,
          jsonb_build_object('person_id', p_person_id, 'application_id', v_app_id,
                             'warnings', to_jsonb(v_warnings), 'confirmed', p_confirm));

  return jsonb_build_object('ok', true, 'code', 'converted',
    'application_id', v_app_id, 'warnings', to_jsonb(v_warnings));
end $$;

-- ---------------------------------------------------------------------------
-- 2) application_intake_readiness — the DERIVED checklist (§9a). Read-only; one
--    aggregate return; no persisted state. Callable by the person themself,
--    staff of the application's residence, care operations, or platform admin.
--
--    Item shape: { key, label, class, status, met, overridable }
--    Statuses: met | missing | unconfirmed | needs_staff_review |
--              pending_document_edition | not_applicable
-- ---------------------------------------------------------------------------
create or replace function recoveryos.application_intake_readiness(p_application_id bigint)
returns jsonb language plpgsql stable security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_app recoveryos.residence_applications%rowtype;
  v_items jsonb := '[]'::jsonb;
  v_blocking jsonb;
  v_t record;
  v_met boolean;
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

  -- Signature documents (required_before_admission, non-overridable): every active,
  -- published, residence-assignable signature template must carry a signed assignment.
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
  -- document edition is ratified) surfaces ONE explicit non-overridable placeholder —
  -- never a silently empty (and therefore trivially "complete") signature section.
  if v_sig_count = 0 then
    v_items := v_items || jsonb_build_object(
      'key', 'signature_documents', 'label', 'Residence document edition (signature set)',
      'class', 'required_before_admission',
      'status', 'pending_document_edition',
      'met', false, 'overridable', false);
  end if;

  -- Acknowledgment documents (required_for_intake_completion, non-overridable):
  -- ack-only templates; a signature-requiring template is covered by its sign item.
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

  -- Screening consent (required_before_admission, non-overridable): enforcement reads
  -- the GRANT — a signed screening policy alone never authorizes screening-result use.
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

  -- Medication confirmation (conditionally_required, OVERRIDABLE): derived readiness
  -- cannot know "has no medications" — with no recorded item the status is UNCONFIRMED
  -- and the manager either records items or overrides with the confirmation as reason.
  select exists (
    select 1 from recoveryos.residency_medication_items m
    where m.person_id = v_app.person_id and m.ended_at is null
  ) into v_met;
  v_items := v_items || jsonb_build_object(
    'key', 'medication_items', 'label', 'Medications recorded per medication policy',
    'class', 'conditionally_required',
    'status', case when v_met then 'met' else 'unconfirmed' end,
    'met', v_met, 'overridable', true);

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

  -- Supervision coordination (conditionally_required only when coordination applies;
  -- OVERRIDABLE): met = active supervision_coordination grant + active officer record.
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

-- ---------------------------------------------------------------------------
-- 3) admit_applicant v2 — the 0115 body VERBATIM plus the §9a readiness gate and
--    narrow audited override. Signature changes (two new defaulted parameters),
--    so the old signature is dropped first.
-- ---------------------------------------------------------------------------
drop function if exists recoveryos.admit_applicant(bigint, bigint, date);

create or replace function recoveryos.admit_applicant(
  p_application_id bigint, p_bed_id bigint default null, p_admission_date date default current_date,
  p_override boolean default false, p_override_reason text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_app recoveryos.residence_applications%rowtype;
  v_residency_id bigint;
  v_assignment_id bigint;
  v_readiness jsonb;
  v_unmet jsonb;
  v_non_overridable jsonb;
  v_follow_up_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_app from recoveryos.residence_applications where id = p_application_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not recoveryos.is_residence_manager_of(v_app.residence_id) and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Admission is a residence-manager decision.');
  end if;
  if v_app.status <> 'approved' then
    return jsonb_build_object('ok', false, 'code', 'not_approved',
      'message', 'Only an approved application can be admitted.');
  end if;

  -- §9a readiness gate: derived checklist, no persisted state. Unmet items refuse
  -- admission unless EVERY unmet item is overridable and the override is reasoned;
  -- the override is not complete without its follow_ups obligation + audit event.
  v_readiness := recoveryos.application_intake_readiness(p_application_id);
  if not (v_readiness->>'ok')::boolean then return v_readiness; end if;
  if not (v_readiness->>'complete')::boolean then
    select coalesce(jsonb_agg(i), '[]'::jsonb) into v_unmet
    from jsonb_array_elements(v_readiness->'items') i
    where (i->>'met')::boolean = false;

    if not p_override then
      return jsonb_build_object('ok', false, 'code', 'intake_incomplete',
        'message', 'Intake checklist is not complete.',
        'blocking_unmet', v_readiness->'blocking_unmet', 'items', v_unmet);
    end if;

    select coalesce(jsonb_agg(i->>'key'), '[]'::jsonb) into v_non_overridable
    from jsonb_array_elements(v_unmet) i
    where (i->>'overridable')::boolean = false;
    if jsonb_array_length(v_non_overridable) > 0 then
      return jsonb_build_object('ok', false, 'code', 'override_not_permitted',
        'message', 'These items are never overridable (safety, rights/consent, or legal documentation).',
        'non_overridable_unmet', v_non_overridable);
    end if;
    if p_override_reason is null or length(trim(p_override_reason)) < 5 then
      return jsonb_build_object('ok', false, 'code', 'override_reason_required',
        'message', 'A deferral needs a concrete reason.');
    end if;

    -- The deferral is not complete without its follow-up obligation (§9a).
    insert into recoveryos.follow_ups
      (person_id, assigned_person_id, follow_up_type, due_at, status, note, created_by_person_id)
    values
      (v_app.person_id, v_me, 'intake_deferral', now() + interval '7 days', 'open',
       'Deferred at admission: '
         || (select string_agg(i->>'key', ', ') from jsonb_array_elements(v_unmet) i)
         || '. Reason: ' || trim(p_override_reason),
       v_me)
    returning id into v_follow_up_id;

    insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
    values (v_me, 'residency.admission_override', 'residence_applications', p_application_id,
            jsonb_build_object('unmet_items', v_readiness->'blocking_unmet',
                               'reason', trim(p_override_reason),
                               'follow_up_id', v_follow_up_id));
  end if;

  -- One live residency per person: the partial unique index is the arbiter.
  begin
    insert into recoveryos.residencies
      (person_id, residence_id, residency_status, admission_date)
    values (v_app.person_id, v_app.residence_id, 'active', p_admission_date)
    returning id into v_residency_id;
  exception when unique_violation then
    select id into v_residency_id from recoveryos.residencies
      where person_id = v_app.person_id
        and residency_status in ('approved','active','on_pass','transitioning');
    if exists (select 1 from recoveryos.residencies
               where id = v_residency_id and residence_id = v_app.residence_id) then
      return jsonb_build_object('ok', true, 'code', 'already_resident', 'residency_id', v_residency_id);
    end if;
    return jsonb_build_object('ok', false, 'code', 'live_residency_elsewhere',
      'message', 'They already have a live residency at another residence.');
  end;

  if p_bed_id is not null then
    if not exists (select 1 from recoveryos.residence_beds b
                   join recoveryos.residence_rooms rm on rm.id = b.room_id
                   join recoveryos.residence_units u on u.id = rm.unit_id
                   where b.id = p_bed_id and u.residence_id = v_app.residence_id) then
      return jsonb_build_object('ok', false, 'code', 'bed_not_in_residence');
    end if;
    begin
      insert into recoveryos.bed_assignments (residency_id, bed_id)
      values (v_residency_id, p_bed_id)
      returning id into v_assignment_id;
      update recoveryos.residencies set bed_assignment_id = v_assignment_id where id = v_residency_id;
    exception when unique_violation then
      -- bed already occupied — admission stands, bed does not.
      v_assignment_id := null;
    end;
  end if;

  -- Resident role/context is server-granted on admission (§34).
  if not exists (select 1 from recoveryos.role_assignments
                 where person_id = v_app.person_id and role_key = 'resident'
                   and residence_id = v_app.residence_id and revoked_at is null) then
    insert into recoveryos.role_assignments (person_id, role_key, residence_id, granted_by_person_id)
    values (v_app.person_id, 'resident', v_app.residence_id, v_me);
  end if;

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'residency.admitted', 'residencies', v_residency_id,
          jsonb_build_object('application_id', p_application_id, 'bed_assigned', v_assignment_id is not null,
                             'override', p_override and not (v_readiness->>'complete')::boolean));

  return jsonb_build_object('ok', true, 'code', 'admitted',
    'residency_id', v_residency_id, 'bed_assignment_id', v_assignment_id,
    'bed_assigned', v_assignment_id is not null);
end $$;

revoke execute on function
  recoveryos.convert_application_intake(bigint, bigint, boolean),
  recoveryos.application_intake_readiness(bigint),
  recoveryos.admit_applicant(bigint, bigint, date, boolean, text)
from public, anon;
grant execute on function
  recoveryos.convert_application_intake(bigint, bigint, boolean),
  recoveryos.application_intake_readiness(bigint),
  recoveryos.admit_applicant(bigint, bigint, date, boolean, text)
to authenticated;

notify pgrst, 'reload schema';
