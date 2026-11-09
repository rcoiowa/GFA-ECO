import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import '@recoveryos/design-tokens/themes/gfa-shared.css';
import './CircleMeetingsPage.css';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import { getMyCircleWorkspace, recordCircleMeeting } from '@recoveryos/data-access';
import { Button, Card, LoadingState, ErrorState } from '@recoveryos/ui';
import { circleTimeToISO } from '../circleTime';

export function CircleMeetingsPage() {
  const { person } = useAuth();
  return <CircleMeetingsWorkspace key={person?.id ?? 'signed-out'} />;
}

function CircleMeetingsWorkspace() {
  const { person } = useAuth();
  const client = useQueryClient();
  const queryKey = ['circle-workspace', person?.id];
  const query = useQuery({ queryKey, queryFn: getMyCircleWorkspace, enabled: !!person });
  const savingRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function confirmLeave(event: React.MouseEvent<HTMLAnchorElement>) {
    if (dirty && !window.confirm('Leave this meeting record? Unsaved changes will be lost.'))
      event.preventDefault();
  }
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<'held' | 'cancelled'>('held');
  const [count, setCount] = useState('');
  const [names, setNames] = useState('');
  const [firstTime, setFirstTime] = useState('');
  const [notes, setNotes] = useState('');
  const documentationV2 = query.data?.capabilities?.circle_documentation_v2 === true;
  function resetFields() {
    setDirty(false);
    setCount('');
    setNames('');
    setFirstTime('');
    setNotes('');
    setMessage('');
    setFailed(false);
    setStatus('held');
  }
  const series = query.data?.series ?? [];
  const readOnlySeries = query.data?.readOnlySeries ?? [];
  const visibleSeries = [...series, ...readOnlySeries];
  const circle = series.find((s) => String(s.id) === selected) ?? series[0];
  // Never carry an author’s draft into another Circle after assignment changes.
  // Layout reset clears sensitive state before the browser paints the replacement form.
  useLayoutEffect(() => {
    resetFields();
  }, [circle?.id]);
  const meetings = query.data?.meetings ?? [];
  const held = meetings.filter((m) => m.occurrence_status === 'held');
  const people = names
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const field = 'mt-1 block w-full rounded-md border border-line bg-surface px-3 py-2 text-ink';

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!circle || savingRef.current) return;
    savingRef.current = true;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setMessage('');
    setFailed(false);
    try {
      const date = String(form.get('date'));
      const startsAt = circleTimeToISO(date, String(form.get('start')), circle.timezone);
      const endsAt = form.get('end')
        ? circleTimeToISO(date, String(form.get('end')), circle.timezone)
        : null;
      if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
        throw new Error('The end time must be after the start time.');
      }
      if (
        status === 'held' &&
        (count.trim() === '' ||
          !Number.isInteger(Number(count)) ||
          Number(count) < 0 ||
          Number(count) > 10000 ||
          people.length === 0)
      ) {
        throw new Error('Enter a whole participant count and at least one facilitator.');
      }
      if (
        (!documentationV2 && (firstTime !== '' || notes.trim())) ||
        (status === 'held' &&
          firstTime !== '' &&
          (!Number.isInteger(Number(firstTime)) ||
            Number(firstTime) < 0 ||
            Number(firstTime) > Number(count))) ||
        Array.from(notes.trim()).length > 2000
      ) {
        setFailed(true);
        setMessage(
          'Check optional documentation: first-time participants must be a whole number from zero to total participants, and notes must be 2,000 characters or fewer. Extended documentation requires current server support.',
        );
        return;
      }
      const result = await recordCircleMeeting({
        ...(documentationV2
          ? {
              documentationV2: true,
              firstTimeParticipants:
                status === 'held' && firstTime !== '' ? Number(firstTime) : null,
              facilitatorNotes: notes.trim(),
            }
          : {}),
        seriesId: circle.id,
        startsAt,
        endsAt,
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
        setDirty(false);
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
        'Save not confirmed. Check Recorded meetings before retrying, because a connection interruption can happen after a record is saved. Also check the date, end time, attendance and your Circle recording access.',
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  if (query.isPending) return <LoadingState label="Opening your Circles…" />;
  if (query.isError)
    return (
      <ErrorState
        message="We couldn’t load your available Circles."
        onRetry={() => void query.refetch()}
      />
    );
  return (
    <div className="gfarc-workspace space-y-8" data-gfa-theme="gfa">
      <nav aria-label="Meeting workspace navigation" className="gfarc-workspace-nav">
        <Link to="/vrcc" onClick={confirmLeave}>
          Back to Recovery Community Center
        </Link>
        <a href="#meeting-record">Meeting record</a>
        <a href="#facilitation-guide">Facilitation guide</a>
        <a href="#recorded-meetings">Recorded meetings</a>
        <a href="https://graceforaddictions.org" onClick={confirmLeave}>
          GFA website
        </a>
      </nav>
      <header className="gfarc-workspace-hero">
        <p className="gfarc-eyebrow">GFA Recovery Circle · Facilitator workspace</p>
        <h1>
          Lead the circle.
          <br />
          <span>Hold the space.</span>
        </h1>
        <p>No Shame, No Stigma, Just Grace.</p>
      </header>
      <section id="meeting-record" aria-labelledby="meeting-record-title" className="scroll-mt-6">
        <p className="gfarc-eyebrow">After the circle</p>
        <h2 id="meeting-record-title" className="gfarc-section-title">
          Record a circle.
        </h2>
        <p className="mt-3 mb-6">Capture what happened. Keep the person at the center.</p>
        <aside className="gfarc-privacy-note">
          <strong>A meeting record, with care.</strong>
          <p>
            Record aggregate attendance and meeting content. Leave participant names, contact
            information, diagnoses, trauma details and personal stories out of this form.
          </p>
          {!documentationV2 && (
            <p className="mt-2">
              First-time participant counts and facilitator notes are not yet supported by this
              RecoveryOS record. They are not collected here. This page does not import records
              saved on a device in the separate facilitator guide.
            </p>
          )}
        </aside>
      </section>
      {!circle ? (
        <Card>
          <p>
            {readOnlySeries.length > 0
              ? 'Read-only Circle access. You can review meeting documentation shared with authorized GFA staff and leadership. Recording requires separate Circle recording authorization.'
              : 'You don’t have Circle recording access yet. Ask your coordinator to confirm your role or Circle assignment.'}
          </p>
        </Card>
      ) : (
        <Card>
          <form
            key={circle.id}
            onSubmit={save}
            className="space-y-6"
            aria-label="Circle meeting record"
            aria-busy={saving}
            onChange={() => setDirty(true)}
            onReset={(event) => {
              if (
                dirty &&
                !window.confirm('Clear this meeting record? Unsaved changes will be lost.')
              ) {
                event.preventDefault();
                return;
              }
              resetFields();
            }}
          >
            <fieldset disabled={saving} className="space-y-6 min-w-0">
              <legend className="text-xl font-semibold mb-4">Meeting details</legend>
              <label className="block">
                Circle
                <select
                  className={field}
                  value={String(circle.id)}
                  onChange={(e) => {
                    if (dirty && !window.confirm('Switch Circles? Unsaved changes will be lost.'))
                      return;
                    setSelected(e.target.value);
                    resetFields();
                  }}
                >
                  {series.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.location_name}
                      {s.participation_access === 'closed_cbh_clients'
                        ? ' · Closed — CBH clients only'
                        : ''}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-ink-muted">
                Times are for {circle.timezone}. Location: {circle.location_name}.
              </p>
              <p className="text-sm">{[circle.address, circle.room].filter(Boolean).join(' · ')}</p>
              <label className="block">
                County (meeting location)
                <input className={field} value={circle.county ?? 'Not configured'} readOnly />
              </label>
              <p className="font-medium">
                {circle.participation_access === 'closed_cbh_clients'
                  ? 'Closed — CBH clients only. Not open to the general public.'
                  : circle.participation_access === 'public'
                    ? 'Open to the public'
                    : 'Attendance eligibility: confirm with the organizer'}
              </p>
              <p className="text-sm text-ink-muted">{circle.schedule_note}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label>
                  Date
                  <input className={field} name="date" type="date" required />
                </label>
                <label>
                  Start time
                  <input
                    className={field}
                    name="start"
                    type="time"
                    defaultValue={circle.start_time?.slice(0, 5) ?? ''}
                    required
                  />
                </label>
                <label>
                  End time (optional)
                  <input
                    className={field}
                    name="end"
                    type="time"
                    defaultValue={circle.end_time?.slice(0, 5) ?? ''}
                  />
                </label>
              </div>
              <label className="block">
                Meeting status
                <select
                  className={field}
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as 'held' | 'cancelled');
                    setFirstTime('');
                  }}
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
                  {documentationV2 && (
                    <label className="block">
                      First-time participants (optional)
                      <input
                        className={field}
                        type="number"
                        min="0"
                        max={count || 10000}
                        step="1"
                        value={firstTime}
                        onChange={(e) => setFirstTime(e.target.value)}
                        aria-label="First-time participants (optional)"
                        aria-describedby="first-time-help"
                      />
                      <span id="first-time-help" className="text-sm text-ink-muted">
                        Included in participants present, not added to attendance. Leave blank if
                        unknown or not collected; enter 0 only if none.
                      </span>
                    </label>
                  )}
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
              {documentationV2 && (
                <label className="block">
                  Facilitator notes (optional, shared)
                  <textarea
                    className={field}
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    aria-label="Facilitator notes (optional, shared)"
                    aria-describedby="facilitator-notes-help"
                  />
                  <span id="facilitator-notes-help" className="text-sm text-ink-muted">
                    Shared with authorized GFA staff and leadership. Record only program/process
                    observations and future facilitation plans. No participant identities, personal
                    stories, diagnoses, trauma details or individual support records. Maximum 2,000
                    characters. This form does not save drafts on your device.
                  </span>
                  <span className="block text-sm">
                    {Array.from(notes.trim()).length}/2,000 characters
                  </span>
                </label>
              )}
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
              <Button type="reset" variant="secondary" disabled={saving}>
                Clear form for another meeting
              </Button>
            </fieldset>
            {message && (
              <p role={failed ? 'alert' : 'status'} className="gfarc-save-message">
                {message}
              </p>
            )}
            <p className="text-sm text-ink-muted">
              Saving uses your authorized RecoveryOS Circle access. A confirmation means the server
              accepted this meeting, not that individual peer connections occurred.
            </p>
          </form>
        </Card>
      )}
      <section
        id="facilitation-guide"
        aria-labelledby="facilitation-guide-title"
        className="scroll-mt-6"
      >
        <Card>
          <p className="gfarc-eyebrow">During the circle</p>
          <h2 id="facilitation-guide-title" className="gfarc-section-title">
            Make room for connection.
          </h2>
          <div className="gfarc-guide-grid">
            <div>
              <h3>Welcome and offer choice</h3>
              <p>
                Explain the plan. Invite people to participate in ways that work for them, including
                passing. Avoid asking anyone to share their full story.
              </p>
            </div>
            <div>
              <h3>Hold respectful space</h3>
              <p>
                Use the agreed topic or practice. Listen without diagnosing or assigning a recovery
                stage. Make room for different recovery pathways and optional faith participation.
              </p>
            </div>
            <div>
              <h3>Close with a next step</h3>
              <p>
                Invite each person to choose what they want to carry forward. Ask permission before
                arranging individual follow-up, and use the approved support process when help is
                needed.
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm text-ink-muted">
            This brief guide supports your training and current organizational procedures; it does
            not replace them. Use authorized operational workflows for individual support or safety
            concerns.
          </p>
          <a className="inline-block mt-5 underline" href="#meeting-record">
            Return to meeting record
          </a>
        </Card>
      </section>
      <section
        id="recorded-meetings"
        aria-labelledby="recorded-meetings-title"
        className="scroll-mt-6"
      >
        <Card>
          <h2 id="recorded-meetings-title" className="text-lg font-semibold">
            Recorded meetings
          </h2>
          <Button
            variant="secondary"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            {query.isFetching ? 'Refreshing…' : 'Refresh recorded meetings'}
          </Button>
          <p className="mt-2">
            {held.length} held meetings · {held.reduce((n, m) => n + (m.participant_count ?? 0), 0)}{' '}
            participant attendances ·{' '}
            {held.reduce((n, m) => n + (m.facilitator_names?.length ?? 0), 0)} facilitator
            attendances
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Totals cover the latest {meetings.length} records shown (up to 200) for Circles you can
            access. Attendance is not unique people served or completed peer connections. Cancelled
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
                        visibleSeries.find((s) => s.id === m.series_id)?.timezone ??
                        'America/Chicago',
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
                  {documentationV2 && m.occurrence_status === 'held' && (
                    <p>
                      First-time participants: {m.first_time_participant_count ?? 'Not collected'}
                    </p>
                  )}
                  {documentationV2 && m.facilitator_notes && (
                    <div className="mt-2">
                      <p className="font-medium">Facilitator notes</p>
                      <p className="whitespace-pre-wrap">{m.facilitator_notes}</p>
                    </div>
                  )}
                  <p>{m.county ? `${m.county} County` : 'County not recorded'}</p>
                  {m.participation_access === 'closed_cbh_clients' && (
                    <p className="font-medium">
                      Closed — CBH clients only. Not open to the general public.
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
      </section>
      <footer className="gfarc-workspace-nav" aria-label="Return paths">
        <Link to="/vrcc" onClick={confirmLeave}>
          Back to Recovery Community Center
        </Link>
        <a href="https://graceforaddictions.org" onClick={confirmLeave}>
          Visit Grace For Addictions
        </a>
      </footer>
    </div>
  );
}
