import { describe, expect, it } from 'vitest';
import { deriveAdminAttention, roleAuthorityLabel } from './admin';

const quiet = {
  openSupportRequests: 0,
  oldestOpenRequestHours: 0,
  overdueFollowUps: 0,
  openReferralLoops: 0,
  unresolvedNeeds: 0,
  residenceApplicationsWaiting: 0,
  unreviewedIncidents: 0,
  pendingInvitations: 0,
};

describe('deriveAdminAttention', () => {
  it('long waits and safety review outrank routine workflow items', () => {
    const items = deriveAdminAttention({
      ...quiet,
      openSupportRequests: 2,
      oldestOpenRequestHours: 30,
      unreviewedIncidents: 1,
      overdueFollowUps: 2,
      pendingInvitations: 1,
    });
    expect(items.map((i) => i.key)).toEqual(['waiting-long', 'incidents', 'followups', 'invitations']);
  });

  it('a fresh open request under the wait target is not an alarm', () => {
    const items = deriveAdminAttention({ ...quiet, openSupportRequests: 1, oldestOpenRequestHours: 2 });
    expect(items).toHaveLength(0);
  });

  it('quiet system derives nothing — no manufactured urgency', () => {
    expect(deriveAdminAttention(quiet)).toHaveLength(0);
  });

  it('language contains no risk scoring or surveillance vocabulary', () => {
    const items = deriveAdminAttention({
      ...quiet,
      openReferralLoops: 3,
      residenceApplicationsWaiting: 2,
    });
    for (const item of items) {
      expect(item.label.toLowerCase()).not.toMatch(/risk|score|rank|alert|violation/);
    }
  });
});

describe('roleAuthorityLabel', () => {
  it('shows the exact intended authority, scoped when residence-scoped', () => {
    expect(roleAuthorityLabel('residence_manager', 'Grace House')).toBe('Residence Manager — Grace House');
    expect(roleAuthorityLabel('navigator')).toBe('Navigator');
    expect(roleAuthorityLabel('system_administrator')).toBe('System Administrator');
  });
});
