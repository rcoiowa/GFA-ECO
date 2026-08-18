import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { completeSession } from '@recoveryos/data-access';
import { useCoachWorkspace } from '../hooks/useCoachWorkspace';
import { SessionRow } from '../components/SessionRow';
import { coachKeys } from '../../lib/query';
import { track } from '../../lib/analytics';

/**
 * Today's sessions — canonical appointments where this coach is the provider.
 * Once a session's start time has passed, the coach can explicitly attest it
 * happened (P4E complete_session RPC): exactly one service event, never
 * automatic from time passing. That attestation is T4b evidence.
 */
export function SessionsPage() {
  const { todaySessions, roster, isLoading, hasError, refetch } = useCoachWorkspace();
  const names = new Map(roster.map((r) => [r.participant_person_id, r.display_name]));
  const queryClient = useQueryClient();
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const complete = useMutation({
    mutationFn: async (appointmentId: number) => {
      const result = await completeSession(appointmentId);
      if (!result.ok) throw new Error(String(result.code));
      track('session_completed_recorded');
      return appointmentId;
    },
    onSuccess: (appointmentId) => {
      setCompleted((prev) => new Set(prev).add(appointmentId));
      void queryClient.invalidateQueries({ queryKey: coachKeys.all });
    },
  });

  if (isLoading) return <LoadingState label="Loading today’s sessions…" />;
  if (hasError)
    return <ErrorState message="We couldn’t load your sessions right now." onRetry={refetch} />;

  const now = Date.now();

  return (
    <div className="space-y-4">
      <PageHeader title="Today’s Sessions" lede="Scheduled connections for today." />
      {complete.isError ? (
        <Alert tone="critical">We couldn’t record that session. Try again.</Alert>
      ) : null}
      {todaySessions.length === 0 ? (
        <EmptyState
          title="You don’t have any sessions scheduled today"
          message="Confirmed sessions with your participants will appear here."
        />
      ) : (
        <ul className="space-y-2">
          {todaySessions.map((a) => (
            <li key={a.id} className="space-y-1.5">
              <SessionRow appointment={a} participantName={names.get(a.person_id)} />
              {completed.has(a.id) ? (
                <p className="text-sm text-ink-muted">Session recorded — thank you.</p>
              ) : new Date(a.starts_at).getTime() <= now ? (
                <Button
                  variant="secondary"
                  size="md"
                  disabled={complete.isPending}
                  onClick={() => complete.mutate(a.id)}
                >
                  {complete.isPending ? 'Recording…' : 'This session happened — mark complete'}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
