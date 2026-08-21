import { describe, expect, it } from 'vitest';
import { homePathForRoles, participantOnboardingApplies } from './routing';

describe('homePathForRoles', () => {
  it('keeps the locked role-routing model', () => {
    expect(homePathForRoles(['participant'])).toBe('/vrcc/today');
    expect(homePathForRoles(['coach'])).toBe('/coach');
    expect(homePathForRoles(['navigator'])).toBe('/navigator');
    expect(homePathForRoles(['residence_staff'])).toBe('/staff/today');
    expect(homePathForRoles(['administrator'])).toBe('/admin');
    expect(homePathForRoles(['resident'])).toBe('/residence/today');
  });

  it('defaults a role-less (mid-provisioning) person to the participant space', () => {
    expect(homePathForRoles([])).toBe('/vrcc/today');
  });
});

describe('participantOnboardingApplies', () => {
  it('applies to participants and role-less new people', () => {
    expect(participantOnboardingApplies(['participant'])).toBe(true);
    expect(participantOnboardingApplies([])).toBe(true);
  });

  it('never captures staff, residence, or admin roles', () => {
    expect(participantOnboardingApplies(['coach'])).toBe(false);
    expect(participantOnboardingApplies(['navigator'])).toBe(false);
    expect(participantOnboardingApplies(['residence_staff'])).toBe(false);
    expect(participantOnboardingApplies(['residence_manager'])).toBe(false);
    expect(participantOnboardingApplies(['program_manager'])).toBe(false);
    expect(participantOnboardingApplies(['administrator'])).toBe(false);
    expect(participantOnboardingApplies(['executive'])).toBe(false);
    expect(participantOnboardingApplies(['system_administrator'])).toBe(false);
    expect(participantOnboardingApplies(['resident'])).toBe(false);
    // Multi-role: any staff/residence home wins over participant.
    expect(participantOnboardingApplies(['participant', 'coach'])).toBe(false);
    expect(participantOnboardingApplies(['participant', 'resident'])).toBe(false);
  });
});
