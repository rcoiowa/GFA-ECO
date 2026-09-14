import { describe, expect, it } from 'vitest';
import { PULSE_PROMPTS, PULSE_QUADRANTS, selectQuadrant } from './prompts';
import {
  DEFAULT_EVENING_HOUR,
  participantLocalDate,
  participantLocalHour,
  routePulse,
} from './routing';
import { evaluatePulseResponses, primaryPulseResponse, requiresSupportPathway } from './rules';

// 2026-08-04T02:30:00Z is still 2026-08-03 in America/Chicago (21:30 CDT).
const LATE_NIGHT_UTC = new Date('2026-08-04T02:30:00Z');
// 14:00 UTC = 09:00 CDT.
const MORNING_UTC = new Date('2026-08-04T14:00:00Z');
// 23:00 UTC = 18:00 CDT.
const EVENING_UTC = new Date('2026-08-04T23:00:00Z');

describe('participant day boundary', () => {
  it('uses the participant timezone, not UTC, for the calendar date', () => {
    expect(participantLocalDate(LATE_NIGHT_UTC)).toBe('2026-08-03');
    expect(participantLocalDate(MORNING_UTC)).toBe('2026-08-04');
  });

  it('reports local hour', () => {
    expect(participantLocalHour(MORNING_UTC)).toBe(9);
    expect(participantLocalHour(EVENING_UTC)).toBe(18);
  });

  it('treats midnight as hour 0', () => {
    // 05:00 UTC = 00:00 CDT.
    expect(participantLocalHour(new Date('2026-08-04T05:00:00Z'))).toBe(0);
  });
});

describe('routePulse', () => {
  const none = { hasMorning: false, hasEvening: false };

  it('gives the morning experience to the first check-in before the threshold', () => {
    expect(routePulse({ now: MORNING_UTC, today: none }).mode).toBe('morning');
  });

  it('gives the evening experience to a second check-in', () => {
    const r = routePulse({ now: MORNING_UTC, today: { hasMorning: true, hasEvening: false } });
    expect(r.mode).toBe('evening');
  });

  it('never asks for a retroactive intention on a late first check-in', () => {
    const r = routePulse({ now: EVENING_UTC, today: none });
    expect(r.mode).toBe('evening_streamlined');
  });

  it('blocks duplicate submissions once both are recorded', () => {
    const r = routePulse({ now: EVENING_UTC, today: { hasMorning: true, hasEvening: true } });
    expect(r.mode).toBe('complete');
  });

  it('honors a configurable evening threshold', () => {
    // 20:00 UTC = 15:00 CDT — evening only if the threshold is lowered.
    const at3pm = new Date('2026-08-04T20:00:00Z');
    expect(routePulse({ now: at3pm, today: none }).mode).toBe('morning');
    expect(routePulse({ now: at3pm, today: none, eveningHour: 15 }).mode).toBe(
      'evening_streamlined',
    );
    expect(DEFAULT_EVENING_HOUR).toBe(17);
  });

  it('always explains itself', () => {
    expect(routePulse({ now: MORNING_UTC, today: none }).reason.length).toBeGreaterThan(0);
  });
});

describe('prompt rotation', () => {
  it('is stable for the same person and day (refreshing must not reroll)', () => {
    const a = selectQuadrant(5, '2026-08-04');
    const b = selectQuadrant(5, '2026-08-04');
    expect(a).toBe(b);
  });

  it('advances when the participant asks for something different', () => {
    const first = selectQuadrant(5, '2026-08-04');
    const second = selectQuadrant(5, '2026-08-04', 1);
    expect(second).not.toBe(first);
  });

  it('cycles through every quadrant without getting stuck', () => {
    const seen = new Set(PULSE_QUADRANTS.map((_, i) => selectQuadrant(5, '2026-08-04', i)));
    expect(seen.size).toBe(PULSE_QUADRANTS.length);
  });

  it('pairs a morning and an evening question for every quadrant', () => {
    for (const q of PULSE_QUADRANTS) {
      expect(PULSE_PROMPTS[q].morning.length).toBeGreaterThan(0);
      expect(PULSE_PROMPTS[q].evening.length).toBeGreaterThan(0);
    }
  });
});

describe('adaptive responses', () => {
  it('surfaces Support Now on low mood and never ends generically', () => {
    const res = evaluatePulseResponses({ mood: 1, craving: 2 });
    expect(requiresSupportPathway(res)).toBe(true);
    expect(primaryPulseResponse(res)?.kind).toBe('support_now');
  });

  it('surfaces Support Now on high craving even when mood is fine', () => {
    const res = evaluatePulseResponses({ mood: 4, craving: 5 });
    expect(requiresSupportPathway(res)).toBe(true);
  });

  it('invites a story when hope drops sharply', () => {
    const res = evaluatePulseResponses({ mood: 3, hope: 2 }, { mood: 3, hope: 5 });
    expect(res.some((r) => r.id === 'hope_drop')).toBe(true);
  });

  it('asks what happened when mood drops', () => {
    const res = evaluatePulseResponses({ mood: 3 }, { mood: 5 });
    expect(res.some((r) => r.id === 'mood_drop')).toBe(true);
  });

  it('names steadiness rather than staying silent about good days', () => {
    const res = evaluatePulseResponses({ mood: 4 }, { mood: 5 });
    expect(res.some((r) => r.id === 'steady')).toBe(true);
  });

  it('offers a practice when cravings rise', () => {
    const res = evaluatePulseResponses({ mood: 3, craving: 3 }, { mood: 3, craving: 1 });
    expect(res.some((r) => r.id === 'craving_rise')).toBe(true);
  });

  it('offers connection after two quiet days, and not after one', () => {
    expect(
      evaluatePulseResponses({ mood: 3, connection: 'none' }, null, 'none').some(
        (r) => r.id === 'connection_gap',
      ),
    ).toBe(true);
    expect(
      evaluatePulseResponses({ mood: 3, connection: 'none' }, null, 'yes').some(
        (r) => r.id === 'connection_gap',
      ),
    ).toBe(false);
  });

  it('stays quiet on an unremarkable day', () => {
    expect(evaluatePulseResponses({ mood: 3, craving: 2 }, { mood: 3, craving: 2 })).toHaveLength(
      0,
    );
  });

  it('is deterministic — identical inputs give identical output', () => {
    const a = evaluatePulseResponses({ mood: 1, craving: 5 }, { mood: 4, craving: 1 });
    const b = evaluatePulseResponses({ mood: 1, craving: 5 }, { mood: 4, craving: 1 });
    expect(a).toEqual(b);
  });

  it('explains every response it produces', () => {
    const res = evaluatePulseResponses({ mood: 1, craving: 5, hope: 1 }, { mood: 5, hope: 5 });
    expect(res.length).toBeGreaterThan(0);
    for (const r of res) expect(r.because).toMatch(/You're seeing this because/);
  });
});
