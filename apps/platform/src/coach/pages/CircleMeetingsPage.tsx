import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import { getMyCircleWorkspace, recordCircleMeeting } from '@recoveryos/data-access';
import { Button, Card, PageHeader, LoadingState, ErrorState } from '@recoveryos/ui';
import { circleTimeToISO } from '../circleTime';

export function CircleMeetingsPage() {
  const { person } = useAuth();
  const client = useQueryClient();
  const queryKey = ['circle-workspace', person?.id];
  const query = useQuery({ queryKey, queryFn: getMyCircleWorkspace, enabled: !!person });
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<'held' | 'cancelled'>('held');
  const [count, setCount] = useState('');
  const [names, setNames] = useState('');
  const series = query.data?.series ?? [];
  const circle = series.find((s) => String(s.id) === selected) ?? series[0];
  const meetings = query.data?.meetings ?? [];
  const held = meetings.filter((m) => m.occurrence_status === 'held');
  const people = names
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const field = 'mt-1 block w-full rounded-md border border-line bg-surface px-3 py-2 text-ink';

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!circle || saving) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setMessage('');
    setFailed(false);
    try {
      const date = String(form.get('date'));
      const result = await recordCircleMeeting({
        seriesId: circle.id,
        startsAt: circleTimeToISO(date, String(form.get('start')), circle.timezone),
        endsAt: form.get('end')
          ? circleTimeToISO(date, String(form.get('end')), circle.timezone)
          : null,
        status,
        participants: status === 'held' ? Number(count) : null,
        facilitators: status === 'held' ? people : [],
        topic: String(form.get('topic') ?? ''),
        theme: String(form.get('theme') ?? ''),
        icarePhase: String(form.get('icare') ?? ''),
        domain: String(form.get('domain') ?? ''),
      });
      if (!result.ok) {
        setFailed(true);
        setMessage(
          'A meeting already exists for this Circle and start time with different details. Review the saved record before requesting a correction.',
        );
      } else {
        setMessage(
          result.code === 'already_recorded'
            ? 'This meeting was already saved. No duplicate was added.'
            : 'Circle meeting saved.',
        );
      }
      await client.invalidateQueries({ queryKey });
    } catch {
      setFailed(true);
      setMessage(
        'We couldn’t save this meeting. Check the date, times, attendance, and your Circle assignment, then try again.',
      );
    } finally {
      setSaving(false);
    }
  }
  if (query.isPending) return <LoadingState label="Opening your Circles…" />;
  if (query.isError)
    return (
      <ErrorState
        message="We couldn’t load your Circle assignments."
        onRetry={() => void query.refetch()}
      />
    );
  return (
    <div className="space-y-5">
      <PageHeader
        title="Log a Circle meeting"
        lede="A simple record of the gathering you helped facilitate."
      />
      {!circle ? (
        <Card>
          <p>
            You don’t have a Circle assignment yet. Ask your coordinator to assign the Circle you
            facilitate.
          </p>
        </Card>
      ) : (
        <Card>
          <form onSubmit={save} className="space-y-4">
            <label className="block">
              Circle
              <select
                className={field}
                value={String(circle.id)}
                onChange={(e) => setSelected(e.target.value)}
              >
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.location_name}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-ink-muted">
              Times are for {circle.timezone}. Location: {circle.location_name}.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label>
                Date
                <input className={field} name="date" type="date" required />
              </label>
              <label>
                Start time
                <input className={field} name="start" type="time" required />
              </label>
              <label>
                End time (optional)
                <input className={field} name="end" type="time" />
              </label>
            </div>
            <label className="block">
              Meeting status
              <select
                className={field}
                value={status}
                onChange={(e) => setStatus(e.target.value as 'held' | 'cancelled')}
              >
                <option value="held">Held</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            {status === 'held' && (
              <>
                <label className="block">
                  Participants present (exclude facilitators)
                  <input
                    className={field}
                    type="number"
                    min="0"
                    max="10000"
                    step="1"
                    required
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  />
                </label>
                <label className="block">
                  Facilitators present — one name per line
                  <textarea
                    className={field}
                    required
                    maxLength={4800}
                    rows={3}
                    value={names}
                    onChange={(e) => setNames(e.target.value)}
                  />
                </label>
                <p className="text-sm text-ink-muted">
                  Names document who facilitated. They do not grant account access. No participant
                  names are needed.
                </p>
                <p aria-live="polite">
                  {count === '' ? '—' : count} participants + {people.length} facilitators ={' '}
                  {count === '' ? '—' : Number(count) + people.length} people present
                </p>
              </>
            )}
            <label className="block">
              Topic (optional)
              <input className={field} name="topic" maxLength={240} />
            </label>
            <details>
              <summary className="cursor-pointer font-medium">
                Optional programming classifications
              </summary>
              <div className="mt-3 space-y-3">
                <p className="text-sm text-ink-muted">
                  These describe the meeting’s content, not a participant’s stage or outcome.
                </p>
                <label className="block">
                  ICARE phase
                  <select className={field} name="icare">
                    <option value="">Not specified</option>
                    {['Identify', 'Connect', 'Assess', 'Respond', 'Empower'].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Domain
                  <input className={field} name="domain" maxLength={80} />
                </label>
                <label className="block">
                  Theme
                  <input className={field} name="theme" maxLength={120} />
                </label>
              </div>
            </details>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Circle meeting'}
            </Button>
            {message && <p role={failed ? 'alert' : 'status'}>{message}</p>}
          </form>
        </Card>
      )}
      <Card>
        <h2 className="text-lg font-semibold">Recorded meetings</h2>
        <p className="mt-2">
          {held.length} held meetings · {held.reduce((n, m) => n + (m.participant_count ?? 0), 0)}{' '}
          participant attendances ·{' '}
          {held.reduce((n, m) => n + (m.facilitator_names?.length ?? 0), 0)} facilitator attendances
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Totals cover the latest {meetings.length} records shown (up to 200) for your assigned
          Circles. Attendance is not unique people served or completed peer connections. Cancelled
          meetings are excluded.
        </p>
        {meetings.length === 0 ? (
          <p className="mt-3">No Circle meetings recorded yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {meetings.map((m) => (
              <li key={m.id} className="rounded-md border border-line p-3">
                <p className="font-medium">
                  {m.title} · {m.location_name}
                </p>
                <p>
                  {new Intl.DateTimeFormat('en-US', {
                    timeZone:
                      series.find((s) => s.id === m.series_id)?.timezone ?? 'America/Chicago',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(m.starts_at))}{' '}
                  · {m.occurrence_status}
                </p>
                {m.occurrence_status === 'held' && (
                  <p>
                    {m.participant_count} participants + {m.facilitator_names?.length ?? 0}{' '}
                    facilitators = {m.total_attendance} people present
                  </p>
                )}
                <p>{m.facilitator_names?.join(' & ')}</p>
                <p>{m.topic_title}</p>
                <p className="text-sm text-ink-muted">
                  {[m.programming_icare_phase, m.programming_domain, m.topic_category]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
