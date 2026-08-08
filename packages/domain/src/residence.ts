/**
 * Residence attention view models (P4F §40–41). Pure, tested, calm — no hidden
 * risk scoring, and routine operations never dress up as emergencies. These are
 * the canonical derivations for the staff/resident surfaces; the preserved
 * legacy pages adopt them as they are touched.
 */

export interface ResidenceAttentionItem {
  key: string;
  label: string;
  to: string;
}

/**
 * Staff priority (§40): safety item needing review → applicant waiting →
 * pass awaiting decision → bed/transition task → follow-up due. Max 4.
 */
export function deriveResidenceStaffAttention(input: {
  unreviewedIncidents: number;
  applicationsWaiting: number;
  passesWaiting: number;
  unassignedActiveResidencies: number;
  followUpsDue: number;
}): ResidenceAttentionItem[] {
  const items: ResidenceAttentionItem[] = [];
  if (input.unreviewedIncidents > 0) {
    items.push({
      key: 'incidents',
      label:
        input.unreviewedIncidents === 1
          ? 'An incident report is waiting for review.'
          : `${input.unreviewedIncidents} incident reports are waiting for review.`,
      to: '/staff/incidents',
    });
  }
  if (input.applicationsWaiting > 0) {
    items.push({
      key: 'applications',
      label:
        input.applicationsWaiting === 1
          ? 'Someone is waiting to hear about their application.'
          : `${input.applicationsWaiting} people are waiting to hear about their applications.`,
      to: '/staff/applications',
    });
  }
  if (input.passesWaiting > 0) {
    items.push({
      key: 'passes',
      label:
        input.passesWaiting === 1
          ? 'A pass request needs a decision.'
          : `${input.passesWaiting} pass requests need decisions.`,
      to: '/staff/today',
    });
  }
  if (input.unassignedActiveResidencies > 0) {
    items.push({
      key: 'beds',
      label:
        input.unassignedActiveResidencies === 1
          ? 'A resident needs a bed assignment.'
          : `${input.unassignedActiveResidencies} residents need bed assignments.`,
      to: '/staff/beds',
    });
  }
  if (input.followUpsDue > 0) {
    items.push({
      key: 'followups',
      label: input.followUpsDue === 1 ? 'A follow-up is due.' : `${input.followUpsDue} follow-ups are due.`,
      to: '/staff/today',
    });
  }
  return items.slice(0, 4);
}

/**
 * Resident priority (§41): document awaiting signature → pass response →
 * chore due → house meeting. Max 3 — a home, not a surveillance dashboard.
 */
export function deriveResidentAttention(input: {
  documentsAwaiting: number;
  passDecided: boolean;
  choresDueToday: number;
  meetingToday: boolean;
}): ResidenceAttentionItem[] {
  const items: ResidenceAttentionItem[] = [];
  if (input.documentsAwaiting > 0) {
    items.push({
      key: 'documents',
      label:
        input.documentsAwaiting === 1
          ? 'A document is ready for your signature.'
          : `${input.documentsAwaiting} documents are ready for your signature.`,
      to: '/residence/documents',
    });
  }
  if (input.passDecided) {
    items.push({
      key: 'pass',
      label: 'There’s a response to your pass request.',
      to: '/residence/passes',
    });
  }
  if (input.choresDueToday > 0) {
    items.push({
      key: 'chores',
      label:
        input.choresDueToday === 1 ? 'You have a chore due today.' : `${input.choresDueToday} chores due today.`,
      to: '/residence/chores',
    });
  }
  if (input.meetingToday) {
    items.push({ key: 'meeting', label: 'House meeting today.', to: '/residence/meetings' });
  }
  return items.slice(0, 3);
}
