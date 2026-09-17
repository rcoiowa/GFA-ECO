# GFA-ECO (RecoveryOS) — Entity-Relationship Diagram

**Source:** Live Postgres catalog of Supabase project `cqcxvwoukyhxyokfwnjm`, schema `recoveryos` (plus one deprecated table in `public`), extracted 2026-09-17. Evidence class: **B — Verified Operational Evidence** (read directly from the running database, not from design documents).

**Scope:** 85 tables in `recoveryos`, all primary keys and all foreign keys. Diagrams are grouped by functional area so each one stays readable; every foreign key in the schema appears in exactly one diagram below. Hub tables (`people`, `organizations`, `residences`, …) are drawn in full once and referenced as bare boxes elsewhere.

**Conventions**
- `PK` / `FK` mark primary and foreign key columns.
- Relationship lines carry the FK column name as the label.
- Cardinality encodes FK nullability: `||--o{` = child row **must** have a parent (NOT NULL FK); `|o--o{` = optional parent (nullable FK); `||--o|` = one-to-zero-or-one.
- Column-level nullability is otherwise omitted for legibility; enum types (`service_modality`, `role_key`, …) are Postgres enums in schema `recoveryos`.

---

## 1. Identity & Access

`people` is the hub of the entire schema — nearly every other table references it (as participant, provider, coach, navigator, or as an audit actor such as `recorded_by_person_id` / `verified_by_person_id`). A person may be linked to a Supabase `auth.users` account.

```mermaid
erDiagram
    auth_users {
        uuid id PK
    }
    people {
        bigint id PK
        uuid auth_user_id FK
        text first_name
        text last_name
        text preferred_name
        text pronouns
        date date_of_birth
        timestamptz created_at
        timestamptz updated_at
    }
    person_profiles {
        bigint person_id PK
        text bio
        date recovery_date
        jsonb accessibility_preferences
        jsonb communication_preferences
        text timezone
        timestamptz updated_at
    }
    person_classification {
        bigint person_id PK
        text classification
        text reason
        timestamptz created_at
        timestamptz updated_at
    }
    contact_methods {
        bigint id PK
        bigint person_id FK
        text kind
        text value
        bool is_primary
        bool is_verified
        timestamptz created_at
    }
    emergency_contacts {
        bigint id PK
        bigint person_id FK
        text name
        text phone
        text relationship
        bool notify_authorized
        bool is_active
        timestamptz created_at
        timestamptz updated_at
    }
    role_assignments {
        bigint id PK
        bigint person_id FK
        role_key role_key
        bigint organization_id FK
        bigint program_id FK
        bigint residence_id FK
        bigint granted_by_person_id FK
        timestamptz granted_at
        timestamptz revoked_at
    }
    staff_preauthorizations {
        bigint id PK
        text email
        role_key_array role_keys
        text note
        timestamptz consumed_at
        bigint consumed_person_id FK
        timestamptz created_at
        text purpose
        bigint organization_id FK
        bigint residence_id FK
        timestamptz expires_at
        timestamptz revoked_at
        bigint created_by_person_id FK
    }
    support_team_memberships {
        bigint id PK
        bigint person_id FK
        bigint member_person_id FK
        text member_role
        date started_at
        date ended_at
    }
    provider_meeting_rooms {
        bigint id PK
        bigint person_id FK
        text provider
        text room_url
        bool is_active
        timestamptz created_at
        timestamptz updated_at
    }
    leads {
        bigint id PK
        text first_name
        text last_name
        text email
        text phone
        text message
        text interest
        text readiness
        text source
        text status
        bigint assigned_to_person_id FK
        bigint converted_person_id FK
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    auth_users |o--o{ people : "auth_user_id"
    people ||--o| person_profiles : "person_id"
    people ||--o| person_classification : "person_id"
    people ||--o{ contact_methods : "person_id"
    people ||--o{ emergency_contacts : "person_id"
    people ||--o{ role_assignments : "person_id"
    people |o--o{ role_assignments : "granted_by_person_id"
    organizations |o--o{ role_assignments : "organization_id"
    programs |o--o{ role_assignments : "program_id"
    residences |o--o{ role_assignments : "residence_id"
    people |o--o{ staff_preauthorizations : "created_by_person_id"
    people |o--o{ staff_preauthorizations : "consumed_person_id"
    organizations |o--o{ staff_preauthorizations : "organization_id"
    residences |o--o{ staff_preauthorizations : "residence_id"
    people ||--o{ support_team_memberships : "person_id"
    people ||--o{ support_team_memberships : "member_person_id"
    people ||--o{ provider_meeting_rooms : "person_id"
    people |o--o{ leads : "assigned_to_person_id"
    people |o--o{ leads : "converted_person_id"
```

## 2. Organizations & Programs

