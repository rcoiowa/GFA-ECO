import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  listResidenceRoster,
  listScreenings,
  recordScreening,
  type RosterEntry,
} from '@recoveryos/data-access';
import type { Screening } from '@recoveryos/domain';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@recoveryos/ui';
import { useStaff } from '../staffContext';

const TYPES = ['random', 'scheduled', 'for cause', 'follow-up', 'intake'];
const RESULTS = ['negative', 'prescription-consistent', 'positive', 'refused', 'invalid'];

/**
 * Screening log (Policy: Drug & Alcohol Screening Policy & Consent v2.0).
 * Each logged screen auto-evidences NARR 2.F.16.c on the compliance tracker.
 */
export function ScreeningsPage() {
  const { person } = useAuth();
  const { residence } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [residencyId, setResidencyId] = useState('');
  const [screeningType, setScreeningType] = useState('random');
  const [result, setResult] = useState('negative');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!residence) return;
    setLoading(true);
    setError(false);
    try {
      const r = await listResidenceRoster(residence.id);
      setRoster(r);
      setScreenings(await listScreenings(r.map((row) => row.id)));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [residence]);

  useEffect(() => {
    void load();
  }, [load]);

  const nameByResidency = useMemo(
    () =>
      new Map(
        roster.map((r) => [
          r.id,
          `${r.person.preferred_name || r.person.first_name} ${r.person.last_name}`,
        ]),
      ),
    [roster],
  );

  const submit = async () => {
    if (!person || !residencyId) return;
    setSaving(true);
    setSaved(false);
    try {
      await recordScreening({
        residencyId: Number(residencyId),
        screeningType,
        result,
        recordedByPersonId: person.id,
      });
      setSaved(true);
      setResidencyId('');
      await load();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (!residence) return <Alert tone="attention">Select a residence to log screenings.</Alert>;

  return (
    <>
      <PageHeader
        title="Screenings"
        lede="A community-safety tool, never a surveillance tool. Results are confidential — House Manager and Executive Director access only."
        crumbs={[{ to: '/staff/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle>Log a screening</CardTitle>
            {saved ? (
              <Alert tone="positive">Logged — NARR 2.F.16.c evidence recorded.</Alert>
            ) : null}
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Resident
                <select
                  className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                  value={residencyId}
                  onChange={(e) => setResidencyId(e.target.value)}
                >
                  <option value="">Select…</option>
                  {roster.map((r) => (
                    <option key={r.id} value={r.id}>
                      {nameByResidency.get(r.id)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Type
                <select
                  className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                  value={screeningType}
                  onChange={(e) => setScreeningType(e.target.value)}
                >
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Result
                <select
                  className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                >
                  {RESULTS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            </div>
            <Button
              className="mt-3"
              onClick={() => void submit()}
              disabled={saving || !residencyId}
            >
              {saving ? 'Logging…' : 'Log screening'}
            </Button>
            {result === 'positive' || result === 'refused' ? (
              <Alert tone="attention">
                A {result} result starts the Return-to-Use Response: a support conversation and
                safety assessment — not automatic discharge. Schedule the care conversation within
                24 hours.
              </Alert>
            ) : null}
          </Card>

          <Card>
            <CardTitle>Recent screenings</CardTitle>
            {screenings.length === 0 ? (
              <p className="text-ink-muted">No screenings logged yet.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {screenings.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap justify-between gap-2 border-b border-line py-1.5 text-sm"
                  >
                    <span className="text-ink">
                      {nameByResidency.get(s.residency_id) ?? `Residency #${s.residency_id}`}
                    </span>
                    <span className="text-ink-muted">
                      {s.screening_type} · {s.result ?? '—'} ·{' '}
                      {new Date(s.collected_at).toLocaleDateString()}
                    </span>
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
