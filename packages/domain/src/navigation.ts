import type { FollowUpRow } from './coach';
import type { MessageRow, OpenPoolRow } from './coaching';

/**
 * Navigation domain view models (P4E). Funder-neutral, humane, pure.
 * Keys are stable; labels can evolve. No grant vocabulary anywhere.
 */

// ---- need taxonomy -----------------------------------------------------------

export const NEED_CATEGORIES = [
  { key: 'housing', label: 'Housing' },
  { key: 'recovery_residence', label: 'Recovery residence' },
  { key: 'transportation', label: 'Transportation' },
  { key: 'treatment_healthcare', label: 'Treatment & health care' },
  { key: 'mental_health', label: 'Mental health support' },
  { key: 'employment', label: 'Employment & work' },
  { key: 'education_training', label: 'Education & training' },
  { key: 'food_basic_needs', label: 'Food & basic needs' },
  { key: 'benefits_financial', label: 'Benefits & financial help' },
  { key: 'legal_reentry', label: 'Legal & reentry' },
  { key: 'identification_documents', label: 'ID & documents' },
  { key: 'family_childcare', label: 'Family & childcare' },
  { key: 'digital_access', label: 'Phone & internet access' },
  { key: 'social_connection', label: 'Social & community connection' },
  { key: 'recovery_support', label: 'Recovery support' },
  { key: 'other', label: 'Something else' },
] as const;

export type NeedCategoryKey = (typeof NEED_CATEGORIES)[number]['key'];

export function needCategoryLabel(key: string): string {
  return NEED_CATEGORIES.find((c) => c.key === key)?.label ?? 'Support need';
}

/** Humane, operational — never a judgment of the participant. */
export function needStatusLabel(status: string): string {
  switch (status) {
    case 'identified':
      return 'Identified';
    case 'in_progress':
      return 'Working on it';
    case 'resolved':
      return 'Resolved';
    case 'partially_resolved':
      return 'Partly resolved';
    case 'unresolved':
      return 'Still unresolved';
    case 'deferred':
      return 'Set aside for now';
    default:
      return 'In progress';
  }
}

// ---- referral / connection ---------------------------------------------------

export function referralTypeLabel(type: string): string {
  switch (type) {
    case 'information':
      return 'Resource shared';
    case 'referral':
      return 'Referral made';
    case 'warm_handoff':
      return 'Warm handoff';
    default:
      return 'Connection step';
  }
}

/** Participant-understandable status — internal enums never render. */
export function referralStatusLabel(status: string): string {
  switch (status) {
    case 'initiated':
      return 'Referral made';
    case 'contact_attempted':
      return 'Reaching out';
    case 'connected':
      return 'Connected';
    case 'not_connected':
      return 'Not connected yet';
    case 'participant_declined':
      return 'No longer needed';
    case 'partner_unavailable':
      return 'Provider unavailable right now';
    case 'closed':
      return 'Closed';
    default:
      return 'In progress';
  }
}

/** Referral states where asking the participant "were you able to connect?" makes sense. */
export function awaitingConnectionConfirmation(status: string): boolean {
  return status === 'initiated' || status === 'contact_attempted' || status === 'not_connected';
}

// ---- DTOs --------------------------------------------------------------------

export interface NavigationNeedRow {
  id: number;
  person_id: number;
  navigation_relationship_id: number | null;
  need_category: string;
  status: string;
  identified_at: string;
  resolved_at: string | null;
  note: string | null;
}

export interface NavigationReferralRow {
  id: number;
  person_id: number;
  navigation_need_id: number | null;
  resource_id: number | null;
  organization_id: number | null;
  destination_name: string | null;
  referral_type: string;
  status: string;
  connection_evidence: string | null;
  attempted_at: string | null;
  connected_at: string | null;
  created_at: string;
}

export interface NavRosterEntry {
  relationship_id: number;
  participant_person_id: number;
  display_name: string;
  pronouns: string | null;
  is_primary: boolean;
  started_at: string | null;
  origin_request_type: string | null;
}

// ---- request-type domain routing (mirror of server dispatch, for display) ----

export const NAVIGATION_REQUEST_TYPES = ['navigation', 'needs_assessment'] as const;

export function isNavigationRequest(requestType: string): boolean {
  return (NAVIGATION_REQUEST_TYPES as readonly string[]).includes(requestType);
}