```mermaid
erDiagram
    organizations {
        bigint id PK
        text name
        text organization_type
        bigint parent_organization_id FK
        bool is_active
        timestamptz created_at
        text structure
    }
    organization_relationships {
        bigint id PK
        bigint from_organization_id FK
        bigint to_organization_id FK
        organization_relationship_type relationship_type
        date started_at
        date ended_at
        timestamptz created_at
    }
    locations {
        bigint id PK
        bigint organization_id FK
        text name
        text address_line1
        text address_line2
        text city
        text state
        text postal_code
        bool is_active
    }
    programs {
        bigint id PK
        bigint organization_id FK
        text key
        text name
        text description
        bool is_active
    }
    program_enrollments {
        bigint id PK
        bigint person_id FK
        bigint program_id FK
        enrollment_status status
        text referral_source
        date started_at
        date ended_at
        timestamptz created_at
        timestamptz updated_at
    }
    funding_sources {
        bigint id PK
        bigint organization_id FK
        text name
        text reference_code
        bool is_active
    }

    organizations |o--o{ organizations : "parent_organization_id"
    organizations ||--o{ organization_relationships : "from_organization_id"
    organizations ||--o{ organization_relationships : "to_organization_id"
    organizations ||--o{ locations : "organization_id"
    organizations ||--o{ programs : "organization_id"
    organizations |o--o{ funding_sources : "organization_id"
    people ||--o{ program_enrollments : "person_id"
    programs ||--o{ program_enrollments : "program_id"
```

## 3. Housing — Structure & Occupancy

Physical hierarchy is `residences → residence_units → residence_rooms → residence_beds`. A `residency` is a person's stay at a residence; `bed_assignments` joins residencies to beds over time (note the deliberate circular pair: `bed_assignments.residency_id` and the denormalized pointer `residencies.bed_assignment_id` to the current assignment).

```mermaid
erDiagram
    residences {
        bigint id PK
        bigint organization_id FK
        bigint location_id FK
        text name
        text address_street
        text address_city
        text address_state
        text postal_code
        text phone
        text email
        int capacity
        bool is_active
        text population_served
        text narr_level
        text narr_certification_status
        text narr_affiliate
        numeric shared_room_fee_weekly
        numeric private_room_fee_weekly
        numeric shared_room_fee_monthly
        numeric private_room_fee_monthly
        bool accepts_mat
        bool accepts_supervision
        text public_description
        text level_of_support
        text_array commitments
        text curfew_weeknight
        bool is_public_directory
        timestamptz created_at
    }
    residence_units {
        bigint id PK
        bigint residence_id FK
        text name
    }
    residence_rooms {
        bigint id PK
        bigint unit_id FK
        text name
    }
    residence_beds {
        bigint id PK
        bigint room_id FK
        text name
        bool is_active
    }
    residencies {
        bigint id PK
        bigint person_id FK
        bigint residence_id FK
        bigint program_enrollment_id FK
        date admission_date
        date anticipated_exit_date
        date discharge_date
        residency_status residency_status
        bigint bed_assignment_id FK
        smallint phase
        date phase_started_at
        timestamptz created_at
        timestamptz updated_at
    }
    bed_assignments {
        bigint id PK
        bigint residency_id FK
        bigint bed_id FK
        timestamptz assigned_at
        timestamptz released_at
    }
    residency_phases {
        bigint id PK
        bigint residency_id FK
        int phase
        date started_on
        text note
        bigint recorded_by_person_id FK
        timestamptz created_at
    }

    organizations ||--o{ residences : "organization_id"
    locations |o--o{ residences : "location_id"
    residences ||--o{ residence_units : "residence_id"
    residence_units ||--o{ residence_rooms : "unit_id"
    residence_rooms ||--o{ residence_beds : "room_id"
    people ||--o{ residencies : "person_id"
    residences ||--o{ residencies : "residence_id"
    program_enrollments |o--o{ residencies : "program_enrollment_id"
    bed_assignments |o--o{ residencies : "bed_assignment_id"
    residencies ||--o{ bed_assignments : "residency_id"
    residence_beds ||--o{ bed_assignments : "bed_id"
    residencies ||--o{ residency_phases : "residency_id"
    people |o--o{ residency_phases : "recorded_by_person_id"
```

## 4. Housing — Applications, Referrals & Medication Review

`residence_application_intake` is the canonical public intake boundary (it superseded the deprecated `public.housing_applications`); an accepted intake converts into a `person` and a `residence_applications` row. `residence_listing_submissions` is the public pipeline for adding residences to the directory.

