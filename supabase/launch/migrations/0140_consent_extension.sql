-- 0140_consent_extension.sql — Gate B2: canonical consent extension (infrastructure only).
--
-- Implements the RATIFIED consent/ROI model (Gate B §7, ratified 2026-08-24; authorized for
-- INFRASTRUCTURE, not external disclosure activation). Everything lives in the canonical
-- consent_grants — no parallel consent table, no page-local disclosure authorization.
--
--   ACKNOWLEDGMENT (document received/read)  ≠  AGREEMENT (residency terms signed)
--   ≠  CONSENT (authorized information use)  ≠  COORDINATION AUTHORIZATION (permission to
--   work with an external person/organization).
--
-- Three residence consent types (reusing the canonical table + categories):
--   residence_screening      (residence_operations) — pairs with the signed screening
--                            policy; ENFORCEMENT READS THE GRANT, never the signature alone.
--   information_disclosure   (data_sharing) — the ROI shape: structured scope naming the
--                            recipient, information categories, and purpose.
--   supervision_coordination (data_sharing) — disclosure specialization for
--                            probation/parole/reentry coordination.
--
-- Structured ROI scope (validated by the RPC, stored in the existing scope jsonb):
--   { recipient_name, recipient_organization?, recipient_relationship?,
--     information_scope: [subset of the enumerated categories below], purpose, notes? }
-- Enumerated information categories (operational vocabulary; extend only by migration):
--   residency_status, screening_results, attendance, medication_presence, progress_summary.
--
-- EXTERNAL DISCLOSURE REMAINS GATED: record_consent_disclosure exists as audit
-- infrastructure only; no workflow calls it until GFA's 42 CFR Part 2 applicability
-- analysis and retention/deletion governance are established (Gate B §16a). Voluntary GFA
-- privacy practice is never presented as a legal requirement.
--
-- ROLLBACK:
--   drop policy consent_grants_residence_staff_read on recoveryos.consent_grants;
--   drop function recoveryos.record_consent_disclosure(bigint, text);
--   drop function recoveryos.revoke_consent_grant(bigint, text);
--   drop function recoveryos.record_consent_grant(bigint, text, jsonb, text, timestamptz);
--   update recoveryos.consent_types set is_active = false
--     where key in ('residence_screening','information_disclosure','supervision_coordination');

set search_path = recoveryos, public;

insert into recoveryos.consent_types (key, category, name, description, is_required_for_service)
values
  ('residence_screening', 'residence_operations', 'Drug & Alcohol Screening Consent',
   'Consent to the residence screening process described in the signed screening policy. Enforcement reads this grant — a signed document alone never authorizes screening-result use.', false),
  ('information_disclosure', 'data_sharing', 'Information Disclosure (Release of Information)',
   'Scoped, revocable authorization to disclose specific information categories to a named recipient for a stated purpose. Never a blanket release.', false),
  ('supervision_coordination', 'data_sharing', 'Supervision / Reentry Coordination',
   'Scoped, revocable authorization to coordinate with a named supervision/reentry contact. Coordination information is stored and visible only while this grant is active.', false)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- record_consent_grant — the definer write path for the residence consent types.
-- Authorization: the person themself, or staff of a residence the person is connected to
-- (active residency, or an application at that residence), or platform admin. Staff-recorded
-- grants carry method 'verbal_witnessed' or 'paper' and the recorder's identity.
-- ---------------------------------------------------------------------------
create or replace function recoveryos.record_consent_grant(
  p_person_id bigint,
  p_type_key text,
  p_scope jsonb default '{}'::jsonb,
  p_method text default 'in_app',
  p_expires_at timestamptz default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_type recoveryos.consent_types%rowtype;
  v_grant_id bigint;
  v_cat text;
  v_allowed text[] := array['residency_status','screening_results','attendance',
                            'medication_presence','progress_summary'];
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_type_key not in ('residence_screening','information_disclosure','supervision_coordination') then
    return jsonb_build_object('ok', false, 'code', 'invalid_consent_type',
      'message', 'This path records residence consent types only.');
  end if;
  select * into v_type from recoveryos.consent_types where key = p_type_key and is_active;
  if not found then return jsonb_build_object('ok', false, 'code', 'consent_type_inactive'); end if;

  if v_me <> p_person_id
     and not recoveryos.is_platform_admin()
     and not exists (
       select 1 from recoveryos.residencies r
       where r.person_id = p_person_id
         and r.residency_status in ('active','on_pass','transitioning')
         and r.residence_id in (select recoveryos.staff_residence_ids())
       union all
       select 1 from recoveryos.residence_applications a
       where a.person_id = p_person_id
         and a.residence_id in (select recoveryos.staff_residence_ids())) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  if p_method not in ('in_app','verbal_witnessed','paper') then
    return jsonb_build_object('ok', false, 'code', 'invalid_method');
  end if;
  if v_me <> p_person_id and p_method = 'in_app' then
    return jsonb_build_object('ok', false, 'code', 'method_requires_person',
      'message', 'Staff-recorded consent must be verbal_witnessed or paper.');
  end if;

  -- Structured scope for the disclosure shapes: recipient + categories + purpose.
  if p_type_key in ('information_disclosure','supervision_coordination') then
    if coalesce(trim(p_scope->>'recipient_name'), '') = '' then
      return jsonb_build_object('ok', false, 'code', 'recipient_required');
    end if;
    if coalesce(trim(p_scope->>'purpose'), '') = '' then
      return jsonb_build_object('ok', false, 'code', 'purpose_required');
    end if;
    if jsonb_typeof(p_scope->'information_scope') is distinct from 'array'
       or jsonb_array_length(p_scope->'information_scope') = 0 then
      return jsonb_build_object('ok', false, 'code', 'information_scope_required');
    end if;
    for v_cat in select jsonb_array_elements_text(p_scope->'information_scope') loop
      if not (v_cat = any(v_allowed)) then
        return jsonb_build_object('ok', false, 'code', 'invalid_information_category',
          'message', v_cat);
      end if;
    end loop;
  end if;

  insert into recoveryos.consent_grants
    (person_id, consent_type_id, status, scope, method, effective_at, expires_at,
     created_by_person_id)
  values
    (p_person_id, v_type.id, 'granted', coalesce(p_scope, '{}'::jsonb), p_method, now(),
     p_expires_at, v_me)
  returning id into v_grant_id;

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'consent_granted', 'consent_grants', v_grant_id,
          jsonb_build_object('type', p_type_key, 'method', p_method,
                             'recipient', p_scope->>'recipient_name'));

  return jsonb_build_object('ok', true, 'code', 'granted', 'grant_id', v_grant_id);
