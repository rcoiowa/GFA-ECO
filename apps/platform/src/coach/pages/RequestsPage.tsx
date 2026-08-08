import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Button, EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import {
  formatElapsed,
  isNavigationRequest,
  requestTypeLabel,
  type OpenPoolRow,
} from '@recoveryos/domain';
import { useCoachWorkspace, useClaimRequest, type ClaimOutcome } from '../hooks/useCoachWorkspace';
import { track } from '../../lib/analytics';
import { useEffect } from 'react';

/**
 * People waiting for connection (open pool). Progressive disclosure: only what
 * a coach needs to decide whether to connect — name, kind of support, preferred
 * way to connect, how long they've waited. Participant free-text context is
 * deliberately NOT shown pre-claim; it becomes visible once a relationship
 * exists. Claiming is "Connect", and the server decides who won.
 */
export function RequestsPage() {
  const { pool: fullPool, isLoading, hasError, refetch } = useCoachWorkspace();
  // Coaching-domain requests only — navigation requests belong to the Navigator
  // Workspace, and the server enforces domain eligibility at claim regardless.
  const pool = fullPool.filter((row) => !isNavigationRequest(row.request_type));
  const claim = useClaimRequest();
  const navigate = useNavigate();
  const [outcome, setOutcome] = useState<{ id: number; result: ClaimOutcome } | null>(null);

  useEffect(() => {
    track('open_request_viewed');
  }, []);

  async function connect(row: OpenPoolRow) {
    const result = await claim.mutateAsync(row.support_request_id);
    setOutcome({ id: row.support_request_id, result });
    if (result === 'connected') {
      navigate(`/coach/participants/${row.participant_person_id}`);
    }
  }

  if (isLoading) return <LoadingState label="Checking who’s waiting…" />;
  if (hasError)
    return <ErrorState message="We couldn’t load the waiting list right now." onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="People waiting for connection"
        lede="Each of these people reached out and is waiting for a human response."
      />

      {outcome?.result === 'race_lost' ? (
        <Alert tone="info">
          Someone else just connected with this person. That’s okay — there may be others still
          waiting.
        </Alert>
      ) : null}
      {outcome?.result === 'has_coach' ? (
        <Alert tone="info">They’re already connected with another coach.</Alert>
      ) : null}
      {outcome?.result === 'failed' ? (
        <Alert tone="critical">We couldn’t complete that connection. Try again.</Alert>
      ) : null}

      {pool.length === 0 ? (
        <EmptyState
          title="No one is waiting right now"
          message="When someone asks for support, they’ll appear here."
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
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {requestTypeLabel(row.request_type)}
                  </p>
                  <p className="text-sm text-ink-faint">
                    Prefers {String(row.preferred_modality).replace('_', ' ')} · waiting{' '}
                    {formatElapsed(row.created_at)}
                  </p>
                </div>
                <Button
                  size="md"
                  onClick={() => connect(row)}
                  disabled={claim.isPending}
                >
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