```mermaid
erDiagram
    residence_application_intake {
        bigint id PK
        bigint residence_id FK
        text applicant_name
        text applicant_email
        text applicant_phone
        text preferred_contact
        text referral_source
        jsonb answers
        bool consent_to_contact
        text status
        timestamptz reviewed_at
        bigint reviewed_by_person_id FK
        text review_notes
        bigint converted_person_id FK
        bigint converted_application_id FK
        text source
        bool test_fixture
        timestamptz created_at
        timestamptz updated_at
    }
    residence_applications {
        bigint id PK
        bigint person_id FK
        bigint residence_id FK
        text status
        timestamptz submitted_at
        timestamptz decided_at
        bigint decided_by_person_id FK
        text notes
        jsonb answers
    }
    residence_listing_submissions {
        bigint id PK
        text residence_name
        text organization_name
        text address_city
        text address_state
        text address_county
        text population_served
        text residence_type
        text support_level
        bool narr_certified
        text certification_details
        int capacity
        text website
        text contact_name
        text contact_email
        text contact_phone
        text notes
        text status
        timestamptz reviewed_at
        bigint reviewed_by_person_id FK
        text review_notes
        bigint published_residence_id FK
        text source
        bool test_fixture
        timestamptz created_at
        timestamptz updated_at
    }
    referrals {
        bigint id PK
        bigint residence_id FK
        text referrer_name
        text referrer_organization
        text referrer_role
        text referrer_email
        text referrer_phone
        text participant_name
        text participant_phone
        text participant_location
        text notes
        bool consent_attested
        text status
        bigint handled_by_person_id FK
        timestamptz handled_at
        timestamptz created_at
    }
    medication_status_reviews {
        bigint id PK
        bigint person_id FK
        bigint application_id FK
        text outcome
        bigint reviewed_by_person_id FK
        timestamptz reviewed_at
        timestamptz superseded_at
        timestamptz created_at
    }
    residency_medication_items {
        bigint id PK
        bigint person_id FK
        bigint application_id FK
        bigint residency_id FK
        text name
        text storage_requirement
        bool is_moud
        bool prescriber_on_file
        bigint recorded_by_person_id FK
        timestamptz started_at
        timestamptz ended_at
        timestamptz created_at
    }

    residences ||--o{ residence_application_intake : "residence_id"
    people |o--o{ residence_application_intake : "reviewed_by_person_id"
    people |o--o{ residence_application_intake : "converted_person_id"
    residence_applications |o--o{ residence_application_intake : "converted_application_id"
    people ||--o{ residence_applications : "person_id"
    residences ||--o{ residence_applications : "residence_id"
    people |o--o{ residence_applications : "decided_by_person_id"
    people |o--o{ residence_listing_submissions : "reviewed_by_person_id"
    residences |o--o{ residence_listing_submissions : "published_residence_id"
    residences ||--o{ referrals : "residence_id"
    people |o--o{ referrals : "handled_by_person_id"
    people ||--o{ medication_status_reviews : "person_id"
    residence_applications |o--o{ medication_status_reviews : "application_id"
    people |o--o{ medication_status_reviews : "reviewed_by_person_id"
    people ||--o{ residency_medication_items : "person_id"
    residence_applications |o--o{ residency_medication_items : "application_id"
    residencies |o--o{ residency_medication_items : "residency_id"
    people |o--o{ residency_medication_items : "recorded_by_person_id"
```

## 5. House Operations

Day-to-day life of a residence: curfews, passes, fees, screenings, chores, incidents, grievances, house posts, and house meetings.

