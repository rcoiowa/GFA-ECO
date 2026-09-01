-- 0200_seed_core_reference.sql
-- Canonical core reference data for RecoveryOS launch, exported from the dev project.
-- Idempotent: natural-key / pinned-id upserts. No participant PII — reference and configuration data only.
-- IDs are pinned (insert ... overriding system value) for organizations, programs, residences,
-- service_types and consent_types because canonical RPCs default to organization_id=1, program_id=1,
-- service_type_id=1 (coaching_session). Sequences are realigned with setval() after each pinned insert.

-- ============================================================
-- organizations (pinned id = 1)
-- ============================================================
insert into recoveryos.organizations (id, name, organization_type, parent_organization_id, is_active, created_at, structure)
overriding system value
values
  (1, 'Grace For Addictions', 'recovery_support', null, true, '2026-07-29 22:00:24.676383+00', null)
on conflict (id) do update set
  name = excluded.name,
  organization_type = excluded.organization_type,
  parent_organization_id = excluded.parent_organization_id,
  is_active = excluded.is_active,
  structure = excluded.structure;

select setval(pg_get_serial_sequence('recoveryos.organizations','id'), greatest((select max(id) from recoveryos.organizations), 1), true);

-- ============================================================
-- programs (pinned ids; id 1 = vrcc)
-- ============================================================
insert into recoveryos.programs (id, organization_id, key, name, description, is_active)
overriding system value
values
  (1, (select id from recoveryos.organizations where name = 'Grace For Addictions'), 'vrcc', 'Virtual Recovery Community Center', 'General recovery-support services: coaching, peer support, navigation, education, and community.', true),
  (2, (select id from recoveryos.organizations where name = 'Grace For Addictions'), 'anchor', 'ANCHOR', 'ANCHOR program participation.', true)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  key = excluded.key,
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active;

select setval(pg_get_serial_sequence('recoveryos.programs','id'), greatest((select max(id) from recoveryos.programs), 1), true);

-- ============================================================
-- residences (pinned ids to match dev; location_id is null in source)
-- ============================================================
insert into recoveryos.residences (
  id, organization_id, location_id, name, address_city, address_state, capacity, is_active, created_at,
  address_street, postal_code, phone, email, population_served, narr_level, narr_certification_status,
  narr_affiliate, shared_room_fee_weekly, private_room_fee_weekly, shared_room_fee_monthly,
  private_room_fee_monthly, accepts_mat, accepts_supervision, public_description, level_of_support,
  commitments, curfew_weeknight)
overriding system value
values
  (1, (select id from recoveryos.organizations where name = 'Grace For Addictions'), null, 'Grace House', 'Des Moines', 'IA', 12, true, '2026-07-29 22:00:24.676383+00',
   '1311 9th Street', '50314', '515-220-8771', 'gracehouse@graceforaddictions.org', 'Women', 'II', 'in_preparation',
   'MCRSP', 175, 200, 650,
   700, true, true, 'Women''s recovery residence operated by Grace For Addictions. Phased program, life & recovery coaching, MAT/MOUD-affirming, all pathways honored.', null,
   '{}'::text[], null),
  (2, (select id from recoveryos.organizations where name = 'Grace For Addictions'), null, 'Ernest & Johnnie White Recovery House', 'Des Moines', 'IA', null, true, '2026-07-30 16:53:06.870896+00',
   '1414 12th Street', '50314', '515-220-8771', 'ejwrh@rcoiowa.org', 'Men', 'II', 'in_preparation',
   -- Monthly fees per the executively ratified EJWRH fee schedule ($650/$750);
   -- earlier 660/760 values were superseded by the ratified Participant & Residency Agreement §5.
   'MCRSP', 175, 200, 650,
   750, true, true, 'Men''s recovery residence with wraparound recovery support services from Grace For Addictions; Iowa DOC approved placement.', null,
   '{}'::text[], null)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  location_id = excluded.location_id,
  name = excluded.name,
  address_city = excluded.address_city,
  address_state = excluded.address_state,
  capacity = excluded.capacity,
  is_active = excluded.is_active,
  address_street = excluded.address_street,
  postal_code = excluded.postal_code,
  phone = excluded.phone,
  email = excluded.email,
  population_served = excluded.population_served,
  narr_level = excluded.narr_level,
  narr_certification_status = excluded.narr_certification_status,
  narr_affiliate = excluded.narr_affiliate,
  shared_room_fee_weekly = excluded.shared_room_fee_weekly,
  private_room_fee_weekly = excluded.private_room_fee_weekly,
  shared_room_fee_monthly = excluded.shared_room_fee_monthly,
  private_room_fee_monthly = excluded.private_room_fee_monthly,
  accepts_mat = excluded.accepts_mat,
  accepts_supervision = excluded.accepts_supervision,
  public_description = excluded.public_description,
  level_of_support = excluded.level_of_support,
  commitments = excluded.commitments,
  curfew_weeknight = excluded.curfew_weeknight;

select setval(pg_get_serial_sequence('recoveryos.residences','id'), greatest((select max(id) from recoveryos.residences), 1), true);

-- ============================================================
-- service_types (pinned ids; coaching_session must be id 1)
-- ============================================================
insert into recoveryos.service_types (id, key, name, category, is_active)
overriding system value
values
  (1, 'coaching_session', 'Recovery coaching session', 'coaching', true),
  (2, 'peer_support', 'Peer support conversation', 'peer_support', true),
  (3, 'mentoring', 'Mentoring session', 'mentoring', true),
  (4, 'accountability', 'Accountability support', 'accountability', true),
  (5, 'recovery_circle', 'Recovery circle', 'recovery_circle', true),
  (6, 'navigation', 'Resource navigation', 'navigation', true),
  (7, 'recovery_capital_assessment', 'Recovery capital assessment', 'assessment', true),
  (8, 'daily_check_in', 'Daily check-in', 'check_in', true),
  (9, 'education_module', 'Educational content', 'education', true),
  (10, 'recovery_practice', 'Recovery practice', 'practice', true),
  (11, 'support_request', 'Support request', 'support_request', true),
  (12, 'community_event', 'Community event', 'event', true)
on conflict (id) do update set
  key = excluded.key,
  name = excluded.name,
  category = excluded.category,
  is_active = excluded.is_active;

select setval(pg_get_serial_sequence('recoveryos.service_types','id'), greatest((select max(id) from recoveryos.service_types), 1), true);

-- ============================================================
-- consent_types (pinned ids to match dev)
-- ============================================================
insert into recoveryos.consent_types (id, key, category, name, description, is_required_for_service, is_active)
overriding system value
values
  (1, 'terms_of_use', 'account_identity'::recoveryos.consent_category, 'Terms of use and privacy notice', 'How RecoveryOS stores and protects your information.', true, true),
  (2, 'service_participation', 'service_participation'::recoveryos.consent_category, 'Participation in recovery-support services', 'Consent to receive VRCC recovery-support services.', true, true),
  (3, 'coaching', 'coaching'::recoveryos.consent_category, 'Recovery coaching', 'Consent to work with a recovery coach and share goals with them.', false, true),
  (4, 'resource_navigation', 'resource_navigation'::recoveryos.consent_category, 'Resource navigation', 'Consent to work with a navigator and share resource needs.', false, true),
  (5, 'recovery_assessments', 'recovery_assessments'::recoveryos.consent_category, 'Recovery assessments', 'Consent to complete recovery capital and related assessments.', false, true),
  (6, 'communications', 'communications'::recoveryos.consent_category, 'Messages and reminders', 'Consent to receive appointment reminders and program messages.', false, true),
  (7, 'ai_features', 'ai_features'::recoveryos.consent_category, 'Grace AI features', 'Consent to use Grace AI. Optional — declining never limits other services.', false, true),
  (8, 'analytics', 'analytics'::recoveryos.consent_category, 'De-identified program improvement analytics', 'Consent to include de-identified information in program improvement analysis.', false, true)
on conflict (id) do update set
  key = excluded.key,
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  is_required_for_service = excluded.is_required_for_service,
  is_active = excluded.is_active;

select setval(pg_get_serial_sequence('recoveryos.consent_types','id'), greatest((select max(id) from recoveryos.consent_types), 1), true);

-- ============================================================
-- curfew_schedules (residence resolved by name; unique (residence_id, day_of_week))
-- ============================================================
insert into recoveryos.curfew_schedules (residence_id, day_of_week, curfew_time)
select r.id, v.dow, v.ct::time
from (values (0, '22:00:00'), (1, '22:00:00'), (2, '22:00:00'), (3, '22:00:00'), (4, '22:00:00'), (5, '22:00:00'), (6, '22:00:00')) as v(dow, ct)
join recoveryos.residences r on r.name = 'Grace House'
on conflict (residence_id, day_of_week) do update set curfew_time = excluded.curfew_time;

-- ============================================================
-- residence_chores (residence resolved by name; natural key (residence_id, name) via where-not-exists)
-- ============================================================
insert into recoveryos.residence_chores (residence_id, name, description, is_active)
select r.id, v.name, v.description, v.is_active
from (values
  ('Kitchen reset', 'Dishes done, counters wiped, floor swept after dinner', true),
  ('Common room tidy', 'Straighten furniture, clear surfaces, take out recycling', true)
) as v(name, description, is_active)
join recoveryos.residences r on r.name = 'Grace House'
where not exists (
  select 1 from recoveryos.residence_chores c
  where c.residence_id = r.id and c.name = v.name
);

update recoveryos.residence_chores c
set description = v.description, is_active = v.is_active
from (values
  ('Kitchen reset', 'Dishes done, counters wiped, floor swept after dinner', true),
  ('Common room tidy', 'Straighten furniture, clear surfaces, take out recycling', true)
) as v(name, description, is_active),
recoveryos.residences r
where r.name = 'Grace House' and c.residence_id = r.id and c.name = v.name;

