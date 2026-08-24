-- 0139_document_evidence.sql — Gate B1: document evidence hardening.
--
-- Implements the RATIFIED Gate B evidence chain (docs/plans/gate-b-ejwrh-intake-architecture.md
-- §6, ratified 2026-08-24; implementation authorized B1–B4 only):
--   document identity -> immutable version -> content hash -> assignment ->
--   acknowledgment/agreement action -> signer identity -> signed timestamp ->
--   immutable signed-artifact reference -> audit trail.
--
-- Design choices:
--   * content_hash is COMPUTED BY THE DATABASE (before insert/update trigger, sha256 of
--     body_markdown) — one source of truth; seeds need no hash emission; a hash can never
--     drift from its body.
--   * Published versions are IMMUTABLE (trigger): corrections are new versions, never
--     edits. Historical signed terms are therefore reproducible forever from the pinned
--     document_version_id + content_hash — never reconstructed from the latest edition.
--   * Acknowledgment ≠ Agreement: ack-only documents set acknowledged_at; signature
--     documents set acknowledged_at + signed_at + signature_name via the audited RPC.
--     An acknowledged/signed assignment row is immutable (trigger).
--   * ASSIGNMENT ANCHORS: assignments may anchor to an APPROVED residence application
--     (application_id) so intake-stage signing precedes admission; residency stays the
--     post-admission anchor.
--   * RESIDENCE SCOPING (Gate B §5a / B1 authorization): the current resident-facing
--     document set is the GRACE HOUSE edition (authored from the Grace House operational
--     documents). Templates gain residence_id (NULL = organization-wide); the resident-
--     facing set is scoped to Grace House (residence 1) so that NO document with
--     unresolved EJWRH applicability can be assigned for EJWRH signature. §5a
--     reconciliation later reclassifies each template (org-wide -> residence_id NULL;
--     EJWRH edition -> new template/version rows). This encodes applicability, not policy
--     wording.
--   * requires_acknowledgment marks the ack-only universal intake documents (ratified §5
--     table: rights, grievance, emergency protocols, curfew/pass, exit/transition) so the
--     readiness checklist (B3) can derive acknowledgment status.
--   * acknowledge_document is the audited signing/ack path. The 0013 direct-UPDATE policy
--     (document_assignments_ack_self) is DELIBERATELY LEFT IN PLACE — retirement is B6,
--     staged and telemetry-gated. This migration only prepares it (RPC parity + audit).
--
-- ROLLBACK:
--   drop function recoveryos.acknowledge_document(bigint, text);
--   drop trigger document_assignments_immutable on recoveryos.document_assignments;
--   drop trigger document_versions_immutable on recoveryos.document_versions;
--   drop trigger document_versions_hash on recoveryos.document_versions;
--   drop function recoveryos.trg_document_assignments_immutable();
--   drop function recoveryos.trg_document_versions_immutable();
--   drop function recoveryos.trg_document_versions_hash();
--   alter table recoveryos.document_versions drop column content_hash;
--   alter table recoveryos.document_assignments drop column signed_at, drop column application_id;
--   alter table recoveryos.document_templates drop column residence_id, drop column requires_acknowledgment;
--   (ensure_my_document_assignments: re-run the 0013 body, verbatim in that file.)

set search_path = recoveryos, public;

-- 1) Columns.
alter table recoveryos.document_versions
  add column if not exists content_hash text;
alter table recoveryos.document_assignments
  add column if not exists signed_at timestamptz,
  add column if not exists application_id bigint references recoveryos.residence_applications (id);
alter table recoveryos.document_templates
  add column if not exists residence_id bigint references recoveryos.residences (id),
  add column if not exists requires_acknowledgment boolean not null default false;

comment on column recoveryos.document_versions.content_hash is
  'sha256 of body_markdown, computed by trigger — the immutable fingerprint of the exact '
  'terms a person saw. Signed artifacts are reproduced from the pinned version + this hash, '
  'never from the latest edition.';
comment on column recoveryos.document_templates.residence_id is
  'NULL = organization-wide document. A residence id scopes the document to that house '
  '(Gate B §5a: unresolved-applicability documents are never assignable at another house).';
comment on column recoveryos.document_assignments.application_id is
  'Intake-stage anchor: assignment issued against an APPROVED residence application, before '
  'any residency exists. Residency stays the post-admission anchor.';

-- 2) Deterministic hash: computed at write time, backfilled for all existing versions.
create or replace function recoveryos.trg_document_versions_hash()
returns trigger language plpgsql as $$
begin
  new.content_hash := encode(extensions.digest(convert_to(new.body_markdown, 'UTF8'), 'sha256'), 'hex');
  return new;
end $$;
create trigger document_versions_hash
  before insert or update of body_markdown on recoveryos.document_versions
  for each row execute function recoveryos.trg_document_versions_hash();

update recoveryos.document_versions
   set content_hash = encode(extensions.digest(convert_to(body_markdown, 'UTF8'), 'sha256'), 'hex')
 where content_hash is null;

do $$
declare v_missing bigint;
begin
  select count(*) into v_missing from recoveryos.document_versions where content_hash is null;
  if v_missing <> 0 then
    raise exception 'GATE B1 ABORT: % document versions could not be hashed', v_missing;
  end if;
end $$;

