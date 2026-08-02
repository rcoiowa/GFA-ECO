import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  listMyAppointments,
  requestCoachingSession,
  type AppointmentRow,
} from '@recoveryos/data-access';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  TextAreaField,
  TextField,
} from '@recoveryos/ui';

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
  requested: { label: 'Requested — we’ll reach out', style: 'bg-attention-50 text-attention-700' },
  scheduled: { label: 'Scheduled', style: 'bg-positive-50 text-positive-700' },
  completed: { label: 'Completed', style: 'bg-surface-sunken text-ink-muted' },
  cancelled: { label: 'Cancelled', style: 'bg-surface-sunken text-ink-muted' },
  no_show: {
    label: 'Missed — no judgment, re-request anytime',
    style: 'bg-surface-sunken text-ink-muted',
  },
};

/**
 * Connect: the front door to human support. The coaching request is
 * deliberately two fields — the legacy flow's friction is the thing being
 * replaced, not ported.
 */
export function ConnectPage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [justRequested, setJustRequested] = useState(false);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      setAppointments(await listMyAppointments(person.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!person) return;
    const form = new FormData(event.currentTarget);
    const preferredTimes = String(form.get('preferredTimes') ?? '').trim();
    const note = String(form.get('note') ?? '').trim();
    if (!preferredTimes) {
      setFormError('Let us know when you’re generally available — even roughly.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const created = await requestCoachingSession({
        personId: person.id,
        preferredTimes,
        note: note || undefined,
      });
      setAppointments((prev) => [created, ...prev]);
      setJustRequested(true);
      event.currentTarget?.reset?.();
    } catch {
      setFormError("We couldn't send your request. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Connect"
        lede="Real people, on your side. Ask for a coaching session anytime."
        crumbs={[{ to: '/app/today', label: 'Today' }]}
      />
      <div className="flex flex-col gap-5">
        <Card>
          <CardTitle>Request a coaching session</CardTitle>
          <p className="mb-4 text-ink-muted">
            A recovery coach will reach out to set a time that works. Two quick questions,
            nothing else.
          </p>
          {justRequested ? (
            <Alert tone="positive">
              Request sent. A coach will be in touch — usually within a business day.
            </Alert>
          ) : null}
          <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-4" noValidate>
            {formError ? <Alert tone="critical">{formError}</Alert> : null}
            <TextField
              label="When are you generally available?"
              name="preferredTimes"
              placeholder="e.g. Weekday evenings, or Tuesday mornings"
              required
            />
            <TextAreaField
              label="Anything you'd like your coach to know? (optional)"
              name="note"
              rows={3}
            />
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? 'Sending…' : 'Request a session'}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Your sessions</CardTitle>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState onRetry={() => void load()} />
          ) : appointments.length === 0 ? (
            <p className="text-ink-muted">
              No sessions yet — your requests and scheduled sessions will appear here.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {appointments.map((appt) => {
                const status = STATUS_LABELS[appt.status] ?? {
                  label: appt.status,
                  style: 'bg-surface-sunken text-ink-muted',
                };
                return (
                  <li
                    key={appt.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-ink">{appt.title}</p>
                      {appt.location_note ? (
                        <p className="text-sm text-ink-muted">{appt.location_note}</p>
                      ) : null}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>
                      {status.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>Recovery circles</CardTitle>
          <EmptyState
            title="Circles are coming soon"
            message="Group meetings and community circles will be listed here with easy ways to join."
          />
        </Card>
      </div>
    </>
  );
}
