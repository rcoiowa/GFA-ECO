-- 0145_electronic_records_consent.sql — B5B legal-review reconciliation (qualified review:
-- APPROVED WITH ATTACHED REVISIONS, 2026-08-24). Implementation PREPARATION only — EJWRH
-- document activation and resident e-signing remain CLOSED; nothing here assigns or
-- publishes any document.
--
-- Three review requirements land here:
--   1. AFFIRMATIVE ELECTRONIC CONSENT before e-signing: new canonical consent type
--      `electronic_records` (category account_identity), grantable ONLY by the person
--      themself, in-app (an affirmative resident action — staff can never record it for
--      them); revocable through the existing revoke path (withdrawal is prospective:
--      already-signed records stand, future documents go to paper).
--   2. E-SIGNING GATED ON THAT CONSENT: acknowledge_document now refuses a SIGNATURE
--      document with 'electronic_consent_required' unless the signer holds an active
--      electronic_records grant. Acknowledgment-only documents are receipts, not
--      signatures, and are unchanged.
--   3. PAPER PATH WITH FULL PARITY (no adverse readiness consequence): staff record a
--      witnessed paper signature via record_paper_signature — same assignment, same
--      pinned version + hash, same immutability, same readiness effect. New
--      document_assignments.signature_method ('electronic' | 'paper') records which path
--      was used; the audit event names it.
--
-- ROLLBACK:
--   drop function recoveryos.record_paper_signature(bigint, text, text);
--   (re-run the 0139 acknowledge_document body, verbatim in that file)
--   (re-run the 0140 record_consent_grant body, verbatim in that file)
--   alter table recoveryos.document_assignments drop column signature_method;
--   update recoveryos.consent_types set is_active = false where key = 'electronic_records';

set search_path = recoveryos, public;

-- 1) Signature method on the assignment (set at signing time, frozen by the 0139
--    immutability trigger together with everything else once acknowledged).
alter table recoveryos.document_assignments
  add column if not exists signature_method text
    check (signature_method is null or signature_method in ('electronic', 'paper'));
comment on column recoveryos.document_assignments.signature_method is
  'How a signature document was signed: electronic (in-app, e-consent gated) or paper '
  '(staff-witnessed, recorded via record_paper_signature). NULL for ack-only documents '
  'and unsigned assignments.';

-- 2) The electronic-records consent type.
insert into recoveryos.consent_types (key, category, name, description, is_required_for_service)
values ('electronic_records', 'account_identity', 'Electronic Records & Signatures Consent',
        'Affirmative consent to use electronic records and signatures for residence documents. '
        'Self-granted only, in-app, revocable at any time; withdrawal is prospective and paper '
        'is always available at no charge with no adverse consequence.', false)
on conflict (key) do nothing;

-- 3) record_consent_grant learns the new type — SELF-ONLY, IN-APP ONLY.
--    (0140 body preserved verbatim otherwise.)
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
  if p_type_key not in ('residence_screening','information_disclosure','supervision_coordination',
                        'electronic_records') then
    return jsonb_build_object('ok', false, 'code', 'invalid_consent_type',
      'message', 'This path records residence consent types only.');
  end if;
  select * into v_type from recoveryos.consent_types where key = p_type_key and is_active;
  if not found then return jsonb_build_object('ok', false, 'code', 'consent_type_inactive'); end if;

  -- Electronic-records consent is the person's own affirmative in-app action, always.
  if p_type_key = 'electronic_records' then
    if v_me <> p_person_id or p_method <> 'in_app' then
      return jsonb_build_object('ok', false, 'code', 'self_only',
        'message', 'Electronic-records consent is given by the person themself, in the app.');
    end if;
    if exists (select 1 from recoveryos.consent_grants g
               where g.person_id = p_person_id and g.consent_type_id = v_type.id
                 and g.status = 'granted' and g.revoked_at is null
                 and (g.expires_at is null or g.expires_at > now())) then
      return jsonb_build_object('ok', true, 'code', 'already_granted');
    end if;
  end if;

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

