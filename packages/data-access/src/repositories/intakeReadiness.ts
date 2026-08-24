import { getSupabase } from '../client';

/**
 * Gate B (B2–B4) wrappers: residence consent extension, conditional intake
 * data, intake conversion, and the derived readiness checklist. All writes go
 * through audited SECURITY DEFINER RPCs (0140–0142) — there is no direct table
 * write path. These return the RPC envelope instead of throwing on business
 * refusals (confirm_required, intake_incomplete, override_not_permitted…),
 * because the staff UI must branch on those codes, not treat them as crashes.
 * (Staff surfaces land in B5; these wrappers are the sanctioned call sites.)
 */

export interface IntakeRpcResult {
  ok: boolean;
  code?: string;
  message?: string;
  [key: string]: unknown;
}

async function callRpc(fn: string, args: Record<string, unknown>): Promise<IntakeRpcResult> {
  const { data, error } = await getSupabase().rpc(fn, args);
  if (error) throw error;
  return (data as IntakeRpcResult) ?? { ok: false, code: 'empty' };
}

// ---- B2: residence consent types (canonical consent_grants) -----------------

export type ResidenceConsentTypeKey =
  | 'residence_screening'
  | 'information_disclosure'
  | 'supervision_coordination';

export type DisclosureInformationCategory =
  | 'residency_status'
  | 'screening_results'
  | 'attendance'
  | 'medication_presence'
  | 'progress_summary';

/** Structured ROI scope for the disclosure-shaped consent types. */
export interface DisclosureScope {
  recipient_name: string;
  recipient_organization?: string;
  recipient_relationship?: string;
  information_scope: DisclosureInformationCategory[];
  purpose: string;
  notes?: string;
}

export async function recordResidenceConsentGrant(input: {
  personId: number;
  typeKey: ResidenceConsentTypeKey;
  scope?: DisclosureScope | Record<string, never>;
  method?: 'in_app' | 'verbal_witnessed' | 'paper';
  expiresAt?: string;
}): Promise<IntakeRpcResult & { grant_id?: number }> {
  return callRpc('record_consent_grant', {
    p_person_id: input.personId,
    p_type_key: input.typeKey,
    p_scope: input.scope ?? {},
    p_method: input.method ?? 'in_app',
    p_expires_at: input.expiresAt ?? null,
  });
}

export async function revokeConsentGrant(input: {
  grantId: number;
  reason?: string;
}): Promise<IntakeRpcResult> {
  return callRpc('revoke_consent_grant', {
    p_grant_id: input.grantId,
    p_reason: input.reason ?? null,
  });
}

// ---- B4: conditional intake data (strict minimization) ----------------------

export async function recordEmergencyContact(input: {
  personId: number;
  name: string;
  phone: string;
  relationship?: string;
  notifyAuthorized?: boolean;
}): Promise<IntakeRpcResult & { contact_id?: number }> {
  return callRpc('record_emergency_contact', {
    p_person_id: input.personId,
    p_name: input.name,
    p_phone: input.phone,
    p_relationship: input.relationship ?? null,
    p_notify_authorized: input.notifyAuthorized ?? true,
  });
}

export async function recordMedicationItem(input: {
  personId: number;
  name: string;
  storageRequirement?: 'self_managed' | 'secure_storage' | 'staff_count';
  isMoud?: boolean;
  prescriberOnFile?: boolean;
}): Promise<IntakeRpcResult & { item_id?: number }> {
  return callRpc('record_medication_item', {
    p_person_id: input.personId,
    p_name: input.name,
    p_storage_requirement: input.storageRequirement ?? 'self_managed',
    p_is_moud: input.isMoud ?? false,
    p_prescriber_on_file: input.prescriberOnFile ?? false,
  });
}

export async function endMedicationItem(itemId: number): Promise<IntakeRpcResult> {
  return callRpc('end_medication_item', { p_item_id: itemId });
}

/**
 * One-tap outcome of the medication conversation when the person has NO current
 * medications (0143). A normal satisfied intake state — never an override, never
 * a fabricated medication row. Superseded automatically if an item is recorded.
 */
export async function confirmNoCurrentMedications(
  personId: number,
): Promise<IntakeRpcResult & { review_id?: number }> {
  return callRpc('confirm_no_current_medications', { p_person_id: personId });
}

