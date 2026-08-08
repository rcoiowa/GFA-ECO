import { describe, expect, it } from 'vitest';
import { deriveCoachAttention, todaysAppointments } from './coach';
import type { CanonicalAppointmentRow, OpenPoolRow } from './coaching';
import type { FollowUpRow } from './coach';

const NOW = new Date('2026-08-08T15:00:00Z');

const appt = (over: Partial<CanonicalAppointmentRow> = {}): CanonicalAppointmentRow => ({
  id: 1,
  person_id: 10,
  provider_person_id: 20,
  status: 'confirmed',
  starts_at: '2026-08-08T16:00:00Z',
  ends_at: null,
  modality: 'video',
  meeting_url: null,
  timezone: 'America/Chicago',
  confirmed_at: null,
  ...over,
});

const pool = (id: number): OpenPoolRow => ({
  support_request_id: id,
  participant_person_id: 100 + id,
  participant_name: `Person ${id}`,
  request_type: 'recovery_coach',
  preferred_modality: 'video',

  created_at: '2026-08-08T10:00:00Z',
});

const fu = (over: Partial<FollowUpRow> = {}): FollowUpRow => ({
  id: 1,
  person_id: 10,
  assigned_person_id: 20,
  appointment_id: null,
  follow_up_type: 'check_in',
  due_at: '2026-08-08T20:00:00Z',
  status: 'open',
  note: null,
  completed_at: null,
  created_at: '2026-08-07T10:00:00Z',
  ...over,
});

describe('deriveCoachAttention', () => {
  it('empty inputs derive nothing', () => {
    expect(
      deriveCoachAttention({ todayAppointments: [], openPool: [], followUps: [], now: NOW }),
    ).toHaveLength(0);
  });

  it('imminent session outranks everything and names the participant', () => {
    const items = deriveCoachAttention({
      todayAppointments: [appt()],
      openPool: [pool(1)],
      followUps: [fu({ due_at: '2026-08-08T09:00:00Z' })],
      rosterNames: new Map([[10, 'Sam R.']]),
      now: NOW,
    });
    expect(items[0]?.label).toBe('Session with Sam R. coming up soon.');
    expect(items[1]?.key).toBe('followups-overdue');
    expect(items[2]?.key).toBe('pool');
  });

  it('sessions later than two hours out are not imminent', () => {
    const items = deriveCoachAttention({
      todayAppointments: [appt({ starts_at: '2026-08-08T22:00:00Z' })],
      openPool: [],
      followUps: [],
      now: NOW,
    });
    expect(items.find((i) => i.key.startsWith('imminent'))).toBeUndefined();
  });

  it('caps at four items', () => {
    const items = deriveCoachAttention({
      todayAppointments: [appt()],
      openPool: [pool(1), pool(2)],
      followUps: [fu({ id: 1, due_at: '2026-08-08T09:00:00Z' }), fu({ id: 2, due_at: '2026-08-08T20:00:00Z' })],
      now: NOW,
    });
    expect(items.length).toBeLessThanOrEqual(4);
  });
});

describe('deriveCoachAttention — unread messages', () => {
  it('a single named unread message reads personally and sits below imminent sessions', () => {
    const items = deriveCoachAttention({
      todayAppointments: [appt()],
      openPool: [],
      followUps: [],
      rosterNames: new Map([[10, 'Sam R.']]),
      unreadMessages: { count: 1, from: 'Sam R.' },
      now: NOW,
    });
    expect(items[0]?.key).toMatch(/^imminent/);
    expect(items[1]?.label).toBe('New message from Sam R.');
    expect(items[1]?.to).toBe('/coach/messages');
  });

  it('multiple unread messages summarize without urgency language', () => {
    const items = deriveCoachAttention({
      todayAppointments: [],
      openPool: [],
      followUps: [],
      unreadMessages: { count: 3 },
      now: NOW,
    });
    expect(items[0]?.label).toBe('3 unread messages.');
  });
});

describe('todaysAppointments', () => {
  it('keeps only today, confirmed/scheduled, sorted', () => {
    const list = todaysAppointments(
      [
        appt({ id: 1, starts_at: '2026-08-08T20:00:00Z' }),
        appt({ id: 2, starts_at: '2026-08-08T16:00:00Z' }),
        appt({ id: 3, starts_at: '2026-08-09T16:00:00Z' }),
        appt({ id: 4, starts_at: '2026-08-08T18:00:00Z', status: 'cancelled' }),
      ],
      NOW,
    );
    expect(list.map((a) => a.id)).toEqual([2, 1]);
  });
});
