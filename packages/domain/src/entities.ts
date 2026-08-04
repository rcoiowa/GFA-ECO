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
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  population_served: string | null;
  narr_level: string | null;
  narr_certification_status: 'certified' | 'pending' | 'in_preparation' | 'not_certified';
  narr_affiliate: string | null;
  shared_room_fee_weekly: number | null;
  private_room_fee_weekly: number | null;
  shared_room_fee_monthly: number | null;
  private_room_fee_monthly: number | null;
  accepts_mat: boolean;
  accepts_supervision: boolean;
  public_description: string | null;
  capacity: number | null;
  is_active: boolean;
  level_of_support: 'I' | 'II' | 'III' | 'IV' | null;
  commitments: string[];
  curfew_weeknight: string | null;
}

export interface ResidenceUnit {
  id: number;
  residence_id: number;
  name: string;
}

export interface ResidenceRoom {
  id: number;
  unit_id: number;
  name: string;
}

export interface ResidenceBed {
  id: number;
  room_id: number;
  name: string;
  is_active: boolean;
}

export interface BedAssignment {
  id: number;
  residency_id: number;
  bed_id: number;
  assigned_at: string;
  released_at: string | null;
}

export interface ResidenceApplication {
  id: number;
  person_id: number;
  residence_id: number;
  status: 'submitted' | 'in_review' | 'approved' | 'waitlisted' | 'declined' | 'withdrawn';
  submitted_at: string;
  decided_at: string | null;
  decided_by_person_id: number | null;
  notes: string | null;
  answers: Record<string, string>;
}

export interface Screening {
  id: number;
  residency_id: number;
  screening_type: string;
  collected_at: string;
  result: string | null;
  recorded_by_person_id: number | null;
}

export interface Incident {
  id: number;
  residence_id: number;
  residency_id: number | null;
  occurred_at: string;
  category: string;
  severity: number | null;
  summary: string;
  follow_up: string | null;
  reported_by_person_id: number | null;
  reviewed_by_person_id: number | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ResidencyPhase {
  id: number;
  residency_id: number;
  phase: number;
  started_on: string;
  note: string | null;
  recorded_by_person_id: number | null;
  created_at: string;
}

export interface FeeLedgerEntry {
  id: number;
  residency_id: number;
  entry_type: 'charge' | 'payment' | 'adjustment' | 'refund';
  amount: number;
  method: string | null;
  period_start: string | null;
  period_end: string | null;
  receipt_number: string | null;
  note: string | null;
  recorded_by_person_id: number | null;
  created_at: string;
}

export interface NarrStandard {
  id: number;
  code: string;
  domain: number;
  title: string;
  sort: number;
}

export interface NarrCompliance {
  id: number;
  residence_id: number;
  standard_id: number;
  status: 'met' | 'in_progress' | 'not_met' | 'not_applicable';
  evidence: string | null;
  verified_by_person_id: number | null;
  verified_at: string | null;
  next_review_on: string | null;
}

export interface IowaChecklistItem {
  id: number;
  item_no: number;
  title: string;
}

export interface IowaChecklistStatus {
  id: number;
  residence_id: number;
  item_id: number;
  status: 'yes' | 'in_progress' | 'no';
  evidence: string | null;
  verified_by_person_id: number | null;
  verified_at: string | null;
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

export interface DocumentTemplate {
  id: number;
  organization_id: number;
  key: string;
  name: string;
  requires_signature: boolean;
  is_active: boolean;
}

export interface DocumentVersion {
  id: number;
  template_id: number;
  version: string;
  body_markdown: string;
  published_at: string | null;
}

export interface DocumentAssignment {
  id: number;
  document_version_id: number;
  person_id: number;
  residency_id: number | null;
  assigned_at: string;
  acknowledged_at: string | null;
  signature_name: string | null;
}

export interface ResidenceChore {
  id: number;
  residence_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface ChoreAssignment {
  id: number;
  chore_id: number;
  residency_id: number;
  due_on: string;
  completed_at: string | null;
  verified_by_person_id: number | null;
}

export interface CurfewSchedule {
  id: number;
  residence_id: number;
  day_of_week: number;
  curfew_time: string;
}

export interface Pass {
  id: number;
  residency_id: number;
  starts_at: string;
  ends_at: string;
  destination: string | null;
  status: 'requested' | 'approved' | 'denied' | 'active' | 'returned' | 'overdue';
  decided_by_person_id: number | null;
  created_at: string;
}

export interface Meeting {
  id: number;
  organization_id: number;
  residence_id: number | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  is_required_for_residents: boolean;
  created_at: string;
}

export interface Grievance {
  id: number;
  residence_id: number;
  filed_by_person_id: number;
  summary: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  filed_at: string;
  resolved_at: string | null;
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
