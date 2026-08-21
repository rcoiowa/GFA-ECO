import type { BookingProposalRow, BookingStateRow } from './coaching';

/**
 * Scheduling negotiation view model (P4D-2). Pure: canonical booking rows in,
 * "what should this person do next" out. Rounds, lifecycle statuses, and ids
 * stay internal — the UI renders choices, never the state machine.
 */

export interface SchedulingView {
  /** An open negotiation where the OTHER person offered times — choose or counter. */
  needsMyChoice: { booking: BookingStateRow; offers: BookingProposalRow[] } | null;
  /** An open negotiation where the ball is in the other person's court. */
  waitingOnOther: BookingStateRow | null;
}

export function deriveSchedulingView(
  bookings: BookingStateRow[],
  myPersonId: number,
): SchedulingView {
  let needsMyChoice: SchedulingView['needsMyChoice'] = null;
  let waitingOnOther: BookingStateRow | null = null;

  for (const booking of bookings) {
    if (booking.status !== 'open') continue;
    const active = (booking.proposals ?? []).filter((p) => p.is_active);
    const offersForMe = active.filter((p) => p.proposed_by_person_id !== myPersonId);
    if (offersForMe.length > 0) {
      if (!needsMyChoice) {
        needsMyChoice = {
          booking,
          offers: [...offersForMe].sort((a, b) => a.proposed_start.localeCompare(b.proposed_start)),
        };
      }
    } else if (!waitingOnOther) {
      waitingOnOther = booking;
    }
  }
  return { needsMyChoice, waitingOnOther };
}

/** The booking that produced a confirmed appointment (for cancel/reschedule paths). */
export function bookingForAppointment(
  bookings: BookingStateRow[],
  appointmentId: number,
): BookingStateRow | null {
  return bookings.find((b) => b.appointment_id === appointmentId) ?? null;
}
