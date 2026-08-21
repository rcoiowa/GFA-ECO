import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import { getCoachBookingStates } from '@recoveryos/data-access';
import { deriveSchedulingView, formatOfferedTime } from '@recoveryos/domain';
import { Alert, Button, Card, CardTitle } from '@recoveryos/ui';
import { coachKeys } from '../../lib/query';
import { TimeOffersForm } from '../../scheduling/TimeOffersForm';
import {
  useAcceptProposal,
  useCancelBooking,
  useCounterPropose,
  useCreateBooking,
} from '../../scheduling/useScheduling';

/**
 * Coach-side scheduling for one participant (P4D-2): open scheduling with a
 * few possible times, respond to counter-offers, confirm, or step back — all
 * through the canonical booking RPCs. No lifecycle vocabulary on screen.
 */
export function SchedulingCard({
  participantPersonId,
  participantName,
}: {
  participantPersonId: number;
  participantName: string;
}) {
  const { person } = useAuth();
  const myPersonId = person?.id ?? 0;
  const [offering, setOffering] = useState(false);
  const [reoffering, setReoffering] = useState(false);
  const [modality, setModality] = useState<'video' | 'phone' | 'in_person'>('video');
  const create = useCreateBooking();
  const counter = useCounterPropose();
  const accept = useAcceptProposal();
  const cancelBooking = useCancelBooking();
  const [acceptNotice, setAcceptNotice] = useState<string | null>(null);

  const bookings = useQuery({
    queryKey: coachKeys.bookings(myPersonId),
    queryFn: () => getCoachBookingStates(myPersonId),
    enabled: myPersonId > 0,
    refetchInterval: 20_000,
  });

  const mine = (bookings.data ?? []).filter(
    (b) => b.participant_person_id === participantPersonId,
  );
  const view = deriveSchedulingView(mine, myPersonId);

  async function choose(proposalId: number) {
    setAcceptNotice(null);
    const outcome = await accept.mutateAsync(proposalId);
    if (outcome === 'times_changed')
      setAcceptNotice('That time just changed — take a look at the latest.');
    if (outcome === 'failed') setAcceptNotice('We couldn’t confirm that time. Try again.');
  }

  return (
    <Card>
      <CardTitle>Scheduling</CardTitle>
      {acceptNotice ? (
        <div className="mt-2">
          <Alert tone="info">{acceptNotice}</Alert>
        </div>
      ) : null}

      {view.needsMyChoice ? (
        <div className="mt-2">
          <p className="text-sm text-ink-muted">{participantName} suggested these times:</p>
          <ul className="mt-2 space-y-2">
            {view.needsMyChoice.offers.map((offer) => (
              <li
                key={offer.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2"
              >
                <span className="text-sm text-ink">{formatOfferedTime(offer.proposed_start)}</span>
                <Button size="md" onClick={() => void choose(offer.id)} disabled={accept.isPending}>
                  Confirm this time
                </Button>
              </li>
            ))}
          </ul>
          {reoffering ? (
            <div className="mt-3">
              <TimeOffersForm
                submitLabel="Offer different times"
                submitting={counter.isPending}
                onCancel={() => setReoffering(false)}
                onSubmit={(starts) => {
                  const bookingId = view.needsMyChoice?.booking.id;
                  if (!bookingId) return;
                  void counter
                    .mutateAsync({ bookingRequestId: bookingId, starts })
                    .then(() => setReoffering(false))
                    .catch(() => undefined);
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setReoffering(true)}
              className="mt-3 text-sm font-medium text-experience-700 underline underline-offset-2"
            >
              Offer different times instead
            </button>
          )}
        </div>
      ) : view.waitingOnOther ? (
        <div className="mt-2">
          <p className="text-sm text-ink-muted">
            Times are with {participantName} — they can choose one or suggest others.
          </p>
          <button
            type="button"
            onClick={() =>
              void cancelBooking
                .mutateAsync({ bookingRequestId: view.waitingOnOther!.id })
                .catch(() => undefined)
            }
            disabled={cancelBooking.isPending}
            className="mt-2 text-sm font-medium text-ink-faint underline underline-offset-2"
          >
            {cancelBooking.isPending ? 'One moment…' : 'Withdraw these times'}
          </button>
        </div>
      ) : offering ? (
        <div className="mt-2 space-y-2">
          <div>
            <label htmlFor="scheduling-modality" className="block text-sm text-ink-muted">
              How you’ll meet
            </label>
            <select
              id="scheduling-modality"
              value={modality}
              onChange={(e) => setModality(e.target.value as 'video' | 'phone' | 'in_person')}
              className="mt-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="video">Video call</option>
              <option value="phone">Phone call</option>
              <option value="in_person">In person</option>
            </select>
          </div>
          <TimeOffersForm
            submitLabel="Send these times"
            submitting={create.isPending}
            onCancel={() => setOffering(false)}
            onSubmit={(starts) =>
              void create
                .mutateAsync({
                  participantPersonId,
                  providerPersonId: myPersonId,
                  modality,
                  starts,
                })
                .then(() => setOffering(false))
                .catch(() => undefined)
            }
          />
          {create.isError ? (
            <Alert tone="critical">We couldn’t send those times. Try again.</Alert>
          ) : null}
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-ink-muted">
            Offer {participantName} a few possible times — they’ll choose one or suggest others.
          </p>
          <Button variant="secondary" className="mt-2" onClick={() => setOffering(true)}>
            Schedule a session
          </Button>
        </div>
      )}
    </Card>
  );
}
