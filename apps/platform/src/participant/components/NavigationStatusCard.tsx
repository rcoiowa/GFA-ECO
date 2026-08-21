import { useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import {
  confirmMyConnection,
  getNavigationNeeds,
  getNavigationReferrals,
} from '@recoveryos/data-access';
import {
  CONNECTION_CONFIRMATION_OPTIONS,
  awaitingConnectionConfirmation,
  needCategoryLabel,
  needStatusLabel,
  referralStatusLabel,
  referralTypeLabel,
} from '@recoveryos/domain';
import { Alert, Button, Card, CardTitle } from '@recoveryos/ui';
import { participantKeys } from '../../lib/query';
import { track } from '../../lib/analytics';

/**
 * The participant's view of their navigation support (P4E §36–37): what's
 * being worked on and where each connection stands — in their language, never
 * internal enums, staff notes, or partner scoring. When a connection is open,
 * a gentle "Were you able to connect?" closes the loop in their own voice.
 */
export function NavigationStatusCard() {
  const { person } = useAuth();
  const personId = person?.id ?? 0;
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const [needs, referrals] = useQueries({
    queries: [
      {
        queryKey: [...participantKeys.all, personId, 'navigationNeeds'],
        queryFn: () => getNavigationNeeds(personId),
        enabled: personId > 0,
      },
      {
        queryKey: [...participantKeys.all, personId, 'navigationReferrals'],
        queryFn: () => getNavigationReferrals(personId),
        enabled: personId > 0,
      },
    ],
  });

  const confirm = useMutation({
    mutationFn: async (input: { referralId: number; response: string }) => {
      const result = await confirmMyConnection(input.referralId, input.response);
      if (!result.ok) throw new Error(String(result.code));
      track(input.response === 'yes' ? 'connection_confirmed' : 'connection_not_confirmed');
      return result;
    },
    onSettled: () => {
      setConfirmingId(null);
      void queryClient.invalidateQueries({ queryKey: participantKeys.all });
    },
  });

  const activeNeeds = (needs.data ?? []).filter((n) => n.status !== 'deferred');
  const rows = referrals.data ?? [];
  if (activeNeeds.length === 0 && rows.length === 0) return null;

  return (
    <Card>
      <CardTitle>Getting connected</CardTitle>

      {activeNeeds.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm">
          {activeNeeds.map((need) => (
            <li key={need.id} className="flex flex-wrap justify-between gap-2">
              <span className="text-ink">{needCategoryLabel(need.need_category)}</span>
              <span className="text-ink-muted">
                {need.status === 'in_progress'
                  ? 'We’re working on this with you.'
                  : needStatusLabel(need.status)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {rows.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {rows.map((referral) => (
            <li key={referral.id} className="rounded-md border border-line px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-ink">
                  {referral.destination_name ?? 'A community resource'}
                </span>
                <span className="text-ink-muted">
                  {referral.referral_type === 'warm_handoff' && referral.status === 'connected'
                    ? 'Your navigator helped connect you directly.'
                    : `${referralTypeLabel(referral.referral_type)} · ${referralStatusLabel(referral.status)}`}
                </span>
              </div>
              {awaitingConnectionConfirmation(referral.status) ? (
                confirmingId === referral.id ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CONNECTION_CONFIRMATION_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant="ghost"
                        size="md"
                        disabled={confirm.isPending}
                        onClick={() =>
                          void confirm
                            .mutateAsync({ referralId: referral.id, response: option.value })
                            .catch(() => undefined)
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(referral.id)}
                    className="mt-2 text-sm font-medium text-experience-700 underline underline-offset-2"
                  >
                    Were you able to connect?
                  </button>
                )
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {confirm.isError ? (
        <div className="mt-2">
          <Alert tone="critical">We couldn’t save that. Try again.</Alert>
        </div>
      ) : null}
    </Card>
  );
}
