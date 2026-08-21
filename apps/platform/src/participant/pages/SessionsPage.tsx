import { useState } from 'react';
import { Link } from 'react-router';
import { useQueries } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import {
  getMyBookingStates,
  getMySupportTeam,
  getMyUpcomingAppointments,
} from '@recoveryos/data-access';
import {
  bookingForAppointment,
  deriveSchedulingView,
  formatAppointmentTime,
  formatOfferedTime,
} from '@recoveryos/domain';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@recoveryos/ui';
import { participantKeys } from '../../lib/query';
import { TimeOffersForm } from '../../scheduling/TimeOffersForm';
import {
  useAcceptProposal,
  useCancelBooking,
  useCounterPropose,
  useRescheduleBooking,
} from '../../scheduling/useScheduling';

/**
 * The participant scheduling destination (P4D-2): choose from suggested times,
 * suggest others, see the confirmed session, and change it safely. Lifecycle
 * vocabulary (rounds, proposals, booking requests) never reaches the screen.
 */
export function SessionsPage() {
  const { person } = useAuth();
  const personId = person?.id ?? 0;
  const enabled = personId > 0;
  const accept = useAcceptProposal();
  const counter = useCounterPropose();
  const cancelBooking = useCancelBooking();
  const reschedule = useRescheduleBooking();
  const [countering, setCountering] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [acceptNotice, setAcceptNotice] = useState<'times_changed' | 'failed' | null>(null);

  const [bookings, appointments, team] = useQueries({
    queries: [
      {
        queryKey: participantKeys.bookings(personId),
        queryFn: () => getMyBookingStates(personId),
        enabled,
        refetchInterval: 20_000,
      },
      {
        queryKey: participantKeys.appointments(personId),
        queryFn: () => getMyUpcomingAppointments(personId),
        enabled,
      },
      {
        queryKey: participantKeys.supportTeam(personId),
        queryFn: () => getMySupportTeam(),
        enabled,
      },
    ],
  });

  if (enabled && (bookings.isPending || appointments.isPending)) {
    return <LoadingState label="Checking your sessions…" />;
  }
  if (bookings.error && appointments.error) {
    return (
      <ErrorState
        message="We couldn’t load your session information right now."
        onRetry={() => {
          void bookings.refetch();
          void appointments.refetch();
        }}
      />
    );
  }

  const coachName =
    ((team.data ?? []).find((m) => m.is_primary) ?? (team.data ?? [])[0])?.display_name ??
    'your coach';
  const view = deriveSchedulingView(bookings.data ?? [], personId);
  const next = (appointments.data ?? [])[0];

  async function choose(proposalId: number) {
    setAcceptNotice(null);
    const outcome = await accept.mutateAsync(proposalId);
    if (outcome !== 'confirmed') setAcceptNotice(outcome);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Sessions" lede="Find a time that works — together." />

      {acceptNotice === 'times_changed' ? (
        <Alert tone="info">
          Those times just changed — take a look at the latest options below.
        </Alert>
      ) : null}
      {acceptNotice === 'failed' ? (
        <Alert tone="critical">We couldn’t confirm that time. Try again.</Alert>
      ) : null}

      {view.needsMyChoice ? (
        <Card>
          <CardTitle>{coachName} suggested these times</CardTitle>
          <ul className="mt-2 space-y-2">
            {view.needsMyChoice.offers.map((offer) => (
              <li
                key={offer.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2.5"
              >
                <span className="text-ink">{formatOfferedTime(offer.proposed_start)}</span>
                <Button size="md" onClick={() => void choose(offer.id)} disabled={accept.isPending}>
                  {accept.isPending ? 'One moment…' : 'Choose this time'}
                </Button>
              </li>
            ))}
          </ul>
          {countering ? (
            <div className="mt-4">
              <p className="mb-2 text-sm text-ink-muted">Offer times that work better for you:</p>
              <TimeOffersForm
                submitLabel="Suggest these times"
                submitting={counter.isPending}
                onCancel={() => setCountering(false)}
                onSubmit={(starts) => {
                  const bookingId = view.needsMyChoice?.booking.id;
                  if (!bookingId) return;
                  void counter
                    .mutateAsync({ bookingRequestId: bookingId, starts })
                    .then(() => setCountering(false))
                    .catch(() => undefined);
                }}
              />
              {counter.isError ? (
                <Alert tone="critical">We couldn’t send those times. Try again.</Alert>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCountering(true)}
              className="mt-3 text-sm font-medium text-experience-700 underline underline-offset-2"
            >
              These times don’t work — suggest another time
            </button>
          )}
        </Card>
      ) : null}

      {!view.needsMyChoice && view.waitingOnOther ? (
        <Card>
          <CardTitle>Scheduling underway</CardTitle>
          <p className="mt-1 text-ink-muted">
            {coachName} is looking at the times — you’ll hear back here soon.
          </p>
        </Card>
      ) : null}

      {next ? (
        <Card>
          <CardTitle>Your next session</CardTitle>
          {(() => {
            const when = formatAppointmentTime(next.starts_at, next.timezone);
            return (
              <p className="mt-1 text-ink">
                {when.day} at {when.time}
                {when.zone ? <span className="text-ink-muted"> ({when.zone})</span> : null}
                {next.modality ? (
                  <span className="text-ink-muted"> · {String(next.modality).replace('_', ' ')}</span>
                ) : null}
              </p>
            );
          })()}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {next.meeting_url && next.modality === 'video' ? (
              <a
                href={next.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-full bg-experience-600 px-5 font-semibold text-white hover:bg-experience-strong"
              >
                Join session
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setRescheduling((v) => !v)}
              className="text-sm font-medium text-experience-700 underline underline-offset-2"
            >
              Find another time
            </button>
            <button
              type="button"
              onClick={() => setConfirmingCancel(true)}
              className="text-sm font-medium text-ink-faint underline underline-offset-2"
            >
              Cancel session
            </button>
          </div>
          {rescheduling ? (
            <div className="mt-4">
              <p className="mb-2 text-sm text-ink-muted">
                Suggest new times — your current session stays until a new one is confirmed
                together.
              </p>
              <TimeOffersForm
                submitLabel="Suggest new times"
                submitting={reschedule.isPending}
                onCancel={() => setRescheduling(false)}
                onSubmit={(starts) =>
                  void reschedule
                    .mutateAsync({ appointmentId: next.id, starts })
                    .then(() => setRescheduling(false))
                    .catch(() => undefined)
                }
              />
              {reschedule.isError ? (
                <Alert tone="critical">We couldn’t start rescheduling. Try again.</Alert>
              ) : null}
            </div>
          ) : null}
          {confirmingCancel ? (
            <div className="mt-4 rounded-md border border-line bg-surface p-3">
              <p className="text-ink">Cancel this session?</p>
              <p className="mt-0.5 text-sm text-ink-muted">
                We’ll let {coachName} know. You can always schedule a new one.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="secondary"
                  disabled={cancelBooking.isPending}
                  onClick={() => {
                    const booking = bookingForAppointment(bookings.data ?? [], next.id);
                    if (!booking) return;
                    void cancelBooking
                      .mutateAsync({ bookingRequestId: booking.id })
                      .then(() => setConfirmingCancel(false))
                      .catch(() => undefined);
                  }}
                >
                  {cancelBooking.isPending ? 'One moment…' : 'Yes, cancel it'}
                </Button>
                <Button variant="ghost" onClick={() => setConfirmingCancel(false)}>
                  Keep my session
                </Button>
              </div>
              {cancelBooking.isError ? (
                <Alert tone="critical">We couldn’t cancel that. Try again.</Alert>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}

      {!next && !view.needsMyChoice && !view.waitingOnOther ? (
        <EmptyState
          title="No session scheduled yet"
          message="Your coach can suggest times here — or you can ask about scheduling in Messages."
        />
      ) : null}

      <p className="text-sm text-ink-faint">
        Want to talk first?{' '}
        <Link to="/vrcc/messages" className="underline underline-offset-2">
          Open Messages
        </Link>
      </p>
    </div>
  );
}
