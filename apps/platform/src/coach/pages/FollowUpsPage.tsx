import { Button, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { formatElapsed, type FollowUpRow } from '@recoveryos/domain';
import { useCoachWorkspace, useCompleteFollowUp } from '../hooks/useCoachWorkspace';

/**
 * Follow-Ups — who needs another intentional contact, why, and when.
 * Completion is a canonical RPC transition; completing a follow-up records
 * that contact happened — it never claims a participant outcome improved.
 */
export function FollowUpsPage() {
  const { followUps, roster, isLoading, hasError, refetch } = useCoachWorkspace();
  const complete = useCompleteFollowUp();
  const names = new Map(roster.map((r) => [r.participant_person_id, r.display_name]));
  const now = new Date();

  if (isLoading) return <LoadingState label="Loading follow-ups…" />;
  if (hasError)
    return <ErrorState message="We couldn’t load follow-ups right now." onRetry={refetch} />;

  const open = followUps.filter((f) => f.status === 'open');
  const overdue = open.filter((f) => f.due_at && new Date(f.due_at) < now);
  const upcoming = open.filter((f) => !f.due_at || new Date(f.due_at) >= now);
  const done = followUps.filter((f) => f.status === 'done').slice(0, 10);

  function Item({ f, urgent }: { f: FollowUpRow; urgent?: boolean }) {
    return (
      <li
        className={`rounded-md border px-3 py-2.5 ${
          urgent ? 'border-attention-500 bg-surface-raised' : 'border-line bg-surface-raised'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium text-ink">
              {names.get(f.person_id) ?? 'Participant'}
              {urgent ? <span className="sr-only"> (past due)</span> : null}
            </p>
            <p className="text-sm text-ink-muted">
              {f.follow_up_type.replace(/_/g, ' ')}
              {f.due_at ? ` · ${urgent ? 'was due' : 'due'} ${formatElapsed(f.due_at)}` : ''}
            </p>
            {f.note ? <p className="text-sm text-ink-faint">{f.note}</p> : null}
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => complete.mutate(f.id)}
            disabled={complete.isPending}
          >
            Done
          </Button>
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Follow-Ups" lede="Connection shouldn’t depend on memory." />

      {open.length === 0 ? (
        <EmptyState title="Nothing needs follow-up right now" message="When a follow-up is due, it’ll appear here." />
      ) : (
        <>
          {overdue.length > 0 ? (
            <Card>
              <h2 className="font-semibold text-ink">Past due</h2>
              <ul className="mt-2 space-y-1.5">
                {overdue.map((f) => (
                  <Item key={f.id} f={f} urgent />
                ))}
              </ul>
            </Card>
          ) : null}
          {upcoming.length > 0 ? (
            <Card>
              <h2 className="font-semibold text-ink">Coming up</h2>
              <ul className="mt-2 space-y-1.5">
                {upcoming.map((f) => (
                  <Item key={f.id} f={f} />
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      )}

      {done.length > 0 ? (
        <Card>
          <h2 className="font-semibold text-ink">Recently completed</h2>
          <ul className="mt-2 space-y-1">
            {done.map((f) => (
              <li key={f.id} className="text-sm text-ink-muted">
                {names.get(f.person_id) ?? 'Participant'} · {f.follow_up_type.replace(/_/g, ' ')}
                {f.completed_at ? ` · ${formatElapsed(f.completed_at)}` : ''}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
