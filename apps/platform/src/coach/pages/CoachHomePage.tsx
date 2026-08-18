import { Link } from 'react-router';
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { formatElapsed, requestTypeLabel } from '@recoveryos/domain';
import { useCoachWorkspace } from '../hooks/useCoachWorkspace';
import { SessionRow } from '../components/SessionRow';
import { useEffect } from 'react';
import { track } from '../../lib/analytics';

/** Coach home — who needs me, who I'm meeting, who's waiting, who needs follow-up. */
export function CoachHomePage() {
  const { pool, roster, todaySessions, followUps, attention, isLoading, hasError, refetch } =
    useCoachWorkspace();

  useEffect(() => {
    track('coach_workspace_viewed');
  }, []);

  if (isLoading) return <LoadingState label="Opening your workspace…" />;
  if (hasError)
    return <ErrorState message="We couldn’t load your workspace right now." onRetry={refetch} />;

  const openFollowUps = followUps.filter((f) => f.status === 'open');
  const rosterNames = new Map(roster.map((r) => [r.participant_person_id, r.display_name]));

  return (
    <div className="space-y-5">
      <PageHeader title="Coach Workspace" lede="The people counting on you today." />

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
        <CardTitle>Today’s sessions</CardTitle>
        {todaySessions.length === 0 ? (
          <p className="mt-2 text-ink-muted">You don’t have any sessions scheduled today.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {todaySessions.map((a) => (
              <li key={a.id}>
                <SessionRow appointment={a} participantName={rosterNames.get(a.person_id)} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>People waiting for connection</CardTitle>
        {pool.length === 0 ? (
          <p className="mt-2 text-ink-muted">No one is waiting for a coach right now.</p>
        ) : (
          <>
            <ul className="mt-2 space-y-1.5">
              {pool.slice(0, 3).map((r) => (
                <li key={r.support_request_id} className="rounded-md border border-line bg-surface-raised px-3 py-2.5">
                  <p className="font-medium text-ink">{r.participant_name}</p>
                  <p className="text-sm text-ink-muted">
                    {requestTypeLabel(r.request_type)} · waiting {formatElapsed(r.created_at)}
                  </p>
                </li>
              ))}
            </ul>
            <Link
              to="/coach/requests"
              className="mt-2 inline-block text-sm font-medium text-experience-700 underline underline-offset-2"
            >
              {pool.length > 3 ? `See all ${pool.length} waiting` : 'Open waiting list'}
            </Link>
          </>
        )}
      </Card>

      <Card>
        <CardTitle>Follow-ups</CardTitle>
        {openFollowUps.length === 0 ? (
          <p className="mt-2 text-ink-muted">Nothing needs follow-up right now.</p>
        ) : (
          <p className="mt-2 text-ink-muted">
            {openFollowUps.length === 1 ? '1 open follow-up.' : `${openFollowUps.length} open follow-ups.`}{' '}
            <Link to="/coach/follow-ups" className="font-medium text-experience-700 underline underline-offset-2">
              View
            </Link>
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>My participants</CardTitle>
        {roster.length === 0 ? (
          <EmptyState
            title="No one is connected with you yet"
            message="When you connect with someone from the waiting list, they’ll appear here."
          />
        ) : (
          <p className="mt-2 text-ink-muted">
            {roster.length === 1 ? '1 active participant.' : `${roster.length} active participants.`}{' '}
            <Link to="/coach/participants" className="font-medium text-experience-700 underline underline-offset-2">
              View roster
            </Link>
          </p>
        )}
      </Card>
    </div>
  );
}
