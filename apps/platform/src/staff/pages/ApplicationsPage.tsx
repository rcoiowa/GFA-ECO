import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@recoveryos/auth';
import {
  decideApplication,
  listApplications,
  listReferrals,
  listResidenceRoster,
  updateReferralStatus,
  type ApplicationWithPerson,
  type Referral,
} from '@recoveryos/data-access';
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
import { IntakeChecklist } from '../components/IntakeChecklist';
import { track } from '../../lib/analytics';

const STATUS_LABELS: Record<ApplicationWithPerson['status'], string> = {
  submitted: 'Submitted',
  in_review: 'In review',
  approved: 'Approved',
  waitlisted: 'Waitlisted',
  declined: 'Referred elsewhere',
  withdrawn: 'Withdrawn',
};

/**
 * Applications & waitlist. B5A: approval unlocks the intake checklist;
 * move-in (the residency) is its own deliberate action from the checklist.
 * The waitlist promise (contact at least every two weeks) lives here.
 */
export function ApplicationsPage() {
  const { person } = useAuth();
  const { residence } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [applications, setApplications] = useState<ApplicationWithPerson[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [residentIds, setResidentIds] = useState<Set<number>>(new Set());
  const [justApproved, setJustApproved] = useState<string | null>(null);
  const [checklistFor, setChecklistFor] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!residence) return;
    setLoading(true);
    setError(false);
    try {
      const [apps, refs, roster] = await Promise.all([
        listApplications(residence.id),
        listReferrals(residence.id),
        listResidenceRoster(residence.id),
      ]);
      setApplications(apps);
      setReferrals(refs);
      setResidentIds(new Set(roster.map((r) => r.person_id)));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [residence]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (
    application: ApplicationWithPerson,
    status: 'in_review' | 'approved' | 'waitlisted' | 'declined',
  ) => {
    if (!person) return;
    try {
      await decideApplication({ application, status, decidedByPersonId: person.id });
      if (status === 'approved') {
        setJustApproved(
          `${application.person.preferred_name || application.person.first_name} ${application.person.last_name}`,
        );
      }
      await load();
    } catch {
      setError(true);
    }
  };

  const triageReferral = async (referralId: number, status: Referral['status']) => {
    if (!person) return;
    try {
      await updateReferralStatus({ referralId, status });
      track('residence_referral_triaged');
      await load();
    } catch {
      setError(true);
    }
  };

  if (!residence) return <Alert tone="attention">Select a residence to see applications.</Alert>;

  const openReferrals = referrals.filter((r) => ['received', 'contacted'].includes(r.status));
  const open = applications.filter((a) =>
    ['submitted', 'in_review', 'waitlisted'].includes(a.status),
  );
  // Approved but not yet living here: intake in progress — the checklist drives move-in.
  const inIntake = applications.filter(
    (a) => a.status === 'approved' && !residentIds.has(a.person_id),
  );
  const closed = applications.filter(
    (a) =>
      !['submitted', 'in_review', 'waitlisted'].includes(a.status) &&
      !(a.status === 'approved' && !residentIds.has(a.person_id)),
  );

  return (
    <>
      <PageHeader
        title="Applications"
        lede="Every applicant gets a real answer within 2 business days — and waitlisted applicants hear from us at least every two weeks."
        crumbs={[{ to: '/staff/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <div className="flex flex-col gap-5">
          {justApproved ? (
            <Alert tone="positive">
              {justApproved} is approved — their intake checklist is now open below. Move-in is its
              own step, once the checklist is ready.
            </Alert>
          ) : null}
          <Card>
            <CardTitle>Partner referrals ({openReferrals.length})</CardTitle>
            {openReferrals.length === 0 ? (
              <p className="text-ink-muted">
                No open referrals. Partner submissions from the public directory land here the
                moment they're sent.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {openReferrals.map((r) => (
                  <li key={r.id} className="rounded-md border border-line bg-surface-raised p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-ink">{r.participant_name}</p>
                        <p className="text-sm text-ink-muted">
                          Referred by {r.referrer_name}
                          {r.referrer_organization ? ` (${r.referrer_organization})` : ''}
                          {' · '}
                          {new Date(r.created_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {r.status === 'contacted' ? ' · contacted' : ''}
                        </p>
                        <p className="text-sm text-ink-muted">
                          {[r.referrer_phone, r.referrer_email, r.participant_phone]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {r.status === 'received' ? (
                          <Button
                            variant="secondary"
                            onClick={() => void triageReferral(r.id, 'contacted')}
                          >
                            Mark contacted
                          </Button>
                        ) : null}
                        <Button onClick={() => void triageReferral(r.id, 'converted')}>
                          Became an application
                        </Button>
                        <Button variant="ghost" onClick={() => void triageReferral(r.id, 'closed')}>
                          Close
                        </Button>
                      </div>
                    </div>
                    {r.notes ? <p className="mt-2 text-sm text-ink">{r.notes}</p> : null}
                    {!r.consent_attested ? (
                      <p className="mt-1 text-sm text-attention-700">
                        Referrer did not attest participant consent — confirm with the participant
                        before any information flows back to the referrer.
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {inIntake.length > 0 ? (
            <Card>
              <CardTitle>In intake — approved, working the checklist ({inIntake.length})</CardTitle>
              <ul className="flex flex-col gap-3">
                {inIntake.map((a) => (
                  <li key={a.id} className="rounded-md border border-line bg-surface-raised p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-ink">
                        {a.person.preferred_name || a.person.first_name} {a.person.last_name}
                      </p>
                      <p className="text-sm text-ink-muted">
                        Approved
                        {a.decided_at ? ` ${new Date(a.decided_at).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    <IntakeChecklist
                      applicationId={a.id}
                      personId={a.person_id}
                      personName={a.person.preferred_name || a.person.first_name}
                      applicationStatus={a.status}
                      onAdmitted={() => void load()}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card>
            <CardTitle>Open ({open.length})</CardTitle>
            {open.length === 0 ? (
              <p className="text-ink-muted">No open applications.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {open.map((a) => (
                  <li key={a.id} className="rounded-md border border-line bg-surface-raised p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-ink">
                          {a.person.preferred_name || a.person.first_name} {a.person.last_name}
                        </p>
                        <p className="text-sm text-ink-muted">
                          {STATUS_LABELS[a.status]} · submitted{' '}
                          {new Date(a.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {a.status === 'submitted' ? (
                          <Button variant="secondary" onClick={() => void decide(a, 'in_review')}>
                            Start review
                          </Button>
                        ) : null}
                        <Button onClick={() => void decide(a, 'approved')}>Approve</Button>
                        <Button variant="secondary" onClick={() => void decide(a, 'waitlisted')}>
                          Waitlist
                        </Button>
                        <Button variant="ghost" onClick={() => void decide(a, 'declined')}>
                          Refer elsewhere
                        </Button>
                      </div>
                    </div>
                    {a.notes ? <p className="mt-2 text-sm text-ink">{a.notes}</p> : null}
                    <button
                      type="button"
                      className="mt-2 text-sm text-experience-700 underline underline-offset-2"
                      onClick={() => setChecklistFor(checklistFor === a.id ? null : a.id)}
                    >
                      {checklistFor === a.id ? 'Hide intake checklist' : 'Intake checklist'}
                    </button>
                    {checklistFor === a.id ? (
                      <IntakeChecklist
                        applicationId={a.id}
                        personId={a.person_id}
                        personName={a.person.preferred_name || a.person.first_name}
                        applicationStatus={a.status}
                        onAdmitted={() => void load()}
                      />
                    ) : null}
                    {a.answers && Object.keys(a.answers).length > 0 ? (
                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer font-medium text-experience-700">
                          Application details
                        </summary>
                        <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                          {Object.entries(a.answers).map(([key, value]) => (
                            <div key={key}>
                              <dt className="font-medium text-ink">
                                {key
                                  .replace(/([A-Z])/g, ' $1')
                                  .replace(/^./, (c) => c.toUpperCase())}
                              </dt>
                              <dd className="text-ink-muted">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {closed.length > 0 ? (
            <Card>
              <CardTitle>Decided</CardTitle>
              <ul className="flex flex-col gap-1">
                {closed.map((a) => (
                  <li
                    key={a.id}
                    className="flex justify-between border-b border-line py-1.5 text-sm"
                  >
                    <span className="text-ink">
                      {a.person.preferred_name || a.person.first_name} {a.person.last_name}
                    </span>
                    <span className="text-ink-muted">
                      {STATUS_LABELS[a.status]}
                      {a.decided_at ? ` · ${new Date(a.decided_at).toLocaleDateString()}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <p className="text-sm text-ink-faint">
            &ldquo;Referred elsewhere&rdquo; is a service, not a rejection — the application policy
            asks us to help every applicant find the right fit, here or somewhere better suited.
          </p>
        </div>
      )}
    </>
  );
}