export async function recordSupervisionCoordination(input: {
  personId: number;
  consentGrantId: number;
  officerName: string;
  officerPhone?: string;
  agency?: string;
  obligationsSummary?: string;
}): Promise<IntakeRpcResult & { record_id?: number }> {
  return callRpc('record_supervision_coordination', {
    p_person_id: input.personId,
    p_consent_grant_id: input.consentGrantId,
    p_officer_name: input.officerName,
    p_officer_phone: input.officerPhone ?? null,
    p_agency: input.agency ?? null,
    p_obligations_summary: input.obligationsSummary ?? null,
  });
}

// ---- B3: conversion + derived readiness --------------------------------------

/**
 * Deliberate staff conversion of a pre-account intake into the canonical
 * application. `confirm` acknowledges an identity warning (email_mismatch /
 * email_matches_other_person) after human verification — never pass it
 * preemptively.
 */
export async function convertApplicationIntake(input: {
  intakeId: number;
  personId: number;
  confirm?: boolean;
}): Promise<IntakeRpcResult & { application_id?: number; warnings?: string[] }> {
  return callRpc('convert_application_intake', {
    p_intake_id: input.intakeId,
    p_person_id: input.personId,
    p_confirm: input.confirm ?? false,
  });
}

/** One readiness checklist item (§9a six-class taxonomy). */
export interface ReadinessItem {
  key: string;
  label: string;
  class:
    | 'required_for_intake_completion'
    | 'required_before_admission'
    | 'conditionally_required'
    | 'recommended'
    | 'deferred_with_follow_up'
    | 'not_applicable';
  status:
    | 'met'
    | 'missing'
    | 'unconfirmed'
    | 'reviewed_none'
    | 'needs_staff_review'
    | 'pending_document_edition'
    | 'not_applicable';
  met: boolean;
  overridable: boolean;
}

export async function applicationIntakeReadiness(
  applicationId: number,
): Promise<IntakeRpcResult & { complete?: boolean; items?: ReadinessItem[]; blocking_unmet?: string[] }> {
  return callRpc('application_intake_readiness', { p_application_id: applicationId });
}

/**
 * The deliberate move-in action (B3 admit_applicant v2): manager/admin gated,
 * readiness-gated, with the narrow audited override for deferrable items only.
 * Approval never calls this — admission is its own human act.
 */
export async function admitApplicant(input: {
  applicationId: number;
  bedId?: number;
  admissionDate?: string;
  override?: boolean;
  overrideReason?: string;
}): Promise<IntakeRpcResult & { residency_id?: number }> {
  return callRpc('admit_applicant', {
    p_application_id: input.applicationId,
    p_bed_id: input.bedId ?? null,
    p_admission_date: input.admissionDate ?? new Date().toISOString().slice(0, 10),
    p_override: input.override ?? false,
    p_override_reason: input.overrideReason ?? null,
  });
}

export interface IntakeConversionCandidate {
  person_id: number;
  first_name: string;
  last_name: string;
  matched_intake_email: boolean;
}

/**
 * Find the account(s) matching an intake row's email (or an email the applicant
 * states in person) so staff can convert to the RIGHT person (0144). Minimum
 * disclosure: id + name only, for one intake the caller already reviews.
 */
export async function findPersonForIntakeConversion(input: {
  intakeId: number;
  email?: string;
}): Promise<IntakeRpcResult & { candidates?: IntakeConversionCandidate[] }> {
  return callRpc('find_person_for_intake_conversion', {
    p_intake_id: input.intakeId,
    p_email: input.email ?? null,
  });
}

export interface MedicationItem {
  id: number;
  person_id: number;
  name: string;
  storage_requirement: 'self_managed' | 'secure_storage' | 'staff_count';
  is_moud: boolean;
  prescriber_on_file: boolean;
  started_at: string;
  ended_at: string | null;
}

/** Active medication items for a person (RLS: self, or staff of their residence). */
export async function listActiveMedicationItems(personId: number): Promise<MedicationItem[]> {
  const { data, error } = await getSupabase()
    .from('residency_medication_items')
    .select('id, person_id, name, storage_requirement, is_moud, prescriber_on_file, started_at, ended_at')
    .eq('person_id', personId)
    .is('ended_at', null)
    .order('started_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MedicationItem[];
}
