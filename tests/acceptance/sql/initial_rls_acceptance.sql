-- Initial DEV acceptance battery — Phase C2 (2026-11-12).
-- Runs against a DISPOSABLE bootstrap with DEV fixtures applied
-- (scripts/test-dev-acceptance.py). Read-only: one transaction, ends ROLLBACK.
-- Impersonation shim: auth.uid() reads test.uid (bootstrap prelude);
-- actors run as `authenticated` via SET LOCAL ROLE, exactly like the P0 suites.
--
-- What it proves (each assertion raises on failure):
--   A. identity resolution per persona (auth user -> person);
--   B. participant plane: own-row-only visibility of people and consent_grants;
--      no staff predicate, no application visibility;
--   C. consent states: active grant for dev-participant; revoked and expired
--      grants for dev-revoked are present and distinguishable (the UI rule
--      "expired/revoked is NOT allowed" has data to render against);
--   D. residence staff scoping: Grace House staff see exactly residence 1 and
--      its application/intake rows; EJWRH staff see exactly residence 2 and
--      ZERO Grace House rows (cross-residence denial);
--   E. role-grant boundary: an ordinary participant calling
--      grant_role_assignment gets not_authorized (no privilege escalation);
--   F. anonymous plane: anon reads zero rows from people, consent_grants,
--      residence_applications, and the service-role-only intake tables.

\set ON_ERROR_STOP on
begin;

do $$ begin
  if (select count(*) from recoveryos.people where last_name = 'Devfixture') <> 12 then
    raise exception 'acceptance requires the DEV fixtures (12 personas)';
  end if;
end $$;

-- ---------- A/B: participant plane ----------
select set_config('test.uid', '00000000-0000-4000-a000-000000000001', true);
set local role authenticated;
do $$
declare pid bigint; n int;
begin
  pid := recoveryos.current_person_id();
  if pid is null then raise exception 'A: participant identity did not resolve'; end if;
  select count(*) into n from recoveryos.people;
  if n <> 1 then raise exception 'B: participant sees % people rows, expected own row only', n; end if;
  select count(*) into n from recoveryos.people where id = pid;
  if n <> 1 then raise exception 'B: participant cannot see own people row'; end if;
  select count(*) into n from recoveryos.consent_grants where person_id <> pid;
  if n <> 0 then raise exception 'B: participant sees % foreign consent rows', n; end if;
  if recoveryos.has_role('residence_staff') then raise exception 'B: participant holds staff predicate'; end if;
  if recoveryos.has_role('administrator') then raise exception 'B: participant holds admin predicate'; end if;
  select count(*) into n from recoveryos.residence_applications;
  if n <> 0 then raise exception 'B: participant sees % applications', n; end if;
  -- C: active ai_features grant visible and active
  select count(*) into n from recoveryos.consent_grants g
    join recoveryos.consent_types t on t.id = g.consent_type_id
    where g.person_id = pid and t.key = 'ai_features' and g.status = 'granted'
      and g.revoked_at is null and (g.expires_at is null or g.expires_at > now());
  if n <> 1 then raise exception 'C: active ai_features grant missing for participant'; end if;
end $$;
reset role;

-- ---------- C: revoked/expired persona ----------
select set_config('test.uid', '00000000-0000-4000-a000-000000000002', true);
set local role authenticated;
do $$
declare pid bigint; n int;
begin
  pid := recoveryos.current_person_id();
  select count(*) into n from recoveryos.consent_grants g where g.person_id = pid and g.revoked_at is not null;
  if n < 1 then raise exception 'C: revoked grant missing'; end if;
  select count(*) into n from recoveryos.consent_grants g
    where g.person_id = pid and g.expires_at is not null and g.expires_at < now();
  if n < 1 then raise exception 'C: expired grant missing'; end if;
  -- And none of them may count as currently allowed:
  select count(*) into n from recoveryos.consent_grants g
    where g.person_id = pid and g.status = 'granted' and g.revoked_at is null
      and (g.expires_at is null or g.expires_at > now());
  if n <> 0 then raise exception 'C: revoked/expired persona still has an active grant'; end if;
end $$;
reset role;

-- ---------- D: residence staff scoping ----------
select set_config('test.uid', '00000000-0000-4000-a000-000000000007', true);
set local role authenticated;
do $$
declare n int; scope bigint[];
begin
  scope := array(select s from recoveryos.staff_residence_ids() s order by s);
  if scope <> array[1]::bigint[] then raise exception 'D: GH staff scope is %, expected {1}', scope; end if;
  select count(*) into n from recoveryos.residence_applications where residence_id = 1;
  if n < 1 then raise exception 'D: GH staff cannot see the GH application'; end if;
  select count(*) into n from recoveryos.residence_application_intake where residence_id = 1;
  if n < 1 then raise exception 'D: GH staff cannot see the GH intake row'; end if;
end $$;
reset role;

select set_config('test.uid', '00000000-0000-4000-a000-000000000008', true);
set local role authenticated;
do $$
declare n int; scope bigint[];
begin
  scope := array(select s from recoveryos.staff_residence_ids() s order by s);
  if scope <> array[2]::bigint[] then raise exception 'D: EJWRH staff scope is %, expected {2}', scope; end if;
  select count(*) into n from recoveryos.residence_applications;
  if n <> 0 then raise exception 'D: EJWRH staff see % Grace House applications (cross-residence leak)', n; end if;
  select count(*) into n from recoveryos.residence_application_intake where residence_id = 1;
  if n <> 0 then raise exception 'D: EJWRH staff see % Grace House intake rows (cross-residence leak)', n; end if;
end $$;
reset role;

-- ---------- E: no privilege escalation through grant_role_assignment ----------
select set_config('test.uid', '00000000-0000-4000-a000-000000000001', true);
set local role authenticated;
do $$
declare res jsonb; target bigint;
begin
  select id into target from recoveryos.people where auth_user_id = '00000000-0000-4000-a000-000000000002';
  res := recoveryos.grant_role_assignment(target, 'administrator'::recoveryos.role_key, null, null);
  if coalesce(res->>'code', res->>'error', '') <> 'not_authorized' then
    raise exception 'E: participant grant_role_assignment returned % (expected not_authorized)', res;
  end if;
exception
  when insufficient_privilege then null; -- an outright execute denial is equally acceptable
end $$;
reset role;

-- ---------- F: anonymous plane ----------
set local role anon;
do $$
declare n int;
begin
  select count(*) into n from recoveryos.people; if n <> 0 then raise exception 'F: anon sees people'; end if;
  select count(*) into n from recoveryos.consent_grants; if n <> 0 then raise exception 'F: anon sees consents'; end if;
  select count(*) into n from recoveryos.residence_applications; if n <> 0 then raise exception 'F: anon sees applications'; end if;
  begin
    select count(*) into n from recoveryos.residence_application_intake;
    if n <> 0 then raise exception 'F: anon sees intake rows'; end if;
  exception when insufficient_privilege then null; -- no grant at all is the intended posture
  end;
exception when insufficient_privilege then null;
end $$;
reset role;

rollback;
\echo INITIAL ACCEPTANCE BATTERY PASSED (identity, participant plane, consent states, residence scoping, grant boundary, anon denial)
