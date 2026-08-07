import { getSupabase } from '../client';

/**
 * Canonical coaching READ services (P3B — canonical read authority).
 *
 * These are the trusted read layer for the coaching domain: every consumer
 * (the future Coach Workspace, participant Connect, Navigator/Admin/Residence
 * projections) reads relationships, requests, bookings, appointments,
 * conversations, and notifications through these functions — from the
 * `recoveryos` canonical schema, never from the legacy v2 or mvp tables directly.
 *
 * READ-ONLY by design. Write authority (claim / assign / accept / confirm)
 * remains on the v2 path during P3B; canonical write services land in P3C. Do
 * not add mutations here until that phase is authorized.
 *
 * All access is RLS-scoped by the caller's JWT → person_id; identity is never
 * passed as a trust boundary. Pool/roster/coach-list reads are fixture-aware
 * (test/demo identities are excluded from production surfaces).
 */

// ---- DTOs (stable contracts; mirror into @recoveryos/domain at P4) ----------
export interface CoachRelationship {
  id: number;
  participant_person_id: number;
  coach_person_id: number;
  status: string;
  relationship_type: string;
  is_primary: boolean;
  started_at: string | null;
  ended_at: string | null;
}
export interface SupportRequestRow {
  id: number;
  person_id: number;
  request_type: string;
  focus: string | null;
  preferred_modality: string;
  status: string;
  claimed_by_person_id: number | null;
  created_at: string;
}
export interface OpenPoolRow {
  support_request_id: number;
  participant_person_id: number;
  participant_name: string;
  request_type: string;
  preferred_modality: string;
  focus: string | null;
  created_at: string;
}
export interface CanonicalAppointmentRow {
  id: number;
  person_id: number;
  provider_person_id: number | null;
  status: string;
  starts_at: string;
  ends_at: string | null;
  modality: string | null;
  meeting_url: string | null;
  timezone: string;
  confirmed_at: string | null;
}
export interface NotificationRow {
  id: number;
  kind: string;
  title: string;
  body: string;
  link_path: string | null;
  read_at: string | null;
  created_at: string;
}
export interface ConversationRow {
  id: number;
  participant_person_id: number;
  coach_person_id: number;
  context: string;
}
export interface MessageRow {
  id: number;
  conversation_id: number;
  sender_person_id: number;
  body: string;
  read_at: string | null;
  created_at: string;
}

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
    .select('id, person_id, request_type, focus, preferred_modality, status, claimed_by_person_id, created_at')
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
