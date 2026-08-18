-- CAPTURED LIVE-STATE PROVENANCE — already applied to CQCX (cqcxvwoukyhxyokfwnjm).
-- Migration version: 20260811232326  name: create_housing_applications_ejwrh
-- Source: exact statements[] recorded in supabase_migrations.schema_migrations on CQCX.
--         Captured read-only 2026-08-14. This is NOT re-applied by the repo; it documents
--         what is already live. Governing analysis: docs/migration/ejwrh-intake-drift-reconciliation.md
--
-- NOTE (governance): this table lives in the `public` schema and is NOT the canonical
-- recoveryos intake boundary. See the reconciliation doc for the convergence plan onto
-- recoveryos.residence_application_intake (supabase/launch/migrations/0122_public_intake_boundary.sql).

-- Online housing applications, mirroring the Grace House (GFA) housing_applications shape.
-- Multi-residence ready via house_code; EJWRH is the first tenant.
create extension if not exists pgcrypto;

create table if not exists public.housing_applications (
  id                       uuid primary key default gen_random_uuid(),
  house_code               text not null default 'ejwrh',
  applicant_name           text,
  applicant_email          text not null,
  applicant_phone          text,
  county                   text,
  personal                 jsonb not null default '{}'::jsonb,   -- demographics, situation, health/safety, references
  journey                  jsonb not null default '{}'::jsonb,   -- recovery history, supervision/reentry, goals
  your_why                 text,
  consent_rules_reviewed   boolean not null default false,
  consent_share_with_house boolean not null default false,
  consent_contact          boolean not null default false,
  status                   text not null default 'submitted'
                             check (status in ('submitted','under_review','intake_scheduled','accepted','waitlisted','declined','withdrawn')),
  source                   text default 'web',
  submitted_at             timestamptz default now(),
  intake_at                timestamptz,
  decided_at               timestamptz,
  decision_note            text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists housing_applications_house_status_idx
  on public.housing_applications (house_code, status, submitted_at desc);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_housing_applications_updated_at on public.housing_applications;
create trigger trg_housing_applications_updated_at
  before update on public.housing_applications
  for each row execute function public.set_updated_at();

-- Security: public may SUBMIT only. No public read/update/delete.
alter table public.housing_applications enable row level security;

drop policy if exists housing_applications_public_insert on public.housing_applications;
create policy housing_applications_public_insert
  on public.housing_applications
  for insert
  to anon, authenticated
  with check (
    house_code = 'ejwrh'
    and applicant_email is not null
    and length(applicant_email) between 3 and 320
    and consent_contact = true
  );

-- No SELECT/UPDATE/DELETE policies for anon => those operations are denied by default.
-- Staff will read via an authenticated/service-role context in the admin app.
