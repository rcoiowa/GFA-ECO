-- 0146_ejwrh_document_activation.prepared.sql — PREPARED ONLY, DO NOT APPLY.
--
-- ============================================================================
-- ACTIVATION GATE: this file lives in supabase/launch/prepared/ (outside the
-- migrations ledger) precisely so it CANNOT be applied by routine tooling.
-- It moves to supabase/launch/migrations/0146_ejwrh_document_activation.sql
-- and is applied ONLY when every condition below is met:
--   1. Executive ratification of the edition texts. STATUS: the FIVE
--      acknowledgment documents were EXECUTIVE-RATIFIED 2026-08-24 (content as
--      of cffedfd; hashes below are frozen). The late-charge cap was ratified
--      ($5/day, max $50 per delinquent payment period). The §13 electronic-
--      records disclosure is INCORPORATED per the legal review (APPROVED WITH
--      ATTACHED REVISIONS, 2026-08-24; e-consent + paper parity live via 0145).
--      The Agreement remains blocked on: contracting-party operative naming
--      (executed PSA + entity authority; expected party per legal review:
--      Ernest & Johnnie White Recovery House, L.L.C.) and the verified
--      record-retention period (unresolved policy/legal item).
--   2. Signing-method legal review outcome recorded (at minimum for the
--      Participant Agreement).
--   3. B5A UI verified (done, ee9b042) + the B5B browser E2E run green against
--      fixtures (RECOVERYOS_E2E_B5B=1).
-- On apply: EJWRH readiness flips from the single non-overridable
-- 'pending_document_edition' item to the real 1-signature + 5-acknowledgment
-- set; ensure_my_document_assignments starts assigning at residence 2 with no
-- code change.
-- ============================================================================
--
-- CONTENT PINNING: each version body is the canonical markdown from
-- docs/residences/ejwrh/<file> at commit time, with the authoring banner
-- comment stripped (everything after the first '-->' plus newline, trimmed,
-- one trailing newline). The database computes content_hash itself (0139
-- trigger); this migration ABORTS if any computed hash differs from the
-- expected hash pinned below — the seeded text is provably the ratified text.
--
-- Expected sha256 content hashes (five ratified 2026-08-24 at cffedfd — FROZEN;
-- Agreement hash reflects the ratified late-charge cap and will change again
-- when the two remaining Agreement blockers resolve):
--   ejwrh_participant_agreement          fb1d7c9bf2927f8f79b1e6f338d5bd64e11e98dc4c23d075ddcd9fb2f79c4214
--   ejwrh_resident_handbook              834773861098c23b4a36785952498d157da39d568cdc015ca41667ff627690ba
--   ejwrh_resident_rights_grievance      285ce0974c803eb8afb134df20ba21175995c320520c9ccc513822fb44167024
--   ejwrh_screening_policy               a835849688a9515e5a0adb4d7d43941717fdaefb415748e2b8f98106612cd6c7
--   ejwrh_medication_moud_policy         6412db49cfe42cbfdfb81beb2d70e2310c42837407820ff90ad1f4dfdd7d605f
--   ejwrh_return_to_use_response_policy  c4cbe7669007474cb9e6a4c5178ab4968277ec4cfa28efbb0f050fa07ad86a97
-- NOTE: the five ratified hashes are FROZEN (changes only for clerical
-- corrections, re-ratified). Resolving the Agreement's two remaining blockers
-- changes its hash — RECOMPUTE at finalization; stale hashes abort, by design.
--
-- ROLLBACK (activation is reversible without deleting evidence):
--   update recoveryos.document_versions dv set published_at = null
--     from recoveryos.document_templates t
--     where t.id = dv.template_id and t.key like 'ejwrh_%'
--       and not exists (select 1 from recoveryos.document_assignments a
--                       where a.document_version_id = dv.id);
--   update recoveryos.document_templates set is_active = false where key like 'ejwrh_%';
--   (Versions already carrying assignments are immutable evidence — they are
--    never unpublished or deleted; deactivating the template stops NEW
--    assignment while preserving every signed artifact.)