// ---- navigator attention -----------------------------------------------------

export interface NavigatorAttentionItem {
  key: string;
  label: string;
  to: string;
}

/**
 * §43 priority: participant reply → overdue follow-up → new navigation request
 * → warm handoff awaiting confirmation → unresolved need → follow-up due today.
 * Max 4; quiet language, no urgency theater, no hidden scoring.
 */
export function deriveNavigatorAttention(input: {
  openPool: OpenPoolRow[];
  followUps: FollowUpRow[];
  needs: NavigationNeedRow[];
  referrals: NavigationReferralRow[];
  rosterNames?: Map<number, string>;
  unreadMessages?: { count: number; from?: string | null };
  now?: Date;
}): NavigatorAttentionItem[] {
  const now = input.now ?? new Date();
  const items: NavigatorAttentionItem[] = [];
  const nameFor = (personId: number) => input.rosterNames?.get(personId);

  if (input.unreadMessages && input.unreadMessages.count > 0) {
    const { count, from } = input.unreadMessages;
    items.push({
      key: 'messages-unread',
      label:
        count === 1 && from
          ? `New message from ${from}${from.endsWith('.') ? '' : '.'}`
          : count === 1
            ? 'You have a new message.'
            : `${count} unread messages.`,
      to: '/navigator/messages',
    });
  }

  const overdue = input.followUps.filter(
    (f) => f.status === 'open' && f.due_at !== null && new Date(f.due_at) < now,
  );
  if (overdue.length > 0) {
    items.push({
      key: 'followups-overdue',
      label:
        overdue.length === 1
          ? 'A follow-up is past due.'
          : `${overdue.length} follow-ups are past due.`,
      to: '/navigator/follow-ups',
    });
  }

  const waiting = input.openPool.filter((r) => isNavigationRequest(r.request_type));
  if (waiting.length > 0) {
    items.push({
      key: 'pool',
      label:
        waiting.length === 1
          ? 'Someone is waiting for navigation help.'
          : `${waiting.length} people are waiting for navigation help.`,
      to: '/navigator/requests',
    });
  }

  const pendingHandoffs = input.referrals.filter(
    (r) => r.referral_type === 'warm_handoff' && awaitingConnectionConfirmation(r.status),
  );
  if (pendingHandoffs.length > 0) {
    const first = pendingHandoffs[0];
    const who = first ? nameFor(first.person_id) : undefined;
    items.push({
      key: 'handoff-pending',
      label:
        pendingHandoffs.length === 1 && who
          ? `Check whether ${who} got connected.`
          : pendingHandoffs.length === 1
            ? 'A warm handoff is waiting for confirmation.'
            : `${pendingHandoffs.length} warm handoffs are waiting for confirmation.`,
      to: '/navigator/connections',
    });
  }

  const unresolved = input.needs.filter((n) => n.status === 'unresolved');
  if (unresolved.length > 0) {
    items.push({
      key: 'needs-unresolved',
      label:
        unresolved.length === 1
          ? 'An identified need is still unresolved.'
          : `${unresolved.length} identified needs are still unresolved.`,
      to: '/navigator/connections',
    });
  }

  const dueToday = input.followUps.filter(
    (f) =>
      f.status === 'open' &&
      f.due_at !== null &&
      new Date(f.due_at) >= now &&
      new Date(f.due_at).toDateString() === now.toDateString(),
  );
  if (dueToday.length > 0) {
    items.push({
      key: 'followups-today',
      label:
        dueToday.length === 1 ? 'A follow-up is due today.' : `${dueToday.length} follow-ups due today.`,
      to: '/navigator/follow-ups',
    });
  }

  return items.slice(0, 4);
}

// ---- participant confirmation ------------------------------------------------

export const CONNECTION_CONFIRMATION_OPTIONS = [
  { value: 'yes', label: 'Yes, I connected' },
  { value: 'not_yet', label: 'Not yet' },
  { value: 'no_longer_needed', label: 'I don’t need this anymore' },
  { value: 'need_more_help', label: 'I need more help' },
] as const;

export type ConnectionConfirmation = (typeof CONNECTION_CONFIRMATION_OPTIONS)[number]['value'];

// Re-export so navigator surfaces share messaging types without extra imports.
export type { MessageRow };
