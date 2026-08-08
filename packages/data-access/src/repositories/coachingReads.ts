import { getSupabase } from '../client';

/**
 * Canonical coaching READ services (P3B — canonical read authority).
 *
 * These are the trusted read layer for the coaching domain: every consumer
 * (the future Coach Workspace, participant Connect, Navigator/Admin/Residence
 * projections) reads relationships, requests, bookings, appointments,
 * conversations, and notifications through these functions — from the
 * `recoveryos` canonical schema, the platform's single source of truth.
 *
 * READ-ONLY by design — mutations live in coachingWrites.ts behind
 * server-authoritative RPCs.
 *
 * All access is RLS-scoped by the caller's JWT → person_id; identity is never
 * passed as a trust boundary. Pool/roster/coach-list reads are fixture-aware
 * (test/demo identities are excluded from production surfaces).
 */

// ---- contracts: promoted to @recoveryos/domain (P4B) — re-exported for consumers ----
export type {
  CoachRelationship,
  SupportRequestRow,
  OpenPoolRow,
  CanonicalAppointmentRow,
  NotificationRow,
  ConversationRow,
  MessageRow,
  SupportTeamMember,
  BookingStateRow,
  BookingProposalRow,
} from '@recoveryos/domain';
import type {
  CoachRelationship,
  SupportRequestRow,
  OpenPoolRow,
  CanonicalAppointmentRow,
  NotificationRow,
  ConversationRow,
  MessageRow,
  SupportTeamMember,
  BookingStateRow,
} from '@recoveryos/domain';

// ---- relationshipService ----------------------------------------------------