-- ============================================================
-- document_templates (natural key (organization_id, key); org resolved by name)
-- ============================================================
insert into recoveryos.document_templates (organization_id, key, name, is_active, requires_signature)
select o.id, v.key, v.name, v.is_active, v.requires_signature
from (values
  ('participant_agreement', 'Participant Agreement', true, true),
  ('code_of_conduct', 'Code of Conduct', true, true),
  ('resident_handbook', 'Resident Handbook', true, true),
  ('fee_schedule_financial_agreement', 'Fee Schedule & Financial Agreement', true, true),
  ('screening_policy_consent', 'Drug & Alcohol Screening Policy & Consent', true, true),
  ('medication_mat_moud_policy', 'Medication & MAT/MOUD Policy', true, true),
  ('curfew_pass_policy', 'Curfew & Pass Policy + Request Form', true, false),
  ('return_to_use_response_policy', 'Return-to-Use Response Policy', true, true),
  ('grievance_policy_form', 'Grievance Procedure & Form', true, false),
  ('incident_report_system', 'Incident Report System', true, false),
  ('emergency_response_protocols', 'Emergency Response Protocols', true, false),
  ('good_neighbor_policy', 'Good Neighbor Policy', true, true),
  ('exit_transition_policy', 'Exit & Transition Policy', true, false),
  ('code_of_ethics', 'Code of Ethics — Staff, House Leads, Peer Mentors & Volunteers', true, false),
  ('change_course_leaders_policy', 'Change Course Leaders Policy (Partner Program)', true, false),
  ('narr_ii_self_assessment', 'NARR Level II Self-Assessment & Iowa HHS Alignment', true, false),
  ('form_application_prescreening', 'Application & Pre-Screening Form', true, false),
  ('intake_forms_package', 'Intake Forms Package', true, false),
  ('complete_operational_system', 'Complete Operational System (Staff Manual)', true, false),
  ('resident_rights', 'Resident Rights & Responsibilities', true, false)
) as v(key, name, is_active, requires_signature)
cross join (select id from recoveryos.organizations where name = 'Grace For Addictions') o
on conflict (organization_id, key) do update set
  name = excluded.name,
  is_active = excluded.is_active,
  requires_signature = excluded.requires_signature;

-- ============================================================
-- document_versions (natural key (template_id, version); template resolved by (org, key))
-- body_markdown preserved exactly from the dev project.
-- ============================================================
insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', E'# Curfew & Pass Policy + Request Form\n\n*Version 2.0 — Grace For Addictions.*\\n\\nThe full text of this document is maintained in the canonical RecoveryOS library (packages/residence-content, rendered in full in the VRCC app; printable copy at docs/residence-documents/curfew_pass_policy.md; authoritative source at docs/source-documents/grace-house/). This row pins the published version for assignment and audit records.', '2026-07-30 16:54:07.316791+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'curfew_pass_policy' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.0', E'# Grievance Procedure & Form\n\n*Version 1.0 — Grace For Addictions.*\\n\\nThe full text of this document is maintained in the canonical RecoveryOS library (packages/residence-content, rendered in full in the VRCC app; printable copy at docs/residence-documents/grievance_policy_form.md; authoritative source at docs/source-documents/grace-house/). This row pins the published version for assignment and audit records.', '2026-07-30 16:54:07.316791+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'grievance_policy_form' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.0', E'# Incident Report System\n\n*Version 1.0 — Grace For Addictions.*\\n\\nThe full text of this document is maintained in the canonical RecoveryOS library (packages/residence-content, rendered in full in the VRCC app; printable copy at docs/residence-documents/incident_report_system.md; authoritative source at docs/source-documents/grace-house/). This row pins the published version for assignment and audit records.', '2026-07-30 16:54:07.316791+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'incident_report_system' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.0', E'# Emergency Response Protocols\n\n*Version 1.0 — Grace For Addictions.*\\n\\nThe full text of this document is maintained in the canonical RecoveryOS library (packages/residence-content, rendered in full in the VRCC app; printable copy at docs/residence-documents/emergency_response_protocols.md; authoritative source at docs/source-documents/grace-house/). This row pins the published version for assignment and audit records.', '2026-07-30 16:54:07.316791+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'emergency_response_protocols' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', E'# Exit & Transition Policy\n\n*Version 2.0 — Grace For Addictions.*\\n\\nThe full text of this document is maintained in the canonical RecoveryOS library (packages/residence-content, rendered in full in the VRCC app; printable copy at docs/residence-documents/exit_transition_policy.md; authoritative source at docs/source-documents/grace-house/). This row pins the published version for assignment and audit records.', '2026-07-30 16:54:07.316791+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'exit_transition_policy' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', E'# Code of Ethics — Staff, House Leads, Peer Mentors & Volunteers\n\n*Version 2.0 — Grace For Addictions.*\\n\\nThe full text of this document is maintained in the canonical RecoveryOS library (packages/residence-content, rendered in full in the VRCC app; printable copy at docs/residence-documents/code_of_ethics.md; authoritative source at docs/source-documents/grace-house/). This row pins the published version for assignment and audit records.', '2026-07-30 16:54:07.316791+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'code_of_ethics' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.2', E'# Change Course Leaders Policy (Partner Program)\n\n*Version 2.2 — Grace For Addictions.*\\n\\nThe full text of this document is maintained in the canonical RecoveryOS library (packages/residence-content, rendered in full in the VRCC app; printable copy at docs/residence-documents/change_course_leaders_policy.md; authoritative source at docs/source-documents/grace-house/). This row pins the published version for assignment and audit records.', '2026-07-30 16:54:07.316791+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'change_course_leaders_policy' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', E'# NARR Level II Self-Assessment & Iowa HHS Alignment\n\n*Version 2.0 — Grace For Addictions.*\\n\\nThe full text of this document is maintained in the canonical RecoveryOS library (packages/residence-content, rendered in full in the VRCC app; printable copy at docs/residence-documents/narr_ii_self_assessment.md; authoritative source at docs/source-documents/grace-house/). This row pins the published version for assignment and audit records.', '2026-07-30 16:54:07.316791+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'narr_ii_self_assessment' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', E'# Application & Pre-Screening Form\n\n*Version 2.0 — Grace For Addictions.*\\n\\nThe full text of this document is maintained in the canonical RecoveryOS library (packages/residence-content, rendered in full in the VRCC app; printable copy at docs/residence-documents/form_application_prescreening.md; authoritative source at docs/source-documents/grace-house/). This row pins the published version for assignment and audit records.', '2026-07-30 16:54:07.316791+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'form_application_prescreening' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.0', E'# Intake Forms Package\n\n*Version 1.0 — Grace For Addictions.*\\n\\nThe full text of this document is maintained in the canonical RecoveryOS library (packages/residence-content, rendered in full in the VRCC app; printable copy at docs/residence-documents/intake_forms_package.md; authoritative source at docs/source-documents/grace-house/). This row pins the published version for assignment and audit records.', '2026-07-30 16:54:07.316791+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'intake_forms_package' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', E'# Complete Operational System (Staff Manual)\n\n*Version 2.0 — Grace For Addictions.*\\n\\nThe full text of this document is maintained in the canonical RecoveryOS library (packages/residence-content, rendered in full in the VRCC app; printable copy at docs/residence-documents/complete_operational_system.md; authoritative source at docs/source-documents/grace-house/). This row pins the published version for assignment and audit records.', '2026-07-30 16:54:07.316791+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'complete_operational_system' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;
insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', '# Fee Schedule & Financial Agreement

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Current Fee Schedule (Policy GH-FEES-001)

| Room type | Weekly rate | Monthly prepay (due at start of month) |
| --- | --- | --- |
| Shared (double) room | $175 / week | $650 / month |
| Single (private) room | $200 / week | $700 / month |

Program fees cover housing, utilities, household supplies, and program participation. Grace House is a program participation fee model — not a landlord-tenant lease.

## My Agreement

My room type: [ ] Shared — $175/wk or $650/mo prepay [ ] Single — $200/wk or $700/mo prepay

Payment cadence: [ ] Weekly, due each ______________ (day) [ ] Monthly prepay, due the 1st

Payment methods: [ ] Cash [ ] Money order [ ] Electronic transfer (details from House Manager)

I understand and agree:

- Fees are due on the agreed day. If I anticipate difficulty, I will speak with the House Manager before the due date — hardship payment plans are always available and never punitive.

- Non-payment for more than 7 days without an approved plan may begin an administrative review.

- Fees are non-refundable for the current period except in emergency or administrative error.

- Grace House never manages, holds, or controls my personal finances.

- My fee continues during an approved furlough (my bed is held).

## Payment Record

| Date | Amount | Method | Period covered | Receipt # | Staff initials |
| --- | --- | --- | --- | --- | --- |
| ______ | $______ | ________ | ____________ | ________ | ______ |
| ______ | $______ | ________ | ____________ | ________ | ______ |
| ______ | $______ | ________ | ____________ | ________ | ______ |

Participant signature: ______________________________ Date: ____/____/______

House Manager signature: ______________________________ Date: ____/____/______
', '2026-07-30 16:54:48.680783+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'fee_schedule_financial_agreement' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', '# Drug & Alcohol Screening Policy & Consent

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Purpose

Screening protects the substance-free environment every resident depends on. It is a community-safety tool, not a surveillance or punishment tool.

## Schedule

- Phase 1 (Days 1–30): upon intake, then randomly up to twice weekly.

- Phase 2 (Days 31–90): once weekly (random day).

- Phase 3 (Days 91+): randomly, minimum once monthly.

- For cause: at any time based on observable, documented indicators.

- Return-to-use follow-up: per the individualized support plan.

## Standards

- Same-gender observation only where observation is used; dignity preserved at every step.

- Prescribed MAT/MOUD and disclosed prescriptions are recorded as prescription-consistent — never as violations (see Medication Policy).

- A refused screen is treated as a positive result.

- A positive result triggers the Return-to-Use Response Policy — a support conversation and safety assessment, not automatic discharge.

- Results are confidential: House Manager and Executive Director access only; stored in the locked/encrypted resident file; retained per records policy.

## Screening Log Entry (per event)

Resident: ______________ Date: ______ Time: ______ Type: [ ] scheduled [ ] random [ ] for cause [ ] follow-up

Method: [ ] urine dipstick [ ] lab [ ] oral swab [ ] breathalyzer Result: [ ] negative [ ] prescription-consistent [ ] positive [ ] refused [ ] invalid

Substances (if any): ______________ Resident acknowledgment: __________ Staff: __________

## Consent

I consent to drug and alcohol screening according to this policy. I understand refusal is treated as a positive result, that my prescribed medications are protected, and that a positive result initiates a supportive response process.

