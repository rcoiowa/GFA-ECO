// Run with PGLITE_MODULE pointing to an installed @electric-sql/pglite module.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated; create schema auth; create schema recoveryos;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,recoveryos to anon,authenticated;
create table recoveryos.people(id bigint primary key,auth_user_id uuid,first_name text,last_name text,preferred_name text);
create table recoveryos.organizations(id bigint primary key);
create table recoveryos.service_types(id bigint primary key);
create table recoveryos.meetings(id bigint generated always as identity primary key,organization_id bigint not null references recoveryos.organizations(id),residence_id bigint,title text not null,description text,starts_at timestamptz not null,ends_at timestamptz,is_required_for_residents boolean default false,created_at timestamptz default now());
alter table recoveryos.meetings enable row level security;
create policy meetings_read on recoveryos.meetings for select using(residence_id is null);
grant select,insert,update,delete on recoveryos.meetings to anon,authenticated;
create function recoveryos.current_person_id() returns bigint language sql security definer set search_path='' as $$select id from recoveryos.people where auth_user_id=auth.uid()$$;
create function recoveryos.is_platform_admin() returns boolean language sql as $$select recoveryos.current_person_id()=1$$;
insert into recoveryos.people values(1,'00000000-0000-0000-0000-000000000001','Admin','',null),(2,'00000000-0000-0000-0000-000000000002','Facilitator','',null),(3,'00000000-0000-0000-0000-000000000003','Other','',null);
insert into recoveryos.organizations values(1); insert into recoveryos.service_types values(5);
`);
await db.exec(await fs.readFile('supabase/launch/migrations/20261005071446_circle_meeting_logging.sql','utf8'));
await db.exec(`insert into recoveryos.meeting_series(organization_id,service_type_id,name,location_name,location_kind) values(1,5,'GFARC','Hope+Elim','community'),(1,5,'Other Circle','Other site','community'); insert into recoveryos.meeting_facilitator_assignments values(1,2,1,now(),null);`);
async function as(id){await db.exec(`reset role; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-${String(id).padStart(12,'0')}',false);set role authenticated;`);}
const call = (overrides={}) => {
 const args = {series:1,start:'2026-09-29T23:30:00Z',end:'2026-09-30T00:30:00Z',status:'held',count:15,names:['Thomas','Archaletta'],...overrides};
 return db.query('select recoveryos.record_circle_meeting($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as result',[args.series,args.start,args.end,args.status,args.count,args.names,'Slogan 31: Speak well of others in recovery','Community Building','Empower','Social']).then(r=>r.rows[0].result);
};
await as(2);
const saved=await call(); assert.equal(saved.code,'recorded');
assert.equal((await call()).meeting_id,saved.meeting_id); assert.equal((await call()).code,'already_recorded');
assert.equal((await call({count:16})).code,'duplicate_conflict');
await assert.rejects(call({series:2}),/not_authorized/);
await assert.rejects(call({count:-1}),/attendance_required/);
await assert.rejects(call({names:['Thomas','thomas']}),/invalid_details/);
await assert.rejects(call({end:'2026-09-29T22:00:00Z'}),/invalid_date/);
await assert.rejects(call({start:'2099-09-29T23:30:00Z'}),/invalid_date/);
await assert.rejects(call({status:'cancelled',count:15}),/cancelled_has_no_attendance/);
assert.equal((await call({start:'2026-09-22T23:30:00Z',end:'2026-09-23T00:30:00Z',status:'cancelled',count:null,names:[]})).code,'recorded');
const result=await db.query('select recoveryos.get_my_circle_workspace() as result');
const ws=result.rows[0].result; assert.equal(ws.series.length,1); assert.equal(ws.meetings.length,2);
const held=ws.meetings.filter(x=>x.occurrence_status==='held'); assert.equal(held.length,1);assert.equal(held[0].participant_count,15);assert.equal(held[0].facilitator_names.length,2);assert.equal(held[0].total_attendance,17);
assert.equal((await db.query('select * from recoveryos.meetings')).rows.length,0);
await assert.rejects(db.query('select * from recoveryos.people'),/permission denied/);
await assert.rejects(db.query('update recoveryos.meeting_facilitator_assignments set revoked_at=null'),/permission denied/);
await assert.rejects(db.query('select recoveryos.assign_circle_facilitator(2,2,true)'),/not_authorized/);
await as(3);assert.equal((await db.query('select recoveryos.get_my_circle_workspace() as w')).rows[0].w.meetings.length,0);await assert.rejects(call(),/not_authorized/);
await as(1);await db.query('select recoveryos.assign_circle_facilitator(1,2,false)');
await as(2);await assert.rejects(call(),/not_authorized/);assert.equal((await db.query('select recoveryos.get_my_circle_workspace() as w')).rows[0].w.series.length,0);
await db.exec('reset role; set role anon'); await assert.rejects(db.query('select recoveryos.get_my_circle_workspace()'),/permission denied/);assert.equal((await db.query('select * from recoveryos.meetings')).rows.length,0);
console.log('PASS: save, repeat, conflicting duplicate, scoped reads/writes, revocation, anon denial, invalid inputs, 15+2=17, cancelled exclusion.');
await db.exec(`reset role;
create type recoveryos.role_key as enum('coach','navigator','residence_staff','residence_manager','program_manager','participant');
create table recoveryos.role_assignments(id bigint generated always as identity primary key,person_id bigint,role_key recoveryos.role_key,organization_id bigint,program_id bigint,residence_id bigint,revoked_at timestamptz);
create table recoveryos.programs(id bigint primary key,organization_id bigint);
create table recoveryos.residences(id bigint primary key,organization_id bigint);
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz,banned_until timestamptz,is_anonymous boolean default false);
alter table recoveryos.organizations add column name text,add column is_active boolean default true;
alter table recoveryos.service_types add column key text;
update recoveryos.organizations set name='Grace For Addictions';update recoveryos.service_types set key='recovery_circle';
insert into auth.users(id,email,email_confirmed_at) select auth_user_id,'person'||id||'@example.org',now() from recoveryos.people;
insert into recoveryos.organizations values(99,'Other organization',true);
insert into recoveryos.residences values(99,99);
`);
await db.exec(await fs.readFile('supabase/launch/migrations/20261005092358_circle_county_access_schedule.sql','utf8'));
await db.exec(`insert into recoveryos.meeting_series(organization_id,service_type_id,name,location_name,location_kind) values(99,5,'Foreign circle','Foreign site','community');`);
const adminQuery=async(sql,args=[])=>{await db.exec('reset role');return db.query(sql,args);};
const series=(await adminQuery('select * from recoveryos.meeting_series order by id')).rows;
const cbh=series.find(s=>s.location_name.includes('Outpatient')).id;
const foreign=series.find(s=>s.organization_id===99).id;
assert.equal(series.find(s=>s.id===1).start_time,'18:30:00');
for(const role of ['coach','navigator','program_coordinator','residence_staff','residence_manager']) {
 await adminQuery('delete from recoveryos.role_assignments');
 await adminQuery('insert into recoveryos.role_assignments(person_id,role_key,organization_id) values(3,$1,1)',[role]);
 await as(3);
 assert.equal((await call()).code,'already_recorded');
 const ws=(await db.query('select recoveryos.get_my_circle_workspace() as w')).rows[0].w;
 assert.equal(ws.meetings.find(m=>m.id===saved.meeting_id).county,'Polk');
 assert.equal(ws.meetings.find(m=>m.id===saved.meeting_id).total_attendance,17);
 assert.equal(ws.series.some(s=>s.id===cbh),['coach','navigator'].includes(role));
 if(['coach','navigator'].includes(role)) assert.ok((await call({series:cbh})).ok);
 else await assert.rejects(call({series:cbh}),/not_authorized/);
 await assert.rejects(call({series:foreign}),/not_authorized/);
 assert.equal((await db.query('select * from recoveryos.meetings')).rows.length,0);
 await assert.rejects(db.query('select * from recoveryos.people'),/permission denied/);
 await assert.rejects(db.query('select * from recoveryos.residences'),/permission denied/);
}
await adminQuery('update recoveryos.role_assignments set revoked_at=now()');
await as(3);await assert.rejects(call(),/not_authorized/);
// Exact, verified domain only; no trust in user metadata or JWT email claims.
for(const [email,confirmed,allowed] of [
 ['staff@graceforaddictions.org',true,true],['STAFF@GRACEFORADDICTIONS.ORG',true,true],
 ['staff@graceforaddictions.org',false,false],['staff@graceforaddictions.org.attacker.test',true,false],
 ['staff@sub.graceforaddictions.org',true,false],['staff@example.org',true,false]
]) {
 await adminQuery("update auth.users set email=$1,email_confirmed_at=case when $2 then now() else null end where id='00000000-0000-0000-0000-000000000003'",[email,confirmed]);
 await as(3);await db.exec(`select set_config('request.jwt.claim.email','staff@graceforaddictions.org',false)`);
 if(allowed) assert.equal((await call({series:cbh})).code,'already_recorded');
 else await assert.rejects(call({series:cbh}),/not_authorized/);
 await assert.rejects(call(),/not_authorized/); // domain-only does not authorize general circles
}
await adminQuery("update auth.users set email='staff@graceforaddictions.org',email_confirmed_at=now(),banned_until=now()+interval '1 day' where id='00000000-0000-0000-0000-000000000003'");
await as(3);await assert.rejects(call({series:cbh}),/not_authorized/);
await adminQuery("update auth.users set email='staff@example.org',banned_until=null where id='00000000-0000-0000-0000-000000000003'");
await adminQuery("delete from recoveryos.role_assignments");
await adminQuery("insert into recoveryos.role_assignments(person_id,role_key,organization_id) values(3,'coach',99)");
await as(3);await assert.rejects(call(),/not_authorized/);
await adminQuery('update recoveryos.role_assignments set organization_id=null,residence_id=99');
await as(3);await assert.rejects(call(),/not_authorized/);
await adminQuery('update recoveryos.role_assignments set residence_id=null');
await as(3);assert.equal((await call()).code,'already_recorded');
const finalWs=(await db.query('select recoveryos.get_my_circle_workspace() as w')).rows[0].w;
assert.equal(finalWs.meetings.find(m=>m.series_id===cbh).participation_access,'closed_cbh_clients');
assert.equal(finalWs.meetings.find(m=>m.series_id===cbh).county,'Polk');
assert.equal((await call({series:cbh,count:16})).code,'duplicate_conflict');
await db.exec('reset role;set role anon');await assert.rejects(db.query('select recoveryos.get_my_circle_workspace()'),/permission denied/);
console.log('PASS: five roles, CBH subset, verified exact domain, revocation, scope isolation, county snapshots, closed designation, defaults, duplicate prevention.');

await db.close();
