-- Disposable synthetic database only; invoked by replay-launch-local.py.
begin;
alter default privileges for role postgres in schema public grant select on tables to anon;
create table public.readiness_existing(id bigint);
alter default privileges for role postgres in schema public revoke select,insert,update,delete on tables from anon,authenticated,service_role;
alter default privileges for role postgres in schema public revoke usage,select on sequences from anon,authenticated,service_role;
create table public.readiness_new(id bigint, owner_id uuid);
alter table public.readiness_new enable row level security;
do $$ begin
 if not has_table_privilege('anon','public.readiness_existing','SELECT') then raise exception 'Existing grant lost'; end if;
 if has_table_privilege('anon','public.readiness_new','SELECT') or has_table_privilege('authenticated','public.readiness_new','INSERT') then raise exception 'New public table exposed'; end if;
end $$;
grant select on public.readiness_new to authenticated;
create policy readiness_own on public.readiness_new for select to authenticated using (owner_id=auth.uid());
insert into public.readiness_new values (1,'00000000-0000-0000-0000-000000000001'),(2,'00000000-0000-0000-0000-000000000002');
set local role authenticated;
set local test.uid='00000000-0000-0000-0000-000000000001';
do $$ begin
 if (select count(*) from public.readiness_new)<>1 or (select min(id) from public.readiness_new)<>1 then raise exception 'Own-row RLS failed'; end if;
 begin insert into public.readiness_new values (3,auth.uid()); raise exception 'Insert unexpectedly permitted'; exception when insufficient_privilege then null; end;
end $$;
set local test.uid='00000000-0000-0000-0000-000000000002';
do $$ begin
 if (select count(*) from public.readiness_new)<>1 or (select min(id) from public.readiness_new)<>2 then raise exception 'Second identity isolation failed'; end if;
end $$;
reset role;
rollback;