Participant signature: ______________________________ Date: ____/____/______
', '2026-07-30 16:54:48.680783+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'screening_policy_consent' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', '# Medication & MAT/MOUD Policy

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Policy Statement

Grace House affirms and supports all FDA-approved medications for substance use disorders and mental health conditions, including methadone, buprenorphine/naloxone (Suboxone), naltrexone (Vivitrol), and all prescribed psychiatric medications. Taking prescribed medication as directed is never a program violation, never grounds for exclusion, and never treated as “not really being in recovery.” (Iowa HHS Checklist Item 6; NARR Standard: multiple pathways.)

## Participant Responsibilities

- Disclose all prescription medications to the House Manager at intake and whenever prescriptions change.

- Store all medications in your personal lockbox or the house medication safe. Controlled medications must be stored in the house safe with a logged count.

- Take medications only as prescribed; never share medication with any other resident — sharing is an immediate-removal safety violation.

- Dispose of expired/discontinued medication through the House Manager (take-back protocol).

## Medication Disclosure Log

| Medication | Dosage | Prescriber | Pharmacy | Storage (lockbox/safe) |
| --- | --- | --- | --- | --- |
| ____________ | ________ | ____________ | ____________ | ________ |
| ____________ | ________ | ____________ | ____________ | ________ |
| ____________ | ________ | ____________ | ____________ | ________ |
| ____________ | ________ | ____________ | ____________ | ________ |

## Controlled Medication Count Log (house safe)

| Date | Medication | Count in | Count verified | Resident initials | Staff initials |
| --- | --- | --- | --- | --- | --- |
| ______ | ____________ | ______ | ______ | ______ | ______ |
| ______ | ____________ | ______ | ______ | ______ | ______ |

## Drug Screening Interaction

Prescribed MAT/MOUD medications that appear on a drug screen are recorded as prescription-consistent results, not positives. Verification is by prescriber confirmation on file.

Participant signature: ______________________________ Date: ____/____/______

House Manager signature: ______________________________ Date: ____/____/______
', '2026-07-30 16:54:48.680783+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'medication_mat_moud_policy' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', '# Return-to-Use Response Policy

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Principle

A return to use is a medical and recovery event — not a moral failure and not automatic discharge. Grace House responds with safety first, dignity always, and an individualized plan.

## Immediate Response

- Safety assessment: Is the participant medically stable? If in doubt, call 911. Naloxone locations are posted; any suspected overdose follows the Emergency Response Protocols.

- Substance removal: any substances on the property are removed and disposed of.

- Private conversation: one-on-one, non-judgmental. “What do you need right now?”

- Community protection: other residents’ safety and recovery are assessed and protected.

## Individualized Support Pathways (chosen by assessment, not formula)

- Remain in residence with an intensified support plan (increased coach contact, added recovery activities, follow-up screening).

- Brief clinical stabilization (detox/withdrawal management) with the bed held where possible and a warm handoff both directions.

- Transition to a higher level of care with a documented re-entry pathway.

## Considerations for Removal

Removal is considered only when a participant refuses to engage with support after a return to use, continues active use, brings substances into the residence, or endangers another resident’s life or recovery. Any removal follows the canonical removal standard and is documented, reviewable through the grievance process, and carried out with dignity — including connection to alternative housing or care whenever possible.

## Documentation

Date/discovery method · participant’s account and stated needs · safety assessment · support plan and referrals · follow-up timeline. Confidential file; incident report if safety events occurred.

Acknowledged (participant): ______________________________ Date: ____/____/______
', '2026-07-30 16:54:48.680783+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'return_to_use_response_policy' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', '# Good Neighbor Policy

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Our Commitment

Grace House succeeds when our neighborhood trusts us. We commit to being among the best-kept, quietest, most considerate homes on the block. (NARR Standard: good neighbor practices.)

## Standards

- Property appearance: lawn, porch, and walkways maintained weekly; trash and bins managed on schedule; the house looks like every other well-kept home on the street.

- Noise: quiet hours 10:00 PM–7:00 AM daily; outdoor conversations moved inside after dark; no amplified sound outdoors.

- Parking: residents and guests park considerately — never blocking driveways, sidewalks, or accumulating vehicles.

- Smoking: designated rear area only; never on the front porch or sidewalk; containers emptied daily.

- Guests: visitor policy applies; gatherings stay indoors and within noise standards.

- Neighbor concerns: any neighbor may contact the House Manager (515-220-8771). Concerns are acknowledged within 24 hours, addressed promptly, and logged.

## Neighbor Concern Log

| Date | Concern | Received by | Action taken | Resolved (date) |
| --- | --- | --- | --- | --- |
| ______ | ____________________ | __________ | ____________________ | ______ |
| ______ | ____________________ | __________ | ____________________ | ______ |

Resident acknowledgment: ______________________________ Date: ____/____/______
', '2026-07-30 16:54:48.680783+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'good_neighbor_policy' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;
insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', '# Grace House Participant Agreement

This is a program participation agreement, not a residential lease.

Grace For Addictions · 1311 9th Street, Des Moines, Iowa 50314 Office: 515-220-8771 · gracehouse@graceforaddictions.org

Version 2.0. Print-ready and fillable — complete on paper or type directly into this document.

Grace House Participant Agreement

> About This Agreement
> This Agreement is between you and Grace House, operated by Grace For Addictions.
> It outlines the terms and expectations of your residency.
> Please read it carefully. Ask questions about anything that is unclear before signing.
> Signing this agreement is a mutual commitment — we commit to you as you commit to us.
> This agreement does not waive any of your rights as a resident.

RESIDENT NAME: ____________________________________

DATE OF BIRTH: ____________________________________

ADMISSION DATE: ____________________________________

ASSIGNED ROOM/BED: ____________________________________

Part 1: Program Fees and Financial Agreement

Fee schedule per Policy GH-FEES-001 (current).

| Room type | Weekly rate | Monthly prepay (due at start of month) |
| --- | --- | --- |
| Shared (double) room | $175 / week | $650 / month |
| Single (private) room | $200 / week | $700 / month |

My room type: ____________ My rate: $_______ (__ weekly / __ monthly prepay), due every _____________ (day of week, or first of month for monthly prepay).

Payment Methods Accepted:

[ ] Cash

[ ] Money order

[ ] Electronic transfer (details provided by House Manager)

I understand and agree that:

- Program fees are due on the agreed day each week. Late fees or payment plans must be arranged in advance with the House Manager.

- Non-payment of fees for more than 7 days, without an approved payment plan, may result in an administrative discharge process.

- Program fees are non-refundable for the current period, except in cases of emergency or administrative error.

- Grace House does not manage, hold, or control my personal finances.

- I am responsible for maintaining my own financial accounts and obligations.

Part 2: Recovery Participation Agreement

I agree to actively engage in my recovery while living at Grace House. I understand this means:

- Completing an Individual Recovery Plan within 72 hours of intake.

- Reviewing my IRP with the House Manager or peer mentor at 30, 60, and 90 days, and every 90 days thereafter.

- Participating in the required number of recovery support activities each week for my current phase: 4 per week in Phase 1, 3 per week in Phase 2, and 2 per week in Phase 3. Qualifying activities include 12-step meetings, SMART Recovery, Celebrate Recovery, individual therapy, sessions with my life or recovery coach, church or worship services, Bible study, the Tuesday GFA Recovery Community (GFARC) gathering, and other community-based recovery activities. I understand the weekly house meeting does not count toward this total.

- Selecting a life coach or recovery coach at intake, completing daily check-ins through the VRCC app in every phase, and attending coaching sessions weekly in Phase 1, biweekly in Phase 2, and monthly in Phase 3.

- Attending the weekly Grace House community meeting.

- Engaging in employment, education, job training, volunteering, or caregiving at least 30 hours per week by Day 30 (Policy GH-ACTIVITY-001). Exceptions may be approved by the House Manager for medical or other documented reasons.

Part 3: Substance-Free Agreement

I understand that Grace House is a substance-free environment. I agree:

- I will not use alcohol or illegal substances while living at Grace House, whether on or off the property.

- I will not bring alcohol, illegal substances, or non-prescribed medications onto the Grace House property at any time.

- I will submit to drug testing according to the house testing schedule, including random tests.

- I understand that refusing a drug test is treated the same as a positive result.

- I understand that my use of prescribed MAT medications (buprenorphine, methadone, naltrexone, etc.) does not constitute a violation of this policy.

Part 4: Community Expectations Agreement

I agree to contribute to a safe, healthy, and respectful household. Specifically, I agree to:

- Treat all residents, staff, guests, and neighbors with dignity and respect at all times.

- Complete my assigned household chores as scheduled.

- Maintain my personal space in a clean and orderly condition.

- Respect the privacy of all other residents.

- Honor quiet hours as posted.

- Follow the visitors policy, including visitor hours and the prohibition on overnight guests in bedrooms.

- Follow the curfew schedule for my current phase of residency.

- Report any safety concerns to the House Manager promptly.

Part 5: Medication Agreement

I understand and agree that:

- All prescription medications must be disclosed to the House Manager at intake and whenever new prescriptions are obtained.

- All medications will be stored in my personal lockbox or the house medication safe.

- I will not share my medications with any other resident.

- I will provide documentation from my prescribing provider for all controlled substances.

Part 6: Confidentiality Agreement

I understand that the privacy of every person in this household is sacred. I agree:

- I will not share personal information about other residents outside the house.

- I will not post photos or identifying information about other residents on social media.

- I will honor the confidentiality of what is shared in house meetings and peer conversations.

Part 7: Departure Agreement

I agree to provide a minimum of 14 days'' written notice before voluntarily departing Grace House. I understand that:

- If I choose to leave without notice, I forfeit any claim to a refund for the current payment period.

- My personal belongings must be removed within 24 hours of my departure.

- I am welcome to return to Grace House community events and support as an alum.

- If I depart for a higher level of care, I am encouraged to apply for readmission when ready.

Part 8: Grievance Rights Acknowledgment

I understand that I have the right to file a formal grievance if I believe my rights have been violated or a policy has been applied unfairly. I understand:

- The grievance process is described in the Resident Handbook.

- I will not face retaliation for filing a grievance in good faith.

- I may also access external agencies including the Iowa Civil Rights Commission and HUD.

Part 9: Resident Rights Acknowledgment

