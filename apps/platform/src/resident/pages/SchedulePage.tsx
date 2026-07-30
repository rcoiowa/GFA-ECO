import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  getCurfewSchedule,
  getMyActiveResidency,
  listMyPasses,
  listUpcomingMeetings,
  requestPass,
} from '@recoveryos/data-access';
import type { CurfewSchedule, Meeting, Pass, Residence, Residency } from '@recoveryos/domain';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  TextField,
} from '@recoveryos/ui';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PASS_STATUS_LABELS: Record<Pass['status'], string> = {
  requested: 'Requested — awaiting decision',
  approved: 'Approved',
  denied: 'Not approved (reason given in person)',
  active: 'Active — enjoy, and travel safe',
  returned: 'Returned',
  overdue: 'Past return time — check in with staff',
};

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** House meetings, the curfew rhythm, and pass requests in one place. */
export function SchedulePage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [residency, setResidency] = useState<(Residency & { residence: Residence }) | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [curfew, setCurfew] = useState<CurfewSchedule[]>([]);
  const [passes, setPasses] = useState<Pass[]>([]);

  const [showPassForm, setShowPassForm] = useState(false);
  const [passStart, setPassStart] = useState('');
  const [passEnd, setPassEnd] = useState('');
  const [passDestination, setPassDestination] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passError, setPassError] = useState(false);
  const [passRequested, setPassRequested] = useState(false);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      const res = await getMyActiveResidency(person.id);
      setResidency(res);
      const [meetingRows, curfewRows, passRows] = await Promise.all([
        listUpcomingMeetings(),
        res ? getCurfewSchedule(res.residence_id) : Promise.resolve([]),
        res ? listMyPasses(res.id) : Promise.resolve([]),
      ]);
      setMeetings(meetingRows);
      setCurfew(curfewRows);
      setPasses(passRows);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitPass = async () => {
    if (!residency || !passStart || !passEnd) return;
    setPassSubmitting(true);
    setPassError(false);
    try {
      await requestPass({
        residencyId: residency.id,
        startsAt: new Date(passStart).toISOString(),
        endsAt: new Date(passEnd).toISOString(),
        destination: passDestination.trim() || null,
      });
      setPassRequested(true);
      setShowPassForm(false);
      setPassStart('');
      setPassEnd('');
      setPassDestination('');
      await load();
    } catch {
      setPassError(true);
    } finally {
      setPassSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Schedule"
        lede="House meetings, curfew, and passes — the house rhythm, all in one place."
        crumbs={[{ to: '/residence/today', label: 'Today' }]}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle>Upcoming meetings</CardTitle>
            {meetings.length === 0 ? (
              <EmptyState
                title="Nothing scheduled yet"
                message="House meetings and community events will appear here as staff schedule them."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {meetings.map((m) => (
                  <li key={m.id} className="rounded-md border border-line bg-surface-raised p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-ink">{m.title}</span>
                      {m.is_required_for_residents ? (
                        <span className="rounded-full bg-experience-soft px-3 py-0.5 text-sm text-experience-700">
                          Expected
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {new Date(m.starts_at).toLocaleString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    {m.description ? (
                      <p className="mt-1 text-sm text-ink">{m.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle>Curfew this week</CardTitle>
            <p className="mb-3 text-sm text-ink-muted">
              Curfew is how a house full of people who care about you knows you're safe. Need an
              exception? Request a pass — requests are honored whenever safety allows.
            </p>
            {curfew.length === 0 ? (
              <p className="text-ink-muted">
                The curfew schedule isn't posted digitally yet — the posted schedule in the house
                applies.
              </p>
            ) : (
              <ul className="grid gap-1 sm:grid-cols-2">
                {curfew.map((c) => (
                  <li
                    key={c.id}
                    className="flex justify-between border-b border-line py-1.5 text-ink"
                  >
                    <span>{DAYS[c.day_of_week]}</span>
                    <span className="font-medium">{formatTime(c.curfew_time)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Passes</CardTitle>
              {residency && !showPassForm ? (
                <Button variant="secondary" onClick={() => setShowPassForm(true)}>
                  Request a pass
                </Button>
              ) : null}
            </div>

            {passRequested ? (
              <Alert tone="positive">
                Pass requested. The house manager will decide soon — same-day requests for work,
                family, or emergencies are always considered.
              </Alert>
            ) : null}

            {showPassForm ? (
              <div className="mb-4 flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-4 sm:max-w-md">
                {passError ? (
                  <Alert tone="critical">The request didn't save — please try again.</Alert>
                ) : null}
                <TextField
                  label="Leaving"
                  type="datetime-local"
                  value={passStart}
                  onChange={(e) => setPassStart(e.target.value)}
                />
                <TextField
                  label="Returning"
                  type="datetime-local"
                  value={passEnd}
                  onChange={(e) => setPassEnd(e.target.value)}
                />
                <TextField
                  label="Where you'll be"
                  hint="City or general location is enough."
                  value={passDestination}
                  onChange={(e) => setPassDestination(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => void submitPass()}
                    disabled={passSubmitting || !passStart || !passEnd}
                  >
                    {passSubmitting ? 'Requesting…' : 'Submit request'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowPassForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            {passes.length === 0 ? (
              <p className="text-ink-muted">No passes yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {passes.map((p) => (
                  <li key={p.id} className="rounded-md border border-line bg-surface-raised p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-ink">
                        {new Date(p.starts_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        →{' '}
                        {new Date(p.ends_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="rounded-full bg-experience-soft px-3 py-0.5 text-sm text-experience-700">
                        {PASS_STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    {p.destination ? (
                      <p className="mt-0.5 text-sm text-ink-muted">{p.destination}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