```mermaid
erDiagram
    curfew_schedules {
        bigint id PK
        bigint residence_id FK
        int day_of_week
        time curfew_time
    }
    curfew_exceptions {
        bigint id PK
        bigint residency_id FK
        date exception_date
        timestamptz approved_until
        text reason
        bigint approved_by_person_id FK
        timestamptz created_at
    }
    employment_curfew_exceptions {
        bigint id PK
        bigint residency_id FK
        text employer_name
        text schedule_note
        bigint verified_by_person_id FK
        timestamptz verified_at
        bool active
        timestamptz created_at
    }
    passes {
        bigint id PK
        bigint residency_id FK
        timestamptz starts_at
        timestamptz ends_at
        text destination
        text status
        bigint decided_by_person_id FK
        timestamptz created_at
    }
    fee_ledger {
        bigint id PK
        bigint residency_id FK
        text entry_type
        numeric amount
        text method
        date period_start
        date period_end
        text receipt_number
        text note
        bigint recorded_by_person_id FK
        timestamptz created_at
    }
    screenings {
        bigint id PK
        bigint residency_id FK
        text screening_type
        timestamptz collected_at
        text result
        bigint recorded_by_person_id FK
    }
    residence_chores {
        bigint id PK
        bigint residence_id FK
        text name
        text description
        bool is_active
    }
    chore_assignments {
        bigint id PK
        bigint chore_id FK
        bigint residency_id FK
        date due_on
        timestamptz completed_at
        bigint verified_by_person_id FK
    }
    incidents {
        bigint id PK
        bigint residence_id FK
        bigint residency_id FK
        timestamptz occurred_at
        text category
        text summary
        int severity
        text follow_up
        bigint reported_by_person_id FK
        bigint reviewed_by_person_id FK
        timestamptz reviewed_at
        timestamptz created_at
    }
    grievances {
        bigint id PK
        bigint residence_id FK
        bigint filed_by_person_id FK
        text summary
        text status
        timestamptz filed_at
        timestamptz resolved_at
        bigint resolved_by_person_id FK
    }
    house_posts {
        bigint id PK
        bigint residence_id FK
        bigint author_person_id FK
        text category
        text title
        text body
        bool is_pinned
        timestamptz created_at
    }
    meetings {
        bigint id PK
        bigint organization_id FK
        bigint residence_id FK
        text title
        text description
        timestamptz starts_at
        timestamptz ends_at
        bool is_required_for_residents
        timestamptz created_at
    }
    meeting_attendance {
        bigint id PK
        bigint meeting_id FK
        bigint person_id FK
        text status
        bigint recorded_by_person_id FK
        timestamptz recorded_at
    }

    residences ||--o{ curfew_schedules : "residence_id"
    residencies ||--o{ curfew_exceptions : "residency_id"
    people |o--o{ curfew_exceptions : "approved_by_person_id"
    residencies ||--o{ employment_curfew_exceptions : "residency_id"
    people |o--o{ employment_curfew_exceptions : "verified_by_person_id"
    residencies ||--o{ passes : "residency_id"
    people |o--o{ passes : "decided_by_person_id"
    residencies ||--o{ fee_ledger : "residency_id"
    people |o--o{ fee_ledger : "recorded_by_person_id"
    residencies ||--o{ screenings : "residency_id"
    people |o--o{ screenings : "recorded_by_person_id"
    residences ||--o{ residence_chores : "residence_id"
    residence_chores ||--o{ chore_assignments : "chore_id"
    residencies ||--o{ chore_assignments : "residency_id"
    people |o--o{ chore_assignments : "verified_by_person_id"
    residences ||--o{ incidents : "residence_id"
    residencies |o--o{ incidents : "residency_id"
    people |o--o{ incidents : "reported_by_person_id"
    people |o--o{ incidents : "reviewed_by_person_id"
    residences ||--o{ grievances : "residence_id"
    people ||--o{ grievances : "filed_by_person_id"
    people |o--o{ grievances : "resolved_by_person_id"
    residences ||--o{ house_posts : "residence_id"
    people ||--o{ house_posts : "author_person_id"
    organizations ||--o{ meetings : "organization_id"
    residences |o--o{ meetings : "residence_id"
    meetings ||--o{ meeting_attendance : "meeting_id"
    people ||--o{ meeting_attendance : "person_id"
    people |o--o{ meeting_attendance : "recorded_by_person_id"
```

## 6. Compliance & Documents

NARR standards and the Iowa checklist track residence certification; document templates/versions/assignments handle policies, agreements, and signatures.

```mermaid
erDiagram
    narr_standards {
        bigint id PK
        text code
        int domain
        text title
        int sort
    }
    narr_compliance {
        bigint id PK
        bigint residence_id FK
        bigint standard_id FK
        text status
        text evidence
        bigint verified_by_person_id FK
        timestamptz verified_at
        date next_review_on
    }
    iowa_checklist_items {
        bigint id PK
        int item_no
        text title
    }
    iowa_checklist_status {
        bigint id PK
        bigint residence_id FK
        bigint item_id FK
        text status
        text evidence
        bigint verified_by_person_id FK
        timestamptz verified_at
    }
    document_templates {
        bigint id PK
        bigint organization_id FK
        bigint residence_id FK
        text key
        text name
        bool is_active
        bool requires_signature
        bool requires_acknowledgment
    }
    document_versions {
        bigint id PK
        bigint template_id FK
        text version
        text body_markdown
        timestamptz published_at
        text content_hash
    }
    document_assignments {
        bigint id PK
        bigint document_version_id FK
        bigint person_id FK
        bigint residency_id FK
        bigint application_id FK
        timestamptz assigned_at
        timestamptz acknowledged_at
        text signature_name
        timestamptz signed_at
        text signature_method
    }

    residences ||--o{ narr_compliance : "residence_id"
    narr_standards ||--o{ narr_compliance : "standard_id"
    people |o--o{ narr_compliance : "verified_by_person_id"
    residences ||--o{ iowa_checklist_status : "residence_id"
    iowa_checklist_items ||--o{ iowa_checklist_status : "item_id"
    people |o--o{ iowa_checklist_status : "verified_by_person_id"
    organizations ||--o{ document_templates : "organization_id"
    residences |o--o{ document_templates : "residence_id"
    document_templates ||--o{ document_versions : "template_id"
    document_versions ||--o{ document_assignments : "document_version_id"
    people ||--o{ document_assignments : "person_id"
    residencies |o--o{ document_assignments : "residency_id"
    residence_applications |o--o{ document_assignments : "application_id"
```