I acknowledge that I have received, reviewed, and understand my Resident Rights as described in the Grace House Resident Handbook. I understand that these rights cannot be waived or removed as a condition of residency.

Part 10: Emergency and Safety Acknowledgment

I acknowledge that:

- Grace House has naloxone (Narcan) available and I have received or will receive training in its use within 7 days of intake.

- Iowa''s Good Samaritan law protects me from prosecution if I call for help during an overdose emergency.

- Emergency numbers are posted in the common areas of the house.

- I will call 911 in any situation that involves a medical emergency, fire, or imminent safety threat.

Part 11: Mutual Commitment

By signing this agreement, Grace For Addictions commits to:

- Treating you with dignity, respect, and compassion at every stage of your recovery.

- Providing a safe, clean, and supportive home environment.

- Supporting your chosen recovery pathway without judgment or coercion.

- Being transparent about policies, decisions, and any changes that affect your residency.

- Responding to your needs, concerns, and grievances in a timely and fair manner.

- Celebrating your growth and walking with you through the hard days as well as the victories.

SIGNATURES

By signing below, I certify that I have read, understand, and agree to all provisions of this Participant Agreement. I have had the opportunity to ask questions and have received answers that satisfy me. I enter into this agreement freely and voluntarily.

| Resident Signature | Date |
| --- | --- |

| Resident Printed Name | Admission Date |
| --- | --- |

| House Manager Signature | Date |
| --- | --- |

| House Manager Printed Name | Title |
| --- | --- |

On behalf of Grace For Addictions, 1311 9th Street, Des Moines, Iowa 50314

thomas@graceforaddictions.org | 515-336-0006

> A Note From Thomas DeGarmeaux, Executive Director
> This agreement is not a contract of compliance — it is a covenant of community.
> Every policy in it was written with your dignity in mind.
> We believe in you. We are honored you chose Grace House.
> When this season of your life is over, we hope you will look back and say that this place helped you become more fully yourself.
> Our door is always open.
> — Thomas DeGarmeaux, Founder & Executive Director, Grace For Addictions
', '2026-07-30 16:55:25.43217+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'participant_agreement' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;
insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.0', '# GRACE FOR ADDICTIONS

## Grace House Code of Conduct

Effective Date: February 3, 2026  
Version: 1.0

## OUR FOUNDATION

Grace House is built on principles of grace, dignity, community, hope, and multiple pathways to recovery. This Code of Conduct guides our shared life together and ensures a safe, supportive environment where everyone can thrive in their recovery journey.

Our Commitment: - We treat each person with respect and honor - We believe in accountability with compassion - We support each other’s recovery - We maintain a safe, sober, and peaceful home

## CORE VALUES IN ACTION

### GRACE

We believe in second chances and new beginnings. Mistakes are opportunities for growth, not reasons for shame.

### DIGNITY

Every person deserves to be treated with respect, regardless of their past or their struggles.

### COMMUNITY

Recovery happens in relationship. We support each other, celebrate victories together, and walk through challenges side-by-side.

### HOPE

Lasting change is possible. We believe in each person’s capacity for transformation.

### MULTIPLE PATHWAYS

We honor each person’s unique recovery journey and respect diverse approaches to wellness.

## NON-NEGOTIABLE SAFETY STANDARDS

The following behaviors create immediate danger and may result in immediate removal from Grace House:

### ❌ VIOLENCE & THREATS

- Physical violence or assault toward any person

- Threats of violence or intimidation

- Weapons of any kind on property (guns, knives, dangerous objects)

### ❌ SUBSTANCES & PROPERTY VIOLATIONS

- Bringing alcohol or illicit substances onto the property

- Possession of drug paraphernalia

- Selling, sharing, or distributing substances to others

- Theft or deliberate destruction of property

### ❌ SEXUAL MISCONDUCT & HARASSMENT

- Sexual harassment, assault, or coercive behavior

- Non-consensual physical contact

- Creating a sexually hostile environment

### ❌ ENDANGERMENT

- Behaviors that create serious, ongoing risk to self or others

- Refusing to follow safety protocols during emergencies

- Intentionally putting others at risk

These are non-negotiable because they compromise the safety of our community.

## SOBRIETY & RECOVERY EXPECTATIONS

### ✅ SUBSTANCE-FREE LIVING

- Grace House is an alcohol-free and illicit substance-free environment

- All residents commit to abstaining from alcohol and non-prescribed substances

- If you experience a return to use, tell someone immediately — we will support you, not shame you

### ✅ MEDICATIONS ARE SUPPORTED

- All FDA-approved medications are permitted and encouraged

- This includes Medication for Opioid Use Disorder (MOUD): methadone, buprenorphine (Suboxone), naltrexone (Vivitrol)

- Mental health medications are fully supported

- Medications must be prescribed by a licensed provider

- Follow medication storage guidelines (see House Manager)

### ✅ ACTIVE RECOVERY ENGAGEMENT

- Participate in at least 3 recovery support activities per week

- Peer support groups

- Mutual aid meetings (AA, NA, SMART Recovery, etc.)

- Individual counseling/therapy

- Faith-based recovery (if chosen)

- Other recovery activities approved by staff

- Attend required house meetings (weekly — Thursdays at 7:00 PM)

- Meet regularly with your peer coach (frequency varies by program phase)

### ✅ TREATMENT CHOICE IS YOURS

- You may seek clinical treatment from any provider you choose

- You are not required to use a specific treatment program or counselor

- We will support you in accessing the care you need

## DAILY LIVING EXPECTATIONS

### 🏠 HOUSE CARE & RESPONSIBILITIES

Personal Space: - Keep your bedroom clean and organized - Respect roommate’s space and belongings (if shared room) - No eating or storing open food in bedrooms (to prevent pests) - Do laundry regularly and put away clean clothes

Shared Spaces: - Clean up after yourself immediately in kitchen, bathrooms, and common areas - Complete your assigned chores on schedule - Return shared items to their proper place - Report maintenance issues to House Manager

Your Assigned Chores: Assigned at move-in and rotated monthly

Chore Schedule: Posted in the kitchen common area and updated each rotation

### 🕐 SCHEDULE & ATTENDANCE

Curfew: - Weeknight curfew: 10:00 PM (Sunday–Thursday) - Weekend curfew: 11:00 PM (Friday–Saturday) - Curfew extensions for work, medical appointments, or recovery activities: request from the House Manager with at least 24 hours’ notice - Overnight passes: available after 60 days of residency in good standing; submit a written request 48 hours in advance including location and host name - More than three curfew violations in a 30-day period results in a community accountability conversation and a possible curfew reset — restorative, not punitive

House Meetings: - Mandatory attendance: Thursdays at 7:00 PM - If you must miss, notify House Manager in advance

Sign-In/Sign-Out: - Use the sign-out sheet by the front door when leaving the property - Include: time left, destination, expected return

Notify Staff If: - You’ll be late for curfew - You need to miss a house meeting - Your schedule changes - You’ll be away overnight (requires advance approval)

### 👥 VISITORS & GUESTS

Visitor Rules: - All visitors must be pre-approved by House Manager - No visitors who are actively using substances - Visitor hours: Monday–Thursday 10:00 AM–9:00 PM; Friday–Saturday 10:00 AM–10:00 PM; Sunday 12:00 PM–8:00 PM - Visitors must remain in common areas (living room, kitchen) - No visitors in bedrooms at any time - No overnight guests without advance approval

Your responsibility: Ensure your visitors respect house rules and other residents

### 💼 EMPLOYMENT, EDUCATION, VOLUNTEER WORK

Phase 2 and 3 Residents: - Expected to be engaged in employment, education, or volunteer work - Actively engaged weekdays 9:00 AM–4:00 PM in employment, education, job training, volunteering, or scheduled appointments (exceptions require House Manager approval) - If unemployed, actively seeking work (documented job applications) - Keep House Manager informed of work schedule

Exceptions may be made for: - Intensive outpatient treatment - Medical conditions (with documentation) - Short-term transition periods (discussed with House Manager)

### 💰 FINANCIAL RESPONSIBILITIES

Weekly Program Fee: - Amount: $________ per week - Due: Every Friday - Payment methods: Cash, money order, or electronic transfer - Late arrangement: Speak with the House Manager BEFORE the due date if you need a payment plan. Fees unpaid more than 7 days without an approved plan begin an administrative review.

What to do if you can’t pay: - Talk to House Manager immediately — before you fall behind - We will work with you on payment plan or hardship accommodation - Do not avoid staff or hide financial difficulty

## COMMUNICATION & RESPECT

### ✅ RESPECTFUL COMMUNICATION

- Use kind, respectful language with all residents and staff

- No yelling, name-calling, or verbal abuse

- Address conflicts directly and calmly (ask staff for support if needed)

- Practice active listening

### ✅ CONFIDENTIALITY

- What you hear here, stays here; what you see here, stays here

- Do not share other residents’ personal information, stories, or struggles outside Grace House

- Do not post about others on social media without their consent

- Respect others’ privacy

### ✅ BOUNDARIES

- Knock before entering others’ rooms

- Ask permission before borrowing items

- Respect “no” — if someone sets a boundary, honor it

- No romantic or sexual relationships between residents

- Report boundary violations to staff

### ✅ INCLUSIVE COMMUNITY

- Welcome and respect people of all backgrounds

- No discrimination based on race, ethnicity, religion, gender identity, sexual orientation, age, or disability

- Challenge your own biases; be willing to learn and grow

- Create a culture where everyone feels they belong

## HEALTH, SAFETY & SELF-CARE

### 🩺 PERSONAL HEALTH & HYGIENE

- Shower/bathe daily

- Wash hands before meals and after using bathroom

- Do laundry weekly (clean clothes and bedding)

- Keep personal space clean to prevent illness

- If you’re sick, take precautions to avoid spreading illness

### 🚨 EMERGENCY PROTOCOLS

- Know where fire exits are located (see posted map)

- Know where naloxone (Narcan) is stored

- Know how to call for help (see posted emergency numbers)

- Participate in fire drills and safety training

- Follow staff instructions during emergencies

### 🧘 SELF-CARE & WELLNESS

- Attend medical and mental health appointments

- Take medications as prescribed

- Get adequate sleep (quiet hours: 10:00 PM to 7:00 AM (11:00 PM to 7:00 AM on weekends))

