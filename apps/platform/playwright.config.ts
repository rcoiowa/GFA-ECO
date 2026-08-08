import { defineConfig, devices } from '@playwright/test';

/**
 * RecoveryOS browser verification harness (P4H).
 *
 * Two projects:
 *  - `local`  — runs against a production build served on localhost
 *               (vite preview). Covers accessibility, PWA, mobile reflow,
 *               and public-surface checks that need no backend egress.
 *  - `live`   — the P4G §AN 1–31 HTTP gate against RecoveryOS-Launch.
 *               Requires an environment whose egress policy allows
 *               *.supabase.co AND the RECOVERYOS_E2E_LIVE=1 opt-in; every
 *               spec self-skips otherwise, so CI without egress stays green
 *               and honest.
 *
 * The preinstalled Chromium is pinned via executablePath — do not run
 * `playwright install` in this environment.
 */
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: CHROMIUM },
  },
  webServer: {
    command: 'pnpm preview --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'local',
      testIgnore: /live\//,
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: CHROMIUM } },
    },
    {
      name: 'live',
      testMatch: /live\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: CHROMIUM } },
    },
  ],
});
