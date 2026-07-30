import { useCallback, useEffect, useState } from 'react';
import {
  compileSupervisionReport,
  listResidenceRoster,
  type RosterEntry,
  type SupervisionReportData,
} from '@recoveryos/data-access';
import { getPhaseInfo } from '@recoveryos/domain';
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

/**
 * Supervision compliance report (Room 4 seed): compiled automatically from
 * participant data for probation/parole/IDOC partners. Screening details
 * and report contents may be shared ONLY under a signed Release of
 * Information — staff attest before printing.
 */
export function ReportsPage() {
  const { residence } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [residencyId, setResidencyId] = useState('');
  const [report, setReport] = useState<SupervisionReportData | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [roiConfirmed, setRoiConfirmed] = useState(false);

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

  const selected = roster.find((r) => String(r.id) === residencyId);

  const compile = async () => {
    if (!selected) return;
    setCompiling(true);
    setReport(null);
    try {
      setReport(await compileSupervisionReport(selected));
    } catch {
      setError(true);
    } finally {
      setCompiling(false);
    }
  };

  if (!residence) return <Alert tone="attention">Select a residence to compile reports.</Alert>;

  const phase = selected?.admission_date != null ? getPhaseInfo(selected.admission_date) : null;

  return (
    <>
      <PageHeader
        title="Supervision Reports"
        lede="Auto-compiled from participation data for probation, parole, and IDOC partners — shared only under a signed Release of Information."
        crumbs={[{ to: '/staff/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : roster.length === 0 ? (
        <Alert tone="attention">No active residents yet.</Alert>
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle>Compile a report</CardTitle>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Resident
                <select
                  className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                  value={residencyId}
                  onChange={(e) => {
                    setResidencyId(e.target.value);
                    setReport(null);
                    setRoiConfirmed(false);
                  }}
                >
                  <option value="">Select…</option>
                  {roster.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.person.preferred_name || r.person.first_name} {r.person.last_name}
                    </option>
                  ))}
                </select>
              </label>
              <Button onClick={() => void compile()} disabled={compiling || !selected}>
                {compiling ? 'Compiling…' : 'Compile 90-day report'}
              </Button>
            </div>
            <p className="mt-2 text-sm text-ink-faint">
              A signed, unexpired ROI naming the supervision partner must be on file before this
              report leaves the building — check the resident's Intake Forms Package.
            </p>
          </Card>

          {report && selected ? (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                <CardTitle>Report preview</CardTitle>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={roiConfirmed}
                      onChange={(e) => setRoiConfirmed(e.target.checked)}
                    />
                    Signed ROI on file for this recipient
                  </label>
                  <Button
                    variant="secondary"
                    disabled={!roiConfirmed}
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                </div>
              </div>

              <div className="mt-3 rounded-md border border-line bg-surface-raised p-5">
                <h2 className="text-xl font-semibold text-ink">Supervision Compliance Report</h2>
                <p className="text-sm text-ink-muted">
                  {residence.name} · Grace For Addictions · {residence.phone} · Generated{' '}
                  {new Date().toLocaleDateString()} · Reporting window: last {report.windowDays}{' '}
                  days
                </p>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-ink-muted">Participant</dt>
                    <dd className="font-medium text-ink">
                      {selected.person.first_name} {selected.person.last_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-muted">Residency status</dt>
                    <dd className="font-medium text-ink">
                      {selected.residency_status}
                      {selected.admission_date
                        ? ` · admitted ${new Date(selected.admission_date).toLocaleDateString()}`
                        : ''}
                    </dd>
                  </div>
                  {phase ? (
                    <div>
                      <dt className="text-sm text-ink-muted">Program phase</dt>
                      <dd className="font-medium text-ink">
                        {phase.label} (day {phase.dayInResidence}) — {phase.activitiesPerWeek}{' '}
                        recovery activities/week required
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-sm text-ink-muted">Daily check-in engagement</dt>
                    <dd className="font-medium text-ink">
                      {report.checkInDays} days with a VRCC check-in
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-muted">House meetings</dt>
                    <dd className="font-medium text-ink">
                      {report.meetingsAttended} attended of {report.meetingsExpected} expected
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-muted">Recovery services received</dt>
                    <dd className="font-medium text-ink">
                      {report.serviceEvents.length} documented service events
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-muted">Program fees</dt>
                    <dd className="font-medium text-ink">
                      {report.feeBalanceOwed > 0
                        ? `$${report.feeBalanceOwed.toFixed(2)} outstanding (plan in place per policy)`
                        : 'Current'}
                    </dd>
                  </div>
                </dl>

                <h3 className="mt-5 font-semibold text-ink">
                  Screenings ({report.screenings.length} in window)
                </h3>
                {report.screenings.length === 0 ? (
                  <p className="text-sm text-ink-muted">None recorded in this window.</p>
                ) : (
                  <ul className="mt-1 flex flex-col gap-1">
                    {report.screenings.map((s) => (
                      <li
                        key={s.id}
                        className="flex justify-between border-b border-line py-1 text-sm"
                      >
                        <span className="text-ink">
                          {new Date(s.collected_at).toLocaleDateString()} · {s.screening_type}
                        </span>
                        <span className="font-medium text-ink">{s.result ?? 'pending'}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-5 text-sm text-ink-faint">
                  Prepared under the Grace House Confidentiality Policy. Screening results reported
                  with the canonical vocabulary — prescription-consistent results reflect lawful,
                  prescribed medication and are never reported as violations. Questions:{' '}
                  {residence.email} · {residence.phone}.
                </p>
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </>
  );
}