## 7. Coaching, Navigation & Community Resources

Coaching and navigation are separate relationship types. Navigation work flows Need → Referral → (connection evidence), preserving the doctrine that a referral is not automatically a connection. `domains` is the ratified canonical domain taxonomy; `resource_domains` is a multi-domain lens over community `resources`.

```mermaid
erDiagram
    coaching_relationships {
        bigint id PK
        bigint participant_person_id FK
        bigint coach_person_id FK
        bigint organization_id FK
        text status
        text relationship_type
        bool is_primary
        bigint assigned_by_person_id FK
        text assignment_source
        date started_at
        date ended_at
        text end_reason
        uuid legacy_ref
        timestamptz created_at
        timestamptz updated_at
    }
    navigation_relationships {
        bigint id PK
        bigint participant_person_id FK
        bigint navigator_person_id FK
        bigint organization_id FK
        text status
        bool is_primary
        bigint assigned_by_person_id FK
        text assignment_source
        date started_at
        date ended_at
        text end_reason
        timestamptz created_at
        timestamptz updated_at
    }
    navigation_needs {
        bigint id PK
        bigint person_id FK
        bigint navigation_relationship_id FK
        bigint support_request_id FK
        text need_category
        text status
        timestamptz identified_at
        timestamptz resolved_at
        text note
        bigint created_by_person_id FK
        timestamptz created_at
        timestamptz updated_at
    }
    navigation_referrals {
        bigint id PK
        bigint person_id FK
        bigint navigation_relationship_id FK
        bigint navigation_need_id FK
        bigint resource_id FK
        bigint organization_id FK
        text destination_name
        text referral_type
        text status
        text connection_evidence
        timestamptz attempted_at
        timestamptz connected_at
        timestamptz closed_at
        text note
        bigint created_by_person_id FK
        timestamptz created_at
        timestamptz updated_at
    }
    resources {
        bigint id PK
        text name
        text resource_type
        text category
        text description
        bool is_crisis
        text_array crisis_types
        text phone
        text phone_secondary
        text text_number
        text chat_url
        text email
        text website
        text address_line1
        text address_line2
        text city
        text state
        text zip_code
        text county
        text_array counties
        bool is_statewide
        bool is_virtual
        text hours
        bool is_24_7
        text_array languages
        bool walk_in_accepted
        bool appointment_required
        bool is_free
        bool sliding_scale
        bool medicaid_accepted
        bool recovery_friendly
        bool mat_friendly
        bool justice_involved
        bool peer_led
        bool faith_based
        bool trauma_informed
        bool is_gfa_partner
        text referral_process
        int display_order
        bool is_active
        text notes
        text source_generation
        timestamptz created_at
        timestamptz updated_at
    }
    domains {
        text key PK
        text participant_label
        text staff_label
        text definition
        int sort
        bool is_active
    }
    domain_subcategories {
        text key PK
        text domain_key FK
        text display_label
        bool is_cross_cutting
    }
    domain_external_mappings {
        bigint id PK
        text domain_key FK
        text system
        text external_code
        text note
    }
    resource_domains {
        bigint resource_id PK "FK"
        text domain_key PK "FK"
    }

    people ||--o{ coaching_relationships : "participant_person_id"
    people ||--o{ coaching_relationships : "coach_person_id"
    organizations ||--o{ coaching_relationships : "organization_id"
    people |o--o{ coaching_relationships : "assigned_by_person_id"
    people ||--o{ navigation_relationships : "participant_person_id"
    people ||--o{ navigation_relationships : "navigator_person_id"
    organizations ||--o{ navigation_relationships : "organization_id"
    people |o--o{ navigation_relationships : "assigned_by_person_id"
    people ||--o{ navigation_needs : "person_id"
    navigation_relationships |o--o{ navigation_needs : "navigation_relationship_id"
    support_requests |o--o{ navigation_needs : "support_request_id"
    people |o--o{ navigation_needs : "created_by_person_id"
    people ||--o{ navigation_referrals : "person_id"
    navigation_needs |o--o{ navigation_referrals : "navigation_need_id"
    navigation_relationships |o--o{ navigation_referrals : "navigation_relationship_id"
    resources |o--o{ navigation_referrals : "resource_id"
    organizations |o--o{ navigation_referrals : "organization_id"
    people |o--o{ navigation_referrals : "created_by_person_id"
    domains |o--o{ domain_subcategories : "domain_key"
    domains ||--o{ domain_external_mappings : "domain_key"
    resources ||--o{ resource_domains : "resource_id"
    domains ||--o{ resource_domains : "domain_key"
```

