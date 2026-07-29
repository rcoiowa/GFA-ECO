/**
 * Canonical enumerations for RecoveryOS.
 * These mirror the PostgreSQL enum types in supabase/migrations and are the
 * single source of truth for application code. Do not fork per experience.
 */

export const ROLE_KEYS = [
  'participant',
  'resident',
  'coach',
  'navigator',
  'residence_staff',
  'residence_manager',
  'program_manager',
  'administrator',
  'executive',
  'system_administrator',
] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

/** Roles that grant access to each experience shell. */
export const EXPERIENCE_ROLES: Record<ExperienceKey, readonly RoleKey[]> = {
  vrcc: ['participant', 'resident'],
  resident: ['resident'],
  'residence-staff': ['residence_staff', 'residence_manager'],
  coach: ['coach'],
  navigator: ['navigator'],
  admin: ['program_manager', 'administrator', 'executive', 'system_administrator'],
};

export const EXPERIENCE_KEYS = [
  'vrcc',
  'resident',
  'residence-staff',
  'coach',
  'navigator',
  'admin',
] as const;
export type ExperienceKey = (typeof EXPERIENCE_KEYS)[number];

export const ENROLLMENT_STATUSES = [
  'inquiry',
  'eligible',
  'enrolled',
  'paused',
  'completed',
  'withdrawn',
  'ineligible',
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const RESIDENCY_STATUSES = [
  'applicant',
  'waitlisted',
  'approved',
  'active',
  'on_pass',
  'transitioning',
  'exited',
  'discharged',
] as const;
export type ResidencyStatus = (typeof RESIDENCY_STATUSES)[number];

export const DELIVERY_CONTEXTS = [
  'vrcc',
  'recovery_residence',
  'community_outreach',
  'justice_reentry',
  'partner_site',
  'virtual',
  'other',
] as const;
export type DeliveryContext = (typeof DELIVERY_CONTEXTS)[number];

export const SERVICE_MODALITIES = [
  'in_person',
  'video',
  'phone',
  'chat',
  'self_directed',
  'group',
] as const;
export type ServiceModality = (typeof SERVICE_MODALITIES)[number];

export const CONSENT_STATUSES = ['granted', 'declined', 'revoked', 'expired'] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export const CONSENT_CATEGORIES = [
  'account_identity',
  'service_participation',
  'coaching',
  'resource_navigation',
  'recovery_assessments',
  'residence_operations',
  'communications',
  'data_sharing',
  'ai_features',
  'analytics',
] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

export const ORGANIZATION_RELATIONSHIP_TYPES = [
  'owner',
  'operator',
  'manager',
  'service_provider',
  'referring_organization',
  'funding_organization',
  'recovery_support_partner',
] as const;
export type OrganizationRelationshipType = (typeof ORGANIZATION_RELATIONSHIP_TYPES)[number];
