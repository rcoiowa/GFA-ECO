/**
 * Admin attention (P4G §16). Pure derivation over the operations summary —
 * factual operational health, quietly stated. No participant risk scoring,
 * no staff ranking, and routine items never dress as emergencies.
 */

export interface AdminAttentionItem {
  key: string;
  label: string;
  to: string;
}

export interface AdminOperationsFacts {
  openSupportRequests: number;
  oldestOpenRequestHours: number;
  overdueFollowUps: number;
  openReferralLoops: number;
  unresolvedNeeds: number;
  residenceApplicationsWaiting: number;
  unreviewedIncidents: number;
  pendingInvitations: number;
}

/** Operational target: nobody should wait a full day for a human to claim them. */
export const SUPPORT_WAIT_TARGET_HOURS = 24;

export function deriveAdminAttention(facts: AdminOperationsFacts): AdminAttentionItem[] {
  const items: AdminAttentionItem[] = [];

  if (facts.openSupportRequests > 0 && facts.oldestOpenRequestHours >= SUPPORT_WAIT_TARGET_HOURS) {
    items.push({
      key: 'waiting-long',
      label: `Someone has been waiting ${Math.floor(facts.oldestOpenRequestHours / 24)}+ day(s) for a connection.`,
      to: '/admin/operations',
    });
  }
  if (facts.unreviewedIncidents > 0) {
    items.push({
      key: 'incidents',
      label:
        facts.unreviewedIncidents === 1
          ? 'A residence incident report is waiting for review.'
          : `${facts.unreviewedIncidents} residence incident reports are waiting for review.`,
      to: '/admin/residences',
    });
  }
  if (facts.overdueFollowUps > 0) {
    items.push({
      key: 'followups',
      label:
        facts.overdueFollowUps === 1
          ? 'A connection follow-up is past due.'
          : `${facts.overdueFollowUps} connection follow-ups are past due.`,
      to: '/admin/operations',
    });
  }
  if (facts.residenceApplicationsWaiting > 0) {
    items.push({
      key: 'applications',
      label:
        facts.residenceApplicationsWaiting === 1
          ? 'A residence application is waiting for review.'
          : `${facts.residenceApplicationsWaiting} residence applications are waiting for review.`,
      to: '/admin/residences',
    });
  }
  if (facts.openReferralLoops > 0) {
    items.push({
      key: 'loops',
      label:
        facts.openReferralLoops === 1
          ? 'A navigation referral loop is still open.'
          : `${facts.openReferralLoops} navigation referral loops are still open.`,
      to: '/admin/evidence',
    });
  }
  if (facts.pendingInvitations > 0) {
    items.push({
      key: 'invitations',
      label:
        facts.pendingInvitations === 1
          ? 'A staff invitation is pending.'
          : `${facts.pendingInvitations} staff invitations are pending.`,
      to: '/admin/access',
    });
  }
  return items.slice(0, 5);
}

/** Humane, specific authority labels for invitation/grant confirmation (§35). */
export function roleAuthorityLabel(role: string, residenceName?: string | null): string {
  const base: Record<string, string> = {
    participant: 'Participant',
    resident: 'Resident',
    coach: 'Recovery Coach',
    navigator: 'Navigator',
    residence_staff: 'Residence Staff',
    residence_manager: 'Residence Manager',
    program_manager: 'Program Manager',
    administrator: 'Administrator',
    executive: 'Executive',
    system_administrator: 'System Administrator',
  };
  const label = base[role] ?? role;
  return residenceName ? `${label} — ${residenceName}` : label;
}
