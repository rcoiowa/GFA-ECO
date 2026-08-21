import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  listApplicationIntake,
  reviewApplicationIntake,
  type ResidenceApplicationIntake,
} from '@recoveryos/data-access';
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

/**
 * P0.5-A — the review surface for the pre-account housing application intake
 * (0122, Flow 2). This page is the reason the public write path may open at
 * all: every submission lands somewhere a human actually looks. Reads are
 * RLS-scoped (staff of the residence, or care-operations staff); every status
 * change goes through the audited review RPC. Conversion into an account +
 * canonical application stays a deliberate separate act — this queue records
 * contact and disposition, it never auto-provisions a person.
 */

const STATUS_LABELS: Record<ResidenceApplicationIntake['status'], string> = {
  received: 'Received — waiting for first contact',
  contacted: 'Contacted',
  account_offered: 'Account offered',
  converted: 'Converted to a full application',
  waitlisted: 'Waitlisted',
  declined: 'Referred elsewhere',
  closed: 'Closed',
};

const NEXT_STEPS: Record<string, { status: Exclude<ResidenceApplicationIntake['status'], 'received'>; label: string }[]> = {
  received: [
    { status: 'contacted', label: 'Mark contacted' },
    { status: 'waitlisted', label: 'Waitlist' },
    { status: 'declined', label: 'Refer elsewhere' },
    { status: 'closed', label: 'Close' },
  ],
  contacted: [
    { status: 'account_offered', label: 'Account offered' },
    { status: 'waitlisted', label: 'Waitlist' },
    { status: 'declined', label: 'Refer elsewhere' },
    { status: 'closed', label: 'Close' },
  ],
  account_offered: [
    { status: 'converted', label: 'Mark converted' },
    { status: 'waitlisted', label: 'Waitlist' },
    { status: 'closed', label: 'Close' },
  ],
  waitlisted: [
    { status: 'contacted', label: 'Contacted again' },
    { status: 'account_offered', label: 'Account offered' },
    { status: 'closed', label: 'Close' },
  ],
  converted: [],
  declined: [],
  closed: [],
};

const OPEN_STATUSES = new Set(['received', 'contacted', 'account_offered', 'waitlisted']);

export function IntakeQueuePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rows, setRows] = useState<ResidenceApplicationIntake[]>([]);
  const [notesFor, setNotesFor] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setRows(await listApplicationIntake());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (
    intakeId: number,
    status: Exclude<ResidenceApplicationIntake['status'], 'received'>,
  ) => {
    setActionError(null);
    try {
      await reviewApplicationIntake({
        intakeId,
        status,
        notes: notesFor === intakeId && notes.trim() ? notes.trim() : undefined,
      });
      setNotesFor(null);
      setNotes('');
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'We couldn’t record that.');
    }
  };

  const open = rows.filter((r) => OPEN_STATUSES.has(r.status));
  const settled = rows.filter((r) => !OPEN_STATUSES.has(r.status));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Housing application intake"
        lede="People who applied before having an account. First contact within 2 business days; conversion to a full application is always a deliberate step."
      />
      <div className="mb-4">
        <Link to="/home" className="text-sm text-ink-muted underline underline-offset-2">
          Back to my workspace
        </Link>
      </div>

      {loading ? (
        <LoadingState label="Loading the intake queue…" />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <div className="flex flex-col gap-5">
          {actionError ? <Alert tone="critical">{actionError}</Alert> : null}

          <Card>
            <CardTitle>Waiting on us ({open.length})</CardTitle>
            {open.length === 0 ? (
              <p className="text-ink-muted">
                Nothing waiting. Note: visibility is scoped — staff see their residence&rsquo;s
                intake; care-operations staff see all of it.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-3">
                {open.map((r) => (
                  <li key={r.id} className="rounded-md border border-line bg-surface-raised p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-ink">{r.applicant_name}</span>
                      <span className="text-sm text-ink-muted">
                        {STATUS_LABELS[r.status]} ·{' '}
                        {new Date(r.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {[
                        r.applicant_phone,
                        r.applicant_email,
                        r.preferred_contact ? `prefers ${r.preferred_contact}` : null,
                        r.consent_to_contact ? 'consented to contact' : '⚠ no contact consent recorded',
                        r.referral_source ? `heard about us: ${r.referral_source}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {Object.keys(r.answers ?? {}).length > 0 ? (
                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer text-ink-muted">
                          Application answers ({Object.keys(r.answers).length})
                        </summary>
                        <dl className="mt-1 space-y-1">
                          {Object.entries(r.answers).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <dt className="shrink-0 text-ink-faint">{k.replace(/_/g, ' ')}:</dt>
                              <dd className="text-ink-muted">{String(v)}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    ) : null}
                    {r.review_notes ? (
                      <p className="mt-2 text-sm text-ink-muted">Notes: {r.review_notes}</p>
                    ) : null}
                    {notesFor === r.id ? (
                      <div className="mt-2">
                        <TextAreaField
                          label="Note (optional, saved with the next action)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="mt-2 text-sm text-ink-muted underline underline-offset-2"
                        onClick={() => {
                          setNotesFor(r.id);
                          setNotes('');
                        }}
                      >
                        Add a note
                      </button>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(NEXT_STEPS[r.status] ?? []).map((step) => (
                        <Button
                          key={step.status}
                          variant={step.status === 'closed' || step.status === 'declined' ? 'ghost' : 'secondary'}
                          size="md"
                          onClick={() => void act(r.id, step.status)}
                        >
                          {step.label}
                        </Button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle>Settled</CardTitle>
            {settled.length === 0 ? (
              <p className="text-ink-muted">Nothing settled yet.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {settled.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2"
                  >
                    <span className="text-ink">{r.applicant_name}</span>
                    <span className="text-sm text-ink-muted">{STATUS_LABELS[r.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <p className="text-sm text-ink-faint">
            &ldquo;Converted&rdquo; here records the disposition only — creating the person&rsquo;s
            account and canonical application is its own deliberate step with them, never automatic.
          </p>
        </div>
      )}
    </div>
  );
}
