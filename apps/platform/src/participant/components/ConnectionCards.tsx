import { Link } from 'react-router';
import { Card, CardTitle } from '@recoveryos/ui';
import {
  formatAppointmentTime,
  formatElapsed,
  requestTypeLabel,
  type CanonicalAppointmentRow,
  type ConnectionState,
  type SupportTeamMember,
} from '@recoveryos/domain';

/**
 * Reusable participant connection surfaces. Props-driven (no data fetching)
 * so they are directly testable and composable on Connect and Today.
 * Language rule: canonical lifecycle vocabulary never reaches the screen.
 */

export function SupportPersonCard({ member }: { member: SupportTeamMember }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-surface-raised p-3">
      <div
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-experience-soft text-lg font-semibold text-experience-700"
      >
        {member.display_name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-ink">{member.display_name}</p>
        <p className="text-sm text-ink-muted">
          {member.role_label}
          {member.started_at ? ` · with you since ${formatElapsed(member.started_at)}` : ''}
        </p>
      </div>
    </div>
  );
}

export function NextAppointmentCard({
  appointment,
  supportTeam,
}: {
  appointment: CanonicalAppointmentRow;
  supportTeam: SupportTeamMember[];
}) {
  const who = supportTeam.find((m) => m.support_person_id === appointment.provider_person_id);
  const { day, time, zone } = formatAppointmentTime(appointment.starts_at, appointment.timezone);
  const modality =
    appointment.modality === 'video'
      ? 'Video call'
      : appointment.modality === 'phone'
        ? 'Phone call'
        : appointment.modality === 'in_person'
          ? 'In person'
          : null;
  return (
    <div className="rounded-md border border-line bg-surface-raised p-3">
      <p className="font-medium text-ink">
        {who ? `Session with ${who.display_name}` : 'Your next session'}
      </p>
      <p className="mt-0.5 text-sm text-ink-muted">
        {day} at {time}
        {zone ? ` (${zone})` : ''}
        {modality ? ` · ${modality}` : ''}
      </p>
      {appointment.meeting_url && appointment.modality === 'video' ? (
        <a
          href={appointment.meeting_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex min-h-11 items-center rounded-md bg-experience-600 px-4 font-medium text-white"
        >
          Join session
        </a>
      ) : null}
    </div>
  );
}

/** Compact Today card: the participant's support state in one glance. */
export function MySupportCard({ state }: { state: ConnectionState }) {
  return (
    <Card>
      <CardTitle>My Support</CardTitle>
      {state.supportTeam.length > 0 ? (
        <div className="mt-2 space-y-2">
          {state.supportTeam.slice(0, 2).map((m) => (
            <SupportPersonCard key={m.relationship_id} member={m} />
          ))}
          <Link
            to="/vrcc/connect"
            className="inline-block text-sm font-medium text-experience-700 underline underline-offset-2"
          >
            View support
          </Link>
        </div>
      ) : state.kind === 'REQUEST_OPEN' || state.kind === 'REQUEST_CLAIMED' ? (
        <div className="mt-2">
          <p className="text-ink-muted">We’re working on your connection.</p>
          <Link
            to="/vrcc/connect"
            className="mt-1 inline-block text-sm font-medium text-experience-700 underline underline-offset-2"
          >
            View your request
          </Link>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-ink-muted">Need someone to talk with?</p>
          <Link
            to="/vrcc/connect"
            className="mt-1 inline-block text-sm font-medium text-experience-700 underline underline-offset-2"
          >
            Connect
          </Link>
        </div>
      )}
    </Card>
  );
}

/** Compact Today card: next confirmed connection (small when nothing scheduled). */
export function NextConnectionCard({ state }: { state: ConnectionState }) {
  if (state.nextAppointment) {
    return (
      <Card>
        <CardTitle>Next Connection</CardTitle>
        <div className="mt-2">
          <NextAppointmentCard appointment={state.nextAppointment} supportTeam={state.supportTeam} />
        </div>
      </Card>
    );
  }
  if (state.schedulingUnderway) {
    return (
      <Card>
        <CardTitle>Next Connection</CardTitle>
        <p className="mt-2 text-ink-muted">You and your coach are choosing a time.</p>
        <Link
          to="/vrcc/sessions"
          className="mt-1 inline-block text-sm font-medium text-experience-700 underline underline-offset-2"
        >
          View scheduling
        </Link>
      </Card>
    );
  }
  // Nothing scheduled: stay small and calm — no empty schedule widget.
  return null;
}

export interface AttentionItem {
  key: string;
  label: string;
  to: string;
}

/** Derive participant-actionable attention items — highest value first, max 3. */
export function deriveAttentionItems(
  state: ConnectionState,
  unreadCount: number,
  unreadMessages = 0,
): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (unreadMessages > 0) {
    items.push({
      key: 'messages',
      label:
        unreadMessages === 1
          ? 'A new message from your coach.'
          : `${unreadMessages} new messages from your coach.`,
      to: '/vrcc/messages',
    });
  }
  if (state.schedulingUnderway && !state.nextAppointment) {
    items.push({
      key: 'scheduling',
      label: 'A session time is being worked out — take a look.',
      to: '/vrcc/sessions',
    });
  }
  if (state.kind === 'REQUEST_CLAIMED') {
    items.push({
      key: 'claimed',
      label: `Someone picked up your ${requestTypeLabel(
        state.currentRequest?.request_type ?? '',
      ).toLowerCase()} request.`,
      to: '/vrcc/connect',
    });
  }
  if (unreadCount > 0) {
    items.push({
      key: 'notifications',
      label: unreadCount === 1 ? '1 new notification.' : `${unreadCount} new notifications.`,
      to: '/vrcc/notifications',
    });
  }
  return items.slice(0, 3);
}

export function NeedsAttentionCard({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardTitle>Needs your attention</CardTitle>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              to={item.to}
              className="block rounded-md border border-line bg-surface-raised px-3 py-2.5 font-medium text-ink hover:bg-surface-sunken"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
