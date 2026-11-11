-- Optional authorized read-only metadata audit. Never selects participant records.
begin read only;
select n.nspname as schema, c.relname, c.relkind, c.relrowsecurity,
       r.rolname, has_table_privilege(r.oid,c.oid,'SELECT') as can_select,
       has_table_privilege(r.oid,c.oid,'INSERT') as can_insert,
       has_table_privilege(r.oid,c.oid,'UPDATE') as can_update,
       has_table_privilege(r.oid,c.oid,'DELETE') as can_delete
from pg_class c join pg_namespace n on n.oid=c.relnamespace
cross join pg_roles r
where n.nspname in ('public','recoveryos') and c.relkind in ('r','p','v','m')
  and r.rolname in ('anon','authenticated','service_role')
order by 1,2,5;
select pg_get_userbyid(d.defaclrole) as owner,n.nspname,d.defaclobjtype,d.defaclacl
from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace
where n.nspname in ('public','recoveryos') or d.defaclnamespace=0;
select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_policies where schemaname in ('public','recoveryos');
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
 p.prosecdef,p.proconfig,p.proacl
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='recoveryos';
rollback;
