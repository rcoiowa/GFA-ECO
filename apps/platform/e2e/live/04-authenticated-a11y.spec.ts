import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect, FIXTURES, userPage } from './helpers';

/**
 * Live HTTP gate — §14 authenticated accessibility pass. Axe (WCAG 2.x A/AA)
 * across every role's real workspace over the live boundary; serious or
 * critical violations fail the gate. Screen-reader (VoiceOver/NVDA) passes
 * remain HUMAN DEVICE CHECK REQUIRED — axe supplements, never replaces them.
 */
test.describe.configure({ mode: 'serial' });

async function expectNoSeriousViolations(page: Page, route: string) {
  await page.waitForLoadState('networkidle');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map((v) => `${route} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
    `axe serious/critical on ${route}`,
  ).toEqual([]);
}

const WORKSPACES: Array<[Exclude<keyof typeof FIXTURES, 'fresh'>, string[]]> = [
  ['participant', ['/vrcc', '/vrcc/connect', '/vrcc/messages', '/vrcc/sessions']],
  ['coach', ['/coach', '/coach/participants', '/coach/requests', '/coach/messages', '/coach/sessions']],
  ['navigator', ['/navigator', '/navigator/people', '/navigator/requests', '/navigator/messages']],
  ['residenceManager', ['/staff/today', '/staff/applications', '/staff/beds', '/staff/messages']],
  ['resident', ['/residence/today']],
  ['admin', ['/admin', '/admin/people', '/admin/access', '/admin/operations', '/admin/evidence', '/admin/audit']],
  ['executive', ['/admin/evidence']],
];

for (const [role, routes] of WORKSPACES) {
  test(`§14 axe clean (authenticated): ${role}`, async ({ browser }) => {
    const page = await userPage(browser, FIXTURES[role]);
    for (const route of routes) {
      await page.goto(route);
      await expectNoSeriousViolations(page, route);
    }
    await page.context().close();
  });
}
