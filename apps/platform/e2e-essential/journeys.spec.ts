import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
const ORIGIN = 'http://127.0.0.1:5178';
const uuid = '00000000-0000-0000-0000-000000000001';
const evidence = '/tmp/gfa-essential-screenshots';
mkdirSync(evidence, { recursive: true });
async function fixture(page: Page, actor: 'unlinked' | 'applicant' | 'staff' = 'unlinked') {
  const calls: string[] = [];
  const unexpected: string[] = [];
  let receiptError = false;
  let stale = false;
  let callback = '';
  let state: any = null;
  const events: any[] = [];
  const intake = {
    id: 9001,
    residence_id: 1,
    applicant_name: 'Synthetic Review Applicant',
    applicant_email: 'synthetic@example.test',
    applicant_phone: null,
    preferred_contact: 'email',
    answers: {},
    consent_to_contact: true,
    status: 'converted',
    reviewed_at: null,
    review_notes: 'Synthetic prior contact; date unknown',
    converted_person_id: 2,
    converted_application_id: 8001,
    source: 'synthetic-local-review',
    created_at: '2026-10-21T12:00:00Z',
  };
  const token = () => {
    const enc = (x: any) => Buffer.from(JSON.stringify(x)).toString('base64url');
    return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ sub: uuid, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.synthetic-not-valid`;
  };
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname;
    const json = (body: any, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.hostname === 'challenges.cloudflare.com')
      return route.fulfill({
        contentType: 'application/javascript',
        body: `window.turnstile={render(el,opts){el.textContent='Synthetic security-check fixture (not live Turnstile)';setTimeout(()=>opts.callback('synthetic-token'),10);return 'fixture';},remove(){},reset(){}};`,
      });
    if (url.origin !== ORIGIN) {
      unexpected.push(url.origin + p);
      return route.abort();
    }
    if (p.startsWith('/api/')) return json({ error: 'synthetic offline weather' }, 503);
    if (!p.startsWith('/__synthetic_supabase/')) return route.continue();
    calls.push(route.request().method() + ' ' + p);
    if (p.includes('/auth/v1/signup')) {
      const data = route.request().postDataJSON();
      callback = data?.options?.emailRedirectTo ?? url.searchParams.get('redirect_to') ?? '';
      return json({ user: { id: uuid, email: 'synthetic@example.test' }, session: null });
    }
    if (p.includes('/auth/v1/token'))
      return json({
        access_token: token(),
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'synthetic-no-server-credential',
        user: { id: uuid, email: 'synthetic@example.test', user_metadata: {} },
      });
    if (p.includes('/auth/v1/logout')) return json({});
    if (p.includes('/auth/v1/user'))
      return json({ id: uuid, email: 'synthetic@example.test', user_metadata: {} });
    if (p.includes('/functions/v1/residence-intake'))
      return json(
        receiptError ? { ok: false, code: 'unavailable' } : { ok: true, intake_id: 9001 },
        receiptError ? 503 : 200,
      );
    if (p.endsWith('/rest/v1/people'))
      return json(
        actor === 'unlinked'
          ? null
          : { id: 1, auth_user_id: uuid, first_name: 'Synthetic', last_name: 'Reviewer' },
      );
    if (p.endsWith('/rest/v1/role_assignments'))
      return json(
        actor === 'staff' ? [{ person_id: 1, role_key: 'residence_staff', residence_id: 1 }] : [],
      );
    if (p.endsWith('/rest/v1/residence_application_intake')) return json([intake]);
    if (p.endsWith('/rest/v1/housing_follow_through')) return json(state);
    if (p.endsWith('/rest/v1/housing_follow_through_events')) return json(events);
    if (p.endsWith('/rpc/act_housing_follow_through')) {
      if (stale) {
        stale = false;
        return json({ message: 'stale_version' }, 409);
      }
      const data = route.request().postDataJSON();
      state ??= {
        intake_id: 9001,
        owner_person_id: null,
        proposed_cover_person_id: null,
        next_action: null,
        due_at: null,
        closed_at: null,
        bed_state: 'unverified',
        version: 0,
      };
      if (data.p_action === 'claim') state.owner_person_id = 1;
      if (data.p_action === 'next_action') {
        state.next_action = data.p_detail.text;
        state.due_at = data.p_detail.due_at;
      }
      if (data.p_action === 'complete_action') {
        state.next_action = null;
        state.due_at = null;
      }
      state.version++;
      events.push({
        id: events.length + 1,
        actor_person_id: 1,
        occurred_at: '2026-10-21T12:00:00Z',
        action: data.p_action,
        detail: { input: data.p_detail },
      });
      return json(state);
    }
    if (
      [
        '/leads',
        '/consent_types',
        '/consent_grants',
        '/residence_directory_public',
        '/residencies',
        '/residence_applications',
        '/document_assignments',
      ].some((x) => p.endsWith('/rest/v1' + x))
    )
      return json([]);
    unexpected.push(p);
    return json({ message: 'unhandled synthetic request' }, 500);
  });
  return {
    calls,
    unexpected,
    failReceipt: () => {
      receiptError = true;
    },
    conflict: () => {
      stale = true;
    },
    get callback() {
      return callback;
    },
  };
}
async function shot(page: Page, name: string, project: string) {
  await page.screenshot({ path: `${evidence}/${project}-${name}.png`, fullPage: true });
  await page.screenshot({ path: `${evidence}/${project}-${name}-viewport.png`, fullPage: false });
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
}
async function login(page: Page) {
  await page.getByLabel('Email', { exact: true }).fill('synthetic@example.test');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-local-input');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
async function fillIntake(page: Page) {
  await page.getByLabel('Applicant’s name').fill('Synthetic Review Applicant');
  await page.getByLabel('Email', { exact: true }).fill('synthetic@example.test');
  await page.locator('select[name="preferredContact"]').selectOption('email');
  await page.locator('input[name="age18"]').check();
  await page.locator('input[name="consentToContact"]').check();
}

test('public task front door and account-free resource/support/housing pages', async ({
  page,
}, info) => {
  const f = await fixture(page);
  await page.goto('/community-center');
  await expect(page.getByRole('navigation', { name: 'Start a task' })).toBeVisible();
  await noOverflow(page);
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(scan.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
  await shot(page, 'front-door', info.project.name);
  await page.getByRole('link', { name: 'Find resources', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/community-center\/resources/);
  await expect(page.getByRole('link', { name: /Iowa 211/i }).first()).toBeVisible();
  await noOverflow(page);
  await shot(page, 'resources', info.project.name);
  for (const route of ['/support', '/recovery-residences']) {
    await page.goto(route);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(page.url()).not.toContain('/sign-in');
    await noOverflow(page);
  }
  expect(f.calls.some((x) => x.includes('/auth/'))).toBe(false);
  expect(f.unexpected).toEqual([]);
});
for (const home of ['grace-house', 'ejwrh'])
  test(`account-free ${home} application receipt`, async ({ page }, info) => {
    const f = await fixture(page);
    await page.goto(`/recovery-residences/${home}/apply`);
    await expect(page.getByRole('button', { name: 'Send my application' })).toBeVisible();
    await fillIntake(page);
    await noOverflow(page);
    await shot(page, home + '-application', info.project.name);
    await page.getByRole('button', { name: 'Send my application' }).click();
    await expect(page.getByText('Your application was received.')).toBeVisible();
    await expect(page.getByText('Application reference: 9001')).toBeVisible();
    await shot(page, home + '-receipt', info.project.name);
    expect(f.calls.filter((x) => x.includes('/auth/'))).toEqual([]);
    expect(f.unexpected).toEqual([]);
  });
test('uncertain intake receipt keeps values and warns against duplicate submission', async ({
  page,
}, info) => {
  const f = await fixture(page);
  f.failReceipt();
  await page.goto('/recovery-residences/grace-house/apply');
  await fillIntake(page);
  await page.getByRole('button', { name: 'Send my application' }).click();
  await expect(page.getByText(/We couldn’t confirm receipt/)).toBeVisible();
  await expect(page.getByLabel('Applicant’s name')).toHaveValue('Synthetic Review Applicant');
  await shot(page, 'uncertain-receipt', info.project.name);
  expect(f.unexpected).toEqual([]);
});
test('housing sign-in intent survives registration link and refresh without linking identity', async ({
  page,
}, info) => {
  const f = await fixture(page);
  await page.goto('/my-housing/consent?tab=overview#main');
  await expect(page.getByRole('link', { name: 'Create your account' })).toHaveAttribute(
    'href',
    '/register?next=%2Fmy-housing%2Fconsent%3Ftab%3Doverview%23main',
  );
  await page.getByRole('link', { name: 'Create your account' }).click();
  await page.reload();
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await login(page);
  await expect(page).toHaveURL(/my-housing\/consent\?tab=overview#main/);
  await expect(page.getByText(/login is not linked to a person record yet/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/login is not linked/)).toBeVisible();
  await noOverflow(page);
  await shot(page, 'unlinked-housing', info.project.name);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  expect(f.calls.some((x) => x.includes('ensure_person'))).toBe(false);
  expect(f.unexpected).toEqual([]);
});
test('linked housing consent is reachable without resident or participant roles', async ({
  page,
}, info) => {
  const f = await fixture(page, 'applicant');
  await page.goto('/my-housing/consent');
  await login(page);
  await expect(page.getByRole('heading', { name: /consent/i }).first()).toBeVisible();
  await expect(page.getByText(/login is not linked/)).toHaveCount(0);
  await shot(page, 'housing-consent', info.project.name);
  expect(f.calls.some((x) => x.includes('ensure_person'))).toBe(false);
  expect(f.unexpected).toEqual([]);
});
test('staff converted intake follow-through claim, commitment, conflict and refresh', async ({
  page,
}, info) => {
  const f = await fixture(page, 'staff');
  await page.goto('/residences/applications/intake');
  await login(page);
  await expect(page.getByText('Synthetic Review Applicant')).toBeVisible();
  await page.getByText('Housing follow-through · intake #9001', { exact: true }).click();
  await page.getByRole('button', { name: 'Take housing ownership' }).click();
  await expect(page.getByText(/Current owner: Staff #1/)).toBeVisible();
  await page
    .getByLabel('Next housing action', { exact: true })
    .fill('Call synthetic applicant to confirm next step');
  await page.getByLabel('Due time (your local time)').fill('2026-11-01T12:00');
  await page.getByRole('button', { name: 'Add commitment' }).click();
  await expect(page.getByRole('button', { name: 'Add commitment' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Close housing follow-through' })).toBeDisabled();
  await noOverflow(page);
  await shot(page, 'staff-commitment', info.project.name);
  await page
    .getByLabel('Evidence or reason', { exact: false })
    .fill('Synthetic callback completed');
  f.conflict();
  await page.getByRole('button', { name: 'Record commitment completed' }).click();
  await expect(page.getByText(/Not confirmed saved/)).toBeInViewport();
  await shot(page, 'staff-conflict', info.project.name);
  await page.getByRole('button', { name: 'Refresh housing' }).click();
  await page.getByRole('button', { name: 'Record commitment completed' }).click();
  await expect(page.getByText('Outstanding housing commitment: None recorded')).toBeVisible();
  await page.reload();
  await page.getByText('Housing follow-through · intake #9001', { exact: true }).click();
  await expect(page.getByText(/Current owner: Staff #1/)).toBeVisible();
  expect(f.unexpected).toEqual([]);
});
test('an applicant cannot enter staff intake via next', async ({ page }, info) => {
  const f = await fixture(page, 'applicant');
  await page.goto('/residences/applications/intake');
  await login(page);
  await expect(page).toHaveURL(/not-authorized/);
  await shot(page, 'staff-denied', info.project.name);
  expect(f.calls.some((x) => x.includes('residence_application_intake'))).toBe(false);
  expect(f.unexpected).toEqual([]);
});

test('registration email callback preserves housing destination in a new navigation', async ({
  page,
}, info) => {
  const f = await fixture(page);
  await page.goto('/register?next=%2Fmy-housing%2Fconsent');
  await page.getByLabel('First name').fill('Synthetic');
  await page.getByLabel('Last name').fill('Applicant');
  await page.getByLabel('Email', { exact: true }).fill('synthetic@example.test');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-local-input');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByText('One more step — check your email')).toBeVisible();
  expect(f.callback).toBe(ORIGIN + '/sign-in?next=%2Fmy-housing%2Fconsent');
  await shot(page, 'email-confirmation', info.project.name);
  await page.goto(f.callback);
  await login(page);
  await expect(page).toHaveURL(/my-housing\/consent$/);
  await expect(page.getByText(/login is not linked/)).toBeVisible();
  expect(f.unexpected).toEqual([]);
});
