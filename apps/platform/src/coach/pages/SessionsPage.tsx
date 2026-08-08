import { EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { useCoachWorkspace } from '../hooks/useCoachWorkspace';
import { SessionRow } from '../components/SessionRow';

/** Today's sessions — canonical appointments where this coach is the provider. */
export function SessionsPage() {
  const { todaySessions, roster, isLoading, hasError, refetch } = useCoachWorkspace();
  const names = new Map(roster.map((r) => [r.participant_person_id, r.display_name]));

  if (isLoading) return <LoadingState label="Loading today’s sessions…" />;
  if (hasError)
    return <ErrorState message="We couldn’t load your sessions right now." onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="Today’s Sessions" lede="Scheduled connections for today." />
      {todaySessions.length === 0 ? (
        <EmptyState
          title="You don’t have any sessions scheduled today"
          message="Confirmed sessions with your participants will appear here."
        />
      ) : (
        <ul className="space-y-2">
          {todaySessions.map((a) => (
            <li key={a.id}>
              <SessionRow appointment={a} participantName={names.get(a.person_id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
