import { Link } from 'react-router';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { formatElapsed, needCategoryLabel } from '@recoveryos/domain';
import { useNavigatorWorkspace } from '../hooks/useNavigatorWorkspace';

/** Active navigation relationships — people, not cases. */
export function NavPeoplePage() {
  const { roster, needs, isLoading, hasError, refetch } = useNavigatorWorkspace();

  if (isLoading) return <LoadingState label="Loading your people…" />;
  if (hasError)
    return <ErrorState message="We couldn’t load your people right now." onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <PageHeader title="My People" lede="Everyone you’re walking alongside right now." />
      {roster.length === 0 ? (
        <EmptyState
          title="No one is connected with you yet"
          message="When you connect with someone waiting for navigation, they’ll appear here."
        />
      ) : (
        <ul className="space-y-2">
          {roster.map((entry) => {
            const activeNeeds = needs.filter(
              (n) =>
                n.person_id === entry.participant_person_id &&
                n.status !== 'resolved' &&
                n.status !== 'deferred',
            );
            return (
              <li key={entry.relationship_id}>
                <Link
                  to={`/navigator/people/${entry.participant_person_id}`}
                  className="block rounded-lg border border-line bg-surface-raised p-4 hover:border-experience-500"
                >
                  <p className="font-semibold text-ink">
                    {entry.display_name}
                    {entry.pronouns ? (
                      <span className="ml-2 text-sm font-normal text-ink-faint">({entry.pronouns})</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {entry.started_at ? `Together since ${formatElapsed(entry.started_at)}` : 'Recently connected'}
                    {activeNeeds.length > 0
                      ? ` · working on ${activeNeeds.map((n) => needCategoryLabel(n.need_category).toLowerCase()).slice(0, 2).join(', ')}${activeNeeds.length > 2 ? '…' : ''}`
                      : ''}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
