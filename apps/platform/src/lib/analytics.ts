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
  | 'follow_up_completed';

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
