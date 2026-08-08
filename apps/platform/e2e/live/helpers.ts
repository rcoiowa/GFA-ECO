import { test as base, expect, type Page, type Browser } from '@playwright/test';

/**
 * Live HTTP gate helpers (P4G §AN / P4H remainder §13).
 *
 * These specs exercise the REAL boundary: browser → HTTPS → Supabase Auth →
 * PostgREST/RPC → RLS → RecoveryOS-Launch → Realtime → UI. They require:
 *
 *  1. an environment whose egress policy allows *.supabase.co (the CI
 *     container used for P4H denied CONNECT with 403 — see the runbook);
 *  2. RECOVERYOS_E2E_LIVE=1;
 *  3. the p4h-* fixture identities seeded and classified per
 *     docs/product/p4h-e2e-runbook.md (fixtures are excluded from evidence).
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

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password());
  await page.getByRole('button', { name: /sign in/i }).click();
  // Arrival anywhere authenticated (role routing owns the destination).
  await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'), { timeout: 15_000 });
}

export async function signOut(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: /sign out/i });
  if (await button.count()) await button.first().click();
  await page.context().clearCookies();
}

/** A signed-in page in its own context (for multi-user scenarios). */
export async function userPage(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, email);
  return page;
}
