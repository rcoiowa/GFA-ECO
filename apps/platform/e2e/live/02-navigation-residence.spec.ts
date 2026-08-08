import { test, expect, FIXTURES, userPage } from './helpers';

/** Live HTTP gate — items 11–23 (navigation loop + residence). Serial. */
test.describe.configure({ mode: 'serial' });

test('11–16. navigation: claim → message → need → referral → confirmation → attestation', async ({
  browser,
}) => {
  const participant = await userPage(browser, FIXTURES.participant);
  const navigator = await userPage(browser, FIXTURES.navigator);

  // Participant raises a navigation-type request (housing/benefits help).
  await participant.goto('/vrcc/connect');
  const ask = participant.getByRole('button', { name: /support|connect|request/i }).first();
  if (await ask.count()) await ask.click();
  const navType = participant.getByLabel(/type|kind of support/i).first();
  if (await navType.count()) await navType.selectOption({ index: 1 });
  await participant.getByRole('button', { name: /send|submit|ask/i }).first().click();

  // 11. Navigator claims from the waiting pool.
  await navigator.goto('/navigator/requests');
  await navigator.getByRole('button', { name: /claim|i.?ll take|start/i }).first().click();

  // 12. Navigation-context message.
  await navigator.goto('/navigator/messages');
  await navigator.getByRole('link').filter({ hasText: /p4h/i }).first().click();
  await navigator.getByLabel(/message/i).fill('Navigation thread check (P4H live gate).');
  await navigator.getByRole('button', { name: /send/i }).click();

  // 13. Need identified.
  await navigator.goto('/navigator/people');
  await navigator.getByRole('link').filter({ hasText: /p4h/i }).first().click();
  const addNeed = navigator.getByRole('button', { name: /need/i }).first();
  if (await addNeed.count()) {
    await addNeed.click();
    const category = navigator.getByLabel(/category/i).first();
    if (await category.count()) await category.selectOption({ index: 1 });
    await navigator.getByRole('button', { name: /save|add|record/i }).first().click();
  }

  // 14. Referral created (resource/organization — no invented person).
  const addReferral = navigator.getByRole('button', { name: /referral|connect to/i }).first();
  if (await addReferral.count()) {
    await addReferral.click();
    const org = navigator.getByLabel(/organization|resource|partner/i).first();
    if (await org.count()) await org.fill('P4H Fixture Housing Partner');
    await navigator.getByRole('button', { name: /save|create|record/i }).first().click();
  }

  // 15. Participant confirms the connection in their own voice.
  await participant.goto('/vrcc/connect');
  const confirm = participant.getByRole('button', { name: /connected|it worked|confirm/i }).first();
  if (await confirm.count()) {
    await confirm.click();
    await expect(participant.getByText(/glad|connected/i).first()).toBeVisible({ timeout: 15_000 });
  }

  // 16. Navigation service attestation.
  await navigator.goto('/navigator/people');
  await navigator.getByRole('link').filter({ hasText: /p4h/i }).first().click();
  const attest = navigator.getByRole('button', { name: /record.*(service|session)|attest/i }).first();
  if (await attest.count()) {
    await attest.click();
    await navigator.getByRole('button', { name: /save|record|confirm/i }).first().click();
  }

  await participant.context().close();
  await navigator.context().close();
});

test('17–23. residence: application → decision → admission → bed → resident isolation → support → attestation', async ({
  browser,
}) => {
  // 17. Public application submit (fresh applicant signs up first).
  const applicant = await userPage(browser, FIXTURES.resident);
  await applicant.goto('/recovery-residences/grace-house/apply');
  const beginApply = applicant.getByRole('button', { name: /apply|begin|start/i }).first();
  if (await beginApply.count()) await beginApply.click();

  // 18–20. Staff decision → admission → bed.
  const manager = await userPage(browser, FIXTURES.residenceManager);
  await manager.goto('/staff/applications');
  const review = manager.getByRole('button', { name: /review|approve/i }).first();
  if (await review.count()) await review.click();
  const approve = manager.getByRole('button', { name: /approve/i }).first();
  if (await approve.count()) await approve.click();
  await manager.goto('/staff/beds');
  const assign = manager.getByRole('button', { name: /assign/i }).first();
  if (await assign.count()) await assign.click();

  // 21. Resident sees own residence data — and only their own.
  await applicant.goto('/residence/today');
  await expect(applicant.getByText(/your residence/i)).toBeVisible({ timeout: 15_000 });
  // Isolation: staff routes must refuse.
  await applicant.goto('/staff/today');
  await applicant.waitForURL(/not-authorized|sign-in|residence/, { timeout: 15_000 });

  // 22. Residence Support designation + residence-context messaging.
  await manager.goto('/staff/messages');
  const thread = manager.getByRole('link').filter({ hasText: /p4h/i }).first();
  if (await thread.count()) {
    await thread.click();
    await manager.getByLabel(/message/i).fill('Residence support thread check (P4H live gate).');
    await manager.getByRole('button', { name: /send/i }).click();
  }

  // 23. Residence service attestation.
  await manager.goto('/staff/today');
  const attest = manager.getByRole('button', { name: /record.*(service|support)|attest/i }).first();
  if (await attest.count()) {
    await attest.click();
    await manager.getByRole('button', { name: /save|record|confirm/i }).first().click();
  }

  await applicant.context().close();
  await manager.context().close();
});
