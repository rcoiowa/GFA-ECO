import type { CanonicalAppointmentRow, OpenPoolRow } from './coaching';

/**
 * Coach workspace contracts + pure attention derivation (P4C). Same philosophy
 * as the participant view model: canonical truth in, humane operational
 * answers out, nothing persisted for the frontend, fully unit-tested.
 */

export interface CoachRosterEntry {
  relationship_id: number;
  participant_person_id: number;
  display_name: string;
  pronouns: string | null;
  relationship_type: string;
  is_primary: boolean;
  started_at: string | null;
  origin_request_type: string | null;
  origin_focus: string | null;
}

export interface FollowUpRow {
  id: number;
  person_id: number;
  assigned_person_id: number | null;
  appointment_id: number | null;
  follow_up_type: string;
  due_at: string | null;
  status: string;
  note: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface CoachAttentionItem {
  key: string;
  label: string;
  to: string;
}

/**
 * Coach attention — short, actionable, priority-ordered:
 * 1) session imminent (next 2h) · 2) follow-up overdue · 3) people waiting ·
 * 4) follow-up due today. Derived, never stored; max 4.
 */
export function deriveCoachAttention(input: {
  todayAppointments: CanonicalAppointmentRow[];
  openPool: OpenPoolRow[];
  followUps: FollowUpRow[];
  rosterNames?: Map<number, string>;
  now?: Date;
}): CoachAttentionItem[] {
  const now = input.now ?? new Date();
  const items: CoachAttentionItem[] = [];

  const imminent = input.todayAppointments
    .filter((a) => {
      const start = new Date(a.starts_at).getTime();
      return start > now.getTime() && start - now.getTime() <= 2 * 60 * 60 * 1000;
    })
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  if (imminent) {
    const who = input.rosterNames?.get(imminent.person_id);
    items.push({
      key: `imminent-${imminent.id}`,
      label: who ? `Session with ${who} coming up soon.` : 'A session is coming up soon.',
      to: '/coach/sessions',
    });
  }

  const overdue = input.followUps.filter(
    (f) => f.status === 'open' && f.due_at && new Date(f.due_at) < now,
  );
  if (overdue.length > 0) {
    items.push({
      key: 'followups-overdue',
      label:
        overdue.length === 1
          ? 'A follow-up is past due.'
          : `${overdue.length} follow-ups are past due.`,
      to: '/coach/follow-ups',
    });
  }

  if (input.openPool.length > 0) {
    items.push({
      key: 'pool',
      label:
        input.openPool.length === 1
          ? '1 person is waiting for connection.'
          : `${input.openPool.length} people are waiting for connection.`,
      to: '/coach/requests',
    });
  }

  const dueToday = input.followUps.filter((f) => {
    if (f.status !== 'open' || !f.due_at) return false;
    const due = new Date(f.due_at);
    return due >= now && due.getTime() - now.getTime() <= 24 * 60 * 60 * 1000;
  });
  if (dueToday.length > 0) {
    items.push({
      key: 'followups-today',
      label: dueToday.length === 1 ? 'Follow up with someone today.' : `${dueToday.length} follow-ups today.`,
      to: '/coach/follow-ups',
    });
  }

  return items.slice(0, 4);
}

/** Appointments on the coach's current local day, soonest first. */
export function todaysAppointments(
  appointments: CanonicalAppointmentRow[],
  now: Date = new Date(),
): CanonicalAppointmentRow[] {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return appointments
    .filter((a) => {
      const t = new Date(a.starts_at);
      return t >= dayStart && t < dayEnd && (a.status === 'confirmed' || a.status === 'scheduled');
    })
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}
