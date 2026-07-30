import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  listIncidents,
  listResidenceRoster,
  reportIncident,
  type RosterEntry,
} from '@recoveryos/data-access';
import type { Incident } from '@recoveryos/domain';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
  TextAreaField,
} from '@recoveryos/ui';
import { useStaff } from '../staffContext';

const CATEGORIES = [
  'medical',
  'overdose',
  'fire',
  'injury',
  'violence or threat',
  'property',
  'missing person',
  'privacy',
  'other',
];

const SEVERITY_LABELS: Record<number, string> = {
  1: 'Level 1 — informational',
  2: 'Level 2 — needs follow-up',
  3: 'Level 3 — serious (ED notified)',
  4: 'Level 4 — critical (911 / immediate)',
};

/**
 * Incident Report System v1.0 — facts only, person-first, a learning
 * culture. Each report auto-evidences NARR 1.A.4.a documentation.
 */
export function IncidentsPage() {
  const { person } = useAuth();
  const { residence } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [category, setCategory] = useState('medical');
  const [severity, setSeverity] = useState(2);
  const [residencyId, setResidencyId] = useState('');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!residence) return;
    setLoading(true);
    setError(false);
    try {
      const [rows, r] = await Promise.all([
        listIncidents(residence.id),
        listResidenceRoster(residence.id),
      ]);
      setIncidents(rows);
      setRoster(r);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [residence]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!person || !residence || !summary.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      await reportIncident({
        residenceId: residence.id,
        residencyId: residencyId ? Number(residencyId) : null,
        category,
        severity,
        summary: summary.trim(),
        reportedByPersonId: person.id,
      });
      setSummary('');
      setResidencyId('');
      setSaved(true);
      await load();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (!residence) return <Alert tone="attention">Select a residence to view incidents.</Alert>;

  return (
    <>
      <PageHeader
        title="Incidents"
        lede="Document within 24 hours: facts only, person-first language, initials in narratives. Reports are for learning, never punishment."
        crumbs={[{ to: '/staff/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle>Report an incident</CardTitle>
            {saved ? (
              <Alert tone="positive">
                Documented. Offer support to everyone involved — including whoever witnessed it.
              </Alert>
            ) : null}
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Category
                <select
                  className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Classification
                <select
                  className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                >
                  {[1, 2, 3, 4].map((s) => (
                    <option key={s} value={s}>
                      {SEVERITY_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Resident involved (optional)
                <select
                  className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                  value={residencyId}
                  onChange={(e) => setResidencyId(e.target.value)}
                >
                  <option value="">—</option>
                  {roster.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.person.preferred_name || r.person.first_name} {r.person.last_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3">
              <TextAreaField
                label="What happened — facts only"
                hint="What you observed, when, and the immediate response taken. No interpretations or motive attribution; identify residents by initials in this narrative."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              className="mt-3"
              onClick={() => void submit()}
              disabled={saving || !summary.trim()}
            >
              {saving ? 'Saving…' : 'File incident report'}
            </Button>
          </Card>

          <Card>
            <CardTitle>Recent incidents</CardTitle>
            {incidents.length === 0 ? (
              <p className="text-ink-muted">Nothing on record.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {incidents.map((i) => (
                  <li key={i.id} className="rounded-md border border-line bg-surface-raised p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-ink">
                        {i.category}
                        {i.severity
                          ? ` · ${SEVERITY_LABELS[i.severity] ?? `Level ${i.severity}`}`
                          : ''}
                      </span>
                      <span className="text-sm text-ink-muted">
                        {new Date(i.occurred_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink">{i.summary}</p>
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
