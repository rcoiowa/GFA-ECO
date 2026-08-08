import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import { completeFollowUp } from '@recoveryos/data-access';
import { Button, EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { formatElapsed } from '@recoveryos/domain';
import { useNavigatorWorkspace } from '../hooks/useNavigatorWorkspace';
import { navigatorKeys } from '../../lib/query';
import { track } from '../../lib/analytics';

/** The navigator's follow-up commitments — loop-closure work, not outcomes themselves. */
export function NavFollowUpsPage() {
  const { person } = useAuth();
  const { followUps, roster, isLoading, hasError, refetch } = useNavigatorWorkspace();
  const queryClient = useQueryClient();
  const names = new Map(roster.map((r) => [r.participant_person_id, r.display_name]));

  const done = useMutation({
    mutationFn: async (followUpId: number) => {
      const result = await completeFollowUp(followUpId);
      if (!result.ok) throw new Error(String(result.code));
      track('navigation_follow_up_completed');
      return result;
    },
    onSettled: () => {
      if (person) void queryClient.invalidateQueries({ queryKey: navigatorKeys.followUps(person.id) });
    },
  });

  if (isLoading) return <LoadingState label="Loading follow-ups…" />;
  if (hasError)
    return <ErrorState message="We couldn’t load follow-ups right now." onRetry={refetch} />;

  const now = new Date();
  const open = followUps.filter((f) => f.status === 'open');
  const past = open.filter((f) => f.due_at !== null && new Date(f.due_at) < now);
  const coming = open.filter((f) => f.due_at === null || new Date(f.due_at) >= now);

  const row = (f: (typeof followUps)[number], pastDue: boolean) => (
    <li
      key={f.id}
      className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${
        pastDue ? 'border-experience-500' : 'border-line'
      }`}
    >
      <span className="text-sm text-ink-muted">
        {names.get(f.person_id) ?? 'Participant'} · {f.follow_up_type.replace(/_/g, ' ')}
        {f.due_at ? ` · due ${formatElapsed(f.due_at)}` : ''}
        {pastDue ? <span className="sr-only"> (past due)</span> : null}
      </span>
      <Button variant="ghost" size="md" onClick={() => done.mutate(f.id)} disabled={done.isPending}>
        Done
      </Button>
    </li>
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Follow-Ups" lede="Checking back is how loops close." />
      {open.length === 0 ? (
        <EmptyState title="Nothing to follow up on" message="Follow-ups you set will appear here." />
      ) : (
        <>
          {past.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-ink">Past due</h2>
              <ul className="space-y-1.5">{past.map((f) => row(f, true))}</ul>
            </section>
          ) : null}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">Coming up</h2>
            {coming.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing coming up.</p>
            ) : (
              <ul className="space-y-1.5">{coming.map((f) => row(f, false))}</ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
