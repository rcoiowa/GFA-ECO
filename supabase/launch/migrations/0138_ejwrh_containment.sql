-- 0138_ejwrh_containment.sql — Gate A: contain the EJWRH anonymous intake path.
--
-- Authorized by the EJWRH Gate A remediation directive (2026-08-23) following the
-- predeployment audit (docs/audits/ejwrh-predeployment-audit-2026-08-23.md, HOLD confirmed).
--
-- What this does:
--   1. DISABLES the obsolete anonymous submission path into public.housing_applications:
--      drops the public INSERT policy and revokes anon's INSERT grant (the last client
--      privilege on the table, per the 0123 hardening record). The table is retained —
--      0 rows, evidence + rollback material — and is DEPRECATED: it has NO remaining
--      canonical role. recoveryos.residence_application_intake (0122) supersedes it for
--      all application intake (service-role boundary, staff queue, audited review,
--      notifications). Physical disposition of the empty table belongs to a future
--      cleanup gate; nothing may expand or write it.
--   2. Makes the `sites` storage bucket PRIVATE: the previously uploaded EJWRH page
--      (mojibake-encoded, inaccurate public claims per the audit) stops being publicly
--      readable at the raw storage URL. The objects are preserved as evidence, readable
--      via service role. The replacement portal is served self-contained from the
--      version-controlled `ejwrh` Edge Function and does not depend on this bucket.
--
-- What this deliberately does NOT do: deploy any public route (Cloudflare deployment
-- remains CLOSED); touch recoveryos; drop the table or its 2026-08-23 columns; recreate
-- any storage write window.
--
-- ROLLBACK:
--   create policy housing_applications_public_insert on public.housing_applications
--     for insert to anon, authenticated
--     with check (house_code = 'ejwrh' and applicant_email is not null
--                 and length(applicant_email) between 3 and 320 and consent_contact = true);
--   grant insert on public.housing_applications to anon;
--   update storage.buckets set public = true where id = 'sites';

drop policy if exists housing_applications_public_insert on public.housing_applications;
revoke insert on public.housing_applications from anon;

comment on table public.housing_applications is
  'DEPRECATED (Gate A containment, 2026-08-23): superseded by '
  'recoveryos.residence_application_intake (0122 canonical intake boundary). No client role '
  'holds any privilege; no INSERT policy exists; 0 rows ever stored. Retained as drift '
  'evidence and rollback material only — never expand, never write. Physical disposition '
  'belongs to a future cleanup gate. Provenance: live-drift captures 20260811232326, '
  '20260823212156; hardening 0123; containment 0138.';

update storage.buckets set public = false where id = 'sites';

notify pgrst, 'reload schema';
