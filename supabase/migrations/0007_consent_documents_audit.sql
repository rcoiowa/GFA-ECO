-- Consent, documents, and audit.
-- Consent is granular, revocable, time-aware, append-only, and auditable.
-- Declining an optional consent never blocks unrelated services.

create table consent_types (
  id bigint generated always as identity primary key,
  key text not null unique,
  category consent_category not null,
  name text not null,
  description text,
  is_required_for_service boolean not null default false,
  is_active boolean not null default true
);

create table consent_grants (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id) on delete cascade,
  consent_type_id bigint not null references consent_types (id),
  status consent_status not null,
  scope jsonb not null default '{}'::jsonb,
  method text not null default 'in_app',
  document_version text,
  effective_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by_person_id bigint references people (id),
  created_at timestamptz not null default now()
);
create index consent_grants_person_idx on consent_grants (person_id, consent_type_id, created_at desc);

-- Documents ---------------------------------------------------------------

create table document_templates (
  id bigint generated always as identity primary key,
  organization_id bigint not null references organizations (id),
  key text not null,
  name text not null,
  is_active boolean not null default true,
  unique (organization_id, key)
);

create table document_versions (
  id bigint generated always as identity primary key,
  template_id bigint not null references document_templates (id) on delete cascade,
  version text not null,
  body_markdown text not null,
  published_at timestamptz,
  unique (template_id, version)
);

create table document_assignments (
  id bigint generated always as identity primary key,
  document_version_id bigint not null references document_versions (id),
  person_id bigint not null references people (id),
  residency_id bigint references residencies (id),
  assigned_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  signature_name text
);
create index document_assignments_person_idx on document_assignments (person_id) where acknowledged_at is null;

-- Audit -------------------------------------------------------------------

create table audit_log (
  id bigint generated always as identity primary key,
  actor_person_id bigint references people (id),
  action text not null,
  entity_table text not null,
  entity_id bigint,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on audit_log (entity_table, entity_id);
create index audit_log_actor_idx on audit_log (actor_person_id, created_at desc);
