-- 0129_domain_vocabulary.sql — P1.2: the canonical Domain & Vocabulary foundation.
--
-- Implements the RATIFIED architecture (docs/architecture/domain-vocabulary-v1.0.md,
-- executive ratification 2026-08-21): eleven canonical operational domains with PERMANENT
-- machine keys and mutable display labels, the sixteen live need_category keys mapped as
-- subcategories (keys byte-identical — NEVER renamed), and an external-mapping table for
-- later interoperability crosswalks.
--
-- Deliberate choices:
--   * Reference tables, NOT a Postgres enum (ratification §1.16 / §17): labels evolve without
--     ALTER TYPE; keys stay permanent by policy + CI guard (scripts/verify-domain-vocabulary.mjs
--     pins seed <-> TypeScript mirror <-> live need_category keys).
--   * Recovery and Community are separate rows — the hard semantic boundary.
--   * Safety and Trauma are deliberately ABSENT: cross-cutting/never-a-domain per ratification.
--   * identification_documents is cross-cutting (domain_key NULL, is_cross_cutting true):
--     nested needs inherit their parent loop's domain; standalone needs get a staff choice.
--   * Reference-data posture mirrors service_types/consent_types: RLS on, authenticated SELECT,
--     no client write policies; plus explicit DML revokes to neutralize 0110's blanket +
--     default-privilege grants (the 0122 pattern).
--   * Domains are a lens over evidence, not evidence (ratification §13); nothing here stores
--     or implies an evidence level.
--
-- ROLLBACK: drop table recoveryos.domain_external_mappings;
--           drop table recoveryos.domain_subcategories;
--           drop table recoveryos.domains;
--   (Safe while nothing references them; later FK consumers must be dropped first.)

set search_path = recoveryos, public;

create table if not exists recoveryos.domains (
  key text primary key,
  participant_label text not null,
  staff_label text not null,
  definition text,
  sort int not null,
  is_active boolean not null default true
);
comment on table recoveryos.domains is
  'Canonical operational domains (RATIFIED v1.0). key is a PERMANENT machine identifier — '
  'never rename; labels are presentation language and may evolve. Recovery and Community are '
  'deliberately separate. No Safety or Trauma domain by executive decision.';

create table if not exists recoveryos.domain_subcategories (
  key text primary key,
  domain_key text references recoveryos.domains (key),
  display_label text not null,
  is_cross_cutting boolean not null default false,
  constraint domain_subcategories_domain_or_crosscutting
    check (is_cross_cutting or domain_key is not null)
);
comment on table recoveryos.domain_subcategories is
  'Operational subcategories under the canonical domains. Keys are byte-identical to the live '
  'navigation_needs.need_category values and are NEVER renamed. A cross-cutting subcategory '
  '(identification_documents) has no fixed domain: nested work inherits the parent loop''s '
  'domain; standalone work gets a human choice.';

create table if not exists recoveryos.domain_external_mappings (
  id bigint generated always as identity primary key,
  domain_key text not null references recoveryos.domains (key),
  system text not null,
  external_code text not null,
  note text,
  unique (domain_key, system, external_code)
);
comment on table recoveryos.domain_external_mappings is
  'RecoveryOS operational crosswalk — program-design inference, not validated equivalence. '
  'Maps canonical domain keys to external systems (NARR, Iowa HHS, DOC, research) for '
  'export-time translation only. A mapping must NEVER auto-trigger eligibility, referral, '
  'risk flags, notification, or any automation (crosswalk governance).';

alter table recoveryos.domains enable row level security;
alter table recoveryos.domain_subcategories enable row level security;
alter table recoveryos.domain_external_mappings enable row level security;

create policy domains_read on recoveryos.domains
  for select to authenticated using (true);
create policy domain_subcategories_read on recoveryos.domain_subcategories
  for select to authenticated using (true);
create policy domain_external_mappings_read on recoveryos.domain_external_mappings
  for select to authenticated using (recoveryos.is_platform_admin());

-- Neutralize 0110's blanket + default-privilege grants: vocabulary changes are migrations,
-- never client writes.
revoke insert, update, delete on recoveryos.domains from anon, authenticated;
revoke insert, update, delete on recoveryos.domain_subcategories from anon, authenticated;
revoke insert, update, delete on recoveryos.domain_external_mappings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed: the ratified canon (labels exactly as ratified 2026-08-21).
-- ---------------------------------------------------------------------------
insert into recoveryos.domains (key, participant_label, staff_label, definition, sort) values
  ('recovery', 'My recovery', 'Recovery',
   'The person''s work of building and sustaining recovery: pathway, recovery goals, practices, coaching, peer recovery support received, circles and meetings, return-to-use support, recovery planning and confidence, recovery-capital development. Never reduced to abstinence; never a catch-all for life needs.', 1),
  ('community', 'My community', 'Community',
   'Belonging, reciprocal connection, and contribution: peer relationships, community participation, GFARC, events, volunteering, mutual support, service to others, leadership.', 2),
  ('housing', 'Housing', 'Housing',
   'Getting and keeping a safe place to live: applications, recovery residence, landlord matters, household stability logistics.', 3),
  ('employment_purpose', 'Work & purpose', 'Employment & Purpose',
   'Employment, income-producing work, vocational steps, and meaningful daily activity or contribution as one''s occupation.', 4),
  ('health', 'Health & wellbeing', 'Health & Wellness',
   'Physical and mental healthcare: treatment connection, MAT/MOUD access, medications, health-related wellness routines.', 5),
  ('family', 'Family & relationships', 'Family & Relationships',
   'Partner, parenting, children, childcare, family repair and reunification, caregiving, household relationships.', 6),
  ('transportation', 'Getting around', 'Transportation',
   'Rides, transit, license and insurance, vehicle access, transport to obligations.', 7),
  ('education', 'Learning & skills', 'Education & Skills',
   'GED and degrees, training and certification, digital skills, study logistics.', 8),
  ('financial_stability', 'Money & basics', 'Financial Stability & Basic Needs',
   'Income supports and benefits, budgeting and debt, food and material basics, phone and internet access.', 9),
  ('justice', 'Legal & courts', 'Justice & Reentry',
   'Court obligations, probation and parole, reentry, record relief, legal aid.', 10),
  ('other', 'Something else', 'Other / Participant-defined',
   'A participant-named need that genuinely fits nowhere else; reviewed periodically for gaps in the canon.', 11)
on conflict (key) do nothing;

insert into recoveryos.domain_subcategories (key, domain_key, display_label, is_cross_cutting) values
  ('recovery_support',         'recovery',            'Recovery support',        false),
  ('social_connection',        'community',           'Social connection',       false),
  ('housing',                  'housing',             'Housing',                 false),
  ('recovery_residence',       'housing',             'Recovery residence',      false),
  ('employment',               'employment_purpose',  'Employment',              false),
  ('treatment_healthcare',     'health',              'Treatment & healthcare',  false),
  ('mental_health',            'health',              'Mental health',           false),
  ('family_childcare',         'family',              'Family & childcare',      false),
  ('transportation',           'transportation',      'Transportation',          false),
  ('education_training',       'education',           'Education & training',    false),
  ('benefits_financial',       'financial_stability', 'Benefits & financial',    false),
  ('food_basic_needs',         'financial_stability', 'Food & basic needs',      false),
  ('digital_access',           'financial_stability', 'Phone & internet access', false),
  ('legal_reentry',            'justice',             'Legal & reentry',         false),
  ('identification_documents', null,                  'ID & documents',          true),
  ('other',                    'other',               'Other',                   false)
on conflict (key) do nothing;

notify pgrst, 'reload schema';