- Eat nutritious meals

- Engage in healthy activities (exercise, hobbies, social connection)

## TECHNOLOGY & MEDIA USE

### 📱 GUIDELINES

- Use headphones when listening to music, videos, or games

- No loud phone conversations during quiet hours

- Charge devices in your own space (do not monopolize common area outlets)

- No inappropriate content (pornography, glorifying substance use, violent content)

### 📷 PHOTOGRAPHY & SOCIAL MEDIA

- Do not photograph or record others without their consent

- Do not share photos/videos of Grace House or other residents publicly without permission

- Be mindful of your social media use — avoid content that undermines your recovery

- No live streaming from Grace House

## ACCOUNTABILITY & PROGRESSIVE DISCIPLINE

Our approach is grace-centered and focused on growth, not punishment.

### HOW ACCOUNTABILITY WORKS

Level 1: Verbal Conversation - Informal, supportive discussion about concern - Understanding what happened - Agreement on plan moving forward - Documentation in your file

Level 2: Written Warning - Formal written notice - Specific expectation that needs to be met - Timeline for improvement - Increased check-ins - Copy provided to you

Level 3: Accountability Meeting - Meeting with House Manager and peer coach - Review of concerns - Development of accountability plan - May include: - Temporary restrictions (e.g., earlier curfew, increased check-ins) - Return to Phase 1 support structure - Additional recovery support requirements - Increased supervision

Level 4: Housing Review - Care team meeting (you’re invited to participate) - Discussion of whether Grace House is still the right fit - Options may include: - Continued residence with maximum support - Transition to higher level of care (treatment, clinical program) - Voluntary exit with warm handoff to alternative housing - Involuntary discharge (only if safety concern persists)

## RELAPSE RESPONSE POLICY

Return to use is not automatic grounds for discharge. We work WITH you, not against you.

### IF YOU USE SUBSTANCES:

- Tell someone immediately — your safety is our priority

- We will assess your medical needs (may call 911 if necessary)

- Together, we’ll determine next steps:

- Stay with increased support

- Temporary return to treatment/detox with plan to return

- Adjust your recovery plan

- Additional resources and connection

### YOU WILL NOT BE AUTOMATICALLY KICKED OUT

Discharge for return to use is considered only if: - You refuse to engage with support after return to use - You repeatedly bring substances onto property - Your use creates imminent danger to community - You’re unable to maintain sobriety despite all available support

Grace means second chances. And third. And fourth.

## YOUR RIGHTS

### AS A GRACE HOUSE RESIDENT, YOU HAVE THE RIGHT TO:

- ✅ Be treated with dignity and respect

- ✅ Privacy in your personal space

- ✅ Choose your own treatment providers

- ✅ Take all prescribed medications (including MOUD)

- ✅ Practice your spiritual/religious beliefs

- ✅ File a grievance if you feel mistreated

- ✅ Leave the program voluntarily at any time

- ✅ Be free from discrimination

- ✅ Access your own file (with 48-hour notice)

- ✅ Have your personal information kept confidential (within legal limits)

## GRIEVANCE PROCESS

If you have a concern or feel this Code of Conduct has been violated:

- Talk to staff first — most issues can be resolved through conversation

- File written grievance — submit Grievance Form to Executive Director (available from any staff)

- Receive response — within 5 business days

- Appeal if needed — to Board of Directors within 10 days

- External resources — if unresolved, contact Iowa HHS Recovery Housing

You will not face retaliation for filing a grievance.

## VOLUNTARY EXIT & DISCHARGE

### YOU MAY LEAVE AT ANY TIME

If you choose to leave Grace House: - Give 7 days’ notice if possible - Complete exit interview - Return keys and borrowed items - Allow us to help plan your next steps

### DISCHARGE MAY OCCUR IF:

- You violate non-negotiable safety standards

- You refuse support after multiple interventions

- Your behavior creates ongoing risk to community

- You stop paying fees and refuse to create a plan

Even in discharge, we provide referrals, support, and a warm transition when possible.

## OUR SHARED COMMITMENT

By living at Grace House, I commit to: - Maintaining a sober, safe environment - Treating others with respect - Taking responsibility for my recovery - Engaging with the community - Following house expectations - Asking for help when I need it - Celebrating progress with my housemates - Honoring the trust placed in me

Grace House commits to: - Treating you with dignity always - Supporting your recovery journey - Providing a safe, clean home - Holding you accountable with compassion - Working with you through challenges - Respecting your autonomy and choices - Connecting you with resources you need

## ACKNOWLEDGMENT

I have read (or had read to me) the Grace House Code of Conduct. I understand the expectations and my responsibilities. I commit to upholding this Code and contributing to a safe, supportive community.

Resident Signature: ______________________________

Date: _________________________

Staff Witness: ____________________________________

Date: _________________________

This Code of Conduct is reviewed with all residents during orientation and is posted in Grace House common areas for ongoing reference.

Questions? Concerns? Always talk to your peer coach or House Manager.

Grace For Addictions | Grace House  
1311 9th Street, Des Moines, Iowa  
Code of Conduct — Version 1.0 | Effective: February 3, 2026
', '2026-07-30 16:56:25.71388+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'code_of_conduct' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;
insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', '# Grace House Resident Handbook

Grace For Addictions · 1311 9th Street, Des Moines, Iowa 50314 Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Version 2.0 — Canonical Policy Alignment. Print-ready; may also be completed and acknowledged electronically.

Welcome to Grace House

To every woman who walks through this door:

You are not defined by what you have been through. You are not the worst thing that has ever happened to you. You are not your struggles, your history, or your hardest seasons.

You are someone who chose to take a step — and that step matters. It is courageous, even when it doesn''t feel that way.

Grace House exists because we believe every person in recovery deserves more than survival. You deserve a home — a real one. A place where you are known by name, not by case number. A place where you are seen, not surveilled. A place where you belong.

This is a peer community. Everyone here — including the people who help facilitate it — has walked a road that includes struggle and healing. There is no hierarchy of worthiness here. There is only a shared commitment to show up for ourselves and for one another.

This handbook is your guide to life at Grace House. It explains how our community works, what you can expect from us, and what we ask of you in return. Please read it carefully, ask questions when something is unclear, and refer back to it whenever you need to.

Most of all, know this: you belong here. We are glad you are here. And we are committed to walking this season of life with you.

With hope and respect,

The Grace House Community

Operated by Grace For Addictions Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · Toll Free: (877) 295-2535 gracehouse@graceforaddictions.org

Program Philosophy

Our Foundation

Grace House is built on a simple but powerful belief: people in recovery are capable, whole, and worthy of dignity at every stage of the journey. We do not treat recovery as a problem to be managed. We treat it as a life to be lived — fully, freely, and with community support.

Multiple Pathways, One Community

We honor the reality that recovery looks different for every person. There is no single right way to heal. At Grace House, all evidence-based recovery pathways are welcomed and respected, including:

- 12-Step programs (Alcoholics Anonymous, Narcotics Anonymous, Celebrate Recovery, and others)

- SMART Recovery and other secular, science-based approaches

- Medication-Assisted Treatment (MAT) — including methadone, buprenorphine/naloxone (Suboxone), and naltrexone — prescribed and monitored by licensed medical providers

- Faith-based recovery frameworks

- Trauma-informed therapy and counseling

- Wellness practices including mindfulness, exercise, nutrition, and creative expression

- Harm reduction-informed approaches

You will never be required to identify with any particular recovery identity or program. What you will be asked to do is engage — with your own growth, with this community, and with the commitments you make here.

Who Grace House Serves (Eligibility)

Grace House serves adult women who are building a life in recovery. There are two pathways to eligibility:

- Recovery pathway: a personal history of substance use or misuse and a commitment to living substance-free while in residence.

- Family pathway: a parent, partner, or child with a history of substance use disorder or mental-health-related trauma, where stable, structured, recovery-supportive housing supports the family’s healing.

Both pathways carry the same expectations, the same dignity, and the same community membership. Admission decisions are made without regard to race, color, religion, national origin, disability, or any other protected status, and in full compliance with the Fair Housing Act.

Removal from the Program

Grace House does not use punitive legalistic frameworks in its intake materials. Participants may be removed immediately upon violation of program rules or upon conduct that endangers another resident’s life or recovery. Removal decisions are documented, reviewable through the grievance process, and carried out with dignity.

Change Course Leaders (Partner Program)

Change Course is an independent, outside program — it is not a Grace House or GFA program. Change Course has Leaders only — there are no Change Course “participants.”

- Qualification and acceptance as a Change Course Leader is determined solely by Change Course. Grace House plays no role in selecting, qualifying, or approving Change Course Leaders.

- Change Course Leaders take part in extensive Change Course programming Monday through Thursday. Because of this substantial structured engagement, Grace House requires Change Course Leaders to add only two (2) additional supportive activities per week — in place of the standard phase-based recovery activity requirement.

- Change Course Leaders are expected to remain in full compliance with all Change Course program requirements, which are set and administered by Change Course, not by Grace House.

- All other Grace House expectations (house meeting, curfew, coaching and daily check-ins, fees, community standards) apply to Change Course Leaders exactly as they do to every participant.

Trauma-Informed Care

Grace House operates within a trauma-informed framework, which means we understand that many of the behaviors, struggles, and patterns we see in ourselves and each other are often rooted in experiences of pain, loss, and trauma — not in moral failure or personal weakness.

Our five core trauma-informed principles guide everything we do:

> Five Core Principles
> SAFETY — You have the right to feel physically and emotionally safe at Grace House. We create and maintain that safety together.
> TRUST — We are transparent in how decisions are made, and we do what we say we will do.
> CHOICE — You retain agency over your own life and recovery decisions whenever possible.
> COLLABORATION — Decisions that affect residents are made with resident input, not just for residents.
> EMPOWERMENT — Our goal is to build your capacity, not your dependence. Every policy is designed to help you grow stronger, not keep you compliant.

Grace-Based Accountability

We believe that accountability without compassion produces shame, and shame is one of the greatest barriers to sustained recovery. At Grace House, accountability is not punitive — it is restorative.

When someone falls short of a commitment, our first question is not ''what is the consequence?'' but ''what happened, and how do we move forward together?'' This does not mean there are no expectations or no consequences — it means that consequences are always proportionate, transparent, and aimed at restoration rather than punishment.

