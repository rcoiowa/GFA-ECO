import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoWorkflow, CLOSED } from './core.mjs';
const fields = { beneficiary: 'Demo partner', action: 'Prepare a scope card', outcome: 'Agreed scope returned', permission: 'Synthetic operational task only', due: '2026-10-09' };
function setup() { const w = new DemoWorkflow(); const n = w.capture('Executive', 'A synthetic promise'); return {w, n, c:w.promote(n.id, 'Executive', fields)}; }
test('capture creates no commitment and a missing next check cannot promote', () => {
  const w = new DemoWorkflow(); const n = w.capture('Executive', 'Reminder');
  assert.equal(w.commitments.length, 0);
  assert.throws(() => w.promote(n.id, 'Executive', {...fields, due:''}));
  assert.equal(n.commitmentId, null); assert.equal(w.commitments.length, 0);
});
test('promotion replay never duplicates a commitment', () => { const {w,n,c} = setup(); assert.equal(w.promote(n.id,'Executive',fields),c); assert.equal(w.commitments.length,1); });
test('archiving the note does not close its commitment', () => { const {w,n,c}=setup(); w.toggleNote(n.id,'Executive','archived'); assert.equal(c.status,'open'); });
test('sender remains owner until acceptance; wrong role cannot accept', () => {
  const {w,c}=setup(); w.proposeHandoff(c.id,'Executive','Data administrator');
  assert.equal(c.owner,'Executive'); assert.throws(()=>w.respondHandoff(c.id,'House manager',true));
  w.respondHandoff(c.id,'Data administrator',true); assert.equal(c.owner,'Data administrator');
  assert.throws(()=>w.close(c.id,'Executive','fulfilled','Evidence','Returned'));
});
test('declined handoff remains with sender', () => { const {w,c}=setup(); w.proposeHandoff(c.id,'Executive','Data administrator'); w.respondHandoff(c.id,'Data administrator',false); assert.equal(c.owner,'Executive'); });
test('closure requires both evidence and a relational return', () => {
  const {w,c}=setup(); assert.throws(()=>w.close(c.id,'Executive','fulfilled','','Returned'));
  assert.throws(()=>w.close(c.id,'Executive','fulfilled','Prepared','')); assert.equal(c.status,'open');
  w.close(c.id,'Executive','fulfilled','Scope agreed','Partner received scope'); assert.equal(c.status,'fulfilled');
});
test('waiting requires a next check and next action', () => { const {w,c}=setup(); assert.throws(()=>w.continue(c.id,'Executive','waiting','','Check')); w.continue(c.id,'Executive','waiting','2026-10-12','Check partner response'); assert.equal(c.status,'waiting'); });
test('each non-success disposition remains distinct from fulfillment', () => {
  for(const disposition of CLOSED.filter(x=>x!=='fulfilled')) { const {w,c}=setup(); w.close(c.id,'Executive',disposition,'Synthetic authorized disposition evidence','Returned or return not possible'); assert.equal(c.status,disposition); }
});
test('private demo notes reject access from a different role', () => { const {w,n}=setup(); assert.throws(()=>w.editNote(n.id,'House manager','Change')); });
test('pending handoff cannot silently disappear through closure', () => { const {w,c}=setup(); w.proposeHandoff(c.id,'Executive','Data administrator'); assert.throws(()=>w.close(c.id,'Executive','fulfilled','Evidence','Returned')); assert.equal(w.endDay('Executive').pendingHandoffs,1); });