## 8. Support Requests, Booking & Service Delivery

The request-to-service flow: a `support_request` (an initiating state, never itself a delivered service) can lead to a `booking_request` with negotiated `booking_proposals`, which becomes an `appointment`, and delivered work is recorded as a `service_event` typed by the canonical `service_types` taxonomy. Note the intentional circular pairs between `appointments` and `booking_requests`/`service_events` (each side points at the other).

```mermaid
erDiagram
    support_requests {
        bigint id PK
        bigint person_id FK
        bigint service_type_id FK
        text request_type
        text focus
        service_modality preferred_modality
        text status
        text urgency
        delivery_context delivery_context
        bigint organization_id FK
        bigint program_id FK
        bigint claimed_by_person_id FK
        timestamptz claimed_at
        bigint coaching_relationship_id FK
        bigint navigation_relationship_id FK
        timestamptz assigned_at
        timestamptz resolved_at
        timestamptz closed_at
        timestamptz cancelled_at
        bigint last_actor_person_id FK
        uuid legacy_ref
        timestamptz created_at
        timestamptz updated_at
    }
    support_request_events {
        bigint id PK
        bigint support_request_id FK
        text event_type
        bigint actor_person_id FK
        jsonb detail
        timestamptz created_at
    }
    booking_requests {
        bigint id PK
        bigint support_request_id FK
        bigint participant_person_id FK
        bigint provider_person_id FK
        bigint coaching_relationship_id FK
        bigint service_type_id FK
        service_modality modality
        int duration_minutes
        text status
        bigint initiated_by_person_id FK
        text note
        bigint appointment_id FK
        bigint reschedule_of_appointment_id FK
        uuid legacy_ref
        timestamptz created_at
        timestamptz updated_at
    }
    booking_proposals {
        bigint id PK
        bigint booking_request_id FK
        bigint proposed_by_person_id FK
        timestamptz proposed_start
        timestamptz proposed_end
        int round
        bool is_active
        bool accepted
        bool rejected
        timestamptz created_at
    }
    appointments {
        bigint id PK
        bigint person_id FK
        bigint provider_person_id FK
        bigint service_type_id FK
        text title
        timestamptz starts_at
        timestamptz ends_at
        text location_note
        text status
        bigint organization_id FK
        bigint program_id FK
        service_modality modality
        text meeting_provider
        text meeting_url
        text timezone
        bigint requested_by_person_id FK
        bigint confirmed_by_person_id FK
        timestamptz confirmed_at
        bigint rescheduled_from_appointment_id FK
        timestamptz cancelled_at
        text cancellation_reason
        bool follow_up_due
        bigint service_event_id FK
        bigint booking_request_id FK
        bigint support_request_id FK
        bigint coaching_relationship_id FK
        uuid legacy_ref
        timestamptz created_at
        timestamptz updated_at
    }
    appointment_reminders {
        bigint id PK
        bigint appointment_id FK
        text kind
        timestamptz remind_at
        timestamptz sent_at
        timestamptz canceled_at
        int attempts
        text last_error
        timestamptz created_at
    }
    service_types {
        bigint id PK
        text key
        text name
        text category
        bool is_active
    }
    service_events {
        bigint id PK
        bigint person_id FK
        bigint service_type_id FK
        bigint provider_person_id FK
        bigint organization_id FK
        bigint program_id FK
        bigint residence_id FK
        bigint residency_id FK
        delivery_context delivery_context
        service_modality modality
        timestamptz started_at
        timestamptz ended_at
        text outcome_status
        bigint funding_source_id FK
        bigint appointment_id FK
        bigint coaching_relationship_id FK
        bigint navigation_relationship_id FK
        bigint navigation_referral_id FK
        text source
        uuid dedupe_key
        timestamptz created_at
    }
    follow_ups {
        bigint id PK
        bigint person_id FK
        bigint assigned_person_id FK
        bigint appointment_id FK
        bigint service_event_id FK
        text follow_up_type
        timestamptz due_at
        text status
        text note
        timestamptz completed_at
        bigint created_by_person_id FK
        uuid legacy_ref
        timestamptz created_at
        timestamptz updated_at
    }

    people ||--o{ support_requests : "person_id"
    service_types |o--o{ support_requests : "service_type_id"
    organizations |o--o{ support_requests : "organization_id"
    programs |o--o{ support_requests : "program_id"
    people |o--o{ support_requests : "claimed_by_person_id"
    people |o--o{ support_requests : "last_actor_person_id"
    coaching_relationships |o--o{ support_requests : "coaching_relationship_id"
    navigation_relationships |o--o{ support_requests : "navigation_relationship_id"
    support_requests ||--o{ support_request_events : "support_request_id"
    people |o--o{ support_request_events : "actor_person_id"
    support_requests |o--o{ booking_requests : "support_request_id"
    people ||--o{ booking_requests : "participant_person_id"
    people |o--o{ booking_requests : "provider_person_id"
    people |o--o{ booking_requests : "initiated_by_person_id"
    coaching_relationships |o--o{ booking_requests : "coaching_relationship_id"
    service_types |o--o{ booking_requests : "service_type_id"
    appointments |o--o{ booking_requests : "appointment_id"
    appointments |o--o{ booking_requests : "reschedule_of_appointment_id"
    booking_requests ||--o{ booking_proposals : "booking_request_id"
    people ||--o{ booking_proposals : "proposed_by_person_id"
    people ||--o{ appointments : "person_id"
    people |o--o{ appointments : "provider_person_id"
    people |o--o{ appointments : "requested_by_person_id"
    people |o--o{ appointments : "confirmed_by_person_id"
    service_types |o--o{ appointments : "service_type_id"
    organizations |o--o{ appointments : "organization_id"
    programs |o--o{ appointments : "program_id"
    appointments |o--o{ appointments : "rescheduled_from_appointment_id"
    service_events |o--o{ appointments : "service_event_id"
    booking_requests |o--o{ appointments : "booking_request_id"
    support_requests |o--o{ appointments : "support_request_id"
    coaching_relationships |o--o{ appointments : "coaching_relationship_id"
    appointments ||--o{ appointment_reminders : "appointment_id"
    people ||--o{ service_events : "person_id"
    service_types ||--o{ service_events : "service_type_id"
    people |o--o{ service_events : "provider_person_id"
    organizations ||--o{ service_events : "organization_id"
    programs |o--o{ service_events : "program_id"
    residences |o--o{ service_events : "residence_id"
    residencies |o--o{ service_events : "residency_id"
    funding_sources |o--o{ service_events : "funding_source_id"
    appointments |o--o{ service_events : "appointment_id"
    coaching_relationships |o--o{ service_events : "coaching_relationship_id"
    navigation_relationships |o--o{ service_events : "navigation_relationship_id"
    navigation_referrals |o--o{ service_events : "navigation_referral_id"
    people ||--o{ follow_ups : "person_id"
    people |o--o{ follow_ups : "assigned_person_id"
    people |o--o{ follow_ups : "created_by_person_id"
    appointments |o--o{ follow_ups : "appointment_id"
    service_events |o--o{ follow_ups : "service_event_id"
```