Peer-Led Community Model

Grace House is a peer-led recovery residence. This means the culture, care, and community of this home is built by the people who live in it. Experienced residents mentor newer ones. Everyone shares household responsibilities. Leadership within the house is earned through character and consistency, not assigned by credential.

This model is intentional. Research consistently shows that peer support is one of the most powerful catalysts for sustained recovery. You are not just receiving help here — you are also giving it, and that matters deeply.

Resident Rights

As a resident of Grace House, you have the following rights. These rights are non-negotiable and may not be waived, modified, or removed as a condition of residency.

Rights Regarding Dignity and Person

- You have the right to be treated with dignity, respect, and compassion at all times.

- You have the right to be addressed by your preferred name and pronouns.

- You have the right to privacy in your personal communications, including phone calls, letters, and electronic messaging.

- You have the right to manage your own finances, employment, and personal affairs without interference.

- You have the right to keep and access your own identification documents (ID, Social Security card, birth certificate, etc.) at all times.

- You have the right to receive and send personal mail without interception or inspection.

Rights Regarding Recovery

- You have the right to pursue the recovery pathway of your choice, including Medication-Assisted Treatment (MAT), without discrimination or penalty.

- You have the right to choose your own healthcare providers, counselors, and support services in the community.

- You have the right to be free from pressure to affiliate with any specific religious, spiritual, or recovery ideology.

- You have the right to receive medication prescribed by a licensed provider, subject to the house medication policy.

Rights Regarding Residence

- You have the right to a clean, safe, and habitable living environment.

- You have the right to understand all house policies before agreeing to them.

- You have the right to receive advance written notice before any change in your residency status, except in cases of immediate safety concerns.

- You have the right to a fair and transparent grievance process if you believe your rights have been violated or a policy has been applied unfairly.

- You have the right to be free from unlawful searches of your personal belongings.

- You have the right to reasonable accommodations for disability-related needs.

Rights Regarding Confidentiality

- You have the right to confidentiality of your participation in Grace House, subject only to mandatory reporting obligations under Iowa law.

- You have the right to know what information about you is shared, with whom, and why.

- You have the right to provide or withhold consent for release of your information to outside parties.

Rights Regarding Fair Treatment

- You have the right to be free from discrimination based on race, color, national origin, religion, sex, disability, familial status, or any other protected characteristic.

- You have the right to be free from harassment, intimidation, or retaliation from staff or other residents.

- You have the right to access community resources, legal counsel, or outside advocacy without interference.

> If You Believe Your Rights Have Been Violated
> You may file a grievance using the Grace House Grievance Procedure (see page XX).
> You may contact the Iowa Civil Rights Commission: 1-800-457-4416
> You may contact the Iowa Protection & Advocacy Services: 1-800-779-2502
> You may contact the U.S. HUD Office of Fair Housing: 1-800-669-9777
> No retaliation will be taken against any resident for asserting their rights or filing a complaint.

Resident Responsibilities

Living in community means contributing to it. The following responsibilities are what we ask of every resident — not to control you, but because a healthy household requires everyone to show up.

Financial Responsibilities

- Pay your weekly program fee on time. If you are experiencing financial difficulty, speak with the House Manager before your payment is due — not after.

- Maintain your own financial accounts. Grace House does not control, hold, or manage residents'' money.

- Contribute to shared household expenses as outlined in your Participant Agreement.

Household Responsibilities

- Complete your weekly chore assignment thoroughly and on time.

- Keep your personal space (bedroom, bathroom area) clean and organized.

- Clean up after yourself in all shared spaces, including the kitchen, living room, and laundry area.

- Respect all common areas as shared space — not personal space.

- Report maintenance issues or safety concerns to the House Manager promptly.

Community Responsibilities

- Treat every resident, guest, and community member with respect and dignity.

- Maintain a substance-free environment. Do not bring alcohol, illegal substances, or non-prescribed medications into the house or onto the property.

- Do not engage in physical, verbal, or emotional intimidation, harassment, or violence of any kind.

- Honor the privacy of other residents. Do not share personal information about another resident outside the house.

- Honor quiet hours to support everyone''s sleep and wellbeing.

Recovery Responsibilities

- Engage in your personal recovery plan. This does not prescribe a specific program, but it does require active engagement with your own growth.

- Attend required house meetings and community gatherings.

- Comply with drug testing requirements as outlined in the Participant Agreement.

- Notify the House Manager if you are struggling or feel at risk. You will not be punished for being honest.

Behavioral Responsibilities

- Honor your curfew unless prior approval has been granted.

- Follow the visitors policy.

- Comply with the medication policy.

- Do not engage in illegal activity inside or outside the home.

- Do not remove other residents'' belongings without permission.

House Expectations

These expectations exist to make Grace House a safe, functional, and healing environment for everyone. They are not designed to restrict your freedom — they are designed to protect the community we are building together.

Substance-Free Environment

Grace House is an alcohol- and drug-free home. This commitment protects every person in this community.

- No alcohol, illegal drugs, or non-prescribed medications may be brought onto the property at any time.

- Residents may not use substances while living at Grace House, whether on or off the property.

- Residents on Medication-Assisted Treatment (MAT) are fully supported and may continue their prescribed medications under the house medication policy.

- Random drug screens may be requested at any time. Refusal to test is treated the same as a positive result.

- If you are struggling with cravings or feel at risk, please talk to someone. This is not a violation — this is using your recovery community exactly as it was designed.

Quiet Hours and Community Rhythm

Consistent sleep and shared routines support recovery. We ask all residents to honor the following schedule:

| Time | Expectation |
| --- | --- |
| 10:00 PM – 7:00 AM (Sun–Thu) | Quiet hours. Keep voices, music, and devices at low volume. Phone calls in private spaces. |
| 11:00 PM – 7:00 AM (Fri–Sat) | Quiet hours on weekends. |
| 7:00 AM daily | Common areas are open. Morning routines begin. |
| 12:00 PM daily | Bedrooms should be tidied. Daytime activities and obligations underway. |

Common Areas

- Common areas are for everyone. Clean up after every use.

- Kitchen: wash your dishes within 2 hours of using them. Do not leave food on counters.

- Living room: return furniture to its original position after use. No shoes on furniture.

- Laundry: complete your laundry in one session. Do not leave laundry in machines for more than 30 minutes after it is finished.

- Bathrooms: wipe down surfaces after use. Dispose of personal hygiene products properly.

Personal Space

- Your bedroom is your private space. Treat it with care.

- Residents may decorate their rooms in personal ways that do not damage walls or fixtures.

- Bedrooms may not be locked while other residents are home during nighttime hours, in order to maintain the open household environment.

- You are responsible for keeping your bedroom clean. Rooms are subject to wellness checks with 24-hour notice (except in emergencies).

Electronics and Technology

- Personal phones and devices are allowed. Please honor quiet hours and common-area courtesy.

- Social media use that compromises the privacy or reputation of other residents is a serious violation of community trust.

- House WiFi is provided for resident use. Illegal activity conducted via the house network is prohibited.

Pets

- Pets are not permitted at Grace House unless approved in advance by the House Manager as a disability-related accommodation.

- Approved emotional support animals must have current vaccination records on file.

Smoking

- Smoking and vaping are permitted only in designated outdoor areas.

- Do not smoke within 20 feet of any entrance or window.

- Please dispose of cigarette waste responsibly.

Recovery Participation Expectations

Grace House is a recovery-focused community. Living here means actively engaging in your own recovery journey — not performing recovery for someone else, but genuinely investing in your own healing and growth.

What Active Recovery Engagement Looks Like

Policy ID GH-RECOVERY-001 v2.0 — phase-based requirement; supersedes the flat two-per-week standard.

Recovery Activity Requirements by Phase

| Phase | Recovery activities per week |
| --- | --- |
| Phase 1 (Days 1–30) | 4 |
| Phase 2 (Days 31–90) | 3 |
| Phase 3 (Days 91+) | 2 |

What counts as a recovery activity: 12-step meetings (AA/NA), SMART Recovery, Celebrate Recovery, individual therapy or counseling, sessions with your life coach or recovery coach, church or worship services, Bible study, the Tuesday GFA Recovery Community (GFARC) gathering, and other structured community-based recovery activities.

What does not count: the weekly Grace House community meeting. House meeting attendance is a separate, mandatory expectation and may not be counted toward your weekly recovery activity total.

Life Coach / Recovery Coach (required for all participants):

- Every participant selects a life coach or recovery coach at intake.

- Daily check-ins through the VRCC app are required in every phase.

- Coaching sessions: weekly in Phase 1, biweekly in Phase 2, monthly in Phase 3. Coaching sessions count toward your weekly recovery activity total.

- Completing community service, employment, job training, education, or caregiving obligations.

- Engaging in your individual recovery plan with honesty and intention.

House Meetings

Grace House holds a mandatory community meeting once per week. This meeting is the heartbeat of the household. It is where we share, resolve conflicts, make decisions together, celebrate milestones, and maintain our sense of shared life.

- All residents are expected to attend unless prior approval has been granted.

- Meetings are facilitated by rotation among residents.

- All voices are welcome. All perspectives are respected.

- What is shared in house meeting stays in house meeting.

Individual Recovery Planning

Within 72 hours of intake, each resident will complete an Individual Recovery Plan with support from the House Manager or a peer mentor. This plan identifies:

- Your personal recovery goals

- Your chosen recovery pathway and support structure

- Your employment, education, or community service commitments

- Identified strengths, supports, and areas of growth

- Short-term milestones and how success will be measured

Recovery plans are reviewed and updated monthly. They belong to you — not to the house — and are written in your voice.

No Coerced Affiliation

You will never be required to attend a specific recovery program, claim a particular recovery identity, pray in a specific way, or align with any ideology as a condition of living at Grace House. Multiple recovery pathways are honored equally here.

Curfew and Daily Structure

Curfew

Curfew is a structure designed to protect your sleep, your safety, and the community''s sense of stability — not to restrict your life.

Policy ID GH-CURFEW-001 v3.0 — supersedes all prior curfew tables.

| Phase | Weeknight (Sun–Thu) | Weekend (Fri–Sat) |
| --- | --- | --- |
| Phase 1 (Days 1–30) | 9:00 PM | 10:00 PM |
| Phase 2 (Days 31–90) | 10:00 PM | 11:00 PM |
| Phase 3 (Days 91+) | 11:00 PM | Midnight |

