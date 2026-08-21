import { useCallback, useEffect, useState } from 'react';
import { listResidenceGrievances, resolveGrievance } from '@recoveryos/data-access';
import type { Grievance } from '@recoveryos/domain';
import { Alert, Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { useStaff } from '../staffContext';

const STATUS_LABELS: Record<Grievance['status'], string> = {
  open: 'Open — acknowledge within 2 business days',
  in_review: 'In review',
  resolved: 'Resolved',
  closed: 'Closed',
};

/** The disposition steps the server RPC accepts, offered by current status. */
const NEXT_STEPS: Record<
  Grievance['status'],
  Array<{ to: 'in_review' | 'resolved' | 'closed'; label: string }>
> = {
  open: [
    { to: 'in_review', label: 'Start review' },
    { to: 'resolved', label: 'Mark resolved' },
  ],
  in_review: [
    { to: 'resolved', label: 'Mark resolved' },
    { to: 'closed', label: 'Close' },
  ],
  resolved: [{ to: 'closed', label: 'Close' }],
  closed: [],
};

/**
 * The staff grievance queue — the follow-through behind the resident filing
 * form (launch blocker #4). Reads are manager-scoped by RLS (0115
 * `grievances_scoped_select`); disposition goes through the
 * `resolve_grievance` RPC, which refuses the filer's own grievance
 * (conflict of interest) — that server message is surfaced verbatim.
 * The written acknowledgment/decision still happens with the resident per
 * the Grievance Policy; this queue tracks that it happens on time.
 */
export function GrievancesPage() {
  const { residence } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!residence) return;
    setLoading(true);
    setError(false);
    try {
      setGrievances(await listResidenceGrievances(residence.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [residence]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(grievance: Grievance, to: 'in_review' | 'resolved' | 'closed') {
    setBusyId(grievance.id);
    setActionError(null);
    try {
      await resolveGrievance(grievance.id, to);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'That didn’t go through. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  if (!residence) return <Alert tone="attention">Select a residence to view grievances.</Alert>;

  const open = grievances.filter((g) => g.status === 'open' || g.status === 'in_review');
  const settled = grievances.filter((g) => g.status === 'resolved' || g.status === 'closed');

  const renderItem = (g: Grievance) => (
    <li key={g.id} className="rounded-md border border-line bg-surface-raised p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-ink-muted">
          Filed {new Date(g.filed_at).toLocaleDateString()}
        </span>
        <span className="rounded-full bg-experience-soft px-3 py-0.5 text-sm text-experience-700">
          {STATUS_LABELS[g.status]}
        </span>
      </div>
      <p className="mt-1 text-ink">{g.summary}</p>
      {NEXT_STEPS[g.status].length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {NEXT_STEPS[g.status].map((step) => (
            <button
              key={step.to}
              type="button"
              disabled={busyId === g.id}
              onClick={() => void act(g, step.to)}
              className="min-h-11 rounded-md border border-line px-4 font-medium text-ink hover:bg-surface-sunken disabled:opacity-60"
            >
              {busyId === g.id ? 'Saving…' : step.label}
            </button>
          ))}
        </div>
      ) : null}
    </li>
  );

  return (
    <>
      <PageHeader
        title="Grievances"
        lede="Every filing deserves written acknowledgment within 2 business days and a written decision within 7 — no retaliation, ever. This queue tracks that follow-through."
        crumbs={[{ to: '/staff/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <div className="flex flex-col gap-5">
          {actionError ? <Alert tone="critical">{actionError}</Alert> : null}
          <Card>
            <CardTitle>Needs follow-through</CardTitle>
            {open.length === 0 ? (
              <p className="text-ink-muted">
                No open grievances on record. Note: grievance visibility is limited to residence
                managers and platform administrators — residents’ paper and verbal filings enter
                this same queue once recorded.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">{open.map(renderItem)}</ul>
            )}
          </Card>
          {settled.length > 0 ? (
            <Card>
              <CardTitle>Resolved and closed</CardTitle>
              <ul className="flex flex-col gap-2">{settled.map(renderItem)}</ul>
            </Card>
          ) : null}
        </div>
      )}
    </>
  );
}
