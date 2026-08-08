import { formatAppointmentTime, type CanonicalAppointmentRow } from '@recoveryos/domain';

/** One session line for coach surfaces: who, when (appointment timezone), how. */
export function SessionRow({
  appointment,
  participantName,
}: {
  appointment: CanonicalAppointmentRow;
  participantName?: string;
}) {
  const { day, time, zone } = formatAppointmentTime(appointment.starts_at, appointment.timezone);
  const modality =
    appointment.modality === 'video'
      ? 'Video'
      : appointment.modality === 'phone'
        ? 'Phone'
        : appointment.modality === 'in_person'
          ? 'In person'
          : '';
  return (
    <div className="rounded-md border border-line bg-surface-raised px-3 py-2.5">
      <p className="font-medium text-ink">{participantName ?? 'Session'}</p>
      <p className="text-sm text-ink-muted">
        {day} at {time}
        {zone ? ` (${zone})` : ''}
        {modality ? ` · ${modality}` : ''}
      </p>
      {appointment.meeting_url && appointment.modality === 'video' ? (
        <a
          href={appointment.meeting_url}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-flex min-h-11 items-center rounded-md bg-experience-600 px-4 text-sm font-medium text-white"
        >
          Join session
        </a>
      ) : null}
    </div>
  );
}
