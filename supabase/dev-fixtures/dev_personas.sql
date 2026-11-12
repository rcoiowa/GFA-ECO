-- RecoveryOS DEV synthetic personas — Phase C2 (2026-11-12).
--
-- SYNTHETIC ONLY. Every row here is invented: names are obviously artificial,
-- emails end in @example.test, phone numbers use the reserved 000 prefix, and
-- UUIDs are fixed DEV-namespace values. No production participant information
-- exists in, or was consulted for, this file.
--
-- WHERE THIS MAY RUN: disposable bootstrap targets and the isolated DEV
-- project only — never production. Two guards enforce that:
--   1. this file refuses to run unless the session sets
--        set recoveryos.devfixtures = 'on';
--      (scripts/bootstrap-dev.py sets it only for its own local targets);
--   2. scripts/bootstrap-dev.py itself refuses any production reference.
--
-- MECHANISM: personas enter through the CANONICAL provisioning path — rows in
-- auth.users fire recoveryos.handle_new_auth_user() (launch 0103), which
-- creates people rows, baseline participant roles, and consumes the
-- staff_preauthorizations allowlist — exactly as real sign-ups do. Only
-- residence-scoped staff roles and domain rows are inserted directly
-- afterwards (the shapes an administrator's grant produces). No
-- classification, RLS, role, or consent protection is altered: fixtures run
-- under the same schema production runs.
--
-- Personas (fixed UUID suffix → role):
--   …0001 dev-participant        participant; active ai_features consent
--   …0002 dev-revoked            participant; revoked + expired consents
--   …0003 dev-applicant-reg      registered applicant (application in_review, Grace House)
--   …0004 dev-resident           active residency at Grace House, resident role
--   …0005 dev-coach              coach (preauthorized) + active coaching relationship with …0001
--   …0006 dev-navigator          navigator (preauthorized) + active navigation relationship with …0001
--   …0007 dev-staff-gh           residence_staff scoped to Grace House
--   …0008 dev-staff-ejwrh        residence_staff scoped to EJWRH
--   …0009 dev-manager-gh         residence_manager scoped to Grace House
--   …000a dev-admin              administrator
--   …000b dev-facilitator        participant + GFARC Circle facilitator
--   …000c dev-leadership         executive (read-only leadership surfaces)
--   (accountless) one pre-account application intake row, Grace House

do $$ begin
  if coalesce(current_setting('recoveryos.devfixtures', true), '') <> 'on' then
    raise exception 'DEV fixtures refused: recoveryos.devfixtures is not ''on'' (disposable/DEV targets only)';
  end if;
end $$;

set search_path = recoveryos, public;

-- 1. Staff preauthorizations (consumed by the canonical signup trigger).
insert into recoveryos.staff_preauthorizations (email, role_keys, note)
select v.email, v.rks, 'DEV fixture'
from (values
  ('dev-coach@example.test',       array['coach']::recoveryos.role_key[]),
  ('dev-navigator@example.test',   array['navigator']::recoveryos.role_key[]),
  ('dev-staff-gh@example.test',    array['residence_staff']::recoveryos.role_key[]),
  ('dev-staff-ejwrh@example.test', array['residence_staff']::recoveryos.role_key[]),
  ('dev-manager-gh@example.test',  array['residence_manager']::recoveryos.role_key[]),
  ('dev-admin@example.test',       array['administrator']::recoveryos.role_key[]),
  ('dev-leadership@example.test',  array['executive']::recoveryos.role_key[])
) as v(email, rks)
where not exists (select 1 from recoveryos.staff_preauthorizations s
                  where lower(s.email) = lower(v.email));

-- 2. Auth users — the trigger provisions people + roles.
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-4000-a000-000000000001', 'dev-participant@example.test',   now()),
  ('00000000-0000-4000-a000-000000000002', 'dev-revoked@example.test',       now()),
  ('00000000-0000-4000-a000-000000000003', 'dev-applicant-reg@example.test', now()),
  ('00000000-0000-4000-a000-000000000004', 'dev-resident@example.test',      now()),
  ('00000000-0000-4000-a000-000000000005', 'dev-coach@example.test',         now()),
  ('00000000-0000-4000-a000-000000000006', 'dev-navigator@example.test',     now()),
  ('00000000-0000-4000-a000-000000000007', 'dev-staff-gh@example.test',      now()),
  ('00000000-0000-4000-a000-000000000008', 'dev-staff-ejwrh@example.test',   now()),
  ('00000000-0000-4000-a000-000000000009', 'dev-manager-gh@example.test',    now()),
  ('00000000-0000-4000-a000-00000000000a', 'dev-admin@example.test',         now()),
  ('00000000-0000-4000-a000-00000000000b', 'dev-facilitator@example.test',   now()),
  ('00000000-0000-4000-a000-00000000000c', 'dev-leadership@example.test',    now())
on conflict (id) do nothing;

-- Readable synthetic names (provisioning derives names from emails; make them
-- unmistakably artificial).
update recoveryos.people p set first_name = v.fn, last_name = 'Devfixture'
from (values
  ('00000000-0000-4000-a000-000000000001'::uuid, 'Participant'),
  ('00000000-0000-4000-a000-000000000002'::uuid, 'Revoked'),
  ('00000000-0000-4000-a000-000000000003'::uuid, 'Applicant'),
  ('00000000-0000-4000-a000-000000000004'::uuid, 'Resident'),
  ('00000000-0000-4000-a000-000000000005'::uuid, 'Coach'),
  ('00000000-0000-4000-a000-000000000006'::uuid, 'Navigator'),
  ('00000000-0000-4000-a000-000000000007'::uuid, 'StaffGrace'),
  ('00000000-0000-4000-a000-000000000008'::uuid, 'StaffEjwrh'),
  ('00000000-0000-4000-a000-000000000009'::uuid, 'ManagerGrace'),
  ('00000000-0000-4000-a000-00000000000a'::uuid, 'Admin'),
  ('00000000-0000-4000-a000-00000000000b'::uuid, 'Facilitator'),
  ('00000000-0000-4000-a000-00000000000c'::uuid, 'Leadership')
) as v(uid, fn)
where p.auth_user_id = v.uid;

-- 3. Residence-scoped staff roles (the shape grant_role_assignment produces;
--    preauthorization grants are organization-wide and carry no residence_id).
insert into recoveryos.role_assignments (person_id, role_key, organization_id, residence_id)
select p.id, v.rk::recoveryos.role_key, 1, r.id
from (values
  ('00000000-0000-4000-a000-000000000007'::uuid, 'residence_staff',   'Grace House'),
  ('00000000-0000-4000-a000-000000000008'::uuid, 'residence_staff',   'Ernest & Johnnie White Recovery House'),
  ('00000000-0000-4000-a000-000000000009'::uuid, 'residence_manager', 'Grace House')
) as v(uid, rk, rname)
join recoveryos.people p on p.auth_user_id = v.uid
join recoveryos.residences r on r.name = v.rname
where not exists (
  select 1 from recoveryos.role_assignments ra
  where ra.person_id = p.id and ra.role_key = v.rk::recoveryos.role_key
    and ra.residence_id = r.id and ra.revoked_at is null);

-- 4. Resident persona: resident role + active residency at Grace House.
insert into recoveryos.role_assignments (person_id, role_key, organization_id, residence_id)
select p.id, 'resident', 1, r.id
from recoveryos.people p, recoveryos.residences r
where p.auth_user_id = '00000000-0000-4000-a000-000000000004' and r.name = 'Grace House'
  and not exists (select 1 from recoveryos.role_assignments ra
    where ra.person_id = p.id and ra.role_key = 'resident' and ra.revoked_at is null);

insert into recoveryos.residencies (person_id, residence_id, admission_date, residency_status)
select p.id, r.id, current_date - 30, 'active'
from recoveryos.people p, recoveryos.residences r
where p.auth_user_id = '00000000-0000-4000-a000-000000000004' and r.name = 'Grace House'
  and not exists (select 1 from recoveryos.residencies x where x.person_id = p.id
                  and x.residency_status in ('approved','active','on_pass','transitioning'));

-- 5. Registered applicant: in-review application at Grace House.
insert into recoveryos.residence_applications (person_id, residence_id, status, notes)
select p.id, r.id, 'in_review', 'DEV fixture application'
from recoveryos.people p, recoveryos.residences r
where p.auth_user_id = '00000000-0000-4000-a000-000000000003' and r.name = 'Grace House'
  and not exists (select 1 from recoveryos.residence_applications a
                  where a.person_id = p.id and a.residence_id = r.id);

-- Accountless pre-account intake row (public-form shape).
insert into recoveryos.residence_application_intake
  (residence_id, applicant_name, applicant_email, answers, consent_to_contact, source)
select r.id, 'DEV-FIXTURE Accountless Applicant', 'dev-accountless@example.test',
       jsonb_build_object('note', 'synthetic'), true, 'dev-fixture'
from recoveryos.residences r
where r.name = 'Grace House'
  and not exists (select 1 from recoveryos.residence_application_intake i
                  where i.applicant_email = 'dev-accountless@example.test');

-- 6. Support relationships to dev-participant.
insert into recoveryos.coaching_relationships (participant_person_id, coach_person_id, organization_id)
select pp.id, pc.id, 1
from recoveryos.people pp, recoveryos.people pc
where pp.auth_user_id = '00000000-0000-4000-a000-000000000001'
  and pc.auth_user_id = '00000000-0000-4000-a000-000000000005'
  and not exists (select 1 from recoveryos.coaching_relationships c
                  where c.participant_person_id = pp.id and c.coach_person_id = pc.id and c.ended_at is null);

insert into recoveryos.navigation_relationships (participant_person_id, navigator_person_id, organization_id)
select pp.id, pn.id, 1
from recoveryos.people pp, recoveryos.people pn
where pp.auth_user_id = '00000000-0000-4000-a000-000000000001'
  and pn.auth_user_id = '00000000-0000-4000-a000-000000000006'
  and not exists (select 1 from recoveryos.navigation_relationships n
                  where n.participant_person_id = pp.id and n.navigator_person_id = pn.id and n.ended_at is null);

-- 7. Consent states (ai_features key seeded by 0200).
insert into recoveryos.consent_grants (person_id, consent_type_id, status)
select p.id, ct.id, 'granted'
from recoveryos.people p, recoveryos.consent_types ct
where p.auth_user_id = '00000000-0000-4000-a000-000000000001' and ct.key = 'ai_features'
  and not exists (select 1 from recoveryos.consent_grants g
                  where g.person_id = p.id and g.consent_type_id = ct.id);

insert into recoveryos.consent_grants (person_id, consent_type_id, status, revoked_at)
select p.id, ct.id, 'revoked', now() - interval '1 day'
from recoveryos.people p, recoveryos.consent_types ct
where p.auth_user_id = '00000000-0000-4000-a000-000000000002' and ct.key = 'ai_features'
  and not exists (select 1 from recoveryos.consent_grants g
                  where g.person_id = p.id and g.consent_type_id = ct.id and g.status = 'revoked');

insert into recoveryos.consent_grants (person_id, consent_type_id, status, expires_at)
select p.id, ct.id, 'granted', now() - interval '1 hour'
from recoveryos.people p, recoveryos.consent_types ct
where p.auth_user_id = '00000000-0000-4000-a000-000000000002' and ct.key = 'ai_features'
  and not exists (select 1 from recoveryos.consent_grants g
                  where g.person_id = p.id and g.consent_type_id = ct.id and g.expires_at is not null);

-- 8. GFARC Circle: a dev series and facilitator assignment (assigned by admin).
insert into recoveryos.meeting_series (organization_id, service_type_id, name, location_name, location_kind)
select 1, (select id from recoveryos.service_types order by id limit 1),
       'DEV GFARC Circle', 'Dev Fixture Hall', 'community'
where not exists (select 1 from recoveryos.meeting_series
                  where name = 'DEV GFARC Circle' and location_name = 'Dev Fixture Hall');

insert into recoveryos.meeting_facilitator_assignments (series_id, person_id, assigned_by_person_id)
select s.id, pf.id, pa.id
from recoveryos.meeting_series s, recoveryos.people pf, recoveryos.people pa
where s.name = 'DEV GFARC Circle'
  and pf.auth_user_id = '00000000-0000-4000-a000-00000000000b'
  and pa.auth_user_id = '00000000-0000-4000-a000-00000000000a'
on conflict (series_id, person_id) do nothing;

-- 9. Verification — fail loudly if provisioning or any insert went sideways.
do $$
declare
  n int;
begin
  select count(*) into n from recoveryos.people where last_name = 'Devfixture';
  if n <> 12 then raise exception 'fixture verification: expected 12 personas, found %', n; end if;

  select count(*) into n from recoveryos.role_assignments ra
    join recoveryos.people p on p.id = ra.person_id
    where p.last_name = 'Devfixture' and ra.role_key = 'participant' and ra.revoked_at is null;
  if n <> 12 then raise exception 'fixture verification: expected 12 baseline participant roles, found %', n; end if;

  select count(*) into n from recoveryos.staff_preauthorizations
    where email like 'dev-%@example.test' and consumed_at is null;
  if n <> 0 then raise exception 'fixture verification: % preauthorizations not consumed', n; end if;

  select count(*) into n from recoveryos.role_assignments ra
    join recoveryos.people p on p.id = ra.person_id
    where p.last_name = 'Devfixture' and ra.role_key in ('residence_staff','residence_manager')
      and ra.residence_id is not null and ra.revoked_at is null;
  if n <> 3 then raise exception 'fixture verification: expected 3 residence-scoped staff roles, found %', n; end if;

  select count(*) into n from recoveryos.residencies r
    join recoveryos.people p on p.id = r.person_id
    where p.last_name = 'Devfixture' and r.residency_status = 'active';
  if n <> 1 then raise exception 'fixture verification: expected 1 active residency, found %', n; end if;

  select count(*) into n from recoveryos.coaching_relationships c
    join recoveryos.people p on p.id = c.coach_person_id where p.last_name = 'Devfixture' and c.ended_at is null;
  if n < 1 then raise exception 'fixture verification: coaching relationship missing'; end if;

  select count(*) into n from recoveryos.meeting_facilitator_assignments a
    join recoveryos.meeting_series s on s.id = a.series_id
    where s.name = 'DEV GFARC Circle' and a.revoked_at is null;
  if n <> 1 then raise exception 'fixture verification: facilitator assignment missing'; end if;

  -- No fixture may carry a non-synthetic email.
  select count(*) into n from recoveryos.people p
    join auth.users u on u.id = p.auth_user_id
    where p.last_name = 'Devfixture' and u.email not like '%@example.test';
  if n <> 0 then raise exception 'fixture verification: % personas with non-synthetic email', n; end if;

  raise notice 'DEV fixtures verified: 12 personas, roles, residency, relationships, consents, circle';
end $$;
