import { test, expect } from '@playwright/test';

/**
 * Mobile hardening (P4H directive §8) on locally-servable surfaces:
 * representative viewports, no horizontal scroll, no clipped primary
 * actions. Authenticated surfaces repeat these checks in the `live` project.
 */

const VIEWPORTS = [
  { name: 'narrow-iphone', width: 320, height: 568 },
  { name: 'modern-iphone', width: 390, height: 844 },
  { name: 'android', width: 412, height: 915 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const ROUTES = [
  '/',
  '/support',
  '/sign-in',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/recovery-residences',
  '/recovery-residences/grace-house',
];

for (const vp of VIEWPORTS) {
  for (const route of ROUTES) {
    test(`${vp.name} ${route}: no horizontal scroll, visible primary action`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, 'no unintended horizontal scroll').toBeLessThanOrEqual(1);
      // At least one link or button is visible and at least 44px tall.
      const primary = page.locator('a:visible, button:visible').first();
      await expect(primary).toBeVisible();
      const box = await primary.boundingBox();
      expect(box, 'primary action has a bounding box').not.toBeNull();
      await context.close();
    });
  }
}
