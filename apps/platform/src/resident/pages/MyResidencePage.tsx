import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import {
  feeBalance,
  getCurfewSchedule,
  getMyActiveResidency,
  listFeeLedger,
  listMyChoreAssignments,
  type ChoreAssignmentWithChore,
} from '@recoveryos/data-access';
import type { CurfewSchedule, FeeLedgerEntry, Residence, Residency } from '@recoveryos/domain';
import { Alert, Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function MyResidencePage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [residency, setResidency] = useState<(Residency & { residence: Residence }) | null>(null);
  const [chores, setChores] = useState<ChoreAssignmentWithChore[]>([]);
  const [curfew, setCurfew] = useState<CurfewSchedule[]>([]);
  const [ledger, setLedger] = useState<FeeLedgerEntry[]>([]);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      const res = await getMyActiveResidency(person.id);
      setResidency(res);
      if (res) {
        const today = new Date();
        const weekOut = new Date();
        weekOut.setDate(today.getDate() + 7);
        const [choreRows, curfewRows, ledgerRows] = await Promise.all([
          listMyChoreAssignments(res.id, isoDate(today), isoDate(weekOut)),
          getCurfewSchedule(res.residence_id),
          listFeeLedger(res.id),
        ]);
        setChores(choreRows);
        setCurfew(curfewRows);
        setLedger(ledgerRows);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="My Residence"
        lede="Your home, your rights, and what living here involves."
        crumbs={[{ to: '/residence/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : !residency ? (
        <Alert tone="attention">No active residency found for your account.</Alert>
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle>{residency.residence.name}</CardTitle>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-ink-muted">Location</dt>
                <dd className="font-medium text-ink">
                  {[residency.residence.address_city, residency.residence.address_state]
                    .filter(Boolean)
                    .join(', ') || 'On file with staff'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-muted">Your status</dt>
                <dd className="font-medium text-ink">{residency.residency_status}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardTitle>Your responsibilities this week</CardTitle>
            <p className="mb-3 text-sm text-ink-muted">
              Shared work is shared ownership — this is a home, not a facility. Trade with a
              housemate when you need to; just make sure it's covered.
            </p>
            {chores.length === 0 ? (
              <p className="text-ink-muted">
                Nothing assigned digitally this week — the posted chore schedule in the house
                applies.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {chores.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-raised px-4 py-3"
                  >
                    <div>
                      <span className="font-medium text-ink">{c.chore.name}</span>
                      {c.chore.description ? (
                        <span className="block text-sm text-ink-muted">{c.chore.description}</span>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="block text-sm text-ink-muted">
                        Due{' '}
                        {new Date(`${c.due_on}T12:00:00`).toLocaleDateString(undefined, {
                          weekday: 'long',
                        })}
                      </span>
                      {c.completed_at ? (
                        <span className="text-sm font-medium text-positive-700">Done ✓</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle>Curfew</CardTitle>
            {curfew.length === 0 ? (
              <p className="text-ink-muted">
                The posted curfew schedule in the house applies. Need an exception? Request a pass
                from the{' '}
                <Link
                  to="/residence/schedule"
                  className="font-medium text-experience-700 underline underline-offset-2"
                >
                  Schedule
                </Link>{' '}
                page.
              </p>
            ) : (
              <>
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
                <p className="mt-3 text-sm text-ink-muted">
                  Working late, family need, appointment? Request a pass from the{' '}
                  <Link
                    to="/residence/schedule"
                    className="font-medium text-experience-700 underline underline-offset-2"
                  >
                    Schedule
                  </Link>{' '}
                  page — requests are honored whenever safety allows.
                </p>
              </>
            )}
          </Card>

          <Card>
            <CardTitle>Your program fees</CardTitle>
            {ledger.length === 0 ? (
              <p className="text-ink-muted">
                No fee activity on record yet. Your fee schedule is in the Fee Schedule &amp;
                Financial Agreement (Documents), and receipts are issued for every payment.
              </p>
            ) : (
              <>
                <p className="text-2xl font-semibold text-ink">
                  ${Math.abs(feeBalance(ledger)).toFixed(2)}{' '}
                  <span className="text-base font-normal text-ink-muted">
                    {feeBalance(ledger) > 0
                      ? 'currently owed'
                      : feeBalance(ledger) < 0
                        ? 'credit'
                        : '— all settled'}
                  </span>
                </p>
                <ul className="mt-2 flex flex-col gap-1">
                  {ledger.slice(0, 6).map((e) => (
                    <li
                      key={e.id}
                      className="flex justify-between border-b border-line py-1 text-sm"
                    >
                      <span className="text-ink">
                        {e.entry_type}
                        {e.note ? ` · ${e.note}` : ''}
                      </span>
                      <span className="text-ink-muted">
                        {e.entry_type === 'charge' ? '+' : '−'}${Number(e.amount).toFixed(2)} ·{' '}
                        {new Date(e.created_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-ink-faint">
                  Money getting hard? Talk with the House Manager before the due date — hardship
                  payment plans are always available and never punitive.
                </p>
              </>
            )}
          </Card>

          <Card>
            <CardTitle>House expectations and your rights</CardTitle>
            <p className="text-ink-muted">
              Your Resident Agreement, the Resident Rights &amp; Responsibilities statement, the
              House Guidelines, and every house policy live in Documents — in plain language, with
              the reasons behind each expectation.
            </p>
            <Link
              to="/residence/documents"
              className="mt-2 inline-block font-medium text-experience-700 underline underline-offset-2"
            >
              Open Documents
            </Link>
          </Card>
        </div>
      )}
    </>
  );
}
