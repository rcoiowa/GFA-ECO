import type {
  ConsentCategory,
  ConsentStatus,
  DeliveryContext,
  EnrollmentStatus,
  ResidencyStatus,
  RoleKey,
  ServiceModality,
} from './enums';

/**
 * Canonical entity types. Field names match the PostgreSQL schema exactly
 * (snake_case) so rows from data-access need no mapping layer.
 * Primary keys are bigint identities, surfaced as number.
 */

export interface Person {
  id: number;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  pronouns: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonProfile {
  person_id: number;
  bio: string | null;
  recovery_date: string | null;
  accessibility_preferences: Record<string, unknown>;
  communication_preferences: Record<string, unknown>;
  timezone: string;
  updated_at: string;
}

export interface Organization {
  id: number;
  name: string;
  organization_type: string;
  parent_organization_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Program {
  id: number;
  organization_id: number;
  key: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface RoleAssignment {
  id: number;
  person_id: number;
  role_key: RoleKey;
  organization_id: number | null;
  program_id: number | null;
  residence_id: number | null;
  granted_at: string;
  revoked_at: string | null;
}

export interface ProgramEnrollment {
  id: number;
  person_id: number;
  program_id: number;
  status: EnrollmentStatus;
  referral_source: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface Residence {
  id: number;
  organization_id: number;
  name: string;
  address_city: string | null;
  address_state: string | null;
  capacity: number | null;
  is_active: boolean;
}

export interface Residency {
  id: number;
  person_id: number;
  residence_id: number;
  program_enrollment_id: number | null;
  admission_date: string | null;
  anticipated_exit_date: string | null;
  discharge_date: string | null;
  residency_status: ResidencyStatus;
  bed_assignment_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceEvent {
  id: number;
  person_id: number;
  service_type_id: number;
  provider_person_id: number | null;
  organization_id: number;
  program_id: number | null;
  residence_id: number | null;
  residency_id: number | null;
  delivery_context: DeliveryContext;
  modality: ServiceModality;
  started_at: string;
  ended_at: string | null;
  outcome_status: string | null;
  funding_source_id: number | null;
  created_at: string;
}

export interface ConsentGrant {
  id: number;
  person_id: number;
  consent_type_id: number;
  status: ConsentStatus;
  scope: Record<string, unknown>;
  method: string;
  document_version: string | null;
  effective_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  created_by_person_id: number | null;
  created_at: string;
}

export interface ConsentType {
  id: number;
  key: string;
  category: ConsentCategory;
  name: string;
  description: string | null;
  is_required_for_service: boolean;
  is_active: boolean;
}

export interface Goal {
  id: number;
  person_id: number;
  recovery_plan_id: number | null;
  title: string;
  detail: string | null;
  status: 'active' | 'achieved' | 'paused' | 'archived';
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: number;
  person_id: number;
  mood_rating: number | null;
  craving_rating: number | null;
  note: string | null;
  delivery_context: DeliveryContext;
  created_at: string;
}