## 9. Recovery Plans & Wellbeing

Person-owned recovery planning (plan → goals → action steps, with goals optionally tied to a canonical domain), daily check-ins, and recovery capital assessments. `slogans` is a standalone content library referenced by check-ins by number, not by FK.

```mermaid
erDiagram
    recovery_plans {
        bigint id PK
        bigint person_id FK
        text title
        text status
        timestamptz created_at
        timestamptz updated_at
    }
    goals {
        bigint id PK
        bigint person_id FK
        bigint recovery_plan_id FK
        text domain_key FK
        text title
        text detail
        goal_status status
        date target_date
        timestamptz created_at
        timestamptz updated_at
    }
    action_steps {
        bigint id PK
        bigint goal_id FK
        text title
        bool is_done
        date due_date
        timestamptz created_at
    }
    check_ins {
        bigint id PK
        bigint person_id FK
        text period
        date local_date
        int mood_rating
        int craving_rating
        int hope_rating
        int confidence_rating
        int purpose_rating
        text connection_level
        text intention
        text reflection
        text carry_forward
        text_array challenge_tags
        text prompt_quadrant
        text prompt_response
        int prompt_skips
        bigint paired_check_in_id FK
        text_array response_rule_ids
        int slogan_number
        text note
        delivery_context delivery_context
        timestamptz created_at
    }
    recovery_capital_assessments {
        bigint id PK
        bigint person_id FK
        text instrument_key
        jsonb responses
        numeric total_score
        delivery_context delivery_context
        timestamptz completed_at
    }
    slogans {
        bigint id PK
        text slogan_text
        text slogan_short
        text author_credit
        text category
        text_array tags
        int hope_factor
        int action_factor
        int community_factor
        int resilience_factor
        int identity_factor
        int grace_factor
        int neuroplasticity_factor
        numeric composite_score
        text_array applicable_enneagram_types
        text_array applicable_true_colors
        text_array applicable_stages
        bool is_grace_centered
        bool is_active
        timestamptz created_at
    }

    people ||--o{ recovery_plans : "person_id"
    people ||--o{ goals : "person_id"
    recovery_plans |o--o{ goals : "recovery_plan_id"
    domains |o--o{ goals : "domain_key"
    goals ||--o{ action_steps : "goal_id"
    people ||--o{ check_ins : "person_id"
    check_ins |o--o{ check_ins : "paired_check_in_id"
    people ||--o{ recovery_capital_assessments : "person_id"
```

