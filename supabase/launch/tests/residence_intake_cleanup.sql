-- Exact cleanup for the public-intake fixtures. STAGING ONLY. Safe to re-run.
set search_path = recoveryos, public;

delete from recoveryos.referrals
  where referrer_name like 'PUBLIC-INTAKE-TEST%'
     or participant_name like 'PUBLIC-INTAKE-TEST%';

delete from recoveryos.residence_application_intake
  where test_fixture = true or source = 'PUBLIC-INTAKE-TEST'
     or applicant_name like 'PUBLIC-INTAKE-TEST%';

delete from recoveryos.residence_listing_submissions
  where test_fixture = true or source = 'PUBLIC-INTAKE-TEST'
     or residence_name = 'PUBLIC-INTAKE-TEST Fixture Residence';

-- Remove the throwaway residence last (after dependent rows are gone).
delete from recoveryos.residences
  where name = 'PUBLIC-INTAKE-TEST Fixture Residence';
