import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { updatePassword, useAuth } from '@recoveryos/auth';
import { Alert, Button, Card, CardTitle, LoadingState, TextField } from '@recoveryos/ui';

/**
 * Set a new password after following the reset email link. Supabase's
 * detectSessionInUrl turns the recovery token in the URL into a temporary
 * session (a PASSWORD_RECOVERY auth event), so by the time auth is `ready`
 * there is a session we can call updateUser against. No RequireAuth wrapper:
 * that would bounce the recovery arrival to /sign-in before the token is read.
 */
export function ResetPasswordPage() {
  const { ready, session } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirm = String(form.get('confirm') ?? '');
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Those two passwords don’t match.');
      return;
    }
    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    if (result) {
      setError(result);
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4">
      <Card>
        <CardTitle>Choose a new password</CardTitle>

        {!ready ? (
          <div className="mt-3">
            <LoadingState label="Checking your reset link…" />
          </div>
        ) : done ? (
          <div className="mt-3 space-y-4">
            <Alert tone="positive">Your password is updated. You’re signed in.</Alert>
            <Button onClick={() => navigate('/home', { replace: true })}>Continue</Button>
          </div>
        ) : !session ? (
          <div className="mt-3 space-y-3">
            <Alert tone="critical">
              This reset link is invalid or has expired. Request a new one and it’ll arrive within a
              few minutes.
            </Alert>
            <Link className="text-experience-700 underline underline-offset-2" to="/forgot-password">
              Send a new reset link
            </Link>
          </div>
        ) : (
          <form className="mt-3 space-y-4" onSubmit={onSubmit} noValidate>
            {error ? <Alert tone="critical">{error}</Alert> : null}
            <TextField
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters."
              required
            />
            <TextField
              label="Confirm new password"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
            />
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save new password'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
