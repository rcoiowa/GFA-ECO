import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  getMyActiveResidency,
  listMyPasses,
  requestPass,
  type PassRow,
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
  TextField,
} from '@recoveryos/ui';

const STATUS_STYLES: Record<string, string> = {
  requested: 'bg-attention-50 text-attention-700',
  approved: 'bg-positive-50 text-positive-700',
  denied: 'bg-critical-50 text-critical-700',
  active: 'bg-experience-soft text-experience-700',
  returned: 'bg-surface-sunken text-ink-muted',
  overdue: 'bg-critical-50 text-critical-700',
};

/** Pass requests: ask for time away, see decisions. Staff decide in Phase 5. */
export function PassesPage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [residencyId, setResidencyId] = useState<number | null>(null);
  const [passes, setPasses] = useState<PassRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      const residency = await getMyActiveResidency(person.id);
      setResidencyId(residency?.id ?? null);
      setPasses(residency ? await listMyPasses(residency.id) : []);
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
    if (!residencyId) return;
    const form = new FormData(event.currentTarget);
    const startsAt = String(form.get('startsAt') ?? '');
    const endsAt = String(form.get('endsAt') ?? '');
    const destination = String(form.get('destination') ?? '').trim();
    if (!startsAt || !endsAt || !destination) {
      setFormError('Please fill in when you leave, when you return, and where you are going.');
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setFormError('Your return time needs to be after your leave time.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const created = await requestPass({
        residencyId,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        destination,
      });
      setPasses((prev) => [created, ...prev]);
      event.currentTarget?.reset?.();
    } catch {
      setFormError("We couldn't submit your request. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Passes"
        lede="Request time away and see where your requests stand."
        crumbs={[
          { to: '/residence/today', label: 'Today' },
          { to: '/residence/house', label: 'My Residence' },
        ]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : !residencyId ? (
        <Alert tone="attention">No active residency found for your account.</Alert>
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle>Request a pass</CardTitle>
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              {formError ? <Alert tone="critical">{formError}</Alert> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Leaving" name="startsAt" type="datetime-local" required />
                <TextField label="Returning" name="endsAt" type="datetime-local" required />
              </div>
              <TextField
                label="Where are you going?"
                name="destination"
                required
                placeholder="e.g. Family visit in Ankeny"
              />
              <Button type="submit" disabled={saving}>
                {saving ? 'Submitting…' : 'Submit request'}
              </Button>
            </form>
          </Card>

          {passes.length === 0 ? (
            <EmptyState
              title="No pass requests yet"
              message="Your requests and their decisions will appear here."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {passes.map((pass) => (
                <li key={pass.id}>
                  <Card>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-ink">{pass.destination ?? 'Pass'}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[pass.status] ?? 'bg-surface-sunken text-ink-muted'}`}
                      >
                        {pass.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {new Date(pass.starts_at).toLocaleString()} →{' '}
                      {new Date(pass.ends_at).toLocaleString()}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
