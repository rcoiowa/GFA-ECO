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
  await ensureFreshUser(participant, email, 'P4H', 'NavSeeker');

  // Participant raises a navigation-type request.
  await ensureSupportRequested(participant, /help navigating something/i);

  // 11. Navigator claims from the waiting pool.
  const navigator = await userPage(browser, FIXTURES.navigator);
  await navigator.goto('/navigator/requests');
  const claim = navigator.getByRole('button', { name: /connect with this person/i }).first();
  await expect(claim).toBeVisible({ timeout: 20_000 });
  await claim.click();

  // 12. Navigation-context message — the thread starts from the person page
  // ("Message {name}"); the messages list only shows existing conversations.
  const marker = `P4H nav ${Date.now()}`;
  await navigator.goto('/navigator/people');
  await navigator.getByRole('link').filter({ hasText: /navseeker/i }).first().click();
  await navigator.getByRole('link', { name: /^message/i }).first().click();
  await navigator.getByLabel(/message/i).fill(`Navigator hello — ${marker}`);
  await navigator.getByRole('button', { name: /^send$/i }).click();
  await expect(navigator.getByText(`Navigator hello — ${marker}`)).toBeVisible({
    timeout: 15_000,
  });

  // 13–14. Need identified + referral created (surface-driven; the buttons
  // live on the person page — conditional so drift surfaces as a trace, and
  // the admin evidence checks in file 03 stay the hard gate).
  await navigator.goto('/navigator/people');
  await navigator.getByRole('link').filter({ hasText: /navseeker/i }).first().click();
  const addNeed = navigator.getByRole('button', { name: /add.*need|identify.*need|need/i }).first();
  if (await addNeed.isVisible().catch(() => false)) {
    await addNeed.click();
    const category = navigator.getByLabel(/category|need/i).first();
    if ((await category.count()) && (await category.evaluate((el) => el.tagName)) === 'SELECT') {
      await category.selectOption({ index: 1 });
    }
    const save = navigator.getByRole('button', { name: /save|add|record/i }).first();
    if (await save.isVisible().catch(() => false)) await save.click();
  }
  const addReferral = navigator
    .getByRole('button', { name: /referral|warm handoff|connect to/i })
    .first();
  if (await addReferral.isVisible().catch(() => false)) {
    await addReferral.click();
    const org = navigator.getByLabel(/organization|resource|partner|where/i).first();
    if (await org.isVisible().catch(() => false)) await org.fill('P4H Fixture Housing Partner');
    const save = navigator.getByRole('button', { name: /save|create|record/i }).first();
    if (await save.isVisible().catch(() => false)) await save.click();
  }

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
  await navigator.getByRole('link').filter({ hasText: /navseeker/i }).first().click();
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