-- 4) acknowledge_document: e-signing requires the active electronic-records grant and
--    records signature_method = 'electronic'. (0139 body preserved otherwise; ack-only
--    documents unchanged — a receipt is not a signature.)
create or replace function recoveryos.acknowledge_document(
  p_assignment_id bigint, p_signature_name text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_a recoveryos.document_assignments%rowtype;
  v_requires_signature boolean;
  v_version text;
  v_hash text;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_a from recoveryos.document_assignments where id = p_assignment_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_a.person_id <> v_me then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Only the person a document is assigned to may acknowledge it.');
  end if;
  if v_a.acknowledged_at is not null then
    return jsonb_build_object('ok', true, 'code', 'already_acknowledged');
  end if;

  select t.requires_signature, dv.version, dv.content_hash
    into v_requires_signature, v_version, v_hash
  from recoveryos.document_versions dv
  join recoveryos.document_templates t on t.id = dv.template_id
  where dv.id = v_a.document_version_id;

  if v_requires_signature then
    -- Legal-review requirement: affirmative electronic-records consent BEFORE e-signing.
    if not exists (
      select 1 from recoveryos.consent_grants g
      join recoveryos.consent_types ct on ct.id = g.consent_type_id
      where g.person_id = v_me and ct.key = 'electronic_records'
        and g.status = 'granted' and g.revoked_at is null
        and (g.expires_at is null or g.expires_at > now())) then
      return jsonb_build_object('ok', false, 'code', 'electronic_consent_required',
        'message', 'Electronic signing needs your electronic-records consent first — or sign on paper with staff.');
    end if;
    if p_signature_name is null or length(trim(p_signature_name)) < 2
       or length(p_signature_name) > 200 then
      return jsonb_build_object('ok', false, 'code', 'signature_name_required',
        'message', 'Type your name to sign this document.');
    end if;
    update recoveryos.document_assignments
       set acknowledged_at = now(), signed_at = now(), signature_name = trim(p_signature_name),
           signature_method = 'electronic'
     where id = p_assignment_id;
  else
    update recoveryos.document_assignments
       set acknowledged_at = now()
     where id = p_assignment_id;
  end if;

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me,
          case when v_requires_signature then 'document_signed' else 'document_acknowledged' end,
          'document_assignments', p_assignment_id,
          jsonb_build_object('document_version_id', v_a.document_version_id,
                             'version', v_version, 'content_hash', v_hash,
                             'signature_method', case when v_requires_signature then 'electronic' end));

  return jsonb_build_object('ok', true,
    'code', case when v_requires_signature then 'signed' else 'acknowledged' end,
    'content_hash', v_hash);
end $$;

-- 5) The paper pathway: staff record a witnessed paper signature onto the SAME
--    assignment — same pinned version and hash, same immutability, same readiness
--    effect. No electronic consent involved; never an adverse consequence.
create or replace function recoveryos.record_paper_signature(
  p_person_id bigint, p_template_key text, p_signature_name text
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_a recoveryos.document_assignments%rowtype;
  v_version text;
  v_hash text;
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
  if p_signature_name is null or length(trim(p_signature_name)) < 2
     or length(p_signature_name) > 200 then
    return jsonb_build_object('ok', false, 'code', 'signature_name_required');
  end if;

  select a.* into v_a
  from recoveryos.document_assignments a
  join recoveryos.document_versions dv on dv.id = a.document_version_id
  join recoveryos.document_templates t on t.id = dv.template_id
  where a.person_id = p_person_id and t.key = p_template_key
    and t.requires_signature and a.acknowledged_at is null
  order by a.assigned_at desc
  limit 1
  for update of a;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'no_pending_assignment',
      'message', 'No unsigned signature assignment for that document.');
  end if;

  select dv.version, dv.content_hash into v_version, v_hash
  from recoveryos.document_versions dv where dv.id = v_a.document_version_id;

  update recoveryos.document_assignments
     set acknowledged_at = now(), signed_at = now(), signature_name = trim(p_signature_name),
         signature_method = 'paper'
   where id = v_a.id;

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'document_signed_paper', 'document_assignments', v_a.id,
          jsonb_build_object('person_id', p_person_id,
                             'document_version_id', v_a.document_version_id,
                             'version', v_version, 'content_hash', v_hash,
                             'signature_method', 'paper', 'witnessed_by_person_id', v_me));

  return jsonb_build_object('ok', true, 'code', 'signed_paper', 'content_hash', v_hash);
end $$;

revoke execute on function recoveryos.record_paper_signature(bigint, text, text) from public, anon;
grant execute on function recoveryos.record_paper_signature(bigint, text, text) to authenticated;

notify pgrst, 'reload schema';
