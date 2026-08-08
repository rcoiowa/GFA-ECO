#!/usr/bin/env node
/**
 * P4H live-gate fixture seeder (docs/product/p4h-e2e-runbook.md).
 *
 * Runs SERVER-SIDE ONLY (GitHub Actions / operator shell) with the Supabase
 * service key. Creates or refreshes the stable p4h-* synthetic identities,
 * grants their scoped roles, and classifies every one `test_fixture` so no
 * gate run can ever touch production evidence. Idempotent — safe to run
 * before every gate execution.
 *
 * Env:
 *   SUPABASE_URL                 launch project URL
 *   SUPABASE_SERVICE_ROLE_KEY    service key (NEVER in a browser/client)
 *   P4H_E2E_PASSWORD             fixture password (per-run random is fine)
 *   P4H_E2E_EMAIL_DOMAIN         default fixtures.recoveryos.test
 */

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.P4H_E2E_PASSWORD;
const DOMAIN = process.env.P4H_E2E_EMAIL_DOMAIN ?? 'fixtures.recoveryos.test';

if (!URL_ || !KEY || !PASSWORD) {
  console.error(
    'seed-e2e-fixtures: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and P4H_E2E_PASSWORD are required.',
  );
  process.exit(1);
}

const authHeaders = { apikey: KEY, authorization: `Bearer ${KEY}`, 'content-type': 'application/json' };
const restHeaders = {
  ...authHeaders,
  'accept-profile': 'recoveryos',
  'content-profile': 'recoveryos',
};

async function rest(path, init = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { ...restHeaders, ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`REST ${path}: ${res.status} ${await res.text()}`);
  // PostgREST answers 201/204 with an empty body unless return=representation.
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function listAllUsers() {
  const users = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(`${URL_}/auth/v1/admin/users?page=${page}&per_page=100`, {
      headers: authHeaders,
    });
    if (!res.ok) throw new Error(`admin list users: ${res.status} ${await res.text()}`);
    const body = await res.json();
    const batch = body.users ?? body;
    users.push(...batch);
    if (batch.length < 100) break;
  }
  return users;
}

async function ensureUser(email, existing) {
  const found = existing.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());
  if (found) {
    const res = await fetch(`${URL_}/auth/v1/admin/users/${found.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ password: PASSWORD, email_confirm: true }),
    });
    if (!res.ok) throw new Error(`update ${email}: ${res.status} ${await res.text()}`);
    return found.id;
  }
  const res = await fetch(`${URL_}/auth/v1/admin/users`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true }),
  });
  if (!res.ok) throw new Error(`create ${email}: ${res.status} ${await res.text()}`);
  return (await res.json()).id;
}

async function personIdFor(authUserId, email) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const rows = await rest(`people?auth_user_id=eq.${authUserId}&select=id`);
    if (rows.length) return rows[0].id;
    // The signup trigger normally creates the person; fall back for safety.
    if (attempt === 3) {
      const created = await rest('people', {
        method: 'POST',
        headers: { prefer: 'return=representation' },
        body: JSON.stringify({
          auth_user_id: authUserId,
          first_name: `P4H ${email.split('@')[0].replace('p4h-', '')}`,
          last_name: '(fixture)',
        }),
      });
      return created[0].id;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`no person for ${email}`);
}

async function ensureRole(personId, role, residenceId) {
  const scope = residenceId == null ? 'residence_id=is.null' : `residence_id=eq.${residenceId}`;
  const rows = await rest(
    `role_assignments?person_id=eq.${personId}&role_key=eq.${role}&revoked_at=is.null&${scope}&select=id`,
  );
  if (rows.length) return;
  await rest('role_assignments', {
    method: 'POST',
    body: JSON.stringify({
      person_id: personId,
      role_key: role,
      organization_id: 1,
      residence_id: residenceId,
    }),
  });
}

async function classifyFixture(personId) {
  await rest('person_classification', {
    method: 'POST',
    headers: { prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ person_id: personId, classification: 'test_fixture' }),
  });
}

const residences = await rest('residences?select=id,name&order=id&limit=1');
const residenceId = residences[0]?.id ?? null;
if (residenceId == null) {
  console.error('seed-e2e-fixtures: no residence exists to scope residence roles');
  process.exit(1);
}

/** email tag → roles beyond the automatic participant grant */
const PLAN = [
  ['p4h-participant', []],
  ['p4h-coach', ['coach']],
  ['p4h-navigator', ['navigator']],
  ['p4h-residence-manager', [['residence_manager', residenceId]]],
  ['p4h-residence-staff', [['residence_staff', residenceId]]],
  ['p4h-resident', [['resident', residenceId]]],
  ['p4h-admin', ['administrator']],
  ['p4h-executive', ['executive']],
  ['p4h-operator', []],
];

const existing = await listAllUsers();
for (const [tag, roles] of PLAN) {
  const email = `${tag}@${DOMAIN}`;
  const authId = await ensureUser(email, existing);
  const personId = await personIdFor(authId, email);
  for (const entry of roles) {
    const [role, resId] = Array.isArray(entry) ? entry : [entry, null];
    await ensureRole(personId, role, resId);
  }
  await classifyFixture(personId);
  console.log(`seeded ${email} (person ${personId})`);
}

// Classify any per-run timestamped identities left by earlier gate runs
// (invitation/signup tests mint p4h-*-<ts>@domain emails via the real flows).
const strayUsers = existing.filter(
  (u) => (u.email ?? '').startsWith('p4h-') && (u.email ?? '').endsWith(`@${DOMAIN}`),
);
for (const u of strayUsers) {
  const rows = await rest(`people?auth_user_id=eq.${u.id}&select=id`);
  if (rows.length) await classifyFixture(rows[0].id);
}
console.log(`seed complete — residence scope ${residenceId}; ${PLAN.length} stable fixtures.`);
