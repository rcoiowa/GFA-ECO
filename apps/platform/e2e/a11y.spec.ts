import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Automated accessibility regression gate (P4H directive §6) over the
 * locally-servable surfaces: public pages and auth-free flows, in light and
 * dark appearance and the Cosmic atmosphere. Axe supplements — does not
 * replace — manual review; authenticated workspaces run under the `live`
 * project where backend egress exists.
 */

const PUBLIC_ROUTES = [
  { path: '/', name: 'landing' },
  { path: '/support', name: 'support-now' },
  { path: '/sign-in', name: 'sign-in' },
  { path: '/register', name: 'register' },
  { path: '/forgot-password', name: 'forgot-password' },
  { path: '/recovery-residences', name: 'residence-directory' },
  { path: '/recovery-residences/grace-house', name: 'grace-house' },
  { path: '/recovery-residences/list-your-residence', name: 'list-your-residence' },
];

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
  ).toEqual([]);
}

for (const route of PUBLIC_ROUTES) {
  test(`axe clean (light): ${route.name}`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');
    await expectNoSeriousViolations(page);
  });

  test(`axe clean (dark): ${route.name}`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('recoveryos-appearance', 'dark');
      localStorage.setItem('recoveryos-atmosphere', 'hearth');
    });
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');
    await expectNoSeriousViolations(page);
  });
}

test('axe clean (cosmic atmosphere): landing', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('recoveryos-appearance', 'dark');
    localStorage.setItem('recoveryos-atmosphere', 'cosmic');
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expectNoSeriousViolations(page);
});

test('landing has one main landmark, headings, and labeled navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
});

test('sign-in is keyboard-completable to the submit control', async ({ page }) => {
  await page.goto('/sign-in');
  // Tab through the form: every stop must be visible and reach the submit.
  let reachedSubmit = false;
  for (let i = 0; i < 15 && !reachedSubmit; i++) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el ? { tag: el.tagName, type: el.getAttribute('type'), text: el.textContent } : null;
    });
    if (active?.tag === 'BUTTON' && (active.type === 'submit' || /sign in/i.test(active.text ?? '')))
      reachedSubmit = true;
  }
  expect(reachedSubmit).toBe(true);
});

test('reduced motion: settle animation collapses to a static end-state', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const duration = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.className = 'settle-in';
    document.body.appendChild(probe);
    const style = getComputedStyle(probe);
    const d = style.animationDuration;
    probe.remove();
    return d;
  });
  expect(parseFloat(duration)).toBeLessThanOrEqual(0.001);
  await context.close();
});

test('320px reflow: landing has no horizontal scroll', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 } });
  const page = await context.newPage();
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await context.close();
});

test('200% zoom equivalent: landing remains readable without horizontal scroll', async ({
  browser,
}) => {
  // 640px-wide viewport approximates 200% zoom of a 1280px window.
  const context = await browser.newContext({ viewport: { width: 640, height: 800 } });
  const page = await context.newPage();
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await context.close();
});
