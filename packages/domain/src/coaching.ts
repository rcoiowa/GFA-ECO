/**
 * Coaching / connection domain contracts — promoted from data-access (P4B).
 * These are the stable row shapes the canonical recoveryos schema returns and
 * the participant connection view model derived from them. UI code consumes
 * the view model; it never interprets raw lifecycle strings in JSX.
 */

// ---- canonical row contracts -----------------------------------------------
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
  claimed_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
}

export interface SupportTeamMember {
  relationship_id: number;
  support_person_id: number;
  display_name: string;
  role_label: string;
  relationship_type: string;
  /** 'coaching' | 'navigation' — which relationship domain this member belongs to (P4E). */
  context: string;
  is_primary: boolean;
  started_at: string | null;
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

export interface BookingStateRow {
  id: number;
  support_request_id: number | null;
  participant_person_id: number;
  provider_person_id: number | null;
  status: string;
  appointment_id: number | null;
  created_at: string;
  /** Active (current-round) proposals, when loaded alongside the request. */
  proposals?: BookingProposalRow[];
}

export interface BookingProposalRow {
  id: number;
  booking_request_id: number;
  proposed_by_person_id: number;
  proposed_start: string;
  proposed_end: string | null;
  round: number;
  is_active: boolean;
  accepted: boolean;
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

/**
 * Open pool projection — decision fields only. Participant free-text `focus`
 * was removed from the SERVER projection in 0112 (P4E defense-in-depth):
 * pre-claim disclosure is now structurally impossible, not just unrendered.
 */
export interface OpenPoolRow {
  support_request_id: number;
  participant_person_id: number;
  participant_name: string;
  request_type: string;
  preferred_modality: string;
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

// ---- participant-facing request options -------------------------------------
/**
 * Canonical support_requests.request_type values with participant-friendly
 * language. Only types the backend represents; the wording never leaks
 * database vocabulary. (Taxonomy note: these map onto the broader need
 * categories — coaching/support, peer connection, navigation/barriers, life
 * coaching, unsure — documented in the P4B measurement readiness section.)
 */
export const SUPPORT_REQUEST_OPTIONS = [
  {
    type: 'recovery_coach',
    title: 'Talk with a recovery coach',
    description: 'Someone to listen, encourage, and walk alongside you.',
  },
  {
    type: 'peer_support',
    title: 'Peer support',
    description: 'Connect with someone who understands recovery through lived experience.',
  },
  {
    type: 'navigation',
    title: 'Help navigating something',
    description: 'Housing, treatment, transportation, work, benefits, reentry, or another barrier.',
  },
  {
    type: 'life_coach',
    title: 'Life coaching and next steps',
    description: 'Work through goals, choices, accountability, and what comes next.',
  },
  {
    type: 'needs_assessment',
    title: 'I’m not sure — I just need someone',
    description: 'That’s okay. Tell us a little and we’ll figure it out together.',
  },
] as const;

export type SupportRequestType = (typeof SUPPORT_REQUEST_OPTIONS)[number]['type'];

export const MODALITY_OPTIONS = [
  { value: 'video', label: 'Video call' },
  { value: 'phone', label: 'Phone call' },
  { value: 'chat', label: 'Chat / text' },
  { value: 'in_person', label: 'In person' },
] as const;

export function requestTypeLabel(requestType: string): string {
  return (
    SUPPORT_REQUEST_OPTIONS.find((o) => o.type === requestType)?.title ?? 'Support request'
  );
}

// ---- connection view model ---------------------------------------------------
export type ConnectionStateKind =
  | 'NO_REQUEST'
  | 'REQUEST_OPEN'
  | 'REQUEST_CLAIMED'
  | 'RELATIONSHIP_ACTIVE'
  | 'SCHEDULING'
  | 'APPOINTMENT_CONFIRMED';

export interface ConnectionState {
  kind: ConnectionStateKind;
  /** The relevant current (non-terminal) support request, if any. */
  currentRequest: SupportRequestRow | null;
  /** Active primary support relationship, if any. */
  relationship: CoachRelationship | null;
  supportTeam: SupportTeamMember[];
  /** The next upcoming confirmed/scheduled appointment, if any. */
  nextAppointment: CanonicalAppointmentRow | null;
  /** An open scheduling negotiation, if any. */
  openBooking: BookingStateRow | null;
  /** Whether an active proposal round is waiting on SOMEONE (P4D adds who). */
  schedulingUnderway: boolean;
}

const OPEN_REQUEST_STATUSES = ['open', 'submitted'];
const CLAIMED_REQUEST_STATUSES = ['claimed', 'assigned'];
const CURRENT_REQUEST_STATUSES = [...OPEN_REQUEST_STATUSES, ...CLAIMED_REQUEST_STATUSES, 'scheduled'];
const UPCOMING_APPT_STATUSES = ['confirmed', 'scheduled'];

/**
 * Derive the participant connection state from canonical truth. Pure and
 * fully unit-tested; nothing here persists — connection state is never stored
 * redundantly for the frontend. Multiple open requests are legal server-side:
 * the most recent current request drives the headline state and the rest stay
 * reachable through history.
 */
export function deriveConnectionState(input: {
  requests: SupportRequestRow[];
  supportTeam: SupportTeamMember[];
  relationship: CoachRelationship | null;
  bookings: BookingStateRow[];
  appointments: CanonicalAppointmentRow[];
  now?: Date;
}): ConnectionState {
  const now = input.now ?? new Date();

  const currentRequest =
    [...input.requests]
      .filter((r) => CURRENT_REQUEST_STATUSES.includes(r.status))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;

  const nextAppointment =
    [...input.appointments]
      .filter((a) => UPCOMING_APPT_STATUSES.includes(a.status) && new Date(a.starts_at) > now)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] ?? null;

  const openBooking =
    [...input.bookings]
      .filter((b) => b.status === 'open')
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;

  const relationship = input.relationship;
  const schedulingUnderway = Boolean(
    openBooking && (openBooking.proposals?.some((p) => p.is_active) ?? true),
  );

  let kind: ConnectionStateKind = 'NO_REQUEST';
  if (nextAppointment) kind = 'APPOINTMENT_CONFIRMED';
  else if (openBooking && relationship) kind = 'SCHEDULING';
  else if (relationship) kind = 'RELATIONSHIP_ACTIVE';
  else if (currentRequest && CLAIMED_REQUEST_STATUSES.includes(currentRequest.status))
    kind = 'REQUEST_CLAIMED';
  else if (currentRequest && OPEN_REQUEST_STATUSES.includes(currentRequest.status))
    kind = 'REQUEST_OPEN';

  return {
    kind,
    currentRequest,
    relationship,
    supportTeam: input.supportTeam,
    nextAppointment,
    openBooking,
    schedulingUnderway,
  };
}

// ---- notification link safety ------------------------------------------------
/**
 * Notifications carry a link_path. Only same-app absolute paths are followed;
 * anything else (external URLs, protocol-relative, javascript:, missing) falls
 * back to the given default. Never navigate to arbitrary stored strings.
 */
export function safeLinkPath(linkPath: string | null | undefined, fallback = '/vrcc/today'): string {
  if (!linkPath) return fallback;
  if (!linkPath.startsWith('/') || linkPath.startsWith('//')) return fallback;
  if (linkPath.includes(':')) return fallback;
  // Legacy-era stored paths map onto canonical routes.
  if (linkPath === '/sessions') return '/vrcc/connect';
  if (linkPath === '/coach/sessions') return '/coach';
  if (linkPath === '/coach') return '/vrcc/connect';
  return linkPath;
}