## 10. Consent & Supervision Coordination

Consent is first-class: typed, scoped, versioned, and revocable. Supervision coordination records (e.g., probation/parole contact) require an explicit consent grant.

```mermaid
erDiagram
    consent_types {
        bigint id PK
        text key
        consent_category category
        text name
        text description
        bool is_required_for_service
        bool is_active
    }
    consent_grants {
        bigint id PK
        bigint person_id FK
        bigint consent_type_id FK
        consent_status status
        jsonb scope
        text method
        text document_version
        timestamptz effective_at
        timestamptz expires_at
        timestamptz revoked_at
        bigint created_by_person_id FK
        timestamptz created_at
    }
    supervision_coordination_records {
        bigint id PK
        bigint person_id FK
        bigint consent_grant_id FK
        text officer_name
        text officer_phone
        text agency
        text obligations_summary
        bool is_active
        bigint recorded_by_person_id FK
        timestamptz created_at
    }

    people ||--o{ consent_grants : "person_id"
    consent_types ||--o{ consent_grants : "consent_type_id"
    people |o--o{ consent_grants : "created_by_person_id"
    people ||--o{ supervision_coordination_records : "person_id"
    consent_grants ||--o{ supervision_coordination_records : "consent_grant_id"
    people |o--o{ supervision_coordination_records : "recorded_by_person_id"
```

## 11. Messaging & Notifications

```mermaid
erDiagram
    conversations {
        bigint id PK
        bigint participant_person_id FK
        bigint coach_person_id FK
        bigint coaching_relationship_id FK
        bigint navigation_relationship_id FK
        text context
        uuid legacy_ref
        timestamptz created_at
        timestamptz updated_at
    }
    conversation_members {
        bigint id PK
        bigint conversation_id FK
        bigint person_id FK
        text member_role
        bool can_read_history
        timestamptz joined_at
    }
    messages {
        bigint id PK
        bigint conversation_id FK
        bigint sender_person_id FK
        text body
        timestamptz read_at
        uuid legacy_ref
        timestamptz created_at
    }
    notifications {
        bigint id PK
        bigint recipient_person_id FK
        text kind
        text title
        text body
        text link_path
        timestamptz read_at
        text dedup_key
        uuid legacy_ref
        timestamptz created_at
    }
    notification_deliveries {
        bigint id PK
        bigint notification_id FK
        text channel
        text status
        text detail
        timestamptz created_at
    }

    people ||--o{ conversations : "participant_person_id"
    people ||--o{ conversations : "coach_person_id"
    coaching_relationships |o--o{ conversations : "coaching_relationship_id"
    navigation_relationships |o--o{ conversations : "navigation_relationship_id"
    conversations ||--o{ conversation_members : "conversation_id"
    people ||--o{ conversation_members : "person_id"
    conversations ||--o{ messages : "conversation_id"
    people ||--o{ messages : "sender_person_id"
    people ||--o{ notifications : "recipient_person_id"
    notifications ||--o{ notification_deliveries : "notification_id"
```

## 12. System & Operational Logs

```mermaid
erDiagram
    audit_log {
        bigint id PK
        bigint actor_person_id FK
        text action
        text entity_table
        bigint entity_id
        jsonb detail
        timestamptz created_at
    }
    backfill_log {
        bigint id PK
        text domain
        int source_count
        int mapped_count
        int skipped_count
        int exception_count
        jsonb detail
        timestamptz run_at
    }

    people |o--o{ audit_log : "actor_person_id"
```

`audit_log.entity_table` / `entity_id` are a polymorphic reference to any table (no FK constraint by design).

## Deprecated: `public.housing_applications`

Superseded by `recoveryos.residence_application_intake` (Gate A containment, 2026-08-23). Retained as drift evidence and rollback material only — RLS enabled, no client privileges, no INSERT policy, 0 rows ever stored. No foreign keys. Columns: `id (uuid PK)`, `house_code`, `applicant_name`, `applicant_email`, `applicant_phone`, `county`, `personal (jsonb)`, `journey (jsonb)`, `your_why`, `consent_rules_reviewed`, `consent_share_with_house`, `consent_contact`, `status`, `source`, `submitted_at`, `intake_at`, `decided_at`, `decision_note`, `forms (jsonb)`, `signature (jsonb)`, `read_acknowledgments (jsonb)`, `created_at`, `updated_at`.

---

*Regeneration note: this document was generated from `pg_catalog` (tables, columns, primary keys, and foreign-key constraints of schema `recoveryos`). If the schema changes, regenerate from the live catalog rather than editing diagrams by hand.*
