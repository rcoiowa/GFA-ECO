import { test, expect } from '@playwright/test';

/**
 * PWA verification through a real browser against the production build
 * (P4H directive §3): manifest validity, service-worker registration, the
 * offline application-shell fallback, and — structurally — the private-data
 * cache policy (the worker never handles cross-origin requests).
 */

test('manifest is served, linked, and complete', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBe('/manifest.webmanifest');
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.name).toContain('Virtual Recovery Community Center');
  expect(manifest.short_name).toBe('VRCC');
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('/');
  expect(manifest.scope).toBe('/');
  expect(manifest.theme_color).toBe('#6540A5');
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
  expect(
    manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable'),
  ).toBe(true);
  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).status()).toBe(200);
  }
});

test('theme-color metas cover light and dark appearance', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]'),
  ).toHaveAttribute('content', '#141019');
});

test('service worker registers and controls the page', async ({ page }) => {
  await page.goto('/');
  const swState = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    const reg = await navigator.serviceWorker.ready;
    return reg.active?.state ?? 'none';
  });
  expect(swState).toBe('activated');
});

test('offline: application shell still opens (offline-aware, not offline-data)', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Reload once so the worker controls the page, then cut the network.
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  // The cached shell must render the app root — not a browser error page.
  await expect(page.locator('#root')).toBeAttached();
  await context.setOffline(false);
  await context.close();
});

test('service worker never intercepts cross-origin (Supabase) requests', async ({ request }) => {
  const sw = await (await request.get('/sw.js')).text();
  // Structural policy assertions on the shipped worker source.
  expect(sw).toContain("request.method !== 'GET'");
  expect(sw).toContain('url.origin !== self.location.origin');
  expect(sw).not.toContain('supabase');
});
