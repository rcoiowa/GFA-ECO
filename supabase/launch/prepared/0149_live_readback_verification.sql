-- 0149_live_readback_verification.sql — post-apply live read-back for 0149
-- (authorization conditions 6 and 7). Read-only; transaction-wrapped with
-- ROLLBACK; aggregate/boolean output only; raises on any failed check —
-- a failure means STOP AND REPORT.
--
-- Run on CQCX immediately AFTER applying prepared 0149 (which itself runs
-- only after 0148 + its read-back), on a service/admin SQL connection.

\set ON_ERROR_STOP on

begin;

do $$
declare
  fn text;
  bad int := 0;
  acl_public int;
  defacl_row record;
  helper_fns text[] := array[
    'recoveryos.current_person_id()',
    'recoveryos.has_role(recoveryos.role_key)',
    'recoveryos.staff_residence_ids()',
    'recoveryos.my_assigned_document_template_ids()',
    'recoveryos.my_assigned_document_version_ids()'
  ];
begin
  -- 6a. authenticated has no write privilege on the public directory view.
  if has_table_privilege('authenticated', 'recoveryos.residence_directory_public', 'INSERT')
     or has_table_privilege('authenticated', 'recoveryos.residence_directory_public', 'UPDATE')
     or has_table_privilege('authenticated', 'recoveryos.residence_directory_public', 'DELETE') then
    raise exception 'READBACK FAIL: authenticated still holds a write privilege on residence_directory_public';
  end if;
  raise notice 'readback 6a ok: residence_directory_public is read-only for authenticated';

  -- 6b. anon keeps SELECT on the public directory view.
  if not has_table_privilege('anon', 'recoveryos.residence_directory_public', 'SELECT') then
    raise exception 'READBACK FAIL: anon lost SELECT on residence_directory_public';
  end if;
  raise notice 'readback 6b ok: anon still reads residence_directory_public';

  -- 6c. authenticated has no write privilege on check_ins_staff_view.
  if has_table_privilege('authenticated', 'recoveryos.check_ins_staff_view', 'INSERT')
     or has_table_privilege('authenticated', 'recoveryos.check_ins_staff_view', 'UPDATE')
     or has_table_privilege('authenticated', 'recoveryos.check_ins_staff_view', 'DELETE') then
    raise exception 'READBACK FAIL: authenticated still holds a write privilege on check_ins_staff_view';
  end if;
  raise notice 'readback 6c ok: check_ins_staff_view is read-only for authenticated';

  -- 6d. anon cannot execute the compliance writer (PUBLIC inheritance included).
  if has_function_privilege('anon', 'recoveryos.narr_auto_evidence(bigint, text, text)', 'EXECUTE') then
    raise exception 'READBACK FAIL: anon can still execute narr_auto_evidence';
  end if;
  if has_function_privilege('authenticated', 'recoveryos.narr_auto_evidence(bigint, text, text)', 'EXECUTE') then
    raise exception 'READBACK FAIL: authenticated can still execute narr_auto_evidence';
  end if;
  raise notice 'readback 6d ok: narr_auto_evidence is owner/trigger-context only';

  -- 6e. authenticated keeps the five intended helpers.
  foreach fn in array helper_fns loop
    if not has_function_privilege('authenticated', fn, 'EXECUTE') then
      raise exception 'READBACK FAIL: authenticated lost execute on %', fn;
    end if;
    if has_function_privilege('anon', fn, 'EXECUTE') then
      raise exception 'READBACK FAIL: anon can execute %', fn;
    end if;
  end loop;
  raise notice 'readback 6e ok: five helpers executable by authenticated only';

  -- 6f. none of the six functions carries a PUBLIC execute ACL entry any more.
  select count(*) into acl_public
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  left join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a on true
  where n.nspname = 'recoveryos'
    and p.proname in ('current_person_id','has_role','staff_residence_ids',
                      'my_assigned_document_template_ids','my_assigned_document_version_ids',
                      'narr_auto_evidence')
    and a.grantee = 0;  -- 0 = PUBLIC
  if acl_public > 0 then
    raise exception 'READBACK FAIL: % PUBLIC execute ACL entrie(s) remain on the six functions', acl_public;
  end if;
  raise notice 'readback 6f ok: no PUBLIC execute remains on the six functions';

  -- 7. The GLOBAL default function ACL for role postgres exists (namespace 0)
  --    and excludes PUBLIC execute. The global form is required: a schema-
  --    scoped entry cannot remove the built-in PUBLIC EXECUTE default.
  --    Absence of the row means built-in defaults still apply — a failure.
  select count(*) into bad
  from pg_default_acl d
  where d.defaclrole = 'postgres'::regrole
    and d.defaclobjtype = 'f'
    and d.defaclnamespace = 0
    and not exists (select 1 from aclexplode(d.defaclacl) a where a.grantee = 0);
  if bad < 1 then
    raise exception 'READBACK FAIL: no hardened global default function ACL for role postgres (built-in PUBLIC execute still applies to new functions)';
  end if;
  raise notice 'readback 7 ok: global postgres default function ACL excludes PUBLIC execute';

  -- 7b. Behavioral probe: a freshly created function must not be
  --     PUBLIC/anon-executable. Created and dropped inside this rolled-back
  --     transaction — nothing persists.
  execute 'create function recoveryos.readback_defacl_probe_0149() returns int language sql as ''select 1''';
  if has_function_privilege('anon', 'recoveryos.readback_defacl_probe_0149()', 'EXECUTE') then
    raise exception 'READBACK FAIL: a newly created function is still anon-executable';
  end if;
  execute 'drop function recoveryos.readback_defacl_probe_0149()';
  raise notice 'readback 7b ok: newly created functions are not anon-executable';
end $$;

rollback;
