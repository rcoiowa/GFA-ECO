/**
 * Product analytics — process events only, never sensitive content (no free
 * text, no message bodies, no recovery narrative; ids and timestamps only).
 * The sink is pluggable; until an approved analytics destination exists the
 * events buffer in-memory (dev console in DEV builds). Instrumentation points
 * are the deliverable — the funnel stages are stable even before a sink is.
 */

export type AnalyticsEvent =
  | 'connect_page_viewed'
  | 'support_request_started'
  | 'support_request_submitted'
  | 'support_request_cancelled'
  | 'connection_established_viewed'
  | 'next_appointment_viewed'
  | 'notification_opened'
  | 'coach_workspace_viewed'
  | 'open_request_viewed'
  | 'support_request_claim_attempted'
  | 'support_request_claimed'
  | 'support_relationship_established'
  | 'follow_up_completed'
  | 'messages_page_viewed'
  | 'conversation_opened'
  | 'message_send_attempted'
  | 'message_sent'
  | 'first_human_response_observed'
  | 'first_two_way_exchange_observed'
  | 'scheduling_started'
  | 'times_proposed'
  | 'proposal_accepted'
  | 'times_countered'
  | 'session_rescheduled'
  | 'session_cancelled'
  | 'navigator_workspace_viewed'
  | 'navigation_request_viewed'
  | 'navigation_request_claimed'
  | 'navigation_relationship_established'
  | 'need_identified'
  | 'referral_created'
  | 'warm_handoff_recorded'
  | 'connection_confirmed'
  | 'connection_not_confirmed'
  | 'navigation_follow_up_completed'
  | 'navigation_service_event_recorded'
  | 'session_completed_recorded'
  | 'residence_application_submitted'
  | 'application_reviewed'
  | 'residency_admitted'
  | 'bed_assigned'
  | 'pass_requested'
  | 'pass_decided'
  | 'residence_support_service_recorded'
  | 'admin_command_center_viewed'
  | 'staff_invitation_created'
  | 'staff_invitation_revoked'
  | 'role_assignment_granted'
  | 'role_assignment_revoked'
  | 'residence_referral_triaged'
  | 'admin_evidence_viewed';

type Sink = (event: AnalyticsEvent, props?: Record<string, string | number | boolean>) => void;

const buffer: Array<{ event: AnalyticsEvent; at: string }> = [];
let sink: Sink | null = null;

export function setAnalyticsSink(next: Sink) {
  sink = next;
}

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  buffer.push({ event, at: new Date().toISOString() });
  if (buffer.length > 100) buffer.shift();
  if (sink) sink(event, props);
  else if (import.meta.env.DEV) console.debug('[analytics]', event, props ?? {});
}
