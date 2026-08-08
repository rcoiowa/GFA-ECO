import { describe, expect, it } from 'vitest';
import {
  deriveConnectionState,
  requestTypeLabel,
  safeLinkPath,
  type BookingStateRow,
  type CanonicalAppointmentRow,
  type CoachRelationship,
  type SupportRequestRow,
  type SupportTeamMember,
} from './coaching';

const NOW = new Date('2026-08-08T12:00:00Z');

const request = (over: Partial<SupportRequestRow> = {}): SupportRequestRow => ({
  id: 1,
  person_id: 10,
  request_type: 'recovery_coach',
  focus: null,
  preferred_modality: 'video',
  status: 'open',
  claimed_by_person_id: null,
  created_at: '2026-08-08T10:00:00Z',
  ...over,
});

const member: SupportTeamMember = {
  relationship_id: 5,
  support_person_id: 20,
  display_name: 'Jordan B.',
  role_label: 'Recovery Coach',
  relationship_type: 'coach',
  is_primary: true,
  started_at: '2026-08-01',
};

const relationship: CoachRelationship = {
  id: 5,
  participant_person_id: 10,
  coach_person_id: 20,
  status: 'active',
  relationship_type: 'coach',
  is_primary: true,
  started_at: '2026-08-01',
  ended_at: null,
};

const appointment = (over: Partial<CanonicalAppointmentRow> = {}): CanonicalAppointmentRow => ({
  id: 9,
  person_id: 10,
  provider_person_id: 20,
  status: 'confirmed',
  starts_at: '2026-08-10T15:00:00Z',
  ends_at: null,
  modality: 'video',
  meeting_url: null,
  timezone: 'America/Chicago',
  confirmed_at: '2026-08-08T11:00:00Z',
  ...over,
});

const booking = (over: Partial<BookingStateRow> = {}): BookingStateRow => ({
  id: 3,
  support_request_id: 1,
  participant_person_id: 10,
  provider_person_id: 20,
  status: 'open',
  appointment_id: null,
  created_at: '2026-08-08T11:00:00Z',
  proposals: [
    {
      id: 7,
      booking_request_id: 3,
      proposed_by_person_id: 20,
      proposed_start: '2026-08-11T15:00:00Z',
      proposed_end: null,
      round: 1,
      is_active: true,
      accepted: false,
    },
  ],
  ...over,
});

const empty = { requests: [], supportTeam: [], relationship: null, bookings: [], appointments: [], now: NOW };

describe('deriveConnectionState', () => {
  it('NO_REQUEST when nothing exists', () => {
    expect(deriveConnectionState(empty).kind).toBe('NO_REQUEST');
  });

  it('REQUEST_OPEN for an open request', () => {
    const s = deriveConnectionState({ ...empty, requests: [request()] });
    expect(s.kind).toBe('REQUEST_OPEN');
    expect(s.currentRequest?.id).toBe(1);
  });

  it('REQUEST_CLAIMED once someone picks it up', () => {
    const s = deriveConnectionState({
      ...empty,
      requests: [request({ status: 'claimed', claimed_by_person_id: 20 })],
    });
    expect(s.kind).toBe('REQUEST_CLAIMED');
  });

  it('RELATIONSHIP_ACTIVE when a coach is connected', () => {
    const s = deriveConnectionState({
      ...empty,
      requests: [request({ status: 'claimed' })],
      supportTeam: [member],
      relationship,
    });
    expect(s.kind).toBe('RELATIONSHIP_ACTIVE');
    expect(s.supportTeam[0]?.display_name).toBe('Jordan B.');
  });

  it('SCHEDULING when a booking negotiation is open with a relationship', () => {
    const s = deriveConnectionState({
      ...empty,
      supportTeam: [member],
      relationship,
      bookings: [booking()],
    });
    expect(s.kind).toBe('SCHEDULING');
    expect(s.schedulingUnderway).toBe(true);
  });

  it('APPOINTMENT_CONFIRMED outranks everything for an upcoming session', () => {
    const s = deriveConnectionState({
      ...empty,
      supportTeam: [member],
      relationship,
      bookings: [booking()],
      appointments: [appointment()],
    });
    expect(s.kind).toBe('APPOINTMENT_CONFIRMED');
    expect(s.nextAppointment?.id).toBe(9);
  });

  it('past appointments never count as next', () => {
    const s = deriveConnectionState({
      ...empty,
      supportTeam: [member],
      relationship,
      appointments: [appointment({ starts_at: '2026-08-01T15:00:00Z' })],
    });
    expect(s.kind).toBe('RELATIONSHIP_ACTIVE');
    expect(s.nextAppointment).toBeNull();
  });

  it('multiple open requests: latest drives the headline, none invented', () => {
    const s = deriveConnectionState({
      ...empty,
      requests: [
        request({ id: 1, created_at: '2026-08-07T10:00:00Z' }),
        request({ id: 2, created_at: '2026-08-08T10:00:00Z' }),
        request({ id: 3, status: 'cancelled', created_at: '2026-08-08T11:00:00Z' }),
      ],
    });
    expect(s.currentRequest?.id).toBe(2);
  });
});

describe('safeLinkPath', () => {
  it('allows internal absolute paths', () => {
    expect(safeLinkPath('/vrcc/connect')).toBe('/vrcc/connect');
  });
  it('rejects external, protocol, and protocol-relative values', () => {
    expect(safeLinkPath('https://evil.example')).toBe('/vrcc/today');
    expect(safeLinkPath('//evil.example')).toBe('/vrcc/today');
    expect(safeLinkPath('javascript:alert(1)')).toBe('/vrcc/today');
    expect(safeLinkPath(null)).toBe('/vrcc/today');
  });
  it('maps stored legacy paths onto canonical routes', () => {
    expect(safeLinkPath('/sessions')).toBe('/vrcc/connect');
  });
});

describe('requestTypeLabel', () => {
  it('translates canonical types into humane language', () => {
    expect(requestTypeLabel('recovery_coach')).toBe('Talk with a recovery coach');
    expect(requestTypeLabel('unknown_type')).toBe('Support request');
  });
});
