import { useCallback, useEffect, useState } from 'react';
import {
  dischargeResidency,
  listResidenceRoster,
  type RosterEntry,
} from '@recoveryos/data-access';
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
 * P0.5-A — the residents roster with real lifecycle actions. Ending a
 * residency was a deployed-but-unreachable RPC (0115 `discharge_residency`,
 * manager-gated server-side): it releases the bed, revokes the resident role,
 * and ends the residence-support designation, preserving all history. The UI
 * is deliberately calm — a transition is a doorway, not a verdict.
 */

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  on_pass: 'On a pass',
  transitioning: 'Transitioning',
};

const END_OPTIONS = [
  { status: 'transitioning' as const, label: 'Begin transition' },
  { status: 'exited' as const, label: 'Completed / moved on' },
  { status: 'discharged' as const, label: 'Discharged' },
];

export function ResidentsPage() {
  const { residence } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [endingId, setEndingId] = useState<number | null>(null);
  const [endReason, setEndReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!residence) return;
    setLoading(true);
    setError(false);
    try {
      setRoster(await listResidenceRoster(residence.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [residence]);

  useEffect(() => {
    void load();
  }, [load]);

  const endResidency = async (
    residencyId: number,
    status: 'exited' | 'discharged' | 'transitioning',
  ) => {
    setActionError(null);
    try {
      await dischargeResidency({ residencyId, status, reason: endReason });
      setEndingId(null);
      setEndReason('');
      await load();
    } catch (e) {
      // Manager-gated server-side; the refusal is a human sentence — show it.
      setActionError(e instanceof Error ? e.message : 'We couldn’t record that transition.');
    }
  };

  if (!residence) return <Alert tone="attention">Select a residence to view residents.</Alert>;

  const current = roster.filter((r) =>
    ['active', 'on_pass', 'transitioning'].includes(r.residency_status),
  );
  const past = roster.filter((r) => ['exited', 'discharged'].includes(r.residency_status));

  return (
    <>
      <PageHeader
        title="Residents"
        lede="Everyone the house is walking beside — and calm, recorded transitions when a stay ends."
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
            <CardTitle>Current residents ({current.length})</CardTitle>
            {current.length === 0 ? (
              <p className="text-ink-muted">Nobody on the roster right now.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-3">
                {current.map((r) => (
                  <li key={r.id} className="rounded-md border border-line bg-surface-raised p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-ink">
                        {r.person.preferred_name || r.person.first_name} {r.person.last_name}
                      </span>
                      <span className="text-sm text-ink-muted">
                        {STATUS_LABELS[r.residency_status] ?? r.residency_status}
                        {r.admission_date
                          ? ` · since ${new Date(r.admission_date).toLocaleDateString()}`
                          : ''}
                      </span>
                    </div>
                    {endingId === r.id ? (
                      <div className="mt-3 space-y-2">
                        <TextField
                          label="Reason (kept with the record)"
                          value={endReason}
                          onChange={(e) => setEndReason(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                          {END_OPTIONS.map((o) => (
                            <Button
                              key={o.status}
                              variant="secondary"
                              size="md"
                              onClick={() => void endResidency(r.id, o.status)}
                            >
                              {o.label}
                            </Button>
                          ))}
                          <Button
                            variant="ghost"
                            size="md"
                            onClick={() => {
                              setEndingId(null);
                              setEndReason('');
                            }}
                          >
                            Never mind
                          </Button>
                        </div>
                        <p className="text-sm text-ink-faint">
                          Ending a stay releases the bed and residence access. It never deletes
                          anything — their history and their VRCC membership stay theirs.
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="mt-2 text-sm text-ink-muted underline underline-offset-2"
                        onClick={() => setEndingId(r.id)}
                      >
                        End or transition this stay…
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardTitle>Past residents</CardTitle>
            {past.length === 0 ? (
              <p className="text-ink-muted">No completed stays on record.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {past.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2"
                  >
                    <span className="text-ink">
                      {r.person.preferred_name || r.person.first_name} {r.person.last_name}
                    </span>
                    <span className="text-sm text-ink-muted">
                      {r.residency_status === 'exited' ? 'Moved on' : 'Discharged'}
                      {r.discharge_date
                        ? ` · ${new Date(r.discharge_date).toLocaleDateString()}`
                        : ''}
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
