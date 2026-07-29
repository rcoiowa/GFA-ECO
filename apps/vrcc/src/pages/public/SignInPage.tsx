import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { signInSchema } from '@recoveryos/domain';
import { getSupabase } from '@recoveryos/data-access';
import { Alert, Button, Card, TextField } from '@recoveryos/ui';

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const form = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({
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
    const { error } = await getSupabase().auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      setFormError("That email and password didn't match. Please try again.");
      return;
    }
    navigate(location.state?.from ?? '/today', { replace: true });
  }

  return (
    <div className="min-h-dvh bg-surface px-4 py-12">
      <div className="mx-auto max-w-md">
        <Link to="/" className="text-sm text-ink-muted hover:text-ink">
          ← Back to home
        </Link>
        <Card className="mt-4">
          <h1 className="text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-1 text-ink-muted">Sign in to continue your recovery journey.</p>
          {formError ? (
            <div className="mt-4">
              <Alert tone="critical">{formError}</Alert>
            </div>
          ) : null}
          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
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
              autoComplete="current-password"
              required
              error={errors.password}
            />
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-5 text-ink-muted">
            New here?{' '}
            <Link to="/register" className="font-medium text-experience-700 underline underline-offset-2">
              Create your account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
