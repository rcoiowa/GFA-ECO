import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { requestPasswordReset } from '@recoveryos/auth';
import { Alert, Button, Card, CardTitle, TextField } from '@recoveryos/ui';

/**
 * Password reset request. Sends the Supabase auth reset email (account mail,
 * not notification fanout). Always confirms without revealing whether the
 * address has an account.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter the email you signed up with.');
      return;
    }
    setBusy(true);
    setError(null);
    await requestPasswordReset(email.trim(), `${window.location.origin}/sign-in`);
    // Deliberately identical outcome whether or not the account exists.
    setBusy(false);
    setSent(true);
  }

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4">
      <Card>
        <CardTitle>Reset your password</CardTitle>
        {sent ? (
          <div className="mt-3 space-y-3">
            <Alert tone="positive">
              If an account exists for {email.trim()}, a reset link is on its way. Check your
              email.
            </Alert>
            <Link className="text-experience-700 underline underline-offset-2" to="/sign-in">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form className="mt-3 space-y-4" onSubmit={onSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error ?? undefined}
            />
            <Button type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </Button>
            <p className="text-sm text-ink-muted">
              Remembered it?{' '}
              <Link className="text-experience-700 underline underline-offset-2" to="/sign-in">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
