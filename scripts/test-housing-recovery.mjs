// Isolated synthetic PostgreSQL tests. No remote credentials or participant data.
// PGLITE_MODULE may point to an externally installed, pinned @electric-sql/pglite.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated;
create schema recoveryos; grant usage on schema recoveryos to anon,authenticated;
create function recoveryos.current_person_id() returns bigint language sql as
  $$ select nullif(current_setting('test.person',true),'')::bigint $$;
create function recoveryos.is_residence_manager_of(bigint) returns boolean language sql as
  $$ select recoveryos.current_person_id() = 100 + $1 $$;
create table recoveryos.residences(id bigint primary key,capacity integer);
create table recoveryos.residence_units(id bigint generated always as identity primary key,residence_id bigint,name text);
create table recoveryos.residence_rooms(id bigint generated always as identity primary key,unit_id bigint,name text);
create table recoveryos.residence_beds(id bigint generated always as identity primary key,room_id bigint,name text,is_active boolean default true);
create table recoveryos.residence_applications(id bigint primary key,person_id bigint,residence_id bigint,status text,decided_at timestamptz,decided_by_person_id bigint,notes text,answers jsonb);
create table recoveryos.residencies(id bigint primary key,person_id bigint,residence_id bigint,residency_status text);
create table recoveryos.audit_log(id bigint generated always as identity primary key,actor_person_id bigint,action text,entity_table text,entity_id bigint,detail jsonb);
create table recoveryos.document_assignments(id bigint primary key,application_id bigint,signed_at timestamptz);
create table recoveryos.consent_grants(id bigint primary key,person_id bigint,status text);
insert into recoveryos.residences values (1,null),(2,3);
insert into recoveryos.residence_applications values (1,1,1,'approved','2026-10-01',101,'preserve','{"answer":"preserve"}'),(2,2,2,'approved','2026-10-01',102,null,null),(3,3,1,'withdrawn',null,null,null,null);
insert into recoveryos.document_assignments values (1,1,'2026-10-01');
insert into recoveryos.consent_grants values (1,1,'granted');
`);
await db.exec(
  await readFile(
    new URL(
      '../supabase/launch/migrations/20261014214230_housing_recovery_controls.sql',
      import.meta.url,
    ),
    'utf8',
  ),
);
let checks = 0;
async function expectCode(sql, code) {
  const result = (await db.query(sql)).rows[0].result;
  assert.equal(result.code, code);
  checks++;
}
await db.exec("set role authenticated; select set_config('test.person','',false)");
await expectCode('select recoveryos.set_residence_capacity(1,4,null) result', 'unauthenticated');
await db.exec("select set_config('test.person','101',false)");
await expectCode('select recoveryos.set_residence_capacity(2,4,3) result', 'not_authorized');
await expectCode('select recoveryos.set_residence_capacity(1,-1,null) result', 'invalid_capacity');
await expectCode(
  "select recoveryos.add_residence_room_beds(1,'Floor','A',2) result",
  'capacity_required',
);
await expectCode('select recoveryos.set_residence_capacity(1,4,null) result', 'saved');
await expectCode('select recoveryos.set_residence_capacity(1,5,null) result', 'stale_capacity');
await expectCode("select recoveryos.add_residence_room_beds(1,'Floor','A',2) result", 'created');
await expectCode(
  "select recoveryos.add_residence_room_beds(1,'floor',' a ',2) result",
  'room_exists',
);
await expectCode(
  "select recoveryos.add_residence_room_beds(1,'Floor','B',3) result",
  'exceeds_capacity',
);
await expectCode(
  'select recoveryos.set_residence_capacity(1,1,4) result',
  'below_configured_capacity',
);
await expectCode(
  "select recoveryos.reopen_residence_application(2,'approved','Review was incomplete') result",
  'not_authorized',
);
await expectCode(
  "select recoveryos.reopen_residence_application(1,'approved','') result",
  'reason_required',
);
await expectCode(
  "select recoveryos.reopen_residence_application(1,'declined','Review was incomplete') result",
  'stale_application',
);
await expectCode(
  "select recoveryos.reopen_residence_application(3,'withdrawn','Review was incomplete') result",
  'invalid_transition',
);
await expectCode(
  "select recoveryos.reopen_residence_application(1,'approved','Review was incomplete') result",
  'reopened',
);
await expectCode(
  "select recoveryos.reopen_residence_application(1,'approved','Review was incomplete') result",
  'stale_application',
);
await db.exec('reset role');
const app = (await db.query('select * from recoveryos.residence_applications where id=1')).rows[0];
assert.equal(app.status, 'in_review');
assert.equal(app.notes, 'preserve');
assert.equal(app.answers.answer, 'preserve');
assert.equal(app.decided_at, null);
checks++;
assert.equal(
  (
    await db.query(
      'select count(*)::int n from recoveryos.document_assignments where signed_at is not null',
    )
  ).rows[0].n,
  1,
);
checks++;
assert.equal(
  (await db.query("select count(*)::int n from recoveryos.consent_grants where status='granted'"))
    .rows[0].n,
  1,
);
checks++;
const audit = (
  await db.query(
    "select detail from recoveryos.audit_log where action='residence_application.reopened'",
  )
).rows[0].detail;
assert.equal(audit.previous_status, 'approved');
assert.equal(audit.previous_decided_by_person_id, 101);
checks++;
await db.exec(
  "insert into recoveryos.residencies values(2,2,2,'active'); set role authenticated; select set_config('test.person','102',false)",
);
await expectCode(
  "select recoveryos.reopen_residence_application(2,'approved','Review was incomplete') result",
  'residency_exists',
);
await db.exec('reset role; set role anon');
await assert.rejects(
  db.query('select recoveryos.set_residence_capacity(1,6,4)'),
  /permission denied/,
);
checks++;
await db.close();
console.log(
  `${checks} synthetic PostgreSQL checks passed (not a live authorization or concurrency test).`,
);
