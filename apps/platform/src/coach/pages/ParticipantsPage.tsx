import { Link } from 'react-router';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { formatAppointmentTime, formatElapsed, requestTypeLabel } from '@recoveryos/domain';
import { useCoachWorkspace } from '../hooks/useCoachWorkspace';

/** My Participants — the active relationship roster. Relational context only; no scores, no ranking. */
export function ParticipantsPage() {
  const { roster, todaySessions, followUps, isLoading, hasError, refetch } = useCoachWorkspace();

  if (isLoading) return <LoadingState label="Loading your participants…" />;
  if (hasError)
    return <ErrorState message="We couldn’t load your participants right now." onRetry={refetch} />;

  const nextByPerson = new Map<number, (typeof todaySessions)[number]>();
  for (const a of todaySessions) {
    if (!nextByPerson.has(a.person_id)) nextByPerson.set(a.person_id, a);
  }
  const dueByPerson = new Set(
    followUps.filter((f) => f.status === 'open').map((f) => f.person_id),
  );

  return (
    <div className="space-y-4">
      <PageHeader title="My Participants" lede="The people you’re walking alongside." />
      {roster.length === 0 ? (
        <EmptyState
          title="No one is connected with you yet"
          message="When you connect with someone from the waiting list, they’ll appear here."
        />
      ) : (
        <ul className="space-y-2.5">
          {roster.map((r) => {
            const next = nextByPerson.get(r.participant_person_id);
            return (
              <li key={r.relationship_id}>
                <Link
                  to={`/coach/participants/${r.participant_person_id}`}
                  className="block rounded-lg border border-line bg-surface-raised p-4 hover:border-experience-500"
                >
                  <p className="font-semibold text-ink">
                    {r.display_name}
                    {r.pronouns ? (
                      <span className="ml-2 text-sm font-normal text-ink-faint">({r.pronouns})</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {r.origin_request_type
                      ? requestTypeLabel(r.origin_request_type)
                      : 'Coaching relationship'}
                    {r.started_at ? ` · together since ${formatElapsed(r.started_at)}` : ''}
                  </p>
                  <p className="text-sm text-ink-faint">
                    {next
                      ? `Session today at ${formatAppointmentTime(next.starts_at, next.timezone).time}`
                      : 'No session today'}
                    {dueByPerson.has(r.participant_person_id) ? ' · follow-up due' : ''}
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
