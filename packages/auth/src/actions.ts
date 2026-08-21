import { getSupabase } from '@recoveryos/data-access';

/**
 * Auth actions — the single wrapped surface for credential flows so pages never
 * reach for the raw Supabase client. Returns a user-safe error message (never a
 * raw GoTrue error) or null on success.
 */

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'That email and password don’t match. Try again.';
  if (m.includes('email not confirmed'))
    return 'Check your email for a confirmation link, then sign in.';
  if (m.includes('user already registered')) return 'An account with this email already exists. Try signing in.';
  if (m.includes('rate limit')) return 'Too many attempts — give it a minute and try again.';
  return 'Something didn’t work. Please try again.';
}

export async function signInWithPassword(email: string, password: string): Promise<string | null> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  return error ? friendly(error.message) : null;
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ error: string | null; needsEmailConfirmation: boolean }> {
  const { data, error } = await getSupabase().auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { first_name: input.firstName, last_name: input.lastName } },
  });
  if (error) return { error: friendly(error.message), needsEmailConfirmation: false };
  return { error: null, needsEmailConfirmation: !data.session };
}

/** Sends the password-reset email (Supabase auth mail — not notification fanout). */
export async function requestPasswordReset(email: string, redirectTo: string): Promise<string | null> {
  const { error } = await getSupabase().auth.resetPasswordForEmail(email, { redirectTo });
  return error ? friendly(error.message) : null;
}

export async function updatePassword(newPassword: string): Promise<string | null> {
  const { error } = await getSupabase().auth.updateUser({ password: newPassword });
  return error ? friendly(error.message) : null;
}
