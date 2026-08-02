import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { fileGrievance, getMyActiveResidency } from '@recoveryos/data-access';
import { Alert, Button, Card, PageHeader, TextAreaField } from '@recoveryos/ui';

/**
 * Grievance filing: a protected resident right. Plain language, no friction,
 * and a clear statement of what happens next.
 */
export function GrievancePage() {
  const { person } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!person) return;
    const summary = String(new FormData(event.currentTarget).get('summary') ?? '').trim();
    if (summary.length < 10) {
      setFormError('Please tell us a little more so we can respond well.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const residency = await getMyActiveResidency(person.id);
      if (!residency) {
        setFormError('We could not find your active residency.');
        return;
      }
      await fileGrievance({
        residenceId: residency.residence_id,
        personId: person.id,
        summary,
      });
      setSubmitted(true);
    } catch {
      setFormError("We couldn't submit your grievance. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="File a grievance"
        lede="Raising a concern is your right. Doing so will never be held against you."
        crumbs={[
          { to: '/residence/today', label: 'Today' },
          { to: '/residence/house', label: 'My Residence' },
        ]}
      />
      <Card>
        {submitted ? (
          <div className="flex flex-col gap-4">
            <Alert tone="positive">
              Your grievance has been filed. Residence leadership will review it and follow up
              with you directly.
            </Alert>
            <Link
              to="/residence/today"
              className="font-medium text-experience-700 underline underline-offset-2"
            >
              Back to Today
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {formError ? <Alert tone="critical">{formError}</Alert> : null}
            <TextAreaField
              label="What happened, and what would you like to see change?"
              name="summary"
              rows={6}
              hint="Share as much or as little as you're comfortable with. You can also raise concerns with staff in person at any time."
              required
            />
            <Button type="submit" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit grievance'}
            </Button>
          </form>
        )}
      </Card>
    </>
  );
}
