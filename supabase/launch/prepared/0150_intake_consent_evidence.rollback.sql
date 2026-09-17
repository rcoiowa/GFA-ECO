-- 0150_intake_consent_evidence.rollback.sql — exact rollback for prepared 0150.
-- WARNING: dropping the columns discards any consent evidence recorded between
-- apply and rollback. Before running, record the reason and the count of rows
-- carrying non-null evidence. Same authority as the apply.

begin;

alter table recoveryos.residence_application_intake
  drop constraint if exists intake_consent_evidence_pair_check;
alter table recoveryos.residence_application_intake
  drop column if exists consent_notice_version,
  drop column if exists consent_at;

commit;
notify pgrst, 'reload schema';
