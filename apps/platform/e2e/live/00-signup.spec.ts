import {
  test,
  expect,
  FIXTURES,
  registerUser,
  classifyAsFixture,
  signIn,
  signOut,
  EmailRateLimited,
} from './helpers';

/**
 * Live HTTP gate — items 1–2 in isolation: the REAL signup path. Kept in its
 * own file so a signup-posture problem never skips the rest of the gate.
 *
 * Known posture finding (run 31284820851): email confirmations are enabled
 * and the project still uses Supabase's DEFAULT SMTP (~2 emails/hour), so
 * signup returns 429 over_email_send_rate_limit under any real load. That is
 * a soft-launch blocker in its own right (real participants would hit it);
 * remedy is a production SMTP provider or a deliberate confirmation-off
 * decision. When the budget is exhausted this test reports BLOCKED rather
 * than pretending to verify.
 */
test.describe.configure({ mode: 'serial' });

test('1–2. ordinary registration, bootstrap, sign out, sign in', async ({ page }, testInfo) => {
  const email = FIXTURES.fresh('signup');
  try {
    await registerUser(page, email);
  } catch (err) {
    if (err instanceof EmailRateLimited) {
      testInfo.skip(
        true,
        'BLOCKED — auth email budget exhausted (default SMTP ~2/hr): configure production SMTP or disable confirmations, then rerun',
      );
      return;
    }
    throw err;
  }
  await classifyAsFixture(email);
  await signOut(page);
  await signIn(page, email);
  await expect(page).not.toHaveURL(/sign-in/);
});
