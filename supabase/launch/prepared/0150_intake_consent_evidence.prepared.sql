-- 0150_intake_consent_evidence.prepared.sql — R1 decision D3 (ratified
-- 2026-09-15 with the evidence-preservation condition).
--
-- STATUS: PREPARED ONLY. Preparation authorized by decision 6; APPLICATION IS
-- NOT AUTHORIZED. Applies after the approved 0147 → revocation → 0148 → 0149R
-- chain (no technical dependency on 0149R, but the ratified sequence governs).
--
-- What it adds: first-class consent-EVIDENCE columns on
-- recoveryos.residence_application_intake, distinguishing "the consent flag is
-- true" from "we possess evidence of the consent event":
--   * consent_notice_version — the receiver-pinned notice version the person
--     actually saw;
--   * consent_at — the SERVER-side timestamp of the consent event.
--
-- EVIDENCE-PRESERVATION CONDITION (non-negotiable): this migration performs
-- NO backfill. Rows that predate it (live CQCX: three rows, all
-- consent_to_contact = true) keep their boolean and carry NULL evidence
-- columns = LEGACY-UNKNOWN. A notice version or timestamp is never inferred
-- from created_at or anything else; fabricated consent evidence is worse than
-- absent evidence. After activation, the hardened receiver (R1 D3) refuses
-- consent_to_contact !== true and stamps both columns atomically with the
-- insert — enforcement lives at the trust boundary, not in a table default.
--
-- ROLLBACK: 0150_intake_consent_evidence.rollback.sql (drops the columns; any
-- evidence recorded between apply and rollback is lost with them — record the
-- reason and count before rolling back).

begin;

alter table recoveryos.residence_application_intake
  add column if not exists consent_notice_version text,
  add column if not exists consent_at timestamptz;

-- Evidence comes as a pair or not at all (a version without a time, or a time
-- without a version, is not evidence of a consent event).
do $constraint$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'intake_consent_evidence_pair_check'
      and conrelid = 'recoveryos.residence_application_intake'::regclass
  ) then
    alter table recoveryos.residence_application_intake
      add constraint intake_consent_evidence_pair_check
      check ((consent_notice_version is null) = (consent_at is null));
  end if;
end
$constraint$;

comment on column recoveryos.residence_application_intake.consent_notice_version is
  'Receiver-pinned version of the consent notice the applicant actually saw, stamped '
  'atomically by the hardened intake receiver (R1 D3). NULL = LEGACY-UNKNOWN: the row '
  'predates evidence capture. Never backfilled, never inferred (decision 6, D3 '
  'evidence-preservation condition, 2026-09-15).';
comment on column recoveryos.residence_application_intake.consent_at is
  'SERVER-side timestamp of the consent event, stamped by the receiver with the insert. '
  'NULL = LEGACY-UNKNOWN. Never derived from created_at; "consent flag exists" is not '
  '"we possess evidence of the consent event".';

commit;
notify pgrst, 'reload schema';
