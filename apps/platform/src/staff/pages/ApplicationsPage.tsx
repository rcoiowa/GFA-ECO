import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  decideApplication,
  listApplications,
  listReferrals,
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

const STATUS_LABELS: Record<ApplicationWithPerson['status'], string> = {
  submitted: 'Submitted',
  in_review: 'In review',
  approved: 'Approved',
  waitlisted: 'Waitlisted',
  declined: 'Referred elsewhere',
  withdrawn: 'Withdrawn',
};

/**
 * Applications & waitlist. Approving opens the residency record; the
 * waitlist promise (contact at least every two weeks) lives here.
 */
export function ApplicationsPage() {
  const { person } = useAuth();
  const { residence } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [applications, setApplications] = useState<ApplicationWithPerson[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  const load = useCallback(async () => {
    if (!residence) return;
    setLoading(true);
    setError(false);
    try {
      const [apps, refs] = await Promise.all([
        listApplications(residence.id),
        listReferrals(residence.id),
      ]);
      setApplications(apps);
      setReferrals(refs);
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
      await load();
    } catch {
      setError(true);
    }
  };

  const triageReferral = async (referralId: number, status: Referral['status']) => {
    if (!person) return;
    try {
      await updateReferralStatus({ referralId, status, handledByPersonId: person.id });
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
  const closed = applications.filter(
    (a) => !['submitted', 'in_review', 'waitlisted'].includes(a.status),
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
