-- CAPTURED LIVE-DRIFT MIGRATION (verbatim from supabase_migrations.schema_migrations.statements)
-- Version: 20260823212156 · Name: add_forms_and_signature_to_housing_applications
-- Applied to CQCX 2026-08-23 outside the repo lineage (EJWRH portal deploy session).
-- Captured 2026-08-23 during the Gate A EJWRH containment (predeployment audit
-- docs/audits/ejwrh-predeployment-audit-2026-08-23.md).
--
-- DISPOSITION: the columns exist live with 0 rows and are DEPRECATED at birth — the Gate A
-- containment (0138) removes the public write path, and the audit verdict routes application
-- intake through the canonical recoveryos.residence_application_intake boundary instead.
-- Nothing may write these columns; physical disposition belongs to a future cleanup gate.

alter table public.housing_applications
  add column if not exists forms jsonb not null default '{}'::jsonb,
  add column if not exists signature jsonb,
  add column if not exists read_acknowledgments jsonb not null default '{}'::jsonb;
comment on column public.housing_applications.forms is 'Full payloads of intake forms A-F completed online';
comment on column public.housing_applications.signature is 'Typed e-signature: name, signed_at, agreement_version, acknowledgments';
comment on column public.housing_applications.read_acknowledgments is 'Per-document read confirmations with timestamps';
