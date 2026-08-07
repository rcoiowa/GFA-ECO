import { getSupabase } from '../client';

/**
 * Canonical coaching WRITE services (P3C — canonical write authority).
 *
 * The write counterpart to coachingReads.ts. Every critical workflow transition
 * goes through a server-authoritative `recoveryos` SECURITY DEFINER RPC — the
 * client never mutates canonical tables directly, never supplies identity, and
 * never supplies a role. Authority is derived inside the RPC from the JWT →
 * people → role_assignments → active relationship. `v2_profiles.role`,
 * `body.coach_id`, and route names are never trusted.
 *
 * Each function returns the RPC's `{ ok, code, message?, ...ids }` envelope
 * verbatim so callers map domain codes to UX and never see SQL internals.
 *
 * Cutover status is tracked per domain in `recoveryos.write_authority`. These
 * functions are the canonical write path; a domain only becomes production
 * write-authoritative when its `write_authority` row is flipped to 'canonical'
 * AND a real consumer calls these functions (P3C runbook). Until then the v2
 * path remains authoritative and these coexist as the prepared canonical writer.
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

// ---- bookingService (writes) -----------------------------------------------

/** Participant or coach accepts a proposed time; creates exactly one confirmed appointment. */
export function acceptBookingProposal(proposalId: number): Promise<RpcResult> {
  return callRpc('accept_booking_proposal', { p_proposal_id: proposalId });
}

// NOTE: createBookingRequest / proposeBookingTimes / cancelBooking / reschedule and
// meeting provisioning land with the booking+appointment write cutover (P3C-B). They are
// intentionally not exposed until that domain's gate is met, to avoid a half-wired
// scheduling surface.
