import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import {
  completeChore,
  getCurfewSchedule,
  getMyActiveResidency,
  listMyChoresDue,
  listMyDocuments,
  listUpcomingResidenceMeetings,
  type ChoreAssignmentRow,
  type MeetingRow,
} from '@recoveryos/data-access';
import type { Residence, Residency } from '@recoveryos/domain';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@recoveryos/ui';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active resident',
  on_pass: 'On an approved pass',
  transitioning: 'Preparing for transition',
};

/**
 * Resident home: residence identity and status, then today's actual
 * responsibilities (chores, curfew, next meeting, pending documents) —
 * residence duties clearly labeled apart from recovery support.
 */
export function ResidentTodayPage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [residency, setResidency] = useState<(Residency & { residence: Residence }) | null>(null);
  const [chores, setChores] = useState<ChoreAssignmentRow[]>([]);
  const [curfewTonight, setCurfewTonight] = useState<string | null>(null);
  const [nextMeeting, setNextMeeting] = useState<MeetingRow | null>(null);
  const [pendingDocs, setPendingDocs] = useState(0);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      const active = await getMyActiveResidency(person.id);
      setResidency(active);
      if (active) {
        const today = new Date().toISOString().slice(0, 10);
        const [choreRows, curfews, meetings, docs] = await Promise.all([
          listMyChoresDue(active.id, today),
          getCurfewSchedule(active.residence_id),
          listUpcomingResidenceMeetings(active.residence_id, 1),
          listMyDocuments(person.id),
        ]);
        setChores(choreRows);
        const tonight = curfews.find((c) => c.day_of_week === new Date().getDay());
        setCurfewTonight(tonight?.curfew_time ?? null);
        setNextMeeting(meetings[0] ?? null);
        setPendingDocs(docs.filter((d) => !d.acknowledged_at).length);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markChoreDone(chore: ChoreAssignmentRow) {
    await completeChore(chore.id);
    setChores((prev) =>
      prev.map((c) => (c.id === chore.id ? { ...c, completed_at: new Date().toISOString() } : c)),
    );
  }

  const displayName = person?.preferred_name || person?.first_name || 'Friend';
  const openChores = chores.filter((c) => !c.completed_at);
  const doneCount = chores.filter((c) => c.completed_at).length;

  return (
    <>
      <PageHeader title={`Good day, ${displayName}`} lede="Here's your day at a glance." />

      {loading ? (
        <LoadingState label="Loading your residence…" />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : !residency ? (
        <Alert tone="attention">
          We couldn't find an active residency for your account. If this seems wrong, please
          talk with your residence staff.
        </Alert>
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-ink-muted">Your residence</p>
                <p className="text-xl font-semibold text-ink">{residency.residence.name}</p>
              </div>
              <span className="rounded-full bg-experience-soft px-3 py-1 text-sm font-medium text-experience-700">
                {STATUS_LABELS[residency.residency_status] ?? residency.residency_status}
              </span>
            </div>
            {curfewTonight ? (
              <p className="mt-2 text-sm text-ink-muted">
                Curfew tonight:{' '}
                <span className="font-medium text-ink">{curfewTonight.slice(0, 5)}</span>
              </p>
            ) : null}
          </Card>

          <Card>
            <CardTitle>Residence responsibilities today</CardTitle>
            {openChores.length === 0 && !nextMeeting && pendingDocs === 0 ? (
              <p className="text-ink-muted">
                Nothing outstanding right now — you're caught up. Well done.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {openChores.map((chore) => (
                  <li
                    key={chore.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-ink">{chore.chore.name}</p>
                      {chore.chore.description ? (
                        <p className="text-sm text-ink-muted">{chore.chore.description}</p>
                      ) : null}
                    </div>
                    <Button variant="secondary" onClick={() => void markChoreDone(chore)}>
                      Mark done
                    </Button>
                  </li>
                ))}
                {nextMeeting ? (
                  <li className="rounded-md border border-line px-4 py-3">
                    <p className="font-medium text-ink">
                      {nextMeeting.is_required_for_residents ? 'Required: ' : ''}
                      {nextMeeting.title}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {new Date(nextMeeting.starts_at).toLocaleString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </li>
                ) : null}
                {pendingDocs > 0 ? (
                  <li className="rounded-md border border-attention-600/30 bg-attention-50 px-4 py-3">
                    <p className="font-medium text-attention-700">
                      {pendingDocs} document{pendingDocs > 1 ? 's' : ''} waiting for your
                      signature
                    </p>
                    <Link
                      to="/residence/documents"
                      className="text-sm font-medium text-attention-700 underline underline-offset-2"
                    >
                      Review and sign
                    </Link>
                  </li>
                ) : null}
              </ul>
            )}
            {doneCount > 0 ? (
              <p className="mt-3 text-sm text-positive-700">
                ✓ {doneCount} chore{doneCount > 1 ? 's' : ''} completed
              </p>
            ) : null}
          </Card>

          <Card>
            <CardTitle>Your recovery today</CardTitle>
            <p className="text-ink-muted">
              Your goals, check-ins, and recovery tools are always yours — the same VRCC tools
              every participant uses, regardless of where you live.
            </p>
            <Link
              to="/app/today"
              className="mt-2 inline-block font-medium text-experience-700 underline underline-offset-2"
            >
              Open the VRCC
            </Link>
          </Card>
        </div>
      )}
    </>
  );
}
