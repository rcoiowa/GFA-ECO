import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import {
  ensureMyPerson,
  getMyLatestApplication,
  getResidenceByName,
  submitResidenceApplication,
  type MyApplication,
} from '@recoveryos/data-access';
import { Alert, Button, Card, CardTitle, TextAreaField, TextField } from '@recoveryos/ui';

const RESIDENCE_NAME = 'Grace House';
const APPLY_PATH = '/recovery-residences/grace-house/apply';

/**
 * Grace House online application. Reviewing the house documents comes first,
 * the application second; submitting creates the applicant's resident record
 * under Grace House and lands in the staff queue (accept → waitlist or bed).
 * The same intake also runs from the Grace House site through the API
 * gateway (workers/api) — this page is the in-platform path.
 */
export function ResidenceApplyPage() {
  const { session, person, refreshIdentity } = useAuth();
  const navigate = useNavigate();
  const [existing, setExisting] = useState<MyApplication | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!person) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const app = await getMyLatestApplication(person.id);
        if (!cancelled && app && app.residence.name === RESIDENCE_NAME) {
          if (['submitted', 'in_review', 'waitlisted', 'approved'].includes(app.status)) {
            setExisting(app);
          }
        }
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [person]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const form = new FormData(event.currentTarget);
    const firstName = String(form.get('firstName') ?? '').trim();
    const lastName = String(form.get('lastName') ?? '').trim();
    if (!firstName || !lastName) {
      setFormError('Please tell us your first and last name.');
      return;
    }
    if (!form.get('agreeDocuments') || !form.get('attestTruthful')) {
      setFormError('Please confirm the two agreements at the bottom of the application.');
      return;
    }
    setBusy(true);
    try {
      const me = person ?? (await ensureMyPerson({ firstName, lastName }));
      const residence = await getResidenceByName(RESIDENCE_NAME);
      if (!residence) {
        setFormError(
          "We couldn't reach the application system. Please call 515-220-8771 and we'll take your application by phone.",
        );
        return;
      }
      const answers: Record<string, string> = {};
      for (const key of [
        'phone',
        'dateOfBirth',
        'currentCity',
        'currentSituation',
        'recoveryPathway',
        'matStatus',
        'legalStatus',
        'emergencyContactName',
        'emergencyContactPhone',
        'anythingElse',
      ]) {
        const value = String(form.get(key) ?? '').trim();
        if (value) answers[key] = value;
      }
      answers.applicantName = `${firstName} ${lastName}`;
      answers.agreedToDocuments = 'yes';
      answers.attestedTruthful = 'yes';
      answers.source = 'vrcc.app';
      await submitResidenceApplication({
        personId: me.id,
        residenceId: residence.id,
        answers,
      });
      if (!person) await refreshIdentity();
      setSubmitted(true);
      window.scrollTo({ top: 0 });
    } catch {
      setFormError(
        'Something went wrong submitting your application. Nothing is lost — please try again, or call 515-220-8771.',
      );
    } finally {
      setBusy(false);
    }
  }

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
            {!session ? (
              <Link
                to="/sign-in"
                state={{ from: APPLY_PATH }}
                className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
              >
                Sign in
              </Link>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-muted">
          <Link to="/recovery-residences" className="hover:text-experience-700 hover:underline">
            Recovery residences
          </Link>
          <span aria-hidden> / </span>
          <Link
            to="/recovery-residences/grace-house"
            className="hover:text-experience-700 hover:underline"
          >
            Grace House
          </Link>
          <span aria-hidden> / </span>
          <span aria-current="page" className="text-ink">
            Apply
          </span>
        </nav>

        {submitted ? (
          <Card>
            <CardTitle>Your application is in — welcome.</CardTitle>
            <p className="mt-2 text-ink">
              Grace House staff have your application and will contact you within{' '}
              <strong>2 business days</strong>. When there&rsquo;s an opening you&rsquo;ll be
              offered a bed; if the house is full you&rsquo;ll be added to the waitlist and hear
              from us at least every two weeks.
            </p>
            <p className="mt-3 text-ink">
              While you wait, the VRCC — our free virtual recovery community center — is already
              yours: coaching, peer support, and resource navigation, starting today.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/vrcc/today')}>
                Check out the VRCC
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/recovery-residences/my-application')}
              >
                Follow my application
              </Button>
            </div>
          </Card>
        ) : existing ? (
          <Card>
            <CardTitle>You already have an application with Grace House</CardTitle>
            <p className="mt-2 text-ink">
              Its current status is <strong>{existing.status.replace('_', ' ')}</strong>. Staff keep
              every applicant posted — check your status any time.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => navigate('/recovery-residences/my-application')}>
                See my application status
              </Button>
              <Button variant="secondary" onClick={() => navigate('/vrcc/today')}>
                Go to the VRCC
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <h1 className="text-3xl font-semibold text-ink">Apply to Grace House</h1>
            <p className="mt-2 text-lg text-ink-muted">
              A women&rsquo;s recovery residence in Des Moines. Applying is free, takes about ten
              minutes, and is not a commitment — it starts a conversation.
            </p>

            <section
              aria-labelledby="apply-docs"
              className="mt-8 rounded-lg bg-experience-soft p-5"
            >
              <h2 id="apply-docs" className="font-semibold text-experience-700">
                Step 1 — Read the documents and house rules
              </h2>
              <p className="mt-2 text-ink">
                Before applying, please read the full document set on the Grace House site — the
                Participant Agreement, Code of Conduct, Resident Handbook, Fee Schedule &amp;
                Financial Agreement, and Screening Policy &amp; Consent. You&rsquo;ll sign them at
                move-in; reading them now means no surprises later.
              </p>
              <a
                href="https://gracehouse4.pages.dev/"
                className="mt-3 inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-700"
              >
                Open the Grace House documents
              </a>
            </section>

            <section aria-labelledby="apply-form" className="mt-8">
              <h2 id="apply-form" className="text-xl font-semibold text-ink">
                Step 2 — The application
              </h2>

              {!session ? (
                <Card className="mt-4">
                  <p className="text-ink">
                    Applying creates your resident account, so staff can reach you and you can
                    follow your application. Create a free account (about two minutes) or sign in —
                    you&rsquo;ll come right back here.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      onClick={() => navigate(`/register?next=${encodeURIComponent(APPLY_PATH)}`)}
                    >
                      Create my account
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/sign-in', { state: { from: APPLY_PATH } })}
                    >
                      I already have an account
                    </Button>
                  </div>
                </Card>
              ) : !checked ? null : (
                <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4" noValidate>
                  {formError ? <Alert tone="critical">{formError}</Alert> : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="First name"
                      name="firstName"
                      autoComplete="given-name"
                      defaultValue={person?.first_name ?? ''}
                      required
                    />
                    <TextField
                      label="Last name"
                      name="lastName"
                      autoComplete="family-name"
                      defaultValue={person?.last_name ?? ''}
                      required
                    />
                  </div>
                  <TextField
                    label="Phone number"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    hint="The best number for staff to reach you at."
                  />
                  <TextField label="Date of birth" name="dateOfBirth" type="date" />
                  <TextField
                    label="Where are you now?"
                    name="currentCity"
                    hint="City, facility, or program — wherever you'd be coming from."
                  />
                  <TextAreaField
                    label="Your current situation"
                    name="currentSituation"
                    hint="Housing, treatment, work — whatever feels important for us to know."
                  />
                  <TextAreaField
                    label="Your recovery"
                    name="recoveryPathway"
                    hint="Your pathway, how long you've been building it, what support looks like for you. Every pathway is honored."
                  />
                  <TextField
                    label="Medication for recovery (MAT/MOUD)"
                    name="matStatus"
                    hint="Grace House is MAT/MOUD-affirming — this never disqualifies you."
                  />
                  <TextField
                    label="Anything legal we should know about?"
                    name="legalStatus"
                    hint="Probation, parole, or upcoming dates. This helps us plan with you, not screen you out."
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Emergency contact name" name="emergencyContactName" />
                    <TextField
                      label="Emergency contact phone"
                      name="emergencyContactPhone"
                      type="tel"
                    />
                  </div>
                  <TextAreaField label="Anything else you want us to know?" name="anythingElse" />

                  <label className="flex items-start gap-3 text-ink">
                    <input
                      type="checkbox"
                      name="agreeDocuments"
                      className="mt-1.5 size-4"
                      required
                    />
                    <span>
                      I&rsquo;ve read the Grace House documents and rules (or will before move-in),
                      including the fee schedule — shared room $175/week, private room $200/week.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 text-ink">
                    <input
                      type="checkbox"
                      name="attestTruthful"
                      className="mt-1.5 size-4"
                      required
                    />
                    <span>Everything in this application is true to the best of my knowledge.</span>
                  </label>

                  <Button type="submit" size="lg" disabled={busy}>
                    {busy ? 'Submitting your application…' : 'Submit my application'}
                  </Button>
                  <p className="text-sm text-ink-muted">
                    Your application goes only to Grace House staff. It is never shared without your
                    consent, and applying never affects your access to the VRCC.
                  </p>
                </form>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-line py-6">
        <p className="mx-auto max-w-4xl px-4 text-sm text-ink-muted">
          Grace For Addictions · No shame. No stigma. Just grace. · In immediate danger, call 911.
          For crisis support, call or text 988.
        </p>
      </footer>
    </div>
  );
}
