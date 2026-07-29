-- RecoveryOS foundation: enum types and shared helpers.
-- Convention: bigint identity primary keys; timestamptz audit columns;
-- snake_case names mirrored exactly by @recoveryos/domain types.

create type role_key as enum (
  'participant', 'resident', 'coach', 'navigator', 'residence_staff',
  'residence_manager', 'program_manager', 'administrator', 'executive',
  'system_administrator'
);

create type enrollment_status as enum (
  'inquiry', 'eligible', 'enrolled', 'paused', 'completed', 'withdrawn', 'ineligible'
);

create type residency_status as enum (
  'applicant', 'waitlisted', 'approved', 'active', 'on_pass',
  'transitioning', 'exited', 'discharged'
);

create type delivery_context as enum (
  'vrcc', 'recovery_residence', 'community_outreach', 'justice_reentry',
  'partner_site', 'virtual', 'other'
);

create type service_modality as enum (
  'in_person', 'video', 'phone', 'chat', 'self_directed', 'group'
);

create type consent_status as enum ('granted', 'declined', 'revoked', 'expired');

create type consent_category as enum (
  'account_identity', 'service_participation', 'coaching', 'resource_navigation',
  'recovery_assessments', 'residence_operations', 'communications', 'data_sharing',
  'ai_features', 'analytics'
);

create type organization_relationship_type as enum (
  'owner', 'operator', 'manager', 'service_provider',
  'referring_organization', 'funding_organization', 'recovery_support_partner'
);

create type goal_status as enum ('active', 'achieved', 'paused', 'archived');

-- updated_at maintenance
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
