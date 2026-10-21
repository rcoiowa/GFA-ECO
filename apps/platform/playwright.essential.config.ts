import { defineConfig, devices } from '@playwright/test';
// No live project, external base URL, or production fixture support.
export default defineConfig({
  testDir: './e2e-essential',
  timeout: 45000,
  workers: 1,
  retries: 0,
  outputDir: '/tmp/gfa-essential-browser-results',
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5178',
    serviceWorkers: 'block',
    launchOptions: { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'VITE_SUPABASE_URL=http://127.0.0.1:5178/__synthetic_supabase VITE_SUPABASE_ANON_KEY=synthetic-not-a-credential VITE_TURNSTILE_SITE_KEY=synthetic-widget VITE_HOUSING_FOLLOW_THROUGH_ENABLED=true ./node_modules/.bin/vite --host 127.0.0.1 --port 5178 --strictPort',
    url: 'http://127.0.0.1:5178',
    reuseExistingServer: false,
    timeout: 60000,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } },
  ],
});
