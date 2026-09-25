import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { submitResidenceApplicationIntake } from '@recoveryos/data-access';
import { Alert, Button, Card, CardTitle, TextAreaField, TextField } from '@recoveryos/ui';
import { TURNSTILE_SITE_KEY, TurnstileWidget } from './TurnstileWidget';

const EJWRH_RESIDENCE_ID = 2;

export function EJWRHApplyPage() {
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const form = new FormData(event.currentTarget);
    const applicantName = String(form.get('applicantName') ?? '').trim();
    const applicantPhone = String(form.get('applicantPhone') ?? '').trim();
    const applicantEmail = String(form.get('applicantEmail') ?? '').trim();

    if (!applicantName) {
      setFormError('Please tell us your name.');
      return;
    }
    if (!applicantPhone && !applicantEmail) {
      setFormError('Please provide a phone number or email so the intake team can reach you.');
      return;
    }
    if (!form.get('age18') || !form.get('consentToContact')) {
      setFormError('Please confirm that you are 18 or older and agree to be contacted.');
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setFormError('Please complete the security check above the submit button.');
      return;
    }

    const answers: Record<string, string> = { age_18_plus: 'yes' };
    for (const key of [
      'voicemail_ok',
      'county',
      'timing',
      'housing_situation',
      'why_ejwrh',
      'accommodation_needs',
    ]) {
      const value = String(form.get(key) ?? '').trim();
      if (value) answers[key] = value;
    }

    setBusy(true);
    try {
      await submitResidenceApplicationIntake({
        residenceId: EJWRH_RESIDENCE_ID,
        applicantName,
        applicantPhone: applicantPhone || undefined,
        applicantEmail: applicantEmail || undefined,
        preferredContact: String(form.get('preferredContact') ?? 'phone'),
        referralSource: String(form.get('referralSource') ?? '').trim() || undefined,
        consentToContact: true,
        turnstileToken: turnstileToken ?? undefined,
        companyWebsite: String(form.get('companyWebsite') ?? ''),
        source: 'recoveryos-ejwrh',
        answers,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0 });
    } catch {
      setFormError(
        "We couldn't send the application just now. Nothing is lost—please try again, call 515-220-8771, or email ejwrh@rcoiowa.org.",
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
            RecoveryOS
          </Link>
          <Link
            to="/recovery-residences"
            className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
          >
            Housing
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-muted">
          <Link to="/recovery-residences" className="hover:text-experience-700 hover:underline">
            Recovery residences
          </Link>
          <span aria-hidden> / </span>
          <Link
            to="/recovery-residences/ejwrh"
            className="hover:text-experience-700 hover:underline"
          >
            EJWRH
          </Link>
          <span aria-hidden> / </span>
          <span aria-current="page" className="text-ink">
            Apply
          </span>
        </nav>

        {submitted ? (
          <Card>
            <CardTitle>Your application is on its way.</CardTitle>
            <p className="mt-2 text-ink">
              Thank you. A member of the EJWRH intake team will contact you using the method you
              selected. If the residence may be a fit, intake happens with staff, at your pace,
              before move-in.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/community-center"
                className="inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white"
              >
                Visit the Recovery Community Center
              </Link>
              <a
                href="tel:15152208771"
                className="inline-flex min-h-11 items-center rounded-md border border-experience-600 px-5 font-semibold text-experience-700"
              >
                Call 515-220-8771
              </a>
            </div>
          </Card>
        ) : (
          <>
            <p className="font-semibold text-experience-700">Grace For Addictions support</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">Apply to EJWRH</h1>
            <p className="mt-3 text-lg text-ink-muted">
              Apply to Ernest &amp; Johnnie White Recovery House. This takes only a few minutes,
              collects what the team needs to start a conversation, and does not require an account.
              Nothing is signed today.
            </p>

            <section className="mt-7 rounded-lg bg-experience-soft p-5">
              <h2 className="font-semibold text-experience-700">Another way is always available</h2>
              <p className="mt-2 text-ink">
                Apply by phone at{' '}
                <a href="tel:15152208771" className="underline">
                  515-220-8771
                </a>{' '}
                or email{' '}
                <a href="mailto:ejwrh@rcoiowa.org" className="underline">
                  ejwrh@rcoiowa.org
                </a>
                . Choosing phone or email does not affect eligibility or place in line.
              </p>
            </section>

            <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
              {formError ? <Alert tone="critical">{formError}</Alert> : null}
              <div className="absolute left-[-5000px]" aria-hidden="true">
                <label htmlFor="companyWebsite">Company website</label>
                <input id="companyWebsite" name="companyWebsite" tabIndex={-1} autoComplete="off" />
              </div>
              <TextField label="Your name" name="applicantName" autoComplete="name" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Phone number"
                  name="applicantPhone"
                  type="tel"
                  autoComplete="tel"
                  hint="Phone or email is required."
                />
                <TextField
                  label="Email"
                  name="applicantEmail"
                  type="email"
                  autoComplete="email"
                  hint="Phone or email is required."
                />
              </div>

              <label className="flex flex-col text-sm font-medium text-ink">
                Best way to reach you
                <select
                  name="preferredContact"
                  className="mt-1 min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base text-ink"
                  defaultValue="phone"
                >
                  <option value="phone">Call me</option>
                  <option value="text">Text me</option>
                  <option value="email">Email me</option>
                </select>
              </label>
              <label className="flex flex-col text-sm font-medium text-ink">
                Is it safe to leave a voicemail or text?
                <select
                  name="voicemail_ok"
                  className="mt-1 min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base text-ink"
                  defaultValue=""
                >
                  <option value="">Prefer not to say</option>
                  <option value="yes">Yes</option>
                  <option value="no">No—speak with me directly</option>
                </select>
              </label>

              <label className="flex items-start gap-3 text-ink">
                <input type="checkbox" name="age18" className="mt-1.5 size-4" required />
                <span>I am 18 or older.</span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="County you are in now" name="county" />
                <label className="flex flex-col text-sm font-medium text-ink">
                  When are you hoping to move in?
                  <select
                    name="timing"
                    className="mt-1 min-h-11 rounded-md border border-line bg-surface-raised px-3 text-base text-ink"
                    defaultValue=""
                  >
                    <option value="">Not sure yet</option>
                    <option value="now">As soon as possible</option>
                    <option value="soon">In the next month or so</option>
                    <option value="exploring">Just exploring</option>
                  </select>
                </label>
              </div>

              <TextField
                label="Your housing situation right now"
                name="housing_situation"
                hint="Optional—a short answer is enough."
              />
              <TextAreaField
                label="Anything you would like us to know about why EJWRH?"
                name="why_ejwrh"
                hint="Optional. Please do not include medical records or other documents."
              />
              <TextField
                label="Accessibility or accommodation needs"
                name="accommodation_needs"
                hint="Optional and high-level; details can wait for intake."
              />
              <TextField label="How did you hear about us?" name="referralSource" />

              <label className="flex items-start gap-3 text-ink">
                <input type="checkbox" name="consentToContact" className="mt-1.5 size-4" required />
                <span>
                  I agree that Grace For Addictions may process this application and contact me
                  about EJWRH using the method I selected.
                </span>
              </label>

              <TurnstileWidget action="residence_application" onToken={setTurnstileToken} />

              <Button type="submit" size="lg" disabled={busy}>
                {busy ? 'Sending your application…' : 'Send my application'}
              </Button>
              <p className="text-sm text-ink-muted">
                Your information is limited to people authorized to support the intake process.
                Applying does not create an account and does not commit you to move in.
              </p>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
