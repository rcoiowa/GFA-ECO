import { useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { formatElapsed, requestTypeLabel } from '@recoveryos/domain';
import { useNavigatorWorkspace } from '../hooks/useNavigatorWorkspace';
import { track } from '../../lib/analytics';

/**
 * Navigator home answers: who needs help navigating something, which barriers
 * are unresolved, which referrals need follow-up, which connections landed,
 * and who we're waiting to hear from. Relational, not a pipeline.
 */
export function NavigatorHomePage() {
  const { pool, roster, needs, referrals, followUps, attention, isLoading, hasError, refetch } =
    useNavigatorWorkspace();

  useEffect(() => {
    track('navigator_workspace_viewed');
  }, []);

  if (isLoading) return <LoadingState label="Opening your workspace…" />;
  if (hasError)
    return <ErrorState message="We couldn’t load your workspace right now." onRetry={refetch} />;

  const openConnections = referrals.filter(
    (r) => r.status === 'initiated' || r.status === 'contact_attempted' || r.status === 'not_connected',
  );
  const openFollowUps = followUps.filter((f) => f.status === 'open');
  const unresolvedNeeds = needs.filter((n) => n.status !== 'resolved' && n.status !== 'deferred');

  return (
    <div className="space-y-5">
      <PageHeader title="Navigator Workspace" lede="Helping people get from here to there — and knowing they arrived." />

      {attention.length > 0 ? (
        <Card>
          <CardTitle>Needs attention</CardTitle>
          <ul className="mt-2 space-y-1.5">
            {attention.map((item) => (
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
      ) : null}

      <Card>
        <CardTitle>People waiting for navigation</CardTitle>
        {pool.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No one is waiting right now.</p>
        ) : (
          <>
            <ul className="mt-2 space-y-1.5">
              {pool.slice(0, 3).map((row) => (
                <li key={row.support_request_id} className="rounded-md border border-line px-3 py-2 text-sm">
                  <span className="font-medium text-ink">{row.participant_name}</span>{' '}
                  <span className="text-ink-muted">
                    · {requestTypeLabel(row.request_type)} · waiting {formatElapsed(row.created_at)}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/navigator/requests"
              className="mt-2 inline-block text-sm font-medium text-experience-700 underline underline-offset-2"
            >
              See everyone waiting
            </Link>
          </>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle>Connections in progress</CardTitle>
          <p className="mt-1 text-2xl font-semibold text-ink">{openConnections.length}</p>
          <Link to="/navigator/connections" className="text-sm text-experience-700 underline underline-offset-2">
            Open Connections
          </Link>
        </Card>
        <Card>
          <CardTitle>Follow-ups</CardTitle>
          <p className="mt-1 text-2xl font-semibold text-ink">{openFollowUps.length}</p>
          <Link to="/navigator/follow-ups" className="text-sm text-experience-700 underline underline-offset-2">
            Open Follow-Ups
          </Link>
        </Card>
        <Card>
          <CardTitle>My people</CardTitle>
          <p className="mt-1 text-2xl font-semibold text-ink">{roster.length}</p>
          <Link to="/navigator/people" className="text-sm text-experience-700 underline underline-offset-2">
            Open My People
          </Link>
        </Card>
      </div>

      {unresolvedNeeds.length > 0 ? (
        <p className="text-sm text-ink-muted">
          {unresolvedNeeds.length === 1
            ? '1 identified need is still being worked on.'
            : `${unresolvedNeeds.length} identified needs are still being worked on.`}{' '}
          Unmet needs stay visible — they’re real evidence, not failures.
        </p>
      ) : null}
    </div>
  );
}
