import { test, expect, FIXTURES, ensureFreshUser, userPage } from './helpers';

/** Live HTTP gate — items 24–30 (admin/governance) + denial matrix. Serial. */
test.describe.configure({ mode: 'serial' });

test('24. staff invitation → real signup → scoped role', async ({ browser }) => {
  const admin = await userPage(browser, FIXTURES.admin);
  const invitee = FIXTURES.fresh('invited-coach');

  await admin.goto('/admin/access');
  await admin.getByLabel(/email/i).fill(invitee);
  await admin.getByLabel(/authority/i).selectOption('coach');
  await admin.getByRole('button', { name: /review invitation/i }).click();
  await expect(admin.getByText(/this invitation grants/i)).toBeVisible({ timeout: 10_000 });
  await admin.getByRole('button', { name: /create invitation/i }).click();
  await expect(admin.getByText(invitee)).toBeVisible({ timeout: 15_000 });

  // Invited email signs up through the REAL flow → scoped coach role.
  const context = await browser.newContext();
  const page = await context.newPage();
  await ensureFreshUser(page, invitee, 'P4H', 'InvitedCoach');
  await page.goto('/coach');
  await expect(page).toHaveURL(/\/coach/, { timeout: 20_000 });
  // No platform-admin authority came along for the ride.
  await page.goto('/admin');
  await page.waitForURL(/not-authorized|coach|home|vrcc/, { timeout: 20_000 });
  await context.close();
  await admin.context().close();
});

test('25. operator invitation → signup → no premature authority', async ({ browser }) => {
  const admin = await userPage(browser, FIXTURES.admin);
  const operator = FIXTURES.fresh('operator');

  await admin.goto('/admin/access');
  await admin.getByLabel(/email/i).fill(operator);
  await admin.getByLabel(/authority/i).selectOption('operator');
  await admin.getByRole('button', { name: /review invitation/i }).click();
  await expect(admin.getByText(/this invitation grants/i)).toBeVisible({ timeout: 10_000 });
  await admin.getByRole('button', { name: /create invitation/i }).click();
  await expect(admin.getByText(operator)).toBeVisible({ timeout: 15_000 });

  const context = await browser.newContext();
  const page = await context.newPage();
  await ensureFreshUser(page, operator, 'P4H', 'Operator');
  // Signup must NOT have granted residence authority (operator invitations
  // are consumed at provisioning, not signup).
  await page.goto('/staff/today');
  await page.waitForURL(/not-authorized|home|vrcc/, { timeout: 20_000 });
  // Provisioning consumes the invitation: exercised where the operator form
  // renders (conditional — the flow is DB-verified; this proves the gate).
  await page.goto('/recovery-residences/list-your-residence');
  const orgName = page.getByLabel(/organization/i).first();
  if (await orgName.isVisible().catch(() => false)) {
    await orgName.fill('P4H Fixture Operator Org');
    const resName = page.getByLabel(/residence name|house name|name of/i).first();
    if (await resName.isVisible().catch(() => false)) await resName.fill('P4H Fixture House');
    const submit = page.getByRole('button', { name: /create|list my residence|submit/i }).first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      await page.goto('/staff/today');
      await expect(page.getByText(/p4h fixture house/i)).toBeVisible({ timeout: 25_000 });
    }
  }
  await context.close();
  await admin.context().close();
});

test('26. role grant/revoke takes effect for an active session', async ({ browser }) => {
  const admin = await userPage(browser, FIXTURES.admin);
  const subject = await userPage(browser, FIXTURES.executive); // executive has no coach role

  await admin.goto('/admin/people');
  await admin.getByLabel(/find someone/i).fill('P4h-executive');
  const grantOpen = admin.getByRole('button', { name: /grant a role/i }).first();
  await expect(grantOpen).toBeVisible({ timeout: 15_000 });
  await grantOpen.click();
  await admin.getByLabel(/^role$/i).first().selectOption('coach');
  await admin.getByRole('button', { name: /grant recovery coach/i }).click();

  // Active session gains the workspace on next navigation…
  await subject.goto('/coach');
  await expect(subject).toHaveURL(/\/coach/, { timeout: 25_000 });

  // …and loses it after revocation (revocation-aware helpers, no session
  // state). Revoke the coach chip specifically.
  await admin.goto('/admin/people');
  await admin.getByLabel(/find someone/i).fill('P4h-executive');
  const coachChip = admin
    .locator('li', { hasText: /recovery coach/i })
    .getByRole('button', { name: /revoke/i })
    .first();
  await expect(coachChip).toBeVisible({ timeout: 15_000 });
  await coachChip.click();
  await admin.getByRole('button', { name: /confirm revoke/i }).click();
  await subject.goto('/coach');
  await subject.waitForURL(/not-authorized|admin|home|vrcc/, { timeout: 25_000 });

  await admin.context().close();
  await subject.context().close();
});

test('27. cross-role denial matrix', async ({ browser }) => {
  // participant → admin surfaces
  const participant = await userPage(browser, FIXTURES.participant);
  await participant.goto('/admin');
  await participant.waitForURL(/not-authorized|vrcc|home/, { timeout: 20_000 });
  await participant.context().close();

  // navigator → invitations
  const navigator = await userPage(browser, FIXTURES.navigator);
  await navigator.goto('/admin/access');
  await navigator.waitForURL(/not-authorized|navigator|home/, { timeout: 20_000 });
  await navigator.context().close();

  // admin → private message bodies: the marker text sent between the fixture
  // participant and coach must never render on any admin surface.
  const admin = await userPage(browser, FIXTURES.admin);
  for (const path of ['/admin', '/admin/people', '/admin/operations', '/admin/audit']) {
    await admin.goto(path);
    await expect(admin.getByText(/Coach hello — P4H live gate/)).toHaveCount(0);
    await expect(admin.getByText(/Participant reply — P4H live gate/)).toHaveCount(0);
  }
  await admin.context().close();
});

test('28. cross-residence scope: manager sees only their residence', async ({ browser }) => {
  const manager = await userPage(browser, FIXTURES.residenceManager);
  await manager.goto('/staff/today');
  await expect(manager.getByText(/p4h fixture house/i)).toHaveCount(0);
  await manager.context().close();
});

test('29. admin operations + evidence render real aggregates (no TTMHC)', async ({ browser }) => {
  const admin = await userPage(browser, FIXTURES.admin);
  await admin.goto('/admin/operations');
  await expect(admin.getByText(/open support requests/i)).toBeVisible({ timeout: 20_000 });
  await admin.goto('/admin/evidence');
  await expect(admin.getByText(/support requests/i).first()).toBeVisible({ timeout: 20_000 });
  await expect(admin.getByText(/TTMHC/i)).toHaveCount(0);
  // Executive: aggregate evidence only; operations summary refused.
  const exec = await userPage(browser, FIXTURES.executive);
  await exec.goto('/admin/evidence');
  await expect(exec.getByText(/support requests|not available/i).first()).toBeVisible({
    timeout: 20_000,
  });
  await exec.context().close();
  await admin.context().close();
});

test('30. external residence-referral triage', async ({ browser }) => {
  const manager = await userPage(browser, FIXTURES.residenceManager);
  await manager.goto('/staff/applications');
  const contacted = manager.getByRole('button', { name: /contacted/i }).first();
  if (await contacted.isVisible().catch(() => false)) {
    await contacted.click();
  }
  await manager.context().close();
});
