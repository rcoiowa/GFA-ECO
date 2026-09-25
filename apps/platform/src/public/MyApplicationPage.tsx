import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { Residency } from '@recoveryos/domain';
import { useAuth } from '@recoveryos/auth';
import {
  getMyLatestApplication,
  getMyResidencyAt,
  withdrawMyApplication,
  type MyApplication,
} from '@recoveryos/data-access';
import { Alert, Button, Card, CardTitle, ErrorState, LoadingState } from '@recoveryos/ui';

/**
 * Applicant-facing status for a residence application: submitted → review →
 * waitlist or bed. Whatever the stage, the VRCC is open now — the flow ends
 * by inviting the applicant into VRCC onboarding.
 */
export function MyApplicationPage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [application, setApplication] = useState<MyApplication | null>(null);
  const [residency, setResidency] = useState<Residency | null>(null);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const withdraw = async () => {
    if (!application) return;
    setWithdrawError(null);
    try {
      await withdrawMyApplication(application.id);
      setApplication({ ...application, status: 'withdrawn' });
      setConfirmingWithdraw(false);
    } catch (e) {
      setWithdrawError(e instanceof Error ? e.message : 'We couldn’t withdraw it just now.');
    }
  };

  useEffect(() => {
    if (!person) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const app = await getMyLatestApplication(person.id);
        if (cancelled) return;
        setApplication(app);
        if (app && app.status === 'approved') {
          const res = await getMyResidencyAt({
            personId: person.id,
            residenceId: app.residence_id,
          });
          if (!cancelled) setResidency(res);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [person]);

  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line bg-surface-raised">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-semibold text-experience-700">
            VRCC
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/recovery-residences"
              className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
            >
              Residence
            </Link>
            <Link
              to="/app/today"
              className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
            >
              Center
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-semibold text-ink">My residence application</h1>

        {loading ? (
          <div className="mt-6">
            <LoadingState />
          </div>
        ) : error ? (
          <div className="mt-6">
            <ErrorState />
          </div>
        ) : !application ? (
          <Card className="mt-6">
            <p className="text-ink">
              No housing application is linked to this account yet. If you already submitted one,
              please do not apply again. Call 515-220-8771 with your application reference so staff
              can verify your identity and connect it. Your application can be reviewed while
              account linking is pending.
            </p>
            <Link
              to="/recovery-residences"
              className="mt-4 inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-strong"
            >
              See recovery housing options
            </Link>
          </Card>
        ) : (
          <>
            <Card className="mt-6">
              <CardTitle>{application.residence.name}</CardTitle>
              <p className="mt-1 text-sm text-ink-muted">
                Applied {new Date(application.submitted_at).toLocaleDateString()}
              </p>

              {application.status === 'submitted' || application.status === 'in_review' ? (
                <p className="mt-3 text-ink">
                  <strong>Your application is with staff.</strong> A real person reads every
                  application, and someone will contact you about yours. Nothing else is needed from
                  you right now.
                </p>
              ) : application.status === 'waitlisted' ? (
                <p className="mt-3 text-ink">
                  <strong>You&rsquo;re on the waitlist for a bed.</strong> Staff will stay in touch
                  with you while you wait, and the moment a bed opens you&rsquo;ll be first to know.
                  Staying reachable at your application phone number helps.
                </p>
              ) : application.status === 'approved' ? (
                <p className="mt-3 text-ink">
                  <strong>You&rsquo;ve been accepted — welcome.</strong>{' '}
                  {residency?.bed_assignment_id
                    ? 'Your bed is ready. Staff will confirm your move-in day and walk you through the move-in signature set.'
                    : 'Staff will contact you about your bed and move-in day.'}
                </p>
              ) : application.status === 'declined' ? (
                <p className="mt-3 text-ink">
                  <strong>{application.residence.name} wasn&rsquo;t the right fit this time</strong>{' '}
                  — and staff will help you find a residence that is. &ldquo;Referred
                  elsewhere&rdquo; is a service, not a rejection. The statewide directory is a good
                  next step, and a VRCC navigator can make calls with you.
                </p>
              ) : (
                <p className="mt-3 text-ink">This application was withdrawn.</p>
              )}

              {application.status === 'declined' ? (
                <Link
                  to="/recovery-residences"
                  className="mt-4 inline-block font-medium text-experience-700 underline underline-offset-2"
                >
                  Browse recovery housing across Iowa
                </Link>
              ) : null}

              {['submitted', 'in_review', 'waitlisted'].includes(application.status) ? (
                <div className="mt-4 border-t border-line pt-3">
                  {withdrawError ? (
                    <div className="mb-2">
                      <Alert tone="critical">{withdrawError}</Alert>
                    </div>
                  ) : null}
                  {confirmingWithdraw ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-ink-muted">
                        Withdraw this application? You can always apply again — the door stays open.
                      </p>
                      <Button variant="secondary" size="md" onClick={() => void withdraw()}>
                        Yes, withdraw it
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => setConfirmingWithdraw(false)}
                      >
                        Keep my application
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingWithdraw(true)}
                      className="text-sm text-ink-muted underline underline-offset-2 hover:text-ink"
                    >
                      Withdraw my application
                    </button>
                  )}
                </div>
              ) : null}
            </Card>

            <Card className="mt-4">
              <CardTitle>
                {application.status === 'approved'
                  ? 'Next step: complete your VRCC onboarding'
                  : 'Meanwhile, the VRCC is already yours'}
              </CardTitle>
              <p className="mt-2 text-ink">
                {application.status === 'approved'
                  ? 'Your RecoveryOS account also gives you access to the VRCC — coaching, peer community, and recovery tools. Completing onboarding now means your support is in place before move-in day.'
                  : 'Free coaching, peer support, recovery circles, and resource navigation — no residence stay required, starting today.'}
              </p>
              <Link
                to="/app/today"
                className="mt-4 inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-strong"
              >
                {application.status === 'approved'
                  ? 'Complete VRCC onboarding'
                  : 'Check out the VRCC'}
              </Link>
            </Card>
          </>
        )}
      </main>

      <footer className="border-t border-line py-6">
        <p className="mx-auto max-w-4xl px-4 text-sm text-ink-muted">
          Grace For Addictions · Connection prevents crisis · In immediate danger, call 911. For
          crisis support, call or text 988.
        </p>
      </footer>
    </div>
  );
}
