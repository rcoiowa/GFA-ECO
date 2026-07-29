import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { signInSchema } from '@recoveryos/domain';
import { getSupabase } from '@recoveryos/data-access';
import { Alert, Button, Card, TextField } from '@recoveryos/ui';

export function SignInPage() {
  const navigate = useNavigate();
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
      setFormError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    const { error } = await getSupabase().auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      setFormError("That email and password didn't match. Please try again.");
      return;
    }
    navigate('/today', { replace: true });
  }

  return (
    <div className="min-h-dvh bg-surface px-4 py-12">
      <div className="mx-auto max-w-md">
        <Card>
          <h1 className="text-2xl font-semibold text-ink">Welcome home</h1>
          <p className="mt-1 text-ink-muted">Sign in to your residence space.</p>
          {formError ? (
            <div className="mt-4">
              <Alert tone="critical">{formError}</Alert>
            </div>
          ) : null}
          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
            <TextField label="Email" name="email" type="email" autoComplete="email" required />
            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