set search_path = recoveryos, public;

-- 1) Templates: EJWRH-scoped (residence 2), the ratified 1-signature +
--    5-acknowledgment set. Idempotent on key.
insert into recoveryos.document_templates
  (organization_id, key, name, is_active, requires_signature, requires_acknowledgment, residence_id)
select o.id, v.key, v.name, true, v.sig, v.ack, 2
from (values
  ('ejwrh_participant_agreement',        'EJWRH Participant & Residency Agreement', true,  false),
  ('ejwrh_resident_handbook',            'EJWRH Resident Handbook',                 false, true),
  ('ejwrh_resident_rights_grievance',    'EJWRH Resident Rights & Grievance',       false, true),
  ('ejwrh_screening_policy',             'EJWRH Screening Policy',                  false, true),
  ('ejwrh_medication_moud_policy',       'EJWRH Medication & MOUD Policy',          false, true),
  ('ejwrh_return_to_use_response_policy','EJWRH Return-to-Use Response Policy',     false, true)
) as v(key, name, sig, ack)
cross join (select id from recoveryos.organizations where name = 'Grace For Addictions') o
on conflict (organization_id, key) do update set
  name = excluded.name, is_active = excluded.is_active,
  requires_signature = excluded.requires_signature,
  requires_acknowledgment = excluded.requires_acknowledgment,
  residence_id = excluded.residence_id;

-- 2) Versions: v1.0, published at the ratified effective date.
--    [AT FINALIZATION: inline each canonical body below as a dollar-quoted
--     literal generated from docs/residences/ejwrh/ by
--     scripts/build-ejwrh-activation.mjs (to be added at finalization) —
--     never hand-transcribed. Placeholder shown for shape:]
--
-- insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
-- select t.id, '1.0', $ejwrh_body$ ...canonical markdown... $ejwrh_body$,
--        '[EFFECTIVE DATE — set at ratification]'::timestamptz
-- from recoveryos.document_templates t
-- where t.key = 'ejwrh_participant_agreement'
-- on conflict (template_id, version) do nothing;
--   (repeat per template key)

-- 3) Hash verification: ABORT unless every seeded version hashes to the
--    pinned expectation (the 0139 trigger computed content_hash on insert).
do $$
declare v_bad text;
begin
  select string_agg(t.key || '=' || dv.content_hash, ', ') into v_bad
  from recoveryos.document_templates t
  join recoveryos.document_versions dv on dv.template_id = t.id and dv.version = '1.0'
  where t.key like 'ejwrh_%'
    and dv.content_hash not in (
      'fb1d7c9bf2927f8f79b1e6f338d5bd64e11e98dc4c23d075ddcd9fb2f79c4214',
      '834773861098c23b4a36785952498d157da39d568cdc015ca41667ff627690ba',
      '285ce0974c803eb8afb134df20ba21175995c320520c9ccc513822fb44167024',
      'a835849688a9515e5a0adb4d7d43941717fdaefb415748e2b8f98106612cd6c7',
      '6412db49cfe42cbfdfb81beb2d70e2310c42837407820ff90ad1f4dfdd7d605f',
      'c4cbe7669007474cb9e6a4c5178ab4968277ec4cfa28efbb0f050fa07ad86a97');
  if v_bad is not null then
    raise exception 'EJWRH ACTIVATION ABORT: seeded text does not match the ratified hashes: %', v_bad;
  end if;
  if (select count(*) from recoveryos.document_templates t
      join recoveryos.document_versions dv on dv.template_id = t.id
        and dv.version = '1.0' and dv.published_at is not null
      where t.key like 'ejwrh_%') <> 6 then
    raise exception 'EJWRH ACTIVATION ABORT: expected exactly 6 published v1.0 editions';
  end if;
end $$;

notify pgrst, 'reload schema';
