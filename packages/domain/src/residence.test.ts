import { describe, expect, it } from 'vitest';
import { deriveResidenceStaffAttention, deriveResidentAttention } from './residence';

describe('deriveResidenceStaffAttention', () => {
  it('safety review outranks routine operations, capped at four', () => {
    const items = deriveResidenceStaffAttention({
      unreviewedIncidents: 1,
      applicationsWaiting: 2,
      passesWaiting: 1,
      unassignedActiveResidencies: 1,
      followUpsDue: 3,
    });
    expect(items.map((i) => i.key)).toEqual(['incidents', 'applications', 'passes', 'beds']);
    expect(items).toHaveLength(4);
  });

  it('quiet house derives nothing — no manufactured urgency', () => {
    expect(
      deriveResidenceStaffAttention({
        unreviewedIncidents: 0,
        applicationsWaiting: 0,
        passesWaiting: 0,
        unassignedActiveResidencies: 0,
        followUpsDue: 0,
      }),
    ).toHaveLength(0);
  });

  it('language stays humane — no risk or compliance vocabulary', () => {
    const items = deriveResidenceStaffAttention({
      unreviewedIncidents: 2,
      applicationsWaiting: 1,
      passesWaiting: 0,
      unassignedActiveResidencies: 0,
      followUpsDue: 0,
    });
    for (const item of items) {
      expect(item.label.toLowerCase()).not.toMatch(/risk|violation|noncomplian|alert/);
    }
  });
});

describe('deriveResidentAttention', () => {
  it('documents first, capped at three, home not dashboard', () => {
    const items = deriveResidentAttention({
      documentsAwaiting: 1,
      passDecided: true,
      choresDueToday: 2,
      meetingToday: true,
    });
    expect(items.map((i) => i.key)).toEqual(['documents', 'pass', 'chores']);
    expect(items).toHaveLength(3);
  });

  it('nothing pending, nothing shown', () => {
    expect(
      deriveResidentAttention({
        documentsAwaiting: 0,
        passDecided: false,
        choresDueToday: 0,
        meetingToday: false,
      }),
    ).toHaveLength(0);
  });
});
