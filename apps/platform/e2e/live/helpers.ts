import { test as base, expect, type Page, type Browser } from '@playwright/test';

/**
 * Live HTTP gate helpers (P4G §AN / P4H remainder §13).
 *
 * These specs exercise the REAL boundary: browser → HTTPS → Supabase Auth →
 * PostgREST/RPC → RLS → RecoveryOS-Launch → Realtime → UI. They require:
 *
 *  1. egress to *.supabase.co (run from GitHub Actions or a laptop — the
 *     P4H automation container's policy denies it);
 *  2. RECOVERYOS_E2E_LIVE=1;
 *  3. the p4h-* fixture identities seeded per docs/product/p4h-e2e-runbook.md
 *     (fixtures are classified test_fixture and excluded from evidence).
 *
 * Without (1)+(2) every spec self-skips so the suite stays green and honest.
 * NEVER point this suite at real participant records.
 */

export const LIVE = process.env.RECOVERYOS_E2E_LIVE === '1';

/** Auto-fixture: every live spec self-skips without the opt-in + egress. */
export const test = base.extend<{ liveGate: void }>({
  liveGate: [
    async ({}, use, testInfo) => {
      if (!LIVE)
        testInfo.skip(
          true,
          'BLOCKED — live HTTP gate requires egress to *.supabase.co and RECOVERYOS_E2E_LIVE=1',
        );
      await use();
    },
    { auto: true },
  ],
});

export { expect };

const PASSWORD = process.env.P4H_E2E_PASSWORD ?? '';
const DOMAIN = process.env.P4H_E2E_EMAIL_DOMAIN ?? 'fixtures.recoveryos.test';
const SUPA_URL = process.env.VITE_SUPABASE_URL ?? 'https://cqcxvwoukyhxyokfwnjm.supabase.co';
/** Node-side only (never reaches the page): confirm-email fallback. */
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const FIXTURES = {
  participant: `p4h-participant@${DOMAIN}`,
  coach: `p4h-coach@${DOMAIN}`,
  navigator: `p4h-navigator@${DOMAIN}`,
  residenceManager: `p4h-residence-manager@${DOMAIN}`,
  residenceStaff: `p4h-residence-staff@${DOMAIN}`,
  resident: `p4h-resident@${DOMAIN}`,
  admin: `p4h-admin@${DOMAIN}`,
  executive: `p4h-executive@${DOMAIN}`,
  operator: `p4h-operator@${DOMAIN}`,
  /** Fresh identities minted per run for signup/invitation tests. */
  fresh: (tag: string) => `p4h-${tag}-${Date.now()}@${DOMAIN}`,
} as const;

export function password(): string {
  if (!PASSWORD) throw new Error('P4H_E2E_PASSWORD is required for the live gate');
  return PASSWORD;
}

/**
 * If the project requires email confirmation, real signup shows the
 * "check your email" card with no session. Fixture domains have no mailbox,
 * so the harness confirms server-side via the auth admin API (Node process
 * only — the key never touches the browser). Signup itself stays real.
 */
async function adminConfirmEmail(email: string): Promise<void> {
  if (!SERVICE_KEY) throw new Error('confirm-email project needs SUPABASE_SERVICE_ROLE_KEY in the test env');
  const headers = { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}`, 'content-type': 'application/json' };
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(`${SUPA_URL}/auth/v1/admin/users?page=${page}&per_page=100`, { headers });
    const body = (await res.json()) as { users?: Array<{ id: string; email?: string }> };
    const users = body.users ?? [];
    const hit = users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());
    if (hit) {
      await fetch(`${SUPA_URL}/auth/v1/admin/users/${hit.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ email_confirm: true }),
      });
      return;
    }
    if (users.length < 100) break;
  }
  throw new Error(`adminConfirmEmail: no auth user for ${email}`);
}

/** Real registration through the UI; handles both confirmation postures. */
export async function registerUser(
  page: Page,
  email: string,
  first = 'P4H',
  last = 'Signup',
): Promise<void> {
  await page.goto('/register');
  await page.getByLabel(/first name/i).fill(first);
  await page.getByLabel(/last name/i).fill(last);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password());
  await page.getByRole('button', { name: /create account/i }).click();
  const confirmCard = page.getByText(/check your email/i);
  await Promise.race([
    page.waitForURL(/onboarding|home|vrcc/, { timeout: 20_000 }),
    confirmCard.waitFor({ state: 'visible', timeout: 20_000 }),
  ]);
  if (await confirmCard.isVisible().catch(() => false)) {
    await adminConfirmEmail(email);
    await signIn(page, email);
  }
  // Onboarding provisions automatically and routes onward.
  await page.waitForURL(/home|vrcc|coach|navigator|staff|residence|admin/, { timeout: 25_000 });
}

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password());
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'), { timeout: 20_000 });
}

export async function signOut(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: /sign out/i });
  if (await button.count()) {
    await button.first().click();
    await page.waitForURL(/sign-in|\/$/, { timeout: 15_000 }).catch(() => undefined);
    return;
  }
  // Supabase sessions live in localStorage, not cookies.
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
}

/** A signed-in page in its own context (for multi-user scenarios). */
export async function userPage(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, email);
  return page;
}

/** Participant asks for support via the real Connect flow (Mode A). */
export async function askForSupport(page: Page, optionTitle: RegExp): Promise<void> {
  await page.goto('/vrcc/connect');
  await page.getByRole('button', { name: optionTitle }).click();
  await page.getByRole('button', { name: /request support/i }).click();
  await expect(page.getByText(/we.?ve got your request|someone is on it/i)).toBeVisible({
    timeout: 20_000,
  });
}
