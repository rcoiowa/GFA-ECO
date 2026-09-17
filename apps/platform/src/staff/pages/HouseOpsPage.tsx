import { useCallback, useEffect, useState } from 'react';
import {
  assignChore,
  completeChoreAssignment,
  listChoreAssignmentsForResidence,
  listResidenceChores,
  listResidenceMeetings,
  listResidenceRoster,
  recordMeeting,
  recordMeetingAttendance,
  type RosterEntry,
} from '@recoveryos/data-access';
import type { ChoreAssignment, Meeting, ResidenceChore } from '@recoveryos/domain';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
  TextField,
} from '@recoveryos/ui';
import { useStaff } from '../staffContext';

/**
 * P0.5-C — house operations become recordable. Meetings/attendance and chore
 * assignments had tables, reads, and NARR auto-evidence since 0006/0017 but no
 * write path — so "meetings attended/expected" was structurally 0/0 in the
 * supervision and Exhibit E reports, and resident chore cards were permanently
 * empty. Writes are RPC-only (0128); this page is deliberately mechanical:
 * record what happened, one tap per fact.
 */

const ATTENDANCE_OPTIONS = ['present', 'absent', 'excused'] as const;

export function HouseOpsPage() {
  const { residence } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [chores, setChores] = useState<ResidenceChore[]>([]);
  const [assignments, setAssignments] = useState<(ChoreAssignment & { chore: ResidenceChore })[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);

  const [meetingTitle, setMeetingTitle] = useState('House meeting');
  const [meetingAt, setMeetingAt] = useState('');
  const [meetingRequired, setMeetingRequired] = useState(true);
  const [attendanceFor, setAttendanceFor] = useState<number | null>(null);

  const [choreId, setChoreId] = useState('');
  const [choreResidencyId, setChoreResidencyId] = useState('');
  const [choreDueOn, setChoreDueOn] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    if (!residence) return;
    setLoading(true);
    setError(false);
    try {
      const today = new Date();
      const from = new Date(today.getTime() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const to = new Date(today.getTime() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const [m, c, a, r] = await Promise.all([
        listResidenceMeetings(residence.id),
        listResidenceChores(residence.id),
        listChoreAssignmentsForResidence(residence.id, from, to),
        listResidenceRoster(residence.id),
      ]);
      setMeetings(m);
      setChores(c);
      setAssignments(a);
      setRoster(r.filter((x) => ['active', 'on_pass', 'transitioning'].includes(x.residency_status)));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [residence]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (fn: () => Promise<void>, done: string) => {
    setNotice(null);
    try {
      await fn();
      setNotice(done);
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'We couldn’t record that.');
    }
  };

  if (!residence) return <Alert tone="attention">Select a residence for house operations.</Alert>;

  return (
    <>
      <PageHeader
        title="House operations"
        lede="Meetings and chores — record what happened so the house's story stays true without anyone retyping it."
        crumbs={[{ to: '/staff/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <div className="flex flex-col gap-5">
          {notice ? <Alert tone="info">{notice}</Alert> : null}

          <Card>
            <CardTitle>Record a meeting</CardTitle>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <TextField
                label="What"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
              />
              <TextField
                label="When"
                type="datetime-local"
                value={meetingAt}
                onChange={(e) => setMeetingAt(e.target.value)}
              />
              <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={meetingRequired}
                  onChange={(e) => setMeetingRequired(e.target.checked)}
                />
                Required for residents
              </label>
              <Button
                disabled={!meetingTitle.trim() || !meetingAt}
                onClick={() =>
                  void act(
                    () =>
                      recordMeeting({
                        residenceId: residence.id,
                        title: meetingTitle.trim(),
                        startsAt: new Date(meetingAt).toISOString(),
                        isRequired: meetingRequired,
                      }),
                    'Meeting recorded.',
                  )
                }
              >
                Record meeting
              </Button>
            </div>

            <div className="mt-5"><CardTitle>Recent and upcoming meetings</CardTitle></div>
            {meetings.length === 0 ? (
              <p className="text-ink-muted">No meetings recorded yet.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {meetings.map((m) => (
                  <li key={m.id} className="rounded-md border border-line bg-surface-raised p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-ink">{m.title}</span>
                      <span className="text-sm text-ink-muted">
                        {new Date(m.starts_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {m.is_required_for_residents ? ' · required' : ''}
                      </span>
                    </div>
                    {attendanceFor === m.id ? (
                      <div className="mt-2 space-y-1.5">
                        {roster.map((r) => (
                          <div
                            key={r.person_id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-1.5"
                          >
                            <span className="text-sm text-ink">
                              {r.person.preferred_name || r.person.first_name} {r.person.last_name}
                            </span>
                            <span className="flex gap-1.5">
                              {ATTENDANCE_OPTIONS.map((s) => (
                                <Button
                                  key={s}
                                  variant="ghost"
                                  size="md"
                                  onClick={() =>
                                    void act(
                                      () =>
                                        recordMeetingAttendance({
                                          meetingId: m.id,
                                          personId: r.person_id,
                                          status: s,
                                        }),
                                      'Attendance recorded.',
                                    )
                                  }
                                >
                                  {s}
                                </Button>
                              ))}
                            </span>
                          </div>
                        ))}
                        <Button variant="ghost" size="md" onClick={() => setAttendanceFor(null)}>
                          Done
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="mt-2"
                        variant="secondary"
                        size="md"
                        onClick={() => setAttendanceFor(m.id)}
                      >
                        Record attendance
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle>Assign a chore</CardTitle>
            {chores.length === 0 ? (
              <p className="text-ink-muted">
                No chores are defined for this residence yet — the chore catalog is seeded by the
                platform team.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                  Chore
                  <select
                    className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                    value={choreId}
                    onChange={(e) => setChoreId(e.target.value)}
                  >
                    <option value="">Choose…</option>
                    {chores.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                  Resident
                  <select
                    className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                    value={choreResidencyId}
                    onChange={(e) => setChoreResidencyId(e.target.value)}
                  >
                    <option value="">Choose…</option>
                    {roster.map((r) => (
                      <option key={r.id} value={String(r.id)}>
                        {r.person.preferred_name || r.person.first_name} {r.person.last_name}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField
                  label="Due"
                  type="date"
                  value={choreDueOn}
                  onChange={(e) => setChoreDueOn(e.target.value)}
                />
                <Button
                  disabled={!choreId || !choreResidencyId || !choreDueOn}
                  onClick={() =>
                    void act(
                      () =>
                        assignChore({
                          choreId: Number(choreId),
                          residencyId: Number(choreResidencyId),
                          dueOn: choreDueOn,
                        }),
                      'Chore assigned.',
                    )
                  }
                >
                  Assign
                </Button>
              </div>
            )}

            <div className="mt-5"><CardTitle>This week&rsquo;s chores</CardTitle></div>
            {assignments.length === 0 ? (
              <p className="text-ink-muted">Nothing assigned this week.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2"
                  >
                    <span className="text-ink">
                      {a.chore.name} ·{' '}
                      {(() => {
                        const entry = roster.find((r) => r.id === a.residency_id);
                        return entry
                          ? `${entry.person.preferred_name || entry.person.first_name} ${entry.person.last_name}`
                          : 'resident';
                      })()}
                      <span className="text-sm text-ink-muted"> · due {a.due_on}</span>
                    </span>
                    {a.completed_at ? (
                      <span className="text-sm text-ink-muted">Done ✓</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() =>
                          void act(() => completeChoreAssignment(a.id), 'Marked complete.')
                        }
                      >
                        Mark complete
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm text-ink-faint">
              Meetings and chore completions quietly evidence the house&rsquo;s NARR standards —
              recording the work is the compliance.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
