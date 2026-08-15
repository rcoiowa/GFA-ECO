import { test, expect } from '@playwright/test';

/**
 * Public Support Now — anonymous human-connection path. Runs in the `local`
 * project against the production build with NO backend session and Grace AI
 * OFF (provider activation is locked off): the safety path must be complete
 * under exactly those conditions.
 */

test('anonymous visitor reaches /support without any account or redirect', async ({ page }) => {
  await page.goto('/support');
  await expect(page).toHaveURL(/\/support$/);
  await expect(page.getByRole('heading', { name: 'Support, right now' })).toBeVisible();
  // No auth gate: never bounced to sign-in, never asked to register.
  await expect(page).not.toHaveURL(/sign-in/);
  await expect(page.getByText(/create.*account/i)).toHaveCount(0);
});

test('the full hierarchy is present: emergency, crisis, and GFA human support', async ({
  page,
}) => {
  await page.goto('/support');
  await expect(page.getByRole('heading', { name: 'In immediate danger?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Need crisis support right now?' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Want to connect with Grace For Addictions?' }),
  ).toBeVisible();
  await expect(page.locator('a[href="tel:911"]')).toBeVisible();
  await expect(page.locator('a[href="tel:988"]')).toBeVisible();
  await expect(page.locator('a[href="tel:+15153103425"]')).toBeVisible();
  await expect(page.locator('a[href="tel:+15152208771"]')).toBeVisible();
});

test('landing page offers the GFA human path and links to every support option', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('a[href="tel:988"]')).toBeVisible();
  await expect(page.locator('a[href="tel:+15153103425"]').first()).toBeVisible();
  await page.getByRole('link', { name: 'every support option' }).click();
  await expect(page).toHaveURL(/\/support$/);
  await expect(page.getByRole('heading', { name: 'Support, right now' })).toBeVisible();
});

test('public residence pages link to the support path', async ({ page }) => {
  for (const route of ['/recovery-residences', '/recovery-residences/grace-house']) {
    await page.goto(route);
    await expect(page.getByRole('link', { name: 'All support options' })).toBeVisible();
  }
  // Grace House also surfaces the office + warmline directly.
  await page.goto('/recovery-residences/grace-house');
  await expect(page.locator('a[href="tel:+15152208771"]')).toBeVisible();
  await expect(page.locator('a[href="tel:+15153103425"]')).toBeVisible();
});

test('support page exposes no authenticated data and makes no Supabase reads', async ({ page }) => {
  const dataRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('supabase.co/rest')) dataRequests.push(request.url());
  });
  await page.goto('/support');
  await page.waitForLoadState('networkidle');
  expect(dataRequests).toEqual([]);
});
