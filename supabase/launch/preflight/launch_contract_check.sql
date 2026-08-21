-- launch_contract_check.sql — permanent PostgREST privilege/RLS regression guard (P4E §39).
--
-- Exists because of the 0110 discovery: the launch project had correct RLS
-- policies but NO table privileges for `authenticated` — a class of defect that
-- SECURITY DEFINER RPC tests structurally cannot catch, because definer
-- functions run with the owner's privileges. This preflight verifies the
-- direct-PostgREST contract itself. Run it against RecoveryOS-Launch after any
-- migration batch and before any soft-launch gate. It is a REGRESSION GUARD,
-- not a replacement for the real authenticated-HTTP gate.
--
-- PASS: final select returns one row. FAIL: the DO block raises with the
-- specific broken contract, and nothing after it runs.

do $contract$
declare
  missing text;
  n int;
begin
  -- 1) Schema USAGE for the PostgREST roles.
  if not has_schema_privilege('authenticated', 'recoveryos', 'USAGE') then
    raise exception 'LAUNCH-CONTRACT FAIL: authenticated lacks USAGE on schema recoveryos';
  end if;
  if not has_schema_privilege('anon', 'recoveryos', 'USAGE') then
    raise exception 'LAUNCH-CONTRACT FAIL: anon lacks USAGE on schema recoveryos';
  end if;

  -- 2) authenticated holds SELECT/INSERT/UPDATE on every canonical table
  --    (RLS policies — not privileges — are the row gate). Named exceptions:
  --    the two 0122 intake tables DELIBERATELY revoke client INSERT/UPDATE/DELETE
  --    (service-role-only writes; audited review RPCs are the only lifecycle path),
  --    so they are excluded here — their stricter posture is asserted by
  --    scripts/verify-intake-boundary.mjs and the anon check below.
  --    The 0129/0131 domain-vocabulary tables are read-only reference data by design
  --    (SELECT yes; INSERT/UPDATE/DELETE revoked — vocabulary changes are migrations,
  --    never client writes; scripts/verify-domain-vocabulary.mjs guards the content).
  select string_agg(tablename, ', ' order by tablename) into missing
  from pg_tables
  where schemaname = 'recoveryos'
    and tablename not in ('residence_listing_submissions','residence_application_intake',
                          'domains','domain_subcategories','domain_external_mappings',
                          'resource_domains')
    and not (has_table_privilege('authenticated', format('recoveryos.%I', tablename), 'SELECT')
         and has_table_privilege('authenticated', format('recoveryos.%I', tablename), 'INSERT')
         and has_table_privilege('authenticated', format('recoveryos.%I', tablename), 'UPDATE'));
  if missing is not null then
    raise exception 'LAUNCH-CONTRACT FAIL: authenticated missing table privileges on: %', missing;
  end if;

  -- 3) anon privileges limited to the explicitly public surface (referral intake).
  select string_agg(tablename, ', ' order by tablename) into missing
  from pg_tables
  where schemaname = 'recoveryos' and tablename <> 'referrals'
    and (has_table_privilege('anon', format('recoveryos.%I', tablename), 'SELECT')
      or has_table_privilege('anon', format('recoveryos.%I', tablename), 'INSERT')
      or has_table_privilege('anon', format('recoveryos.%I', tablename), 'UPDATE')
      or has_table_privilege('anon', format('recoveryos.%I', tablename), 'DELETE'));
  if missing is not null then
    raise exception 'LAUNCH-CONTRACT FAIL: anon has unexpected privileges on: %', missing;
  end if;

  -- 4) RLS enabled on every canonical table.
  select string_agg(c.relname, ', ' order by c.relname) into missing
  from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
  where ns.nspname = 'recoveryos' and c.relkind = 'r' and not c.relrowsecurity;
  if missing is not null then
    raise exception 'LAUNCH-CONTRACT FAIL: RLS disabled on: %', missing;
  end if;

  -- 5) RLS actually blocks: an unknown authenticated identity (simulated JWT
  --    claims + role, the same path PostgREST takes) reads zero people rows —
  --    proving privileges did not silently widen into data exposure, and that
  --    definer-function results were not standing in for normal grants.
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-00000000dead","role":"authenticated"}', true);
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000dead', true);
  execute 'set local role authenticated';
  select count(*) into n from recoveryos.people;
  execute 'reset role';
  if n <> 0 then
    raise exception 'LAUNCH-CONTRACT FAIL: unknown authenticated identity can read % people rows', n;
  end if;

  -- 6) Residence hardening regression guards (P4F). High-impact lifecycle
  --    tables must have NO generic client write policies — transitions are
  --    RPC-only, and screenings/incidents are append-only.
  select string_agg(distinct tablename, ', ') into missing
  from pg_policies
  where schemaname = 'recoveryos'
    and tablename in ('screenings','incidents')
    and cmd in ('UPDATE','DELETE','ALL');
  if missing is not null then
    raise exception 'LAUNCH-CONTRACT FAIL: append-only violated (UPDATE/DELETE/ALL policy) on: %', missing;
  end if;
  select string_agg(distinct tablename || ':' || policyname, ', ') into missing
  from pg_policies
  where schemaname = 'recoveryos'
    and tablename in ('residence_applications','residencies','bed_assignments','passes')
    and cmd in ('UPDATE','DELETE','ALL')
    and policyname <> 'document_assignments_ack_self';
  if missing is not null then
    raise exception 'LAUNCH-CONTRACT FAIL: generic lifecycle write policy present: %', missing;
  end if;
  if exists (select 1 from pg_policies where schemaname='recoveryos'
             and tablename='grievances' and policyname='grievances_involved') then
    raise exception 'LAUNCH-CONTRACT FAIL: broad grievance read policy (grievances_involved) is back';
  end if;
  if not exists (select 1 from pg_policies where schemaname='recoveryos'
                 and tablename='grievances' and policyname='grievances_scoped_select') then
    raise exception 'LAUNCH-CONTRACT FAIL: grievances_scoped_select missing';
  end if;

  -- 7) Access-governance regression guards (P4G).
  --    Privileged surfaces are RPC-only; the deprecated is_admin_staff helper
  --    must remain a pure alias of is_platform_admin; message bodies stay
  --    member-only; referral triage stays RPC-only.
  select string_agg(tablename || ':' || policyname, ', ') into missing
  from pg_policies
  where schemaname = 'recoveryos'
    and tablename in ('staff_preauthorizations','role_assignments','audit_log')
    and cmd in ('INSERT','UPDATE','DELETE','ALL');
  if missing is not null then
    raise exception 'LAUNCH-CONTRACT FAIL: privileged table has client write policy: %', missing;
  end if;
  select string_agg(policyname, ', ') into missing
  from pg_policies
  where schemaname = 'recoveryos' and tablename = 'referrals'
    and cmd in ('UPDATE','DELETE','ALL');
  if missing is not null then
    raise exception 'LAUNCH-CONTRACT FAIL: referral triage write policy is back: %', missing;
  end if;
  if exists (select 1 from pg_policies
             where schemaname = 'recoveryos' and tablename = 'messages'
               and cmd = 'SELECT' and qual like '%admin%') then
    raise exception 'LAUNCH-CONTRACT FAIL: message bodies are no longer member-only';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'recoveryos' and p.proname = 'is_admin_staff'
                   and p.prosrc like '%is_platform_admin%') then
    raise exception 'LAUNCH-CONTRACT FAIL: is_admin_staff is no longer a platform-admin alias';
  end if;

  -- 8) Client RPC surface (P4H-G1). Every RPC the frontend calls must be
  --    executable by `authenticated` — the 0121 discovery: `revoke ... from
  --    public` silently strips the PUBLIC default authenticated relied on,
  --    and SECURITY DEFINER tests run as owner so they can't catch it.
  select string_agg(distinct p.proname, ', ' order by p.proname) into missing
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'recoveryos'
    and p.proname in (
      'accept_booking_proposal','admin_list_people','admit_applicant','assign_bed',
      'assign_participant_coach','cancel_booking','cancel_support_request','claim_support_request',
      'counter_propose_booking_times','create_booking_request','create_residence_for_current_user',
      'decide_pass','ensure_my_document_assignments','ensure_person_for_current_user',
      'ensure_relationship_conversation','get_my_navigation_participants','get_my_participants',
      'get_my_support_team','list_open_support_requests','mark_conversation_read',
      'propose_booking_times','release_bed','reschedule_booking','review_residence_application',
      'send_message','triage_residence_referral','complete_session',
      'review_residence_listing_submission','publish_residence_listing_submission',
      'review_residence_application_intake')
    and not has_function_privilege('authenticated', p.oid, 'EXECUTE');
  if missing is not null then
    raise exception 'LAUNCH-CONTRACT FAIL: authenticated cannot execute client RPC(s): %', missing;
  end if;

  -- 9) View privilege posture (P0-1, 2026-08-21). A plain view executes with its
  --    OWNER's privileges and bypasses RLS; 0110's blanket grant (and its default-
  --    privileges rule) captures views too. Every recoveryos view reachable by a
  --    client role must therefore be security_invoker — except explicitly
  --    allowlisted curated surfaces (residence_directory_public: anon directory
  --    projection, column-curated in 0122).
  select string_agg(v.viewname, ', ' order by v.viewname) into missing
  from pg_views v
  where v.schemaname = 'recoveryos'
    and v.viewname <> 'residence_directory_public'
    and (has_table_privilege('anon', format('recoveryos.%I', v.viewname), 'SELECT')
      or has_table_privilege('authenticated', format('recoveryos.%I', v.viewname), 'SELECT'))
    and not exists (
      select 1 from pg_class c
      join pg_namespace ns on ns.oid = c.relnamespace
      where ns.nspname = 'recoveryos' and c.relname = v.viewname
        and c.reloptions @> array['security_invoker=true']);
  if missing is not null then
    raise exception 'LAUNCH-CONTRACT FAIL: owner-privileged view readable by client roles: %', missing;
  end if;
end $contract$;

select 'LAUNCH CONTRACT PASS — schema usage, table privileges, anon scope, RLS posture verified' as result;
