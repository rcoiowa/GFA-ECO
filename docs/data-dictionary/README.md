# RecoveryOS Data Dictionary

Canonical schema lives in `supabase/migrations/` (apply in filename order). Types are
mirrored in `packages/domain`. This is the domain map; column-level detail is in the SQL.

## Identity (0002)

| Table             | Purpose                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `people`          | One row per human. `auth_user_id` links to Supabase auth (nullable — people can exist before accounts). |
| `person_profiles` | Preferences: accessibility, communication, timezone, recovery date.                                     |
| `contact_methods` | Email/phone/sms/mail entries per person.                                                                |

## Organizations (0002)

| Table                                      | Purpose                                                                                                          |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `organizations`                            | GFA, residence operators, partners, funders.                                                                     |
| `organization_relationships`               | Explicit owner/operator/manager/provider/referrer/funder links between orgs — no embedded ownership assumptions. |
| `locations`, `programs`, `funding_sources` | Physical sites, program definitions (`vrcc`, `anchor`), funding attribution targets.                             |

## Roles & participation (0003)

| Table                 | Purpose                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `role_assignments`    | Scoped roles (org / program / residence), revocable, auditable.                                                     |
| `program_enrollments` | VRCC/ANCHOR participation with lifecycle status. One live enrollment per person per program (partial unique index). |

## Residences (0004)

| Table                                                                   | Purpose                                                                                         |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `residences` → `residence_units` → `residence_rooms` → `residence_beds` | Physical hierarchy.                                                                             |
| `residence_applications`                                                | Admission pipeline.                                                                             |
| `residencies`                                                           | The person↔residence relationship: admission, status, discharge. One live residency per person. |
| `bed_assignments`                                                       | Bed occupancy history; one active assignment per bed.                                           |

## Services & recovery (0005)

| Table                                                                            | Purpose                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------ |
| `service_types`, `service_events`                                                | The attribution spine (ADR-0005).          |
| `recovery_plans`, `goals`, `action_steps`                                        | Recovery planning engine.                  |
| `check_ins`, `recovery_capital_assessments`                                      | Self-report engines with delivery context. |
| `coaching_relationships`, `navigation_relationships`, `support_team_memberships` | Explicit professional/peer relationships.  |

## Scheduling & residence operations (0006)

`appointments`, `meetings`, `meeting_attendance`; residence-scoped: `residence_chores`,
`chore_assignments`, `curfew_schedules`, `curfew_exceptions`, `passes`, `screenings`,
`incidents`, `grievances`.

## Consent, documents, audit (0007)

`consent_types`, `consent_grants` (append-only, ADR-0009); `document_templates`,
`document_versions`, `document_assignments`; `audit_log`.

## Analytics (0008)

Views: `analytics_people_served` (deduplicated), `analytics_participation_classification`
(VRCC-only / resident / both), `analytics_service_events` (full attribution),
`analytics_residence_occupancy`.

## Security (0009)

RLS on every table; helpers `current_person_id()`, `has_role()`, `staff_residence_ids()`;
RPC `ensure_person_for_current_user()`.