end $$;

-- ---------------------------------------------------------------------------
-- revoke_consent_grant — revocation is honored prospectively and audited.
-- ---------------------------------------------------------------------------
create or replace function recoveryos.revoke_consent_grant(
  p_grant_id bigint, p_reason text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_g recoveryos.consent_grants%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_g from recoveryos.consent_grants where id = p_grant_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_me <> v_g.person_id
     and not recoveryos.is_platform_admin()
     and not exists (
       select 1 from recoveryos.residencies r
       where r.person_id = v_g.person_id
         and r.residence_id in (select recoveryos.staff_residence_ids())
       union all
       select 1 from recoveryos.residence_applications a
       where a.person_id = v_g.person_id
         and a.residence_id in (select recoveryos.staff_residence_ids())) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_g.revoked_at is not null then
    return jsonb_build_object('ok', true, 'code', 'already_revoked');
  end if;
  update recoveryos.consent_grants set revoked_at = now() where id = p_grant_id;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'consent_revoked', 'consent_grants', p_grant_id,
          jsonb_build_object('reason', p_reason));
  return jsonb_build_object('ok', true, 'code', 'revoked');
end $$;

-- ---------------------------------------------------------------------------
-- record_consent_disclosure — AUDIT INFRASTRUCTURE ONLY. No workflow may call this
-- until the Part 2 analysis + retention governance land (Gate B §16a). Verifies the
-- grant is currently active before recording that a disclosure occurred.
-- ---------------------------------------------------------------------------
create or replace function recoveryos.record_consent_disclosure(
  p_grant_id bigint, p_note text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_g recoveryos.consent_grants%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_g from recoveryos.consent_grants where id = p_grant_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not recoveryos.is_platform_admin()
     and not exists (
       select 1 from recoveryos.residencies r
       where r.person_id = v_g.person_id
         and r.residence_id in (select recoveryos.staff_residence_ids())
       union all
       select 1 from recoveryos.residence_applications a
       where a.person_id = v_g.person_id
         and a.residence_id in (select recoveryos.staff_residence_ids())) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_g.status <> 'granted' or v_g.revoked_at is not null
     or (v_g.expires_at is not null and v_g.expires_at <= now()) then
    return jsonb_build_object('ok', false, 'code', 'consent_not_active',
      'message', 'Disclosure requires a currently active consent grant.');
  end if;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'consent_disclosure_recorded', 'consent_grants', p_grant_id,
          jsonb_build_object('scope', v_g.scope, 'note', left(coalesce(p_note,''), 500)));
  return jsonb_build_object('ok', true, 'code', 'disclosure_recorded');
end $$;

-- ---------------------------------------------------------------------------
-- Least-privilege staff visibility (Gate B §11): residence staff read grants of the
-- THREE residence types only, and only for people connected to their residence.
-- Coaches/navigators/external parties gain nothing here.
-- ---------------------------------------------------------------------------
create policy consent_grants_residence_staff_read on recoveryos.consent_grants
  for select to authenticated
  using (
    consent_type_id in (select id from recoveryos.consent_types
                        where key in ('residence_screening','information_disclosure',
                                      'supervision_coordination'))
    and (
      exists (select 1 from recoveryos.residencies r
              where r.person_id = consent_grants.person_id
                and r.residence_id in (select recoveryos.staff_residence_ids()))
      or exists (select 1 from recoveryos.residence_applications a
                 where a.person_id = consent_grants.person_id
                   and a.residence_id in (select recoveryos.staff_residence_ids()))
    )
  );

revoke execute on function
  recoveryos.record_consent_grant(bigint, text, jsonb, text, timestamptz),
  recoveryos.revoke_consent_grant(bigint, text),
  recoveryos.record_consent_disclosure(bigint, text)
from public, anon;
grant execute on function
  recoveryos.record_consent_grant(bigint, text, jsonb, text, timestamptz),
  recoveryos.revoke_consent_grant(bigint, text),
  recoveryos.record_consent_disclosure(bigint, text)
to authenticated;

notify pgrst, 'reload schema';
