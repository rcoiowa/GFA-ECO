import { defineConfig, devices } from '@playwright/test';

import { existsSync } from 'node:fs';

/**
 * RecoveryOS browser verification harness (P4H).
 *
 * Two projects:
 *  - `local`  — runs against a production build served on localhost
 *               (vite preview). Covers accessibility, PWA, mobile reflow,
 *               and public-surface checks that need no backend egress.
 *  - `live`   — the P4G §AN 1–31 HTTP gate against RecoveryOS-Launch.
 *               Requires egress to *.supabase.co AND RECOVERYOS_E2E_LIVE=1;
 *               every spec self-skips otherwise, so CI without egress stays
 *               green and honest.
 *
 * Target modes for the live project (P4H-G1 §8):
 *  - MODE A (default): local production build via `pnpm preview` on the
 *    runner, talking to the real RecoveryOS-Launch backend.
 *  - MODE B: set P4H_E2E_BASE_URL=<staging URL> to run the same specs
 *    against the deployed Cloudflare artifact (no local server started).
 *
 * Browser: uses the sandbox-preinstalled Chromium when present (do not run
 * `playwright install` there); on ordinary CI runners the default
 * Playwright-managed Chromium is used (install it in the workflow).
 */
const PINNED = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const launchOptions = existsSync(PINNED) ? { executablePath: PINNED } : {};
// `||` not `??`: CI passes the input through as an empty string when unset,
// and an empty baseURL turns every relative goto into "invalid URL".
const EXTERNAL_BASE = process.env.P4H_E2E_BASE_URL || undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: EXTERNAL_BASE ?? 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions,
  },
  webServer: EXTERNAL_BASE
    ? undefined
    : {
        // Pin IPv4: CI runners resolve `localhost` to ::1 first, which makes
        // the 127.0.0.1 readiness probe time out against vite's default bind.
        command: 'pnpm preview --host 127.0.0.1 --port 4173 --strictPort',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: true,
        timeout: 60_000,
      },
  projects: [
    {
      name: 'local',
      testIgnore: /live\//,
      use: { ...devices['Desktop Chrome'], launchOptions },
    },
    {
      name: 'live',
      testMatch: /live\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions },
    },
  ],
});
