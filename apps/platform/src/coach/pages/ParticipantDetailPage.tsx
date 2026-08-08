import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { Alert, Button, Card, CardTitle, ErrorState, LoadingState, PageHeader, TextField } from '@recoveryos/ui';
import { formatElapsed, requestTypeLabel } from '@recoveryos/domain';
import { useCoachWorkspace, useCompleteFollowUp, useCreateFollowUp } from '../hooks/useCoachWorkspace';
import { SessionRow } from '../components/SessionRow';
import { SchedulingCard } from '../components/SchedulingCard';

/**
 * Coach participant view — relationship-scoped support workspace. Shows only
 * what the coaching relationship authorizes (roster RPC + coach-visible
 * appointments + follow-ups). Messages and interactive scheduling arrive with
 * the next slice — no dead tabs are rendered.
 */
export function ParticipantDetailPage() {
  const { personId: raw } = useParams();
  const personId = Number(raw);
  const { roster, todaySessions, followUps, isLoading, hasError, refetch } = useCoachWorkspace();
  const createFollowUp = useCreateFollowUp();
  const completeFollowUp = useCompleteFollowUp();
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  const entry = useMemo(
    () => roster.find((r) => r.participant_person_id === personId),
    [roster, personId],
  );

  if (isLoading) return <LoadingState label="Loading…" />;
  if (hasError)
    return (
      <ErrorState
        message="We couldn’t load this person’s support information right now."
        onRetry={refetch}
      />
    );
  if (!entry) {
    return (
      <ErrorState message="This person isn’t in your active participants." />
    );
  }

  const sessions = todaySessions.filter((a) => a.person_id === personId);
  const personFollowUps = followUps.filter((f) => f.person_id === personId);
  const openFollowUps = personFollowUps.filter((f) => f.status === 'open');

  async function addFollowUp(e: FormEvent) {
    e.preventDefault();
    if (!dueDate) return;
    await createFollowUp.mutateAsync({
      personId,
      dueAt: new Date(`${dueDate}T12:00:00`).toISOString(),
      note: note.trim() || undefined,
    });
    setDueDate('');
    setNote('');
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={entry.display_name}
        lede={entry.pronouns ? `(${entry.pronouns})` : undefined}
        crumbs={[{ label: 'My Participants', to: '/coach/participants' }]}
      />

      <Card>
        <CardTitle>Overview</CardTitle>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="text-ink-faint">Connected:</dt>
            <dd className="text-ink-muted">
              {entry.started_at ? formatElapsed(entry.started_at) : '—'}
            </dd>
          </div>
          {entry.origin_request_type ? (
            <div className="flex gap-2">
              <dt className="text-ink-faint">They asked for:</dt>
              <dd className="text-ink-muted">{requestTypeLabel(entry.origin_request_type)}</dd>
            </div>
          ) : null}
          {entry.origin_focus ? (
            <div className="flex gap-2">
              <dt className="text-ink-faint">In their words:</dt>
              <dd className="text-ink-muted">“{entry.origin_focus}”</dd>
            </div>
          ) : null}
        </dl>
      </Card>

      <SchedulingCard
        participantPersonId={entry.participant_person_id}
        participantName={entry.display_name}
      />

      <Card>
        <CardTitle>Sessions</CardTitle>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No session today.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {sessions.map((a) => (
              <li key={a.id}>
                <SessionRow appointment={a} participantName={entry.display_name} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Follow-up</CardTitle>
        {openFollowUps.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {openFollowUps.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2">
                <span className="text-sm text-ink-muted">
                  {f.follow_up_type.replace(/_/g, ' ')}
                  {f.due_at ? ` · due ${formatElapsed(f.due_at)}` : ''}
                </span>
                <Button variant="ghost" size="md" onClick={() => completeFollowUp.mutate(f.id)}>
                  Done
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">No follow-up scheduled.</p>
        )}
        <form onSubmit={addFollowUp} className="mt-3 space-y-2">
          <TextField
            label="Follow up on"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <TextField
            label="Why (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {createFollowUp.isError ? (
            <Alert tone="critical">We couldn’t save that follow-up. Try again.</Alert>
          ) : null}
          <Button type="submit" variant="secondary" disabled={createFollowUp.isPending || !dueDate}>
            {createFollowUp.isPending ? 'Saving…' : 'Add follow-up'}
          </Button>
        </form>
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          to={`/coach/messages/${entry.participant_person_id}`}
          className="inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-700"
        >
          Message {entry.display_name}
        </Link>
        <Link to="/coach/participants" className="text-sm text-ink-muted underline underline-offset-2">
          Back to My Participants
        </Link>
      </div>
    </div>
  );
}
