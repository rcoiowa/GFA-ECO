-- 0149_view_and_function_exposure_hardening.prepared.sql — G3 findings F1/F2/F3
-- (SEC-DB-001; see docs/audits/2026-09-14-g3-database-authorization-audit.md)
--
-- STATUS: PREPARED ONLY. NOT APPLIED. NOT YET AUTHORIZED — the 2026-09-14
-- executive authorization covers 0148 and the fixture-role revocation only.
-- This file sits in the approval queue with its own packet section in the G3
-- audit. Written against ledger tail 0146 (+0148 assumed applied first;
-- nothing here depends on 0148).
--
-- FINDINGS REMEDIATED (each exploit-confirmed on the isolated 0146 replay):
--
--   G3-F1 (HIGH): recoveryos.residence_directory_public is an auto-updatable
--   view owned by postgres WITHOUT security_invoker, and `authenticated` holds
--   INSERT/UPDATE on it. Any signed-in participant can UPDATE the underlying
--   recoveryos.residences row through the view, bypassing residences RLS
--   (confirmed: an authenticated role changed a residence name). Fix: the view
--   stays a read-only public projection — write privileges are revoked from
--   client roles. anon keeps SELECT (its ratified public-directory purpose).
--
--   G3-F2 (MEDIUM, hygiene): recoveryos.check_ins_staff_view carries
--   authenticated INSERT/UPDATE grants. security_invoker=true means base-table
--   checks stop actual writes, but the grants are excess privilege. Revoked.
--
--   G3-F3 (HIGH): six callable functions were left on Postgres default ACLs,
--   which grant EXECUTE to PUBLIC (anon included; recoveryos is
--   PostgREST-exposed per 0010). Worst: recoveryos.narr_auto_evidence is
--   SECURITY DEFINER and WRITES narr_compliance — an anonymous caller set a
--   NARR standard to 'met' with arbitrary evidence text (confirmed). Fix:
--   explicit revokes; helper predicates regranted to authenticated only;
--   narr_auto_evidence becomes owner/trigger-context only.
--
--   Root cause hardening: default privileges in recoveryos/public no longer
--   grant EXECUTE on new functions to PUBLIC, so the class of defect cannot
--   silently recur with future migrations.
--
-- No table-structure changes and no row-data mutations; grants/ACLs only.
-- Trigger-returning functions with default ACLs are not client-callable and
-- are handled by the default-privilege change going forward.
--
-- ROLLBACK: 0149_view_and_function_exposure_hardening.rollback.sql.

begin;

-- G3-F1: public directory view becomes read-only for client roles.
revoke insert, update, delete on recoveryos.residence_directory_public from anon, authenticated;

-- G3-F2: staff check-ins view is read-only for client roles.
revoke insert, update, delete on recoveryos.check_ins_staff_view from anon, authenticated;

-- G3-F3: replace default PUBLIC execute with explicit least privilege.
revoke execute on function recoveryos.current_person_id() from public, anon;
grant  execute on function recoveryos.current_person_id() to authenticated;

revoke execute on function recoveryos.has_role(recoveryos.role_key) from public, anon;
grant  execute on function recoveryos.has_role(recoveryos.role_key) to authenticated;

revoke execute on function recoveryos.staff_residence_ids() from public, anon;
grant  execute on function recoveryos.staff_residence_ids() to authenticated;

revoke execute on function recoveryos.my_assigned_document_template_ids() from public, anon;
grant  execute on function recoveryos.my_assigned_document_template_ids() to authenticated;

revoke execute on function recoveryos.my_assigned_document_version_ids() from public, anon;
grant  execute on function recoveryos.my_assigned_document_version_ids() to authenticated;

-- Owner/trigger-context only: no client role may call the compliance writer.
revoke execute on function recoveryos.narr_auto_evidence(bigint, text, text) from public, anon, authenticated;

-- Root cause: new functions in these schemas no longer default to PUBLIC execute.
alter default privileges in schema recoveryos revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;

commit;
notify pgrst, 'reload schema';
