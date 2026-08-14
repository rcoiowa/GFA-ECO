-- ============================================================================
-- PREPARED — NOT APPLIED. Least-privilege hardening for public.housing_applications
-- on CQCX (cqcxvwoukyhxyokfwnjm). Do NOT apply without an explicit human gate.
-- Analysis + matrices + rollback trigger: docs/migration/ejwrh-intake-drift-reconciliation.md
-- ============================================================================
--
-- WHY: The table's create migration relied on RLS to deny all public reads/writes
-- except a constrained INSERT, BUT Supabase's default public-schema grants leave
-- `anon` and `authenticated` holding FULL DML (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/
-- REFERENCES/TRIGGER). Today the sensitive rows are protected ONLY by the absence of
-- SELECT/UPDATE/DELETE policies — a single accidental permissive policy or an RLS
-- toggle would expose applicant PII. This removes that latent exposure (defense in
-- depth) and matches least privilege.
--
-- VERIFIED WRITER (2026-08-14): anonymous browser → PostgREST anon INSERT (publishable
-- key), gated by policy housing_applications_public_insert. No authenticated-user insert
-- path found. Staff read/manage via service_role (bypasses RLS). Therefore:
--   * anon        keeps INSERT only.
--   * authenticated needs nothing on this table (staff use service_role).
--   * service_role unchanged (trusted server-side admin path).
--
-- BEHAVIORAL IMPACT: none for the live anon submit form (INSERT preserved). anon
-- SELECT/UPDATE/DELETE were already RLS-denied, so revoking those grants changes no
-- observable behavior — it only closes the latent exposure. Revoking authenticated
-- INSERT removes an unused path (no authenticated writer was found).
--
-- ROLLBACK: see the companion block at the bottom (commented).

begin;

-- anon: keep ONLY the intended public submit. RLS policy still constrains the rows.
revoke select, update, delete, truncate, references, trigger
  on public.housing_applications from anon;

-- authenticated: not used by the traced writer; staff read/manage via service_role.
revoke all
  on public.housing_applications from authenticated;

-- Optional (tighten the policy to match the grant surface). Safe: anon INSERT is the
-- only real path. Uncomment only if authenticated INSERT is confirmed unnecessary.
-- drop policy if exists housing_applications_public_insert on public.housing_applications;
-- create policy housing_applications_public_insert
--   on public.housing_applications for insert to anon
--   with check (house_code = 'ejwrh' and applicant_email is not null
--     and length(applicant_email) between 3 and 320 and consent_contact = true);

commit;

-- ---------------------------------------------------------------------------
-- ROLLBACK (restore the prior broad default grants):
-- begin;
-- grant select, insert, update, delete, truncate, references, trigger
--   on public.housing_applications to anon;
-- grant select, insert, update, delete, truncate, references, trigger
--   on public.housing_applications to authenticated;
-- commit;
-- ---------------------------------------------------------------------------
