import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Button, EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { formatElapsed, requestTypeLabel, type OpenPoolRow } from '@recoveryos/domain';
import {
  useClaimNavigationRequest,
  useNavigatorWorkspace,
  type NavClaimOutcome,
} from '../hooks/useNavigatorWorkspace';
import { track } from '../../lib/analytics';

/**
 * People waiting for navigation help. Same progressive-disclosure standard as
 * the coach pool — and since 0112, the server projection itself carries no
 * participant free text, so there is nothing sensitive here to hide.
 */
export function NavRequestsPage() {
  const { pool, isLoading, hasError, refetch } = useNavigatorWorkspace();
  const claim = useClaimNavigationRequest();
  const navigate = useNavigate();
  const [outcome, setOutcome] = useState<NavClaimOutcome | null>(null);

  useEffect(() => {
    track('navigation_request_viewed');
  }, []);

  async function connect(row: OpenPoolRow) {
    const result = await claim.mutateAsync(row.support_request_id);
    setOutcome(result);
    if (result === 'connected') {
      navigate(`/navigator/people/${row.participant_person_id}`);
    }
  }

  if (isLoading) return <LoadingState label="Checking who’s waiting…" />;
  if (hasError)
    return <ErrorState message="We couldn’t load the waiting list right now." onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="People waiting for navigation"
        lede="Each of these people asked for help getting somewhere — housing, care, work, documents."
      />

      {outcome === 'race_lost' ? (
        <Alert tone="info">
          Someone else just connected with this person. That’s okay — there may be others still
          waiting.
        </Alert>
      ) : null}
      {outcome === 'has_navigator' ? (
        <Alert tone="info">They’re already connected with another navigator.</Alert>
      ) : null}
      {outcome === 'not_eligible' ? (
        <Alert tone="info">This request needs a different kind of support person.</Alert>
      ) : null}
      {outcome === 'failed' ? (
        <Alert tone="critical">We couldn’t complete that connection. Try again.</Alert>
      ) : null}

      {pool.length === 0 ? (
        <EmptyState
          title="No one is waiting right now"
          message="When someone asks for navigation help, they’ll appear here."
        />
      ) : (
        <ul className="space-y-2.5">
          {pool.map((row) => (
            <li
              key={row.support_request_id}
              className="rounded-lg border border-line bg-surface-raised p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{row.participant_name}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{requestTypeLabel(row.request_type)}</p>
                  <p className="text-sm text-ink-faint">
                    Prefers {String(row.preferred_modality).replace('_', ' ')} · waiting{' '}
                    {formatElapsed(row.created_at)}
                  </p>
                </div>
                <Button size="md" onClick={() => void connect(row)} disabled={claim.isPending}>
                  {claim.isPending ? 'Connecting…' : 'Connect with this person'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