Hard ceiling: No curfew at Grace House extends past midnight in any phase, for any reason other than verified current employment.

The only curfew exception is current employment. A participant whose verified work schedule conflicts with curfew may be granted an employment-based adjustment covering scheduled shifts plus reasonable travel time. A copy of the work schedule must be on file with the House Manager. No other exceptions (social, family, recreational, or recovery-activity) extend curfew.

Curfew Extensions and Overnight Passes

- Curfew adjustments are granted only for verified current employment. Submit your work schedule to the House Manager; the adjustment covers scheduled shifts plus reasonable travel time.

- Overnight passes may be granted after 60 days of residency to residents in good standing.

- Overnight passes require a written request submitted 48 hours in advance, including the location and host name.

- More than three curfew violations in a 30-day period will result in a community accountability conversation and potential curfew reset.

Morning Routine

A consistent morning routine is one of the most powerful recovery tools available. Residents are encouraged to establish a morning routine that includes:

- Rising at a consistent time (no later than 10:00 AM on days without obligations)

- Personal hygiene and room tidying

- Breakfast and/or connection with housemates

- Engagement with daily obligations (work, school, appointments, volunteer activities)

Daytime Expectations

Grace House is not a daytime respite program. Residents are expected to be actively engaged in employment, education, job training, volunteering, or scheduled appointments during weekday daytime hours (9:00 AM – 4:00 PM). Exceptions require prior approval from the House Manager.

Medication and Appointments

Residents are responsible for scheduling and attending all medical, counseling, and recovery-related appointments. The house schedule and curfew framework are designed to accommodate these commitments. If a conflict exists, bring it to the House Manager immediately.

Visitors Policy

Grace House is a private home. Our visitors policy protects the safety, comfort, and recovery environment of every resident.

General Visitor Guidelines

- Visitors are welcome in common areas only. Guests may not enter any resident''s bedroom.

- All visitors must be introduced to and acknowledged by the House Manager or on-call peer leader.

- Residents are responsible for the behavior of their guests.

- Visitors who behave inappropriately, appear intoxicated, or make other residents uncomfortable may be asked to leave immediately.

- Visitors may not stay overnight unless prior approval has been granted through the extended guest process.

Visitor Hours

| Day | Visitor Hours |
| --- | --- |
| Monday – Thursday | 10:00 AM – 9:00 PM |
| Friday – Saturday | 10:00 AM – 10:00 PM |
| Sunday | 12:00 PM – 8:00 PM |

Prohibited Visitors

- No visitors who are currently using substances or appear intoxicated.

- No visitors who pose a documented safety concern to any current resident.

- No male visitors in bedroom areas. Male visitors are welcome in common areas during visitor hours.

- No visitors under the age of 12 without specific approval (to protect all residents'' privacy and comfort).

Overnight Guests

Overnight guests are a privilege extended to residents in Phase 2 and Phase 3 who are in good standing.

- A written overnight guest request must be submitted to the House Manager 48 hours in advance.

- Approved guests must sleep in common area (living room) only — never in bedrooms.

- A maximum of one overnight guest per resident is permitted.

- Overnight guests may not remain in the home during daytime obligation hours (9:00 AM – 4:00 PM weekdays).

Medication Policy

Grace House is fully supportive of Medication-Assisted Treatment (MAT) and all prescription medications. We recognize that medication is healthcare — not a compromise of recovery.

Medication-Assisted Treatment (MAT)

Residents taking MAT medications — including methadone, buprenorphine (Suboxone), naltrexone (Vivitrol), or any other FDA-approved medication for opioid or alcohol use disorder — are fully welcome at Grace House. Their use of prescribed medication is private health information and will never be used to stigmatize, limit, or dismiss their recovery.

Medication Storage and Administration

- All prescription medications must be disclosed to the House Manager upon intake.

- Medications must be stored in a secure, designated personal lockbox.

- Controlled substances (including MAT medications) must be stored in a house-provided locked medication safe if a personal lockbox is not available.

- Medications may not be shared with any other resident under any circumstances.

- Residents are responsible for taking their own medications independently. Grace House staff do not administer medications.

New Prescriptions

- Any new prescription obtained while living at Grace House must be reported to the House Manager within 24 hours.

- Residents must provide written documentation from their prescribing provider for any controlled substance.

- Over-the-counter medications with potential for misuse (certain cough syrups, antihistamines, etc.) should be disclosed and stored appropriately.

Medical Privacy

Your medical information — including what medications you take — is private. Grace House staff will not disclose your medication information to other residents, family members, or outside parties without your written consent, except as required by law.

> MAT-Affirming Statement
> Grace House explicitly affirms that Medication-Assisted Treatment is an evidence-based, medically appropriate approach to recovery.
> No resident will be asked to discontinue MAT as a condition of residency.
> No resident will face stigma, reduced privileges, or negative consequences for taking prescribed MAT medications.
> Residents taking MAT are full and equal members of this recovery community.

Confidentiality Policy

What happens at Grace House stays at Grace House. Confidentiality is one of the foundations of our community trust.

What We Protect

- The identity of anyone participating in Grace House.

- Personal information shared in house meetings, peer conversations, or with staff.

- Your recovery history, medical information, and legal history.

- Your current address and contact information.

- Any information that could identify you as a person in recovery.

What You Must Protect

Every resident has the same confidentiality obligations to their housemates. This means:

- Do not share another resident''s personal information outside the house.

- Do not post photos, videos, or identifying information about other residents on social media.

- Do not disclose who lives here to people who don''t need to know.

- Honor the trust placed in you when other residents share in meetings or conversations.

Required Disclosures

There are limited situations in which Grace House is required by law to disclose information, even without your consent. These include:

- Imminent risk of harm to yourself or another specific person (duty to warn under Iowa law).

- Suspected abuse or neglect of a child or vulnerable adult (mandatory reporting under Iowa Code Chapter 232).

- Court order requiring disclosure.

In all other cases, your information will not be disclosed without your written, signed consent.

HIPAA and 42 CFR Part 2

Substance use disorder treatment information is protected by federal law under 42 CFR Part 2, which provides stronger protections than standard HIPAA. While Grace House is a peer-led residence (not a clinical treatment provider), we align our confidentiality practices with the highest standard of protection.

Grievance Procedure

If you believe you have been treated unfairly, your rights have been violated, or a policy has been applied inconsistently, you have the right to file a grievance. This process is taken seriously, and no retaliation will occur for using it.

Grievance Process — Step by Step

> Step 1 — Informal Resolution (Within 3 Days)
> If you are comfortable doing so, speak directly with the person involved.
> Be specific about what occurred, how it affected you, and what resolution you are seeking.
> If the concern involves a housemate, a peer mediator can be requested.
> Many concerns can be resolved quickly through honest conversation.

> Step 2 — Formal Written Grievance (Within 10 Days of Incident)
> Complete a Grace House Grievance Form (available from the House Manager or in the resident binder).
> Submit the completed form to the House Manager.
> You will receive a written acknowledgment within 24 hours confirming receipt.
> Your grievance will be reviewed within 5 business days.

> Step 3 — House Manager Response (Within 5 Business Days)
> The House Manager will investigate the grievance by reviewing the facts and speaking with relevant parties.
> A written response will be provided to you within 5 business days of receiving your form.
> The response will include findings, any action taken, and the reasoning behind the decision.

> Step 4 — Appeal (Within 5 Days of House Manager Response)
> If you are not satisfied with the House Manager''s response, you may appeal to Grace For Addictions leadership.
> Submit a written appeal to thomas@graceforaddictions.org with a copy of your original grievance and the response received.
> A final decision will be provided within 10 business days.

> Step 5 — External Resources
> At any point in this process, you may also contact external agencies.
> Iowa Civil Rights Commission: 1-800-457-4416
> Iowa Protection & Advocacy Services: 1-800-779-2502
> HUD Fair Housing: 1-800-669-9777
> Iowa Department of Health and Human Services: 1-800-362-2178

Anti-Retaliation

No resident will face any negative consequences — including threats, changes in privileges, or pressure toward discharge — for filing a grievance in good faith. Retaliation is itself a serious violation and will be addressed through the same process.

Safety Expectations

Safety is not just a rule — it is a value. Every person in this home deserves to feel safe: physically, emotionally, and relationally. These expectations exist to protect that safety.

Physical Safety

- Violence of any kind — physical assault, threats of violence, destruction of property — will result in immediate safety intervention and may result in emergency discharge.

- Weapons of any kind are strictly prohibited on the property.

- Emergency contact numbers are posted in the kitchen, bathroom, and entryway.

- In an emergency, always call 911 first.

- Grace House has a safety plan and fire escape route posted in each common area and near each exit.

- Tampering with smoke detectors, fire extinguishers, or safety equipment is strictly prohibited.

Emotional and Relational Safety

- Verbal aggression, intimidation, threatening language, or emotional manipulation are not tolerated.

- Bullying, gossip campaigns, exclusion, and other forms of social aggression are violations of community standards.

- Each resident has a right to their emotional experience without being dismissed, mocked, or pressured.

- Romantic or sexual relationships between residents are strongly discouraged during early recovery and may be addressed in accountability conversations if they become disruptive to the community.

Crisis Safety Protocol

If you or another resident is in crisis:

- Call 911 if there is immediate danger to life.

- Contact the House Manager or on-call peer leader immediately.

- Call Iowa Substance Use Crisis Line: 1-844-775-5837 (24/7)

- Call National Crisis Lifeline: 988 (call or text, 24/7)

- Do not leave a person in crisis alone.

- Document the situation and notify Grace House leadership as soon as possible.

Mandatory Reporting

Grace House staff and peer leaders are required by Iowa law to report suspected child abuse or neglect, and suspected abuse or neglect of a dependent adult, to the Iowa Department of Health and Human Services. This is not optional. If you are concerned about a child or vulnerable adult in your life, please speak with the House Manager confidentially.

Discharge Policies

Leaving Grace House — whether planned or unplanned — is handled with dignity and care. Our goal is always to support successful transitions, not punitive exits.

Planned (Voluntary) Discharge

When a resident is ready to move to the next chapter — independent housing, transitional housing, reconnection with family — we celebrate that step.

