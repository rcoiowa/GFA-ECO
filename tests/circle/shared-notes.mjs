// Synthetic-only role matrix for the November 9 operational-note sharing decision.
import assert from 'node:assert/strict';

export async function testSharedNotes(
  db,
  { as, adminQuery, call, cbh, foreign, v2, workspace, newRecord, cbhRecord },
) {
  for (const role of [
    'administrator',
    'executive',
    'system_administrator',
    'intake_worker',
    'intake_coordinator',
  ]) {
    await adminQuery(`alter type recoveryos.role_key add value if not exists '${role}'`);
  }
  await adminQuery('insert into recoveryos.programs values (10,1),(99,99)');
  await adminQuery('insert into recoveryos.residences values (10,1)');
  const setRole = async (role, { org = 1, program = null, residence = null } = {}) => {
    await adminQuery('delete from recoveryos.role_assignments where person_id=3');
    if (role)
      await adminQuery(
        'insert into recoveryos.role_assignments(person_id,role_key,organization_id,program_id,residence_id) values(3,$1,$2,$3,$4)',
        [role, org, program, residence],
      );
    await as(3);
  };
  const note = (ws, id) => ws.meetings.find((m) => m.id === id)?.facilitator_notes ?? null;
  const ownName = 'Leave more time for the closing reflection.';
  // Operational staff get existing series scope, not the CBH email OR shortcut.
  for (const role of [
    'coach',
    'navigator',
    'program_coordinator',
    'residence_staff',
    'residence_manager',
  ]) {
    await setRole(role);
    const ws = await workspace();
    assert.equal(note(ws, newRecord.meeting_id), ownName, `${role}: standard notes`);
    assert.equal(
      note(ws, cbhRecord.meeting_id),
      ['coach', 'navigator'].includes(role) ? 'CBH process note.' : null,
      `${role}: CBH notes`,
    );
    await adminQuery(
      "update auth.users set email='staff@graceforaddictions.org' where id='00000000-0000-0000-0000-000000000003'",
    );
    await as(3);
    assert.equal(
      note(await workspace(), cbhRecord.meeting_id),
      ['coach', 'navigator'].includes(role) ? 'CBH process note.' : null,
      `${role}: email must not widen CBH notes`,
    );
    await adminQuery(
      "update auth.users set email='person3@example.org' where id='00000000-0000-0000-0000-000000000003'",
    );
  }
  // The new leadership entitlement is READ ONLY. v1/v2 recording rights unchanged.
  for (const role of ['program_manager', 'administrator', 'executive']) {
    await setRole(role);
    const ws = await workspace();
    assert.equal(ws.series.length, 0, `${role}: no writable series`);
    assert.ok(ws.readOnlySeries.some((s) => s.id === 1));
    assert.ok(ws.readOnlySeries.some((s) => s.id === cbh));
    assert.equal(note(ws, newRecord.meeting_id), ownName);
    assert.equal(note(ws, cbhRecord.meeting_id), 'CBH process note.');
    await assert.rejects(v2(), /not_authorized/);
    await assert.rejects(call(), /not_authorized/);
    await assert.rejects(v2({ series: cbh }), /not_authorized/);
  }
  // All three scope kinds can establish GFA organizational compatibility.
  for (const scope of [
    { org: 1 },
    { org: null, program: 10 },
    { org: null, residence: 10 },
    { org: 1, program: 10, residence: 10 },
  ]) {
    await setRole('executive', scope);
    assert.equal(note(await workspace(), newRecord.meeting_id), ownName);
  }
  for (const scope of [
    { org: null },
    { org: 99 },
    { org: null, program: 99 },
    { org: null, residence: 99 },
    { org: 1, program: 99 },
    { org: 1, residence: 99 },
    { org: 99, program: 10, residence: 10 },
    { org: null, program: 10, residence: 99 },
  ]) {
    await setRole('executive', scope);
    assert.equal(note(await workspace(), newRecord.meeting_id), null);
  }
  // Do not combine a global eligible role with an unrelated GFA-bound role row.
  await setRole('executive', { org: null });
  await adminQuery(
    "insert into recoveryos.role_assignments(person_id,role_key,organization_id) values(3,'participant',1)",
  );
  await as(3);
  assert.equal(note(await workspace(), newRecord.meeting_id), null);
  for (const role of [
    'participant',
    'program_manager',
    'administrator',
    'executive',
    'system_administrator',
    'intake_worker',
    'intake_coordinator',
  ]) {
    await setRole(role, { org: null });
    assert.equal(note(await workspace(), newRecord.meeting_id), null);
  }
  for (const role of [
    'system_administrator',
    'intake_worker',
    'intake_coordinator',
    'participant',
  ]) {
    await setRole(role);
    assert.equal(note(await workspace(), newRecord.meeting_id), null);
  }
  // Explicit meeting assignment is permission to record, not to read others' notes.
  await setRole(null);
  await adminQuery(
    'insert into recoveryos.meeting_facilitator_assignments(series_id,person_id,assigned_by_person_id) values(1,3,1)',
  );
  await as(3);
  assert.ok((await workspace()).series.some((s) => s.id === 1));
  assert.equal(note(await workspace(), newRecord.meeting_id), null);
  await adminQuery('delete from recoveryos.meeting_facilitator_assignments where person_id=3');
  await adminQuery(
    "update auth.users set email='staff@graceforaddictions.org',email_confirmed_at=now() where id='00000000-0000-0000-0000-000000000003'",
  );
  await as(3);
  assert.ok((await workspace()).series.some((s) => s.id === cbh));
  assert.equal(note(await workspace(), cbhRecord.meeting_id), null);
  await adminQuery(
    "update auth.users set email='person3@example.org' where id='00000000-0000-0000-0000-000000000003'",
  );
  // Non-GFA circles never acquire shared-note visibility from this new rule.
  await adminQuery(
    'insert into recoveryos.meeting_facilitator_assignments(series_id,person_id,assigned_by_person_id) values($1,2,1)',
    [foreign],
  );
  await as(2);
  const foreignRecord = await v2({ series: foreign, notes: 'Other organization process.' });
  await setRole('executive', { org: 99 });
  assert.equal(note(await workspace(), foreignRecord.meeting_id), null);
  await setRole('executive', { org: 1 });
  assert.equal(note(await workspace(), foreignRecord.meeting_id), null);
  // Revocation or invalid account removes the new shared access immediately.
  await adminQuery('update recoveryos.role_assignments set revoked_at=now() where person_id=3');
  await as(3);
  assert.equal(note(await workspace(), newRecord.meeting_id), null);
  await adminQuery('update recoveryos.role_assignments set revoked_at=null where person_id=3');
  for (const change of [
    "banned_until=now()+interval '1 day'",
    'deleted_at=now()',
    'is_anonymous=true',
  ]) {
    await adminQuery(
      `update auth.users set ${change} where id='00000000-0000-0000-0000-000000000003'`,
    );
    await as(3);
    assert.equal(note(await workspace(), newRecord.meeting_id), null);
    assert.equal((await workspace()).readOnlySeries.length, 0);
    await adminQuery(
      "update auth.users set banned_until=null,deleted_at=null,is_anonymous=false where id='00000000-0000-0000-0000-000000000003'",
    );
  }
  // Fixture/unclassified actors get neither notes nor the new persistence capability.
  for (const role of ['coach', 'program_coordinator', 'executive']) {
    await setRole(role);
    for (const classification of ['test_fixture', null]) {
      if (classification)
        await adminQuery(
          'update recoveryos.person_classification set classification=$1 where person_id=3',
          [classification],
        );
      else await adminQuery('delete from recoveryos.person_classification where person_id=3');
      await as(3);
      const ws = await workspace();
      assert.equal(ws.capabilities.circle_documentation_v2, false);
      assert.equal(note(ws, newRecord.meeting_id), null);
      assert.equal(ws.readOnlySeries.length, 0);
      await assert.rejects(v2(), /not_authorized/);
      await adminQuery(
        "insert into recoveryos.person_classification values(3,'production') on conflict(person_id) do update set classification='production'",
      );
    }
  }
  // Even the recorder loses note read/write when production classification changes.
  await adminQuery(
    "update recoveryos.person_classification set classification='test_fixture' where person_id=2",
  );
  await as(2);
  assert.equal(note(await workspace(), newRecord.meeting_id), null);
  await assert.rejects(v2(), /not_authorized/);
  await adminQuery(
    "update recoveryos.person_classification set classification='production' where person_id=2",
  );
  // Configuration deactivation suppresses shared reads, without rewriting history.
  await setRole('executive');
  await adminQuery('update recoveryos.meeting_series set is_active=false where id=1');
  await as(3);
  assert.equal(note(await workspace(), newRecord.meeting_id), null);
  await adminQuery('update recoveryos.meeting_series set is_active=true where id=1');
  await adminQuery('update recoveryos.organizations set is_active=false where id=1');
  await as(3);
  assert.equal(note(await workspace(), newRecord.meeting_id), null);
  await adminQuery('update recoveryos.organizations set is_active=true where id=1');
  // Helpers are internal-only, including for authenticated users and service_role.
  for (const role of ['anon', 'authenticated', 'service_role']) {
    await db.exec(`reset role;set role ${role}`);
    await assert.rejects(
      db.query('select recoveryos_circle_private.documentation_actor()'),
      /permission denied/,
    );
    await assert.rejects(
      db.query('select recoveryos_circle_private.can_read_shared_notes(1)'),
      /permission denied/,
    );
  }
  console.log(
    'PASS shared notes: scoped staff and read-only leadership; CBH narrowing; same-row organization/program/residence scope; global/email/assignment/technical/intake exclusions; non-GFA isolation; revocation/account/classification/deactivation denial; internal-helper ACLs.',
  );
}
