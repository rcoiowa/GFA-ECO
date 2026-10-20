-- SYNTHETIC isolated database only. Minimal contract stubs, not a copy of live authorization.
create role anon;
create role authenticated;
create schema auth;
create schema recoveryos;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
create function recoveryos.current_person_id() returns bigint language sql stable as $$ select nullif(current_setting('test.actor',true),'')::bigint $$;
create function recoveryos.staff_residence_ids() returns setof bigint language sql stable as $$ select 10::bigint where recoveryos.current_person_id() in (1,2) $$;
create function recoveryos.is_care_operations_staff() returns boolean language sql stable as $$ select coalesce(recoveryos.current_person_id() = 4, false) $$;
create table recoveryos.people(id bigint primary key);
insert into recoveryos.people values (1),(2),(3),(4),(5);
create table recoveryos.residence_application_intake(id bigint primary key, residence_id bigint not null, status text, converted_person_id bigint, converted_application_id bigint, review_notes text);
insert into recoveryos.residence_application_intake values (100,10,'contacted',null,null,'Synthetic prior personal contact; exact date unknown'), (200,20,'received',null,null,null);
alter table recoveryos.residence_application_intake enable row level security;
create policy intake_read on recoveryos.residence_application_intake for select to authenticated using (residence_id in (select recoveryos.staff_residence_ids()) or recoveryos.is_care_operations_staff());
grant usage on schema auth, recoveryos to authenticated, anon;
grant select on recoveryos.residence_application_intake to authenticated;

create function recoveryos.is_production_person(p bigint) returns boolean language sql stable as $$ select p in (1,2,3,4) $$;
create table recoveryos.role_assignments(person_id bigint, residence_id bigint, role_key text, revoked_at timestamptz);
insert into recoveryos.role_assignments values (1,10,'residence_staff',null),(2,10,'residence_staff',null),(3,20,'residence_staff',null),(5,10,'residence_staff',null);
insert into recoveryos.people values (6);
create function recoveryos.is_platform_admin() returns boolean language sql stable as $$ select recoveryos.current_person_id() in (4,6) $$;
create or replace function recoveryos.is_care_operations_staff() returns boolean language sql stable as $$ select coalesce(recoveryos.current_person_id() in (4,6),false) $$;
create table recoveryos.residences(id bigint primary key, organization_id bigint not null);
insert into recoveryos.residences values(10,1000),(20,2000);
create table recoveryos.residencies(person_id bigint, residence_id bigint, residency_status text);
insert into recoveryos.residencies values(5,10,'active');

create table recoveryos.person_classification(person_id bigint primary key, classification text);
insert into recoveryos.person_classification values(1,'production'),(2,'production'),(3,'production'),(4,'production'),(5,'test_fixture'),(6,'production');