- Please provide at least 14 days'' written notice to the House Manager.

- Your final day and departure plan will be documented.

- A transition planning meeting will be offered to help you connect to ongoing recovery support, housing resources, and community services.

- You are always welcome to return to Grace House events and community as an alum.

Administrative Discharge

Situations may arise that require the house to initiate a discharge. These decisions are made with care and are never taken lightly.

Grounds for Administrative Discharge

- Non-payment of program fees (after documented attempts at payment planning).

- Sustained, documented refusal to engage in recovery participation requirements.

- Behaviors that pose a documented, ongoing safety risk to other residents.

- Court-ordered removal from the residence.

Discharge Process

- The House Manager will document the specific concern with dates, descriptions, and prior interventions.

- A conversation will be held with the resident before a discharge decision is made, whenever safety permits.

- A written notice of discharge will be provided with a minimum of 7 days'' notice, except in emergency situations.

- A transition planning meeting will be offered within 24 hours of notice.

- Resources for alternative housing, crisis support, and recovery services will be provided in writing.

Emergency Discharge

In situations involving immediate safety, emergency discharge may occur without advance notice. Emergency discharge may be initiated when:

- A resident has engaged in physical violence or credible threats of violence against another resident or staff.

- A resident has introduced illegal substances into the home in a way that poses immediate risk to others.

- A resident''s behavior creates an immediate and documented safety emergency that cannot be otherwise managed.

Even in emergency discharge situations, the resident will receive written documentation of the reason, a referral to emergency housing resources, and information about the grievance process.

Discharge Resource Support

Regardless of the type of discharge, every departing resident will receive:

- Written referral list for housing resources in the Des Moines area

- Contact information for Iowa 211 (housing, crisis, and basic needs navigation)

- Recovery support referrals

- Written documentation of their stay at Grace House for use in housing applications

Return-to-Use Response Framework

We reject the word ''relapse'' as a moral verdict. A return to use is a medical and behavioral event — not a character failure, not an identity statement, and not the end of someone''s recovery story.

Grace House''s response to return-to-use events is grounded in science, compassion, and a genuine commitment to the person''s recovery — not compliance theater.

Guiding Principles

> What We Believe About Return-to-Use
> Return to use is a common, documented part of the recovery process for many people — not a sign of failure.
> The response to return-to-use shapes whether a person survives and stays engaged with recovery, or disengages out of shame.
> Our goal is always to keep the person connected to support, even if circumstances require a temporary change in housing.
> Disclosure of a return-to-use event, or help-seeking behavior, is never punished — it is encouraged and supported.
> We apply harm reduction principles at all times to reduce the risk of overdose and serious harm.

Immediate Response Protocol

When a return-to-use event is identified:

- Ensure immediate safety. If the resident is in medical distress, call 911 immediately. Naloxone (Narcan) is available in the house medicine cabinet.

- Contact the House Manager or on-call peer leader.

- Reduce judgment and increase connection. Meet the resident where they are with compassion.

- Conduct a substance-free verification before the resident re-enters shared spaces.

- Schedule a care conversation within 24 hours to assess needs, risks, and next steps.

Care Conversation Framework

Within 24–48 hours of a confirmed return-to-use event, the House Manager or senior peer mentor will conduct a care conversation with the resident. This conversation is not a disciplinary hearing — it is a recovery conversation.

The conversation will explore:

- What happened, and what circumstances surrounded it?

- Is the resident safe? Are there immediate medical concerns?

- What does the resident need right now to get stable?

- What do they want their next step to be?

- What changes to the resident''s recovery plan might help?

- Is a higher level of care (detox, residential treatment) needed?

Housing Determination

A return-to-use event does not automatically result in discharge. The following framework guides the decision:

| Situation | Likely Response |
| --- | --- |
| First event, resident discloses voluntarily, no safety risk, seeking help | Remain in house. Intensified recovery support. Possible clinical referral. |
| First event, discovered rather than disclosed, resident engaged and remorseful | Remain in house with enhanced accountability plan and weekly check-ins. |
| Event involves substances brought into house (risk to others) | Temporary housing pause while safety plan is developed. Return possible with agreement. |
| Repeated events with escalating risk, limited engagement | Care referral for higher level of care. Support transition to appropriate setting. Door remains open. |
| Overdose or medical emergency | Immediate medical response. 72-hour stabilization support. Care conference to determine next steps. |

Return After Treatment

Any resident who departs for a higher level of care (detox, residential treatment, stabilization center) is welcome to return to Grace House upon completing that level of care, subject to bed availability. Prior residency at Grace House is considered a strong positive factor in any return application.

> Naloxone (Narcan) Policy
> Naloxone is available in the Grace House medication cabinet and near the front door.
> All residents will receive naloxone training within 7 days of intake.
> Good Samaritan protection applies under Iowa law — you will not face legal consequences for calling for help during an overdose.
> Administering naloxone to someone in need is never a violation of house policy.
', '2026-07-30 16:58:31.474081+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'resident_handbook' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;
insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.0', 'RESIDENT RIGHTS

You have the right to be treated with dignity and respect at all times.
You have the right to a safe, substance-free living environment.
You have the right to raise concerns or file a grievance without retaliation.
You have the right to access recovery support services of your choosing.
You have the right to review your own records and agreements.

HOUSE EXPECTATIONS

Honor curfew and sign-out procedures so everyone stays accounted for.
Complete assigned chores - a shared home is everyone''s work.
Attend required house meetings.
Respect housemates'' space, belongings, and recovery.
Keep the home substance-free, including guests.

(Draft for demonstration - final language requires Grace For Addictions review.)', '2026-08-02 18:41:20.602792+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'resident_rights' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', 'GRACE HOUSE — RESIDENT RIGHTS & RESPONSIBILITIES

Grace House · Grace For Addictions · 1311 9th Street, Des Moines, Iowa 50314

Office: 515-220-8771 · Warmline: 515-310-DIAL (3425)

Source: Grace House Complete Operational System v2 (canonical).

———————————————————————————

YOUR RIGHTS

———————————————————————————

RIGHTS REGARDING DIGNITY AND PERSON

You have the right to be treated with dignity, respect, and compassion at all times.

You have the right to be addressed by your preferred name and pronouns.

You have the right to privacy in your personal communications, including phone calls, letters, and electronic messaging.

You have the right to manage your own finances, employment, and personal affairs without interference.

You have the right to keep and access your own identification documents (ID, Social Security card, birth certificate, etc.) at all times.

You have the right to receive and send personal mail without interception or inspection.

RIGHTS REGARDING RECOVERY

You have the right to pursue the recovery pathway of your choice, including Medication-Assisted Treatment (MAT), without discrimination or penalty.

You have the right to choose your own healthcare providers, counselors, and support services in the community.

You have the right to be free from pressure to affiliate with any specific religious, spiritual, or recovery ideology.

You have the right to receive medication prescribed by a licensed provider, subject to the house medication policy.

RIGHTS REGARDING RESIDENCE

You have the right to a clean, safe, and habitable living environment.

You have the right to understand all house policies before agreeing to them.

You have the right to receive advance written notice before any change in your residency status, except in cases of immediate safety concerns.

You have the right to a fair and transparent grievance process if you believe your rights have been violated or a policy has been applied unfairly.

You have the right to be free from unlawful searches of your personal belongings.

You have the right to reasonable accommodations for disability-related needs.

RIGHTS REGARDING CONFIDENTIALITY

You have the right to confidentiality of your participation in Grace House, subject only to mandatory reporting obligations under Iowa law.

You have the right to know what information about you is shared, with whom, and why.

You have the right to provide or withhold consent for release of your information to outside parties.

RIGHTS REGARDING FAIR TREATMENT

You have the right to be free from discrimination based on race, color, national origin, religion, sex, disability, familial status, or any other protected characteristic.

You have the right to be free from harassment, intimidation, or retaliation from staff or other residents.

You have the right to access community resources, legal counsel, or outside advocacy without interference.

IF YOU BELIEVE YOUR RIGHTS HAVE BEEN VIOLATED

You may file a grievance using the Grace House Grievance Procedure.

You may contact the Iowa Civil Rights Commission: 1-800-457-4416

You may contact the Iowa Protection & Advocacy Services: 1-800-779-2502

You may contact the U.S. HUD Office of Fair Housing: 1-800-669-9777

No retaliation will be taken against any resident for asserting their rights or filing a complaint.

———————————————————————————

YOUR RESPONSIBILITIES

———————————————————————————

Living in community means contributing to it. The following responsibilities are what we ask of every resident — not to control you, but because a healthy household requires everyone to show up.

FINANCIAL

Pay your weekly program fee on time. If you are experiencing financial difficulty, speak with the House Manager before your payment is due — not after.

Maintain your own financial accounts. Grace House does not control, hold, or manage residents'' money.

Contribute to shared household expenses as outlined in your Participant Agreement.

HOUSEHOLD

Complete your weekly chore assignment thoroughly and on time.

Respect all common areas as shared space — not personal space.

Report maintenance issues or safety concerns to the House Manager promptly.

COMMUNITY

Treat every resident, guest, and community member with respect and dignity.

Maintain a substance-free environment. Do not bring alcohol, illegal substances, or non-prescribed medications into the house or onto the property.

Do not engage in physical, verbal, or emotional intimidation, harassment, or violence of any kind.

Honor the privacy of other residents. Do not share personal information about another resident outside the house.

Honor quiet hours to support everyone''s sleep and wellbeing.

RECOVERY

Engage in your personal recovery plan. This does not prescribe a specific program, but it does require active engagement with your own growth.

Attend required house meetings and community gatherings.

Comply with drug testing requirements as outlined in the Participant Agreement.

Notify the House Manager if you are struggling or feel at risk. You will not be punished for being honest.

BEHAVIORAL

Honor your curfew unless prior approval has been granted.

Follow the visitors policy. Comply with the medication policy.

Do not engage in illegal activity inside or outside the home.

Do not remove other residents'' belongings without permission.', '2026-08-03 16:24:05.816623+00'::timestamptz
from recoveryos.document_templates t
where t.key = 'resident_rights' and t.organization_id = (select id from recoveryos.organizations where name = 'Grace For Addictions')
on conflict (template_id, version) do update set body_markdown = excluded.body_markdown, published_at = excluded.published_at;