alter table recoveryos.document_versions alter column content_hash set not null;

-- 3) Immutability: published versions and acknowledged/signed assignments are frozen.
create or replace function recoveryos.trg_document_versions_immutable()
returns trigger language plpgsql as $$
begin
  if old.published_at is not null and (
       new.body_markdown  is distinct from old.body_markdown
    or new.version        is distinct from old.version
    or new.content_hash   is distinct from old.content_hash
    or new.published_at   is distinct from old.published_at
    or new.template_id    is distinct from old.template_id) then
    raise exception 'published document versions are immutable — corrections are new versions';
  end if;
  return new;
end $$;
create trigger document_versions_immutable
  before update on recoveryos.document_versions
  for each row execute function recoveryos.trg_document_versions_immutable();

create or replace function recoveryos.trg_document_assignments_immutable()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.acknowledged_at is not null then
      raise exception 'acknowledged document assignments are immutable evidence';
    end if;
    return old;
  end if;
  if old.acknowledged_at is not null then
    raise exception 'acknowledged document assignments are immutable evidence';
  end if;
  return new;
end $$;
create trigger document_assignments_immutable
  before update or delete on recoveryos.document_assignments
  for each row execute function recoveryos.trg_document_assignments_immutable();

-- 4) Residence scoping of the current GRACE HOUSE edition (applicability, not policy):
--    every resident-facing intake document authored from the Grace House operational set
--    is scoped to residence 1 pending Gate B §5a reconciliation. Staff/operational
--    documents are not resident-assigned and stay org-wide for staff reading.
update recoveryos.document_templates
   set residence_id = 1
 where key in ('participant_agreement','resident_handbook','code_of_conduct',
               'fee_schedule_financial_agreement','good_neighbor_policy',
               'medication_mat_moud_policy','return_to_use_response_policy',
               'screening_policy_consent','resident_rights','grievance_policy_form',
               'emergency_response_protocols','curfew_pass_policy','exit_transition_policy',
               'intake_forms_package');

-- Ack-only universal intake documents (ratified Gate B §5 table).
update recoveryos.document_templates
   set requires_acknowledgment = true
 where key in ('resident_rights','grievance_policy_form','emergency_response_protocols',
               'curfew_pass_policy','exit_transition_policy');

-- 5) Assignment issuance: active residency (as before) OR approved application (intake
--    stage), residence-scope aware. Idempotent; latest published version per template.
create or replace function recoveryos.ensure_my_document_assignments()
returns setof recoveryos.document_assignments
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_person_id bigint := recoveryos.current_person_id();
  v_residency recoveryos.residencies%rowtype;
  v_app recoveryos.residence_applications%rowtype;
  v_residence_id bigint;
  v_residency_id bigint;
  v_application_id bigint;
begin
  if v_person_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_residency
  from recoveryos.residencies
  where person_id = v_person_id
    and residency_status in ('active', 'on_pass', 'transitioning')
  order by created_at desc
  limit 1;

  if found then
    v_residence_id := v_residency.residence_id;
    v_residency_id := v_residency.id;
  else
    -- Intake stage: an approved application unlocks the document set pre-admission.
    select * into v_app
    from recoveryos.residence_applications
    where person_id = v_person_id and status = 'approved'
    order by submitted_at desc
    limit 1;
    if found then
      v_residence_id := v_app.residence_id;
      v_application_id := v_app.id;
    end if;
  end if;

  if v_residence_id is not null then
    insert into recoveryos.document_assignments
      (document_version_id, person_id, residency_id, application_id)
    select dv.id, v_person_id, v_residency_id, v_application_id
    from recoveryos.document_templates t
    join recoveryos.residences r on r.id = v_residence_id
      and r.organization_id = t.organization_id
    join lateral (
      select id from recoveryos.document_versions
      where template_id = t.id and published_at is not null
      order by published_at desc
      limit 1
    ) dv on true
    where t.is_active
      and (t.requires_signature or t.requires_acknowledgment)
      and (t.residence_id is null or t.residence_id = v_residence_id)
      and not exists (
        select 1 from recoveryos.document_assignments a
        where a.person_id = v_person_id and a.document_version_id = dv.id
      );
  end if;

  return query
  select * from recoveryos.document_assignments where person_id = v_person_id;
end;
$$;
revoke all on function recoveryos.ensure_my_document_assignments() from public, anon;
grant execute on function recoveryos.ensure_my_document_assignments() to authenticated;

-- 6) The audited acknowledgment/signing path (B6 later retires the direct-UPDATE policy).
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
    if p_signature_name is null or length(trim(p_signature_name)) < 2
       or length(p_signature_name) > 200 then
      return jsonb_build_object('ok', false, 'code', 'signature_name_required',
        'message', 'Type your name to sign this document.');
    end if;
    update recoveryos.document_assignments
       set acknowledged_at = now(), signed_at = now(), signature_name = trim(p_signature_name)
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
                             'version', v_version, 'content_hash', v_hash));

  return jsonb_build_object('ok', true,
    'code', case when v_requires_signature then 'signed' else 'acknowledged' end,
    'content_hash', v_hash);
end $$;
revoke execute on function recoveryos.acknowledge_document(bigint, text) from public, anon;
grant execute on function recoveryos.acknowledge_document(bigint, text) to authenticated;

notify pgrst, 'reload schema';
