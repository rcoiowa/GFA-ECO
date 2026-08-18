import { getSupabase } from '../client';

/**
 * Canonical coaching WRITE services (P3C — canonical write authority).
 *
 * The write counterpart to coachingReads.ts. Every critical workflow transition
 * goes through a server-authoritative `recoveryos` SECURITY DEFINER RPC — the
 * client never mutates canonical tables directly, never supplies identity, and
 * never supplies a role. Authority is derived inside the RPC from the JWT →
 * people → role_assignments → active relationship. Client-supplied
 * identity, role claims, and route names are never trusted.
 *
 * Each function returns the RPC's `{ ok, code, message?, ...ids }` envelope
 * verbatim so callers map domain codes to UX and never see SQL internals.
 *
 * Canonical RecoveryOS is the only write path — there is no legacy write
 * authority, no compatibility projection, and no transition state to consult.
 */

export interface RpcResult {
  ok: boolean;
  code: string;
  message?: string;
  [k: string]: unknown;
}

async function callRpc(fn: string, args: Record<string, unknown>): Promise<RpcResult> {
  const { data, error } = await getSupabase().rpc(fn, args);
  if (error) {
    // Surface a domain-shaped result rather than a raw PostgREST error.
    return { ok: false, code: 'rpc_error', message: 'That action could not be completed. Try again.' };
  }
  return (data as RpcResult) ?? { ok: false, code: 'empty', message: 'No result.' };
}

// ---- relationshipService (writes) ------------------------------------------

/** Coach self-claim or admin/navigator assign+transfer. Atomic, one active primary. */
export function assignParticipantCoach(input: {
  participantPersonId: number;
  coachPersonId: number;
  reason?: string;
}): Promise<RpcResult> {
  return callRpc('assign_participant_coach', {
    p_participant_person_id: input.participantPersonId,
    p_coach_person_id: input.coachPersonId,
    p_reason: input.reason ?? null,
  });
}

// ---- supportRequestService (writes) ----------------------------------------

/** Coach claims an open support request; creates/activates the relationship atomically. */
export function claimSupportRequest(supportRequestId: number): Promise<RpcResult> {
  return callRpc('claim_support_request', { p_support_request_id: supportRequestId });
}

/**
 * Participant creates a support request. Insert is RLS-guarded (person_id must be
 * the caller, status pinned open, unclaimed). Returns the created row id.
 */
export async function createSupportRequest(input: {
  personId: number;
  requestType: 'peer_support' | 'recovery_coach' | 'life_coach' | 'navigation' | 'needs_assessment';
  focus?: string;
  preferredModality?: 'in_person' | 'video' | 'phone' | 'chat';
}): Promise<{ id: number } | null> {
  const { data, error } = await getSupabase()
    .from('support_requests')
    .insert({
      person_id: input.personId,
      request_type: input.requestType,
      focus: input.focus ?? null,
      preferred_modality: input.preferredModality ?? 'video',
      status: 'open',
      organization_id: 1,
      program_id: 1,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

// ---- bookingService (writes) — the P3C-B scheduling transaction domain -------
//
// Booking + appointment are ONE transaction domain: a booking negotiation and its confirmed
// appointment are never independently authoritative. Every mutation goes through a canonical
// SECURITY DEFINER RPC that derives identity/role from the JWT and owns the transaction.
// `insertAppointment`/`updateAppointment(anyFields)` are deliberately NOT exposed — appointment
// state changes only through legitimate booking operations.

/** Create a booking request with initial proposed times. Participant- or coach-initiated. */
export function createBookingRequest(input: {
  participantPersonId: number;
  providerPersonId: number;
  supportRequestId?: number | null;
  serviceTypeId?: number;
  modality?: 'in_person' | 'video' | 'phone' | 'chat';
  durationMinutes?: number;
  note?: string;
  proposedStarts: string[]; // ISO timestamptz
}): Promise<RpcResult> {
  return callRpc('create_booking_request', {
    p_participant_person_id: input.participantPersonId,
    p_provider_person_id: input.providerPersonId,
    p_support_request_id: input.supportRequestId ?? null,
    p_service_type_id: input.serviceTypeId ?? 1,
    p_modality: input.modality ?? 'video',
    p_duration_minutes: input.durationMinutes ?? 50,
    p_note: input.note ?? null,
    p_starts: input.proposedStarts,
  });
}

/** Offer a new round of times on an open booking (supersedes the prior active set; history kept). */
export function proposeBookingTimes(bookingRequestId: number, starts: string[]): Promise<RpcResult> {
  return callRpc('propose_booking_times', { p_booking_request_id: bookingRequestId, p_starts: starts });
}

/** Counter-propose times — same transaction semantics as propose (round increments). */
export function counterProposeBookingTimes(bookingRequestId: number, starts: string[]): Promise<RpcResult> {
  return callRpc('counter_propose_booking_times', { p_booking_request_id: bookingRequestId, p_starts: starts });
}

/** Participant or coach accepts a proposed time; creates exactly one confirmed appointment. */
export function acceptBookingProposal(proposalId: number): Promise<RpcResult> {
  return callRpc('accept_booking_proposal', { p_proposal_id: proposalId });
}

/** Cancel a booking (and its confirmed appointment, if any). */
export function cancelBooking(bookingRequestId: number, reason?: string): Promise<RpcResult> {
  return callRpc('cancel_booking', { p_booking_request_id: bookingRequestId, p_reason: reason ?? null });
}

/**
 * Reschedule a confirmed appointment: marks it 'rescheduled' and opens a new booking whose
 * eventual appointment links back via `rescheduled_from_appointment_id` (history preserved).
 */
export function rescheduleBooking(appointmentId: number, starts: string[]): Promise<RpcResult> {
  return callRpc('reschedule_booking', { p_appointment_id: appointmentId, p_starts: starts });
}

// NOTE: notification generation and reminder seeding are SERVER-INTERNAL — domain triggers
// emit them when relationships/appointments change state; clients never call them directly.
// Meeting provisioning goes through the create-meeting Edge Function, which validates the
// caller against the canonical appointment via provision_appointment_meeting.
