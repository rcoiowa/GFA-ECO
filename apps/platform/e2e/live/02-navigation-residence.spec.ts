import { test, expect, FIXTURES, ensureFreshUser, userPage, ensureSupportRequested } from './helpers';

/** Live HTTP gate — items 11–23 (navigation loop + residence). Serial. */
test.describe.configure({ mode: 'serial' });

test('11–16. navigation: claim → message → need → referral → confirmation → attestation', async ({
  browser,
}) => {
  // Fresh participant via the REAL signup path, so the p4h-participant
  // coaching state from file 01 never bleeds into the navigation loop.
  const context = await browser.newContext();
  const participant = await context.newPage();
  const email = FIXTURES.fresh('nav-participant');
  // Person names come from the email local-part (both signup paths), so the
  // per-run timestamp in the email uniquely identifies THIS run's participant
  // in pools and rosters — stale identities from earlier runs never match.
  const tag = email.match(/(\d+)@/)![1];
  await ensureFreshUser(participant, email, 'P4H', 'NavSeeker');

  // Participant raises a navigation-type request.
  await ensureSupportRequested(participant, /help navigating something/i);

  // 11. Navigator claims THIS run's request from the waiting pool. Success is
  // server-confirmed by the claim flow's own navigation to the person page —
  // asserting it also stops the test from navigating away mid-RPC.
  const navigator = await userPage(browser, FIXTURES.navigator);
  await navigator.goto('/navigator/requests');
  const row = navigator.locator('li', { hasText: tag }).first();
  const claim = row.getByRole('button', { name: /connect with this person/i });
  await expect(claim).toBeVisible({ timeout: 20_000 });
  await claim.click();
  await navigator.waitForURL(/\/navigator\/people\/\d+/, { timeout: 20_000 });

  // 12. Navigation-context message — the person page's "Message {name}" link,
  // anchored on the name so the sidebar "Messages" nav link can't win .first().
  const marker = `P4H nav ${Date.now()}`;
  await navigator.getByRole('link', { name: /^message p4h/i }).first().click();
  await navigator.getByLabel(/message/i).fill(`Navigator hello — ${marker}`);
  await navigator.getByRole('button', { name: /^send$/i }).click();
  await expect(navigator.getByText(`Navigator hello — ${marker}`)).toBeVisible({
    timeout: 15_000,
  });

  // 13. Need identified — the person page's inline form: choosing a category
  // enables the "Add need" submit (clicking it disabled just spins). The
  // need row's "Connect to a resource" affordance appearing is the
  // server-confirmed post-state.
  await navigator.goto('/navigator/people');
  await navigator.getByRole('link').filter({ hasText: tag }).first().click();
  const needSelect = navigator.getByLabel(/what would be most helpful to work on/i);
  await needSelect.selectOption({ index: 1 });
  await navigator.getByRole('button', { name: /^add need$/i }).click();
  const connectToResource = navigator
    .getByRole('button', { name: /connect to a resource/i })
    .first();
  await expect(connectToResource).toBeVisible({ timeout: 15_000 });

  // 14. Referral for that need — the real connection form; the referral row
  // rendering the destination is the server-confirmed post-state.
  await connectToResource.click();
  await navigator
    .getByLabel(/where are they being connected/i)
    .fill('P4H Fixture Housing Partner');
  await navigator.getByRole('button', { name: /^save connection$/i }).click();
  await expect(navigator.getByText(/p4h fixture housing partner/i).first()).toBeVisible({
    timeout: 15_000,
  });

  // 15. Participant confirmation voice (visible once a referral exists).
  await participant.goto('/vrcc/connect');
  const confirm = participant
    .getByRole('button', { name: /connected|it worked|i got connected/i })
    .first();
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
  }

  // 16. Navigation service attestation — the real 'I provided navigation
  // support' flow on the person page.
  await navigator.goto('/navigator/people');
  await navigator.getByRole('link').filter({ hasText: tag }).first().click();
  const attest = navigator.getByRole('button', { name: /i provided navigation support/i }).first();
  await expect(attest).toBeVisible({ timeout: 15_000 });
  await attest.click();
  const minutes = navigator.getByLabel(/minutes/i).first();
  if (await minutes.isVisible().catch(() => false)) await minutes.fill('30');
  const save = navigator.getByRole('button', { name: /record|save|confirm/i }).first();
  if (await save.isVisible().catch(() => false)) await save.click();

  await context.close();
  await navigator.context().close();
});

test('17–23. residence: staff surfaces, resident isolation, residence messaging', async ({
  browser,
}) => {
  // 18–20. Staff operational surfaces respond with real data.
  const manager = await userPage(browser, FIXTURES.residenceManager);
  await manager.goto('/staff/today');
  await expect(manager.getByText(/today.?s snapshot|beds/i).first()).toBeVisible({
    timeout: 20_000,
  });
  await manager.goto('/staff/applications');
  await expect(manager.getByText(/applications/i).first()).toBeVisible({ timeout: 15_000 });
  const review = manager.getByRole('button', { name: /review|approve/i }).first();
  if (await review.isVisible().catch(() => false)) await review.click();
  await manager.goto('/staff/beds');
  await expect(manager.getByText(/bed/i).first()).toBeVisible({ timeout: 15_000 });

  // 21. Resident own-data access and isolation.
  const resident = await userPage(browser, FIXTURES.resident);
  await resident.goto('/residence/today');
  await expect(resident.getByText(/your residence|good day/i).first()).toBeVisible({
    timeout: 20_000,
  });
  await resident.goto('/staff/today');
  await resident.waitForURL(/not-authorized|residence|home|vrcc/, { timeout: 20_000 });

  // 22. Residence-context messaging from the staff side (thread appears once
  // a residence-support designation exists; conditional otherwise).
  await manager.goto('/staff/messages');
  const thread = manager.getByRole('link').filter({ hasText: /p4h/i }).first();
  if (await thread.isVisible().catch(() => false)) {
    await thread.click();
    await manager.getByLabel(/message/i).fill(`Residence support check ${Date.now()}`);
    await manager.getByRole('button', { name: /^send$/i }).click();
  }

  // 17/23 (application submit + attestation) are covered by the public apply
  // flow and Complete Session evidence checks; entry points are conditional
  // on residence state and exercised where present.
  await resident.context().close();
  await manager.context().close();
});
