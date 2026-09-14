import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { registrationSchema } from '@recoveryos/domain';
import { getSupabase } from '@recoveryos/data-access';
import { Alert, Button, Card, TextField } from '@recoveryos/ui';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Where to land after account setup (e.g. back to a residence application).
  const next = searchParams.get('next');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const form = new FormData(event.currentTarget);
    const parsed = registrationSchema.safeParse({
      firstName: form.get('firstName'),
      lastName: form.get('lastName'),
      email: form.get('email'),
      password: form.get('password'),
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await getSupabase().auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
        },
      },
    });
    setBusy(false);
    if (error) {
      setFormError(
        "We couldn't create your account. If you already have one, try signing in instead.",
      );
      return;
    }
    navigate(next ? `/onboarding?next=${encodeURIComponent(next)}` : '/onboarding');
  }

  return (
    <div className="min-h-dvh bg-surface px-4 py-12">
      <div className="mx-auto max-w-md">
        <Link to="/" className="text-sm text-ink-muted hover:text-ink">
          ← Back to home
        </Link>
        <Card className="mt-4">
          <h1 className="text-2xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1 text-ink-muted">
            Free, private, and yours. This takes about two minutes.
          </p>
          {formError ? (
            <div className="mt-4">
              <Alert tone="critical">{formError}</Alert>
            </div>
          ) : null}
          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
            <TextField
              label="First name"
              name="firstName"
              autoComplete="given-name"
              required
              error={errors.firstName}
            />
            <TextField
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              required
              error={errors.lastName}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              error={errors.email}
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              hint="At least 10 characters. A short phrase works well."
              required
              error={errors.password}
            />
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? 'Creating your account…' : 'Create account'}
            </Button>
          </form>
          <p className="mt-5 text-ink-muted">
            Already have an account?{' '}
            <Link
              to="/sign-in"
              className="font-medium text-experience-700 underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
