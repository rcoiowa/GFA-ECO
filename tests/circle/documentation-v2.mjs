// Runs in the existing in-memory synthetic Circle database, never against a URL.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export async function testDocumentationV2(db, { as, adminQuery, call, cbh, foreign, saved }) {
  await adminQuery(
    'create table recoveryos.person_classification(person_id bigint primary key references recoveryos.people(id), classification text not null)',
  );
  await adminQuery(
    "insert into recoveryos.person_classification select id,'production' from recoveryos.people",
  );
  await adminQuery('create role service_role bypassrls');
  await adminQuery('grant usage on schema recoveryos,recoveryos_circle_private to service_role');
  // Simulate inherited Supabase grants, to prove explicit revocation is sufficient.
  await adminQuery(
    'alter default privileges in schema recoveryos grant all on tables to anon,authenticated,service_role',
  );
  await adminQuery(
    'alter default privileges in schema recoveryos,recoveryos_circle_private grant execute on functions to service_role',
  );
  const beforeRows = (await adminQuery('select * from recoveryos.meetings order by id')).rows;
  const beforeAcl = (
    await adminQuery(`select oid::regprocedure::text as signature,proacl::text from pg_proc where oid in (
    'recoveryos.record_circle_meeting(bigint,timestamptz,timestamptz,text,integer,text[],text,text,text,text)'::regprocedure,
    'recoveryos.get_my_circle_workspace()'::regprocedure) order by signature`)
  ).rows;
  const review = JSON.parse(
    await fs.readFile('docs/proposals/gfarc-workspace/persistence-review.json', 'utf8'),
  );
  const sql = await fs.readFile(review.sql, 'utf8');
  assert.equal(
    createHash('sha256').update(sql).digest('hex'),
    review.sha256,
    'Prepared SQL requires exact-hash review',
  );
  // PostgreSQL documents octal escapes portably; do not depend on \v support.
  assert.equal((sql.match(/\\013/g) ?? []).length, 2, 'Both note trims use vertical-tab octal');
  assert.equal(sql.includes(String.raw`\v`), false, 'Do not use a version-specific escape');
  await db.exec(sql);
  assert.deepEqual(
    (await adminQuery('select * from recoveryos.meetings order by id')).rows,
    beforeRows,
  );
  assert.deepEqual(
    (
      await adminQuery(`select oid::regprocedure::text as signature,proacl::text from pg_proc where oid in (
    'recoveryos.record_circle_meeting(bigint,timestamptz,timestamptz,text,integer,text[],text,text,text,text)'::regprocedure,
    'recoveryos.get_my_circle_workspace()'::regprocedure) order by signature`)
    ).rows,
    beforeAcl,
  );
  await adminQuery(
    'update recoveryos.meeting_facilitator_assignments set revoked_at=null where series_id=1 and person_id=2',
  );
  const workspace = async () =>
    (await db.query('select recoveryos.get_my_circle_workspace() as w')).rows[0].w;
  const v2 = (overrides = {}) => {
    const a = {
      series: 1,
      start: '2026-10-06T23:30:00Z',
      end: '2026-10-07T00:30:00Z',
      status: 'held',
      count: 15,
      names: ['Facilitator One', 'Facilitator Two'],
      first: 3,
      notes: 'Leave more time for the closing reflection.',
      ...overrides,
    };
    return db
      .query(
        'select recoveryos.record_circle_meeting_v2($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) as r',
        [
          a.series,
          a.start,
          a.end,
          a.status,
          a.count,
          a.names,
          null,
          null,
          null,
          null,
          a.first,
          a.notes,
        ],
      )
      .then((r) => r.rows[0].r);
  };
  await as(2);
  const initial = await workspace();
  assert.equal(initial.capabilities.circle_documentation_v2, true);
  assert.equal(
    initial.meetings.find((m) => m.id === saved.meeting_id).first_time_participant_count,
    null,
  );
  assert.equal(initial.meetings.find((m) => m.id === saved.meeting_id).facilitator_notes, null);
  const newRecord = await v2();
  assert.equal(newRecord.code, 'recorded');
  assert.equal((await v2()).code, 'already_recorded');
  assert.equal((await v2()).meeting_id, newRecord.meeting_id);
  assert.equal(
    (await v2({ notes: '  Leave more time for the closing reflection.  ' })).code,
    'already_recorded',
  );
  assert.equal((await v2({ first: 4 })).code, 'duplicate_conflict');
  assert.equal((await v2({ notes: 'Different reflection.' })).code, 'duplicate_conflict');
  assert.equal((await v2({ count: 16 })).code, 'duplicate_conflict');
  const mine = (await workspace()).meetings.find((m) => m.id === newRecord.meeting_id);
  assert.equal(mine.first_time_participant_count, 3);
  assert.equal(mine.facilitator_notes, 'Leave more time for the closing reflection.');
  assert.equal(mine.total_attendance, 17);
  // Legacy v1 repeat does not discard documentation; v2 cannot retrofit a v1 record.
  const oldRepeat = await db.query(
    'select recoveryos.record_circle_meeting($1,$2,$3,$4,$5,$6) as r',
    [
      1,
      '2026-10-06T23:30:00Z',
      '2026-10-07T00:30:00Z',
      'held',
      15,
      ['Facilitator One', 'Facilitator Two'],
    ],
  );
  assert.equal(oldRepeat.rows[0].r.code, 'already_recorded');
  assert.equal(
    (await workspace()).meetings.find((m) => m.id === newRecord.meeting_id).facilitator_notes,
    mine.facilitator_notes,
  );
  const legacy = await call({ start: '2026-10-13T23:30:00Z', end: '2026-10-14T00:30:00Z' });
  const legacyV2 = (first, notes) =>
    db.query(
      'select recoveryos.record_circle_meeting_v2($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) as r',
      [
        1,
        '2026-10-13T23:30:00Z',
        '2026-10-14T00:30:00Z',
        'held',
        15,
        ['Thomas', 'Archaletta'],
        'Slogan 31: Speak well of others in recovery',
        'Community Building',
        'Empower',
        'Social',
        first,
        notes,
      ],
    );
  assert.equal(
    (await legacyV2(1, 'Cannot attach to history.')).rows[0].r.code,
    'duplicate_conflict',
  );
  assert.equal((await legacyV2(null, null)).rows[0].r.code, 'already_recorded');
  assert.equal(
    (await workspace()).meetings.find((m) => m.id === legacy.meeting_id)
      .first_time_participant_count,
    null,
  );
  for (const first of [-1, 16]) await assert.rejects(v2({ first }), /invalid_first_time_count/);
  await assert.rejects(v2({ first: 1.5 }), /invalid input syntax for type integer/);
  await assert.rejects(v2({ notes: 'x'.repeat(2001) }), /invalid_facilitator_notes/);
  await assert.rejects(v2({ notes: '🌿'.repeat(2001) }), /invalid_facilitator_notes/);
  await assert.rejects(v2({ count: 0, first: 1 }), /invalid_first_time_count/);
  await assert.rejects(
    v2({ status: 'cancelled', count: null, names: [], first: 0 }),
    /invalid_first_time_count/,
  );
  await assert.rejects(v2({ series: foreign }), /not_authorized/);
  const empty = await v2({
    start: '2026-10-20T23:30:00Z',
    end: '2026-10-21T00:30:00Z',
    first: 0,
    notes: ' \t\n ',
  });
  assert.equal(
    (await workspace()).meetings.find((m) => m.id === empty.meeting_id)
      .first_time_participant_count,
    0,
  );
  assert.equal(
    (await workspace()).meetings.find((m) => m.id === empty.meeting_id).facilitator_notes,
    null,
  );
  const cancelled = await v2({
    start: '2026-10-27T23:30:00Z',
    end: null,
    status: 'cancelled',
    count: null,
    names: [],
    first: null,
    notes: 'Room unavailable.',
  });
  assert.equal(
    (await workspace()).meetings.find((m) => m.id === cancelled.meeting_id)
      .first_time_participant_count,
    null,
  );
  const unicode = await v2({
    start: '2026-11-03T23:30:00Z',
    end: null,
    first: null,
    notes: '🌿'.repeat(2000),
  });
  assert.equal(unicode.code, 'recorded');
  const zero = await v2({
    start: '2026-11-04T23:30:00Z',
    end: null,
    count: 0,
    first: 0,
    notes: null,
  });
  assert.equal(
    (await workspace()).meetings.find((m) => m.id === zero.meeting_id).first_time_participant_count,
    0,
  );
  // Persist, read back and retry boundary letters and all supported trim characters.
  // These samples are synthetic process text, never participant records.
  const noteCases = [
    ['visit the new room', 'visit the new room'],
    ['review v', 'review v'],
    ['v', 'v'],
    [' \t\n\r\f\vvisit the room v\v\f\r\n\t ', 'visit the room v'],
    ['\v', null],
    [' \t\n\r\f\v ', null],
    ['review\vprocess', 'review\vprocess'],
  ];
  for (const [index, [input, expected]] of noteCases.entries()) {
    const values = {
      start: `2026-09-${String(index + 1).padStart(2, '0')}T23:30:00Z`,
      end: null,
      notes: input,
    };
    const result = await v2(values);
    assert.equal(result.code, 'recorded');
    assert.equal(
      (await workspace()).meetings.find((m) => m.id === result.meeting_id).facilitator_notes,
      expected,
      `Note must round trip without losing boundary letters: ${JSON.stringify(input)}`,
    );
    assert.equal((await v2(values)).code, 'already_recorded');
    assert.equal((await v2({ ...values, notes: expected })).code, 'already_recorded');
    // Owner-side synthetic assertion proves the table constraint uses the same trim set.
    await assert.rejects(
      adminQuery(
        'update recoveryos.circle_meeting_documentation set facilitator_notes=$1 where meeting_id=$2',
        ['\vsynthetic process text\v', result.meeting_id],
      ),
      /violates check constraint/,
    );
    await as(2);
  }
  // An insert failure after the base occurrence write rolls the whole RPC back.
  await adminQuery(
    `create function recoveryos.test_reject_document() returns trigger language plpgsql as $$begin raise exception 'synthetic_document_failure'; end$$`,
  );
  await adminQuery(
    'create trigger test_document_failure before insert on recoveryos.circle_meeting_documentation for each row execute function recoveryos.test_reject_document()',
  );
  await as(2);
  await assert.rejects(
    v2({ start: '2026-11-05T23:30:00Z', end: null }),
    /synthetic_document_failure/,
  );
  assert.equal(
    (await workspace()).meetings.some((m) => m.starts_at === '2026-11-05T23:30:00+00:00'),
    false,
  );
  assert.equal(
    (
      await adminQuery(
        "select count(*)::int as n from recoveryos.meetings where starts_at='2026-11-05T23:30:00Z'",
      )
    ).rows[0].n,
    0,
  );
  await adminQuery('drop trigger test_document_failure on recoveryos.circle_meeting_documentation');
  await adminQuery('drop function recoveryos.test_reject_document()');
  await as(2);
  // Repeated queued calls are idempotent. Actual multi-connection race remains a release gate.
  const repeated = await Promise.all([v2(), v2(), v2()]);
  assert.ok(
    repeated.every((r) => r.code === 'already_recorded' && r.meeting_id === newRecord.meeting_id),
  );
  await as(3);
  const other = (await workspace()).meetings.find((m) => m.id === newRecord.meeting_id);
  assert.equal(other.first_time_participant_count, 3);
  assert.equal(other.facilitator_notes, null);
  const sameGuess = await v2(),
    differentGuess = await v2({ notes: 'Different reflection.' });
  assert.deepEqual(sameGuess, differentGuess);
  assert.equal(sameGuess.code, 'duplicate_conflict');
  assert.equal(JSON.stringify(sameGuess).includes('reflection'), false);
  // An authorized second recorder's own note is never visible to the first.
  const second = await v2({
    start: '2026-10-07T23:30:00Z',
    end: null,
    notes: 'Second recorder process note.',
  });
  await as(2);
  assert.equal(
    (await workspace()).meetings.find((m) => m.id === second.meeting_id).facilitator_notes,
    null,
  );
  // Revocation, banned/deleted/anonymous account all remove private note access.
  await adminQuery(
    'update recoveryos.meeting_facilitator_assignments set revoked_at=now() where person_id=2',
  );
  await as(2);
  assert.equal((await workspace()).meetings.length, 0);
  await assert.rejects(v2(), /not_authorized/);
  await adminQuery(
    'update recoveryos.meeting_facilitator_assignments set revoked_at=null where person_id=2',
  );
  for (const assignment of [
    "banned_until=now()+interval '1 day'",
    'deleted_at=now()',
    'is_anonymous=true',
  ]) {
    await adminQuery(
      `update auth.users set ${assignment} where id='00000000-0000-0000-0000-000000000002'`,
    );
    await as(2);
    assert.equal((await workspace()).meetings.length, 0);
    await assert.rejects(v2(), /not_authorized/);
    await adminQuery(
      "update auth.users set banned_until=null,deleted_at=null,is_anonymous=false where id='00000000-0000-0000-0000-000000000002'",
    );
  }
  await adminQuery('update recoveryos.role_assignments set revoked_at=now() where person_id=3');
  await as(3);
  assert.equal((await workspace()).meetings.length, 0);
  await assert.rejects(v2(), /not_authorized/);
  await adminQuery('update recoveryos.role_assignments set revoked_at=null where person_id=3');
  // Domain-only CBH author loses visibility immediately when eligibility changes.
  await adminQuery(
    "update auth.users set email='facilitator@graceforaddictions.org',email_confirmed_at=now() where id='00000000-0000-0000-0000-000000000002'",
  );
  await as(2);
  const cbhRecord = await v2({ series: cbh, notes: 'CBH process note.' });
  assert.equal(
    (await workspace()).meetings.find((m) => m.id === cbhRecord.meeting_id).facilitator_notes,
    'CBH process note.',
  );
  await adminQuery(
    "update auth.users set email='facilitator@example.org' where id='00000000-0000-0000-0000-000000000002'",
  );
  await as(2);
  assert.equal(
    (await workspace()).meetings.some((m) => m.id === cbhRecord.meeting_id),
    false,
  );
  await assert.rejects(v2({ series: cbh }), /not_authorized/);
  // New RPC cannot be called anonymously even through its non-exposed helper.
  for (const role of ['anon', 'service_role']) {
    await db.exec(`reset role;set role ${role}`);
    await assert.rejects(v2(), /permission denied/);
    await assert.rejects(
      db.query('select recoveryos_circle_private.documented_workspace()'),
      /permission denied/,
    );
    await assert.rejects(
      db.query(
        "select recoveryos_circle_private.record_documented_occurrence(1,now(),null,'held',1,array['Facilitator'],null,null,null,null,0,null)",
      ),
      /permission denied/,
    );
  }
  for (const role of ['anon', 'authenticated', 'service_role']) {
    await db.exec(`reset role;set role ${role}`);
    for (const sql of [
      'select * from recoveryos.circle_meeting_documentation',
      'insert into recoveryos.circle_meeting_documentation(meeting_id,recorded_by_person_id) values(1,2)',
      'update recoveryos.circle_meeting_documentation set facilitator_notes=null',
      'delete from recoveryos.circle_meeting_documentation',
    ])
      await assert.rejects(db.query(sql), /permission denied/);
  }
  await as(2);
  await db.exec("select set_config('request.jwt.claim.sub','',false)");
  await assert.rejects(v2(), /unauthenticated/);
  await assert.rejects(workspace(), /unauthenticated/);
  const all = (await adminQuery('select * from recoveryos.meetings order by id')).rows;
  assert.deepEqual(
    all.filter((m) => beforeRows.some((x) => x.id === m.id)),
    beforeRows,
  );
  assert.equal(
    (
      await adminQuery(
        'select count(*)::int as n from recoveryos.circle_meeting_documentation where meeting_id=$1',
        [newRecord.meeting_id],
      )
    ).rows[0].n,
    1,
  );
  assert.equal(
    (
      await adminQuery(
        "select relrowsecurity from pg_class where oid='recoveryos.circle_meeting_documentation'::regclass",
      )
    ).rows[0].relrowsecurity,
    true,
  );
  console.log(
    'PASS v2: historical/ACL preservation; optional first-time/zero/cancelled validation; atomic document save/readback; recorder notes/global-only isolation; duplicate equality protection; legacy retry; revocation/banned/deleted/anonymous/domain eligibility; direct CRUD and anon/service-role denial.',
  );
  return { v2, workspace, newRecord, second, cbhRecord };
}
