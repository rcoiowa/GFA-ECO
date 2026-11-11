import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { checkTableAccess } from './check-table-access.mjs';
test('new tables fail closed until every role has an explicit reviewed decision', () => {
  const root = mkdtempSync(join(tmpdir(), 'gfa-manifest-'));
  try {
    mkdirSync(join(root, 'supabase/launch/migrations'), { recursive: true });
    mkdirSync(join(root, 'docs/readiness/2026-10-30'), { recursive: true });
    const file = 'supabase/launch/migrations/9999_test.sql',
      sql = 'create table recoveryos.synthetic(id bigint);';
    writeFileSync(join(root, file), sql);
    const manifest = { appliedHistory: {}, newMigrations: {} };
    const save = () =>
      writeFileSync(
        join(root, 'docs/readiness/2026-10-30/table-access-manifest.json'),
        JSON.stringify(manifest),
      );
    save();
    assert.equal(checkTableAccess(root).length, 1);
    const roles = Object.fromEntries(
      ['PUBLIC', 'anon', 'authenticated', 'service_role'].map((role) => [
        role,
        {
          privileges: [],
          reason: 'RPC-only private source',
          sqlEvidence: 'explicit revoke reviewed',
        },
      ]),
    );
    manifest.newMigrations[file] = {
      sha256: createHash('sha256').update(sql).digest('hex'),
      reviewer: 'synthetic reviewer',
      rationale: 'fixture',
      tables: {
        'recoveryos.synthetic': {
          roles,
          rlsEvidence: 'enabled',
          denialTests: 'synthetic denial assertions',
          rpcReview: 'scoped RPC only',
        },
      },
    };
    save();
    assert.deepEqual(checkTableAccess(root), []);
    delete roles.service_role;
    save();
    assert.match(checkTableAccess(root).join(), /service_role/);
    manifest.appliedHistory[file] = 'bad checksum';
    save();
    assert.match(checkTableAccess(root).join(), /history changed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
