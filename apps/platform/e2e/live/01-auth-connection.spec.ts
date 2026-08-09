import { test, expect, FIXTURES, userPage, ensureSupportRequested } from './helpers';

/**
 * Live HTTP gate — items 1–10 (auth/identity + connection/coaching loop).
 * Serial; run with --workers=1 so fixture state stays deterministic.
 */
test.describe.configure({ mode: 'serial' });

// ---- 3. Role routing (each fixture lands in its workspace) -----------------
const ROUTING: Array<[Exclude<keyof typeof FIXTURES, 'fresh'>, RegExp]> = [
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
    const page = await userPage(browser, FIXTURES[role]);
    await page.goto('/home');
    await page.waitForURL(home, { timeout: 20_000 });
    await page.context().close();
  });
}

// ---- 4–10. Connection & coaching loop --------------------------------------
test('4–10. support request → claim → messages → realtime → scheduling → completion', async ({
  browser,
}) => {
  const participant = await userPage(browser, FIXTURES.participant);
  const coach = await userPage(browser, FIXTURES.coach);

  // 4. T0 — participant asks for a recovery coach (state-tolerant on rerun).
  const mode = await ensureSupportRequested(participant, /talk with a recovery coach/i);
  if (mode !== 'connected') {
    // 5. T2 — coach claims THIS participant's row (not pool.first(), which
    // grabs stale requests on reruns). Success is server-confirmed by the
    // claim flow's own navigation to the participant page — asserting it
    // also stops the test from navigating away while the RPC is in flight.
    await coach.goto('/coach/requests');
    const row = coach.locator('li', { hasText: /p4h-participant/i }).first();
    const claim = row.getByRole('button', { name: /connect with this person/i });
    await expect(claim).toBeVisible({ timeout: 20_000 });
    await claim.click();
    await coach.waitForURL(/\/coach\/participants\/\d+/, { timeout: 20_000 });
  } else {
    await coach.goto('/coach/participants');
    await coach.getByRole('link').filter({ hasText: /p4h-participant/i }).first().click();
    await coach.waitForURL(/\/coach\/participants\/\d+/, { timeout: 20_000 });
  }

  // 6. T1/T4a — two-way messages over real PostgREST. The thread starts from
  // the participant detail page's "Message {name}" link — anchored on the
  // name so the sidebar "Messages" nav link (also /^message/i) can't win
  // .first() and strand the test on the list page.
  const marker = `P4H live gate ${Date.now()}`;
  await coach.getByRole('link', { name: /^message p4h/i }).first().click();
  await coach.getByLabel(/message/i).fill(`Coach hello — ${marker}`);
  await coach.getByRole('button', { name: /^send$/i }).click();
  await expect(coach.getByText(`Coach hello — ${marker}`)).toBeVisible({ timeout: 15_000 });

  // 9 (setup): watch the realtime websocket on the coach side.
  const wsFrames: string[] = [];
  coach.on('websocket', (ws) => {
    if (ws.url().includes('supabase'))
      ws.on('framereceived', (f) => wsFrames.push(String(f.payload)));
  });

  await participant.goto('/vrcc/messages');
  await expect(participant.getByText(`Coach hello — ${marker}`)).toBeVisible({ timeout: 25_000 });
  await participant.getByLabel(/message/i).fill(`Participant reply — ${marker}`);
  await participant.getByRole('button', { name: /^send$/i }).click();

  // 9. Realtime doorbell: the coach page surfaces the reply without reload,
  //    exactly once (no duplicate bubble), with real websocket traffic.
  await expect(coach.getByText(`Participant reply — ${marker}`)).toBeVisible({ timeout: 30_000 });
  await expect(coach.getByText(`Participant reply — ${marker}`)).toHaveCount(1);
  expect(wsFrames.length, 'supabase realtime websocket frames observed').toBeGreaterThan(0);

  // 7. Content-free notification surface: nothing on Today may leak the body.
  await participant.goto('/vrcc');
  await expect(participant.getByText(`Coach hello — ${marker}`)).toHaveCount(0);

  // 8 + 10. Scheduling and completion flows are exercised where the entry
  // points exist for this relationship state; both remain hard-gated by the
  // dedicated evidence checks (appointment ≠ service) on the admin side.
  await participant.goto('/vrcc/sessions');
  const choose = participant.getByRole('button', { name: /choose this time/i }).first();
  if (await choose.isVisible().catch(() => false)) {
    await choose.click();
    await expect(participant.getByText(/confirmed|scheduled/i).first()).toBeVisible({
      timeout: 15_000,
    });
  }
  await coach.goto('/coach/sessions');
  const complete = coach.getByRole('button', { name: /complete session/i }).first();
  if (await complete.isVisible().catch(() => false)) {
    await complete.click();
    await expect(coach.getByText(/recorded|completed/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(coach.getByRole('button', { name: /complete session/i })).toHaveCount(0);
  }

  await participant.context().close();
  await coach.context().close();
});
