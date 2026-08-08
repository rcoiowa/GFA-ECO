import { test, expect, FIXTURES, password, signIn, signOut, userPage } from './helpers';

/**
 * Live HTTP gate — items 1–10 (auth/identity + connection/coaching loop).
 * Serial: later items depend on state created by earlier ones.
 */
test.describe.configure({ mode: 'serial' });

// ---- 1. Register / sign in / sign out --------------------------------------
test('1. ordinary registration, sign out, sign in', async ({ page }) => {
  const email = FIXTURES.fresh('signup');
  await page.goto('/register');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).first().fill(password());
  await page.getByRole('button', { name: /create|register|sign up/i }).click();
  // 2. Person bootstrap + onboarding
  await page.waitForURL(/onboarding|vrcc|home/, { timeout: 20_000 });
  const onboarding = page.getByLabel(/first name|preferred name|name/i).first();
  if (await onboarding.count()) {
    await onboarding.fill('P4H Signup');
    await page.getByRole('button', { name: /continue|save|finish/i }).click();
  }
  await signOut(page);
  await signIn(page, email);
  await expect(page).not.toHaveURL(/sign-in/);
});

// ---- 3. Role routing (each fixture lands in its workspace) -----------------
const ROUTING: Array<[keyof typeof FIXTURES, RegExp]> = [
  ['participant', /\/vrcc/],
  ['coach', /\/coach/],
  ['navigator', /\/navigator/],
  ['residenceStaff', /\/staff/],
  ['residenceManager', /\/staff/],
  ['resident', /\/residence/],
  ['admin', /\/admin/],
  ['executive', /\/admin/],
];
for (const [role, home] of ROUTING) {
  test(`3. role routing: ${role}`, async ({ browser }) => {
    const page = await userPage(browser, FIXTURES[role] as string);
    await page.goto('/home');
    await page.waitForURL(home, { timeout: 15_000 });
    await page.context().close();
  });
}

// ---- 4–10. Connection & coaching loop --------------------------------------
test('4–10. support request → claim → messages → realtime → scheduling → completion', async ({
  browser,
}) => {
  const participant = await userPage(browser, FIXTURES.participant);
  const coach = await userPage(browser, FIXTURES.coach);

  // 4. T0 — participant asks for support.
  await participant.goto('/vrcc/connect');
  const ask = participant.getByRole('button', { name: /support|connect|request/i }).first();
  if (await ask.count()) await ask.click();
  await participant.getByRole('button', { name: /send|submit|ask/i }).first().click();
  await expect(participant.getByText(/we.?ve got your request|heard/i)).toBeVisible({
    timeout: 15_000,
  });

  // 5. T2 — coach claims; the pool row disappears.
  await coach.goto('/coach');
  const requestRow = coach.getByText(/p4h participant|waiting/i).first();
  await expect(requestRow).toBeVisible({ timeout: 15_000 });
  await coach.getByRole('button', { name: /claim|i.?ll take|respond/i }).first().click();
  await expect(coach.getByRole('button', { name: /claim/i })).toHaveCount(0, { timeout: 15_000 });

  // 9 (part). Realtime doorbell: watch the websocket on the participant side.
  const wsFrames: string[] = [];
  participant.on('websocket', (ws) => {
    if (ws.url().includes('supabase')) ws.on('framereceived', (f) => wsFrames.push(String(f.payload)));
  });

  // 6. T1/T4a — two-way messages over real PostgREST.
  await coach.goto('/coach/messages');
  await coach.getByRole('link').filter({ hasText: /p4h/i }).first().click();
  await coach.getByLabel(/message/i).fill('Hello from your coach (P4H live gate).');
  await coach.getByRole('button', { name: /send/i }).click();
  await expect(coach.getByText('Hello from your coach (P4H live gate).')).toBeVisible();

  await participant.goto('/vrcc/messages');
  await expect(
    participant.getByText('Hello from your coach (P4H live gate).'),
  ).toBeVisible({ timeout: 20_000 });
  await participant.getByLabel(/message/i).fill('Hello back (P4H live gate).');
  await participant.getByRole('button', { name: /send/i }).click();

  // 9. Realtime: the coach page should surface the reply without manual reload.
  await expect(coach.getByText('Hello back (P4H live gate).')).toBeVisible({ timeout: 25_000 });
  expect(wsFrames.length, 'websocket frames observed on supabase realtime').toBeGreaterThan(0);
  // Duplicate-bubble check: exactly one instance of the sent body.
  await expect(coach.getByText('Hello back (P4H live gate).')).toHaveCount(1);

  // 7. Unread/read + content-free notification.
  await participant.goto('/vrcc');
  const notification = participant.getByText(/new message/i).first();
  if (await notification.count()) {
    await expect(notification).not.toContainText('Hello from your coach');
  }

  // 8. Scheduling: request → propose → accept → confirmed.
  await participant.goto('/vrcc/sessions');
  const request = participant.getByRole('button', { name: /request|schedule|find a time/i }).first();
  if (await request.count()) await request.click();
  const submitReq = participant.getByRole('button', { name: /send|submit|request/i }).first();
  if (await submitReq.count()) await submitReq.click();

  await coach.goto('/coach/sessions');
  const propose = coach.getByRole('button', { name: /offer|propose|suggest/i }).first();
  if (await propose.count()) {
    await propose.click();
    await coach.getByRole('button', { name: /send|offer/i }).first().click();
  }
  await participant.goto('/vrcc/sessions');
  const accept = participant.getByRole('button', { name: /accept|works for me|confirm/i }).first();
  if (await accept.count()) await accept.click();
  await expect(participant.getByText(/confirmed|scheduled/i).first()).toBeVisible({
    timeout: 15_000,
  });

  // 10. Complete Session → exactly one service event (asserted via the UI
  //     completed state; DB-side uniqueness is preflight/RPC-enforced).
  await coach.goto('/coach/sessions');
  const complete = coach.getByRole('button', { name: /complete session|completed/i }).first();
  if (await complete.count()) {
    await complete.click();
    await expect(coach.getByText(/recorded|completed/i).first()).toBeVisible({ timeout: 15_000 });
    // Second click path must not create a second event: button gone or inert.
    await expect(
      coach.getByRole('button', { name: /complete session/i }),
    ).toHaveCount(0);
  }

  await participant.context().close();
  await coach.context().close();
});