/** The participant's active primary coach relationship, or null. */
export async function getMyCoach(participantPersonId: number): Promise<CoachRelationship | null> {
  const { data, error } = await getSupabase()
    .from('coaching_relationships')
    .select('id, participant_person_id, coach_person_id, status, relationship_type, is_primary, started_at, ended_at')
    .eq('participant_person_id', participantPersonId)
    .eq('status', 'active')
    .eq('is_primary', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** A coach's active participant relationships. */
export async function getMyParticipants(coachPersonId: number): Promise<CoachRelationship[]> {
  const { data, error } = await getSupabase()
    .from('coaching_relationships')
    .select('id, participant_person_id, coach_person_id, status, relationship_type, is_primary, started_at, ended_at')
    .eq('coach_person_id', coachPersonId)
    .eq('status', 'active')
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---- supportRequestService --------------------------------------------------

export async function getMySupportRequests(personId: number): Promise<SupportRequestRow[]> {
  const { data, error } = await getSupabase()
    .from('support_requests')
    .select('id, person_id, request_type, focus, preferred_modality, status, claimed_by_person_id, claimed_at, cancelled_at, created_at')
    .eq('person_id', personId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * The open coaching pool a staff member may act on — fixture-aware and
 * progressive-disclosure-scoped by the SECURITY DEFINER RPC. Returns only the
 * fields a coach needs to decide whether to pick up a request.
 */
export async function getOpenSupportRequestPool(): Promise<OpenPoolRow[]> {
  const { data, error } = await getSupabase().rpc('list_open_support_requests');
  if (error) throw error;
  return (data as OpenPoolRow[]) ?? [];
}

// ---- appointmentService -----------------------------------------------------

/** A participant's upcoming appointments (own). */
export async function getMyUpcomingAppointments(personId: number): Promise<CanonicalAppointmentRow[]> {
  const { data, error } = await getSupabase()
    .from('appointments')
    .select('id, person_id, provider_person_id, status, starts_at, ends_at, modality, meeting_url, timezone, confirmed_at')
    .eq('person_id', personId)
    .in('status', ['scheduled', 'confirmed'])
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** A coach's upcoming appointments (as provider). */
export async function getCoachUpcomingAppointments(coachPersonId: number): Promise<CanonicalAppointmentRow[]> {
  const { data, error } = await getSupabase()
    .from('appointments')
    .select('id, person_id, provider_person_id, status, starts_at, ends_at, modality, meeting_url, timezone, confirmed_at')
    .eq('provider_person_id', coachPersonId)
    .in('status', ['scheduled', 'confirmed'])
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---- notificationService ----------------------------------------------------

export async function getMyNotifications(personId: number, limit = 40): Promise<NotificationRow[]> {
  const { data, error } = await getSupabase()
    .from('notifications')
    .select('id, kind, title, body, link_path, read_at, created_at')
    .eq('recipient_person_id', personId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ---- conversationService ----------------------------------------------------

/** Conversations the caller is a member of (membership-scoped by RLS). */
export async function getMyConversations(): Promise<ConversationRow[]> {
  const { data, error } = await getSupabase()
    .from('conversations')
    .select('id, participant_person_id, coach_person_id, context')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getConversationMessages(conversationId: number): Promise<MessageRow[]> {
  const { data, error } = await getSupabase()
    .from('messages')
    .select('id, conversation_id, sender_person_id, body, read_at, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

// ---- supportTeamService (P4B) ----------------------------------------------

/** The caller's active support relationships with appropriate public identity (RPC, progressive disclosure). */
export async function getMySupportTeam(): Promise<SupportTeamMember[]> {
  const { data, error } = await getSupabase().rpc('get_my_support_team');
  if (error) throw error;
  return (data as SupportTeamMember[]) ?? [];
}

// ---- bookingReadService (P4B) ----------------------------------------------

/**
 * The participant's booking negotiations with their active proposal round —
 * enough to explain "is scheduling underway / is a response waiting", not the
 * full negotiation UI (that lands with the interactive scheduling slice).
 */
export async function getMyBookingStates(participantPersonId: number): Promise<BookingStateRow[]> {
  const { data, error } = await getSupabase()
    .from('booking_requests')
    .select(
      'id, support_request_id, participant_person_id, provider_person_id, status, appointment_id, created_at, proposals:booking_proposals(id, booking_request_id, proposed_by_person_id, proposed_start, proposed_end, round, is_active, accepted)',
    )
    .eq('participant_person_id', participantPersonId)
    .in('status', ['open', 'confirmed'])
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data as unknown as BookingStateRow[]) ?? [];
}

/** A coach's booking negotiations (provider side) with active proposals (P4D). */
export async function getCoachBookingStates(coachPersonId: number): Promise<BookingStateRow[]> {
  const { data, error } = await getSupabase()
    .from('booking_requests')
    .select(
      'id, support_request_id, participant_person_id, provider_person_id, status, appointment_id, created_at, proposals:booking_proposals(id, booking_request_id, proposed_by_person_id, proposed_start, proposed_end, round, is_active, accepted)',
    )
    .eq('provider_person_id', coachPersonId)
    .in('status', ['open', 'confirmed'])
    .order('created_at', { ascending: false })
    .limit(25);
  if (error) throw error;
  return (data as unknown as BookingStateRow[]) ?? [];
}

// ---- notification writes (P4B) ----------------------------------------------

export async function getUnreadNotificationCount(personId: number): Promise<number> {
  const { count, error } = await getSupabase()
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_person_id', personId)
    .is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}

/** Mark one notification read (RLS: recipient-only update). */
export async function markNotificationRead(notificationId: number): Promise<void> {
  const { error } = await getSupabase()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('read_at', null);
  if (error) throw error;
}

/** Mark all of the caller's notifications read. */
export async function markAllNotificationsRead(personId: number): Promise<void> {
  const { error } = await getSupabase()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_person_id', personId)
    .is('read_at', null);
  if (error) throw error;
}

// ---- support request cancel (P4B) --------------------------------------------

/**
 * Participant withdraws their own still-open request via the server-authoritative
 * cancel_support_request RPC (0108): enumerated source statuses, lifecycle fields
 * only, idempotent, event-logged. The broad own-row UPDATE policy was removed —
 * this is the only cancellation path.
 */
export async function cancelMySupportRequest(requestId: number): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('cancel_support_request', {
    p_support_request_id: requestId,
  });
  if (error) throw error;
  const result = data as { ok?: boolean; code?: string } | null;
  return Boolean(result?.ok && (result.code === 'cancelled' || result.code === 'already_cancelled'));
}
