import { test, expect, FIXTURES, registerUser, signIn, signOut } from './helpers';

/**
 * Live HTTP gate — items 1–2 in isolation: the REAL signup path. Kept in its
 * own file so a signup-posture problem (e.g. signups disabled on the
 * project) never skips the rest of the gate.
 */
test.describe.configure({ mode: 'serial' });

// ---- 1–2. Register (real signup + person bootstrap), sign out, sign in ----
test('1–2. ordinary registration, bootstrap, sign out, sign in', async ({ page }) => {
  const email = FIXTURES.fresh('signup');
  await registerUser(page, email);
  await signOut(page);
  await signIn(page, email);
  await expect(page).not.toHaveURL(/sign-in/);
});

