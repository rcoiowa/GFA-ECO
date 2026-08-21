-- Public-intake boundary fixtures — STAGING ONLY. Never run against the launch
-- project (its non-negotiable: test fixtures never enter it). Every row is
-- marked test_fixture = true and uses an unmistakable PUBLIC-INTAKE-TEST
-- namespace so cleanup is exact. Apply with the service role (these tables have
-- no anon grant on purpose).
--
-- Prereq: at least one residence exists to attach the application intake to.
-- This inserts a throwaway "Fixture Residence" if none is present.

set search_path = recoveryos, public;

-- A disposable residence to apply to / list (published so it shows in the view).
insert into recoveryos.residences (organization_id, name, address_city, address_state,
  population_served, is_active, is_public_directory)
select (select id from recoveryos.organizations order by id limit 1),
       'PUBLIC-INTAKE-TEST Fixture Residence', 'Des Moines', 'IA',
       'test_fixture population', true, true
where not exists (select 1 from recoveryos.residences where name = 'PUBLIC-INTAKE-TEST Fixture Residence');

-- Flow 1 — listing submission (moderated; starts 'submitted').
insert into recoveryos.residence_listing_submissions
  (residence_name, organization_name, address_city, address_state, contact_email,
   population_served, source, test_fixture)
values
  ('PUBLIC-INTAKE-TEST Fixture Residence', 'PUBLIC-INTAKE-TEST Org', 'Cedar Rapids', 'IA',
   'fixture-operator@example.test', 'men in early recovery', 'PUBLIC-INTAKE-TEST', true);

-- Flow 2 — Grace House pre-account application intake (starts 'received').
insert into recoveryos.residence_application_intake
  (residence_id, applicant_name, applicant_email, answers, consent_to_contact, source, test_fixture)
values
  ((select id from recoveryos.residences where name = 'PUBLIC-INTAKE-TEST Fixture Residence'),
   'PUBLIC-INTAKE-TEST Fixture Grace House Applicant', 'fixture-applicant@example.test',
   jsonb_build_object('why', 'test_fixture'), true, 'PUBLIC-INTAKE-TEST', true);

-- Flow 3 — referral (unchanged path; constrained anon insert in prod, service role here).
insert into recoveryos.referrals
  (residence_id, referrer_name, referrer_organization, participant_name, consent_attested)
values
  ((select id from recoveryos.residences where name = 'PUBLIC-INTAKE-TEST Fixture Residence'),
   'PUBLIC-INTAKE-TEST Fixture Referrer', 'PUBLIC-INTAKE-TEST Org',
   'PUBLIC-INTAKE-TEST Fixture Participant', true);
