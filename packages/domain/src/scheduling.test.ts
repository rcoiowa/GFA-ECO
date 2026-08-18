import { describe, expect, it } from 'vitest';
import { bookingForAppointment, deriveSchedulingView } from './scheduling';
import { formatOfferedTime } from './time';
import type { BookingProposalRow, BookingStateRow } from './coaching';

const proposal = (over: Partial<BookingProposalRow>): BookingProposalRow => ({
  id: 1,
  booking_request_id: 5,
  proposed_by_person_id: 20,
  proposed_start: '2026-08-12T15:00:00Z',
  proposed_end: '2026-08-12T15:50:00Z',
  round: 1,
  is_active: true,
  accepted: false,
  ...over,
});

const booking = (over: Partial<BookingStateRow>): BookingStateRow => ({
  id: 5,
  support_request_id: null,
  participant_person_id: 10,
  provider_person_id: 20,
  status: 'open',
  appointment_id: null,
  created_at: '2026-08-08T10:00:00Z',
  proposals: [],
  ...over,
});

describe('deriveSchedulingView', () => {
  it("the coach's offered times need the participant's choice, sorted soonest first", () => {
    const view = deriveSchedulingView(
      [
        booking({
          proposals: [
            proposal({ id: 2, proposed_start: '2026-08-13T15:00:00Z' }),
            proposal({ id: 1, proposed_start: '2026-08-12T15:00:00Z' }),
          ],
        }),
      ],
      10,
    );
    expect(view.needsMyChoice?.offers.map((o) => o.id)).toEqual([1, 2]);
    expect(view.waitingOnOther).toBeNull();
  });

  it('my own active offers mean I am waiting, not choosing', () => {
    const view = deriveSchedulingView(
      [booking({ proposals: [proposal({ proposed_by_person_id: 10 })] })],
      10,
    );
    expect(view.needsMyChoice).toBeNull();
    expect(view.waitingOnOther?.id).toBe(5);
  });

  it('inactive (superseded) rounds never surface as choices', () => {
    const view = deriveSchedulingView(
      [booking({ proposals: [proposal({ is_active: false })] })],
      10,
    );
    expect(view.needsMyChoice).toBeNull();
  });

  it('confirmed bookings are not negotiations', () => {
    const view = deriveSchedulingView(
      [booking({ status: 'confirmed', appointment_id: 99, proposals: [proposal({})] })],
      10,
    );
    expect(view.needsMyChoice).toBeNull();
    expect(view.waitingOnOther).toBeNull();
  });
});

describe('bookingForAppointment', () => {
  it('finds the booking behind a confirmed appointment', () => {
    const rows = [booking({ id: 6, status: 'confirmed', appointment_id: 99 })];
    expect(bookingForAppointment(rows, 99)?.id).toBe(6);
    expect(bookingForAppointment(rows, 100)).toBeNull();
  });
});

describe('formatOfferedTime — timezone and DST honesty', () => {
  it('renders the same instant with an explicit zone label', () => {
    const s = formatOfferedTime('2026-08-12T15:00:00Z', 'America/Chicago');
    expect(s).toMatch(/Aug 12/);
    expect(s).toMatch(/10:00\sAM/);
    expect(s).toMatch(/CDT/);
  });

  it('crossing the March DST boundary changes both clock hour and zone label', () => {
    // Same 14:00 UTC — before the 2026-03-08 spring-forward it is 8:00 CST,
    // after it is 9:00 CDT. Intl owns the math; no offset arithmetic anywhere.
    const before = formatOfferedTime('2026-03-07T14:00:00Z', 'America/Chicago');
    const after = formatOfferedTime('2026-03-09T14:00:00Z', 'America/Chicago');
    expect(before).toMatch(/8:00\sAM/);
    expect(before).toMatch(/CST/);
    expect(after).toMatch(/9:00\sAM/);
    expect(after).toMatch(/CDT/);
  });
});
