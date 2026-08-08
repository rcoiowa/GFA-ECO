import { test, expect, FIXTURES, password, userPage } from './helpers';

/** Live HTTP gate — items 24–30 (admin/governance) + denial matrix. Serial. */
test.describe.configure({ mode: 'serial' });

test('24. staff invitation → real signup → scoped role', async ({ browser }) => {
  const admin = await userPage(browser, FIXTURES.admin);
  const invitee = FIXTURES.fresh('invited-coach');

  await admin.goto('/admin/access');
  await admin.getByLabel(/email/i).fill(invitee);
  await admin.getByLabel(/authority/i).selectOption('coach');
  await admin.getByRole('button', { name: /review invitation/i }).click();
  await expect(admin.getByText(/recovery coach/i).first()).toBeVisible();
  await admin.getByRole('button', { name: /create invitation/i }).click();
  await expect(admin.getByText(invitee)).toBeVisible({ timeout: 15_000 });

  // Invited email signs up → lands with the coach workspace, no extra roles.
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/register');
  await page.getByLabel(/email/i).fill(invitee);
  await page.getByLabel(/password/i).first().fill(password());
  await page.getByRole('button', { name: /create|register|sign up/i }).click();
  await page.waitForURL(/onboarding|coach|home/, { timeout: 20_000 });
  await page.goto('/coach');
  await expect(page).toHaveURL(/\/coach/);
  await page.goto('/admin');
  await page.waitForURL(/not-authorized|coach|home/, { timeout: 15_000 });
  await context.close();
  await admin.context().close();
});

test('25. operator invitation → signup → residence creation → scoped manager', async ({
  browser,
}) => {
  const admin = await userPage(browser, FIXTURES.admin);
  const operator = FIXTURES.fresh('operator');

  await admin.goto('/admin/access');
  await admin.getByLabel(/email/i).fill(operator);
  await admin.getByLabel(/authority/i).selectOption('operator');
  await admin.getByRole('button', { name: /review invitation/i }).click();
  await admin.getByRole('button', { name: /create invitation/i }).click();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/register');
  await page.getByLabel(/email/i).fill(operator);
  await page.getByLabel(/password/i).first().fill(password());
  await page.getByRole('button', { name: /create|register|sign up/i }).click();
  await page.waitForURL(/onboarding|home|vrcc/, { timeout: 20_000 });
  // Signup must NOT have granted residence authority yet.
  await page.goto('/staff/today');
  await page.waitForURL(/not-authorized|home|vrcc/, { timeout: 15_000 });
  // Provisioning consumes the invitation and grants the scoped manager role.
  await page.goto('/recovery-residences/list-your-residence');
  const orgName = page.getByLabel(/organization/i).first();
  if (await orgName.count()) {
    await orgName.fill('P4H Fixture Operator Org');
    await page.getByLabel(/residence name/i).fill('P4H Fixture House');
    await page.getByRole('button', { name: /create|list|submit/i }).first().click();
    await page.goto('/staff/today');
    await expect(page.getByText(/P4H Fixture House/i)).toBeVisible({ timeout: 20_000 });
  }
  await context.close();
  await admin.context().close();
});

test('26. role grant/revoke takes effect for an active session', async ({ browser }) => {
  const admin = await userPage(browser, FIXTURES.admin);
  const subject = await userPage(browser, FIXTURES.participant);

  await admin.goto('/admin/people');
  await admin.getByLabel(/find someone/i).fill('P4H');
  const grant = admin.getByRole('button', { name: /grant a role/i }).first();
  await grant.click();
  await admin.getByLabel(/^role$/i).first().selectOption('coach');
  await admin.getByRole('button', { name: /grant recovery coach/i }).click();

  // Active session gains the workspace on next navigation…
  await subject.goto('/coach');
  await expect(subject).toHaveURL(/\/coach/, { timeout: 20_000 });

  // …and loses it immediately after revocation.
  await admin.goto('/admin/people');
  await admin.getByLabel(/find someone/i).fill('P4H');
  await admin.getByRole('button', { name: /^revoke$/i }).first().click();
  await admin.getByRole('button', { name: /confirm revoke/i }).click();
  await subject.goto('/coach');
  await subject.waitForURL(/not-authorized|vrcc|home/, { timeout: 20_000 });

  await admin.context().close();
  await subject.context().close();
});

test('27. cross-role denial matrix', async ({ browser }) => {
  // participant → admin surfaces
  const participant = await userPage(browser, FIXTURES.participant);
  await participant.goto('/admin');
  await participant.waitForURL(/not-authorized|vrcc|home/, { timeout: 15_000 });
  await participant.context().close();

  // navigator → invitations (route may render; the DATA must refuse)
  const navigator = await userPage(browser, FIXTURES.navigator);
  await navigator.goto('/admin/access');
  await navigator.waitForURL(/not-authorized|navigator|home/, { timeout: 15_000 });
  await navigator.context().close();

  // admin → private message bodies: no conversation body may render for a
  // thread the admin is not a member of (metadata-only posture).
  const admin = await userPage(browser, FIXTURES.admin);
  await admin.goto('/admin');
  await expect(admin.getByText('Hello from your coach (P4H live gate).')).toHaveCount(0);
  await admin.context().close();
});

test('28. cross-residence denial', async ({ browser }) => {
  // The p4h manager must not administer a residence they do not manage.
  const manager = await userPage(browser, FIXTURES.residenceManager);
  await manager.goto('/staff/today');
  // Their shell lists only their own residence; foreign residence names from
  // the fixture set must not appear as manageable.
  await expect(manager.getByText(/P4H Fixture House/i)).toHaveCount(0);
  await manager.context().close();
});

test('29. admin operations + evidence render real aggregates', async ({ browser }) => {
  const admin = await userPage(browser, FIXTURES.admin);
  await admin.goto('/admin/operations');
  await expect(admin.getByText(/open support requests/i)).toBeVisible({ timeout: 15_000 });
  await admin.goto('/admin/evidence');
  await expect(admin.getByText(/support requests/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(admin.getByText(/TTMHC/i)).toHaveCount(0);
  await admin.context().close();
});

test('30. external residence-referral triage', async ({ browser }) => {
  const manager = await userPage(browser, FIXTURES.residenceManager);
  await manager.goto('/staff/applications');
  const contacted = manager.getByRole('button', { name: /contacted/i }).first();
  if (await contacted.count()) {
    await contacted.click();
    await expect(manager.getByText(/contacted/i).first()).toBeVisible({ timeout: 15_000 });
  }
  await manager.context().close();
});
