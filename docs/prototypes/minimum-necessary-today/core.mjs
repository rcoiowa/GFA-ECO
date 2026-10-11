// Synthetic workflow demonstrator. Not production authorization or service evidence.
export const ROLES = ['Executive', 'Data administrator', 'House manager', 'AI consultant'];
export const CLOSED = ['fulfilled', 'declined', 'withdrawn', 'cancelled', 'unreachable'];
const required = (value, label) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
};
export class DemoWorkflow {
  constructor() { this.notes = []; this.commitments = []; this.nextId = 1; }
  capture(author, text) {
    if (!ROLES.includes(author)) throw new Error('Choose a demo role.');
    const note = { id: this.nextId++, author, text: required(text, 'Note'), collapsed: false, pinned: false, archived: false, commitmentId: null };
    this.notes.push(note); return note;
  }
  note(id, actor) {
    const note = this.notes.find(n => n.id === id);
    if (!note || note.author !== actor) throw new Error('This demo role cannot change that note.');
    return note;
  }
  toggleNote(id, actor, key) {
    if (!['collapsed', 'pinned', 'archived'].includes(key)) throw new Error('Unknown note action.');
    const note = this.note(id, actor); note[key] = !note[key]; return note;
  }
  editNote(id, actor, text) { const note = this.note(id, actor); note.text = required(text, 'Note'); return note; }
  promote(id, actor, fields) {
    const note = this.note(id, actor);
    // Replay returns the existing commitment, never duplicates a promise.
    if (note.commitmentId !== null) return this.commitments.find(c => c.id === note.commitmentId);
    const beneficiary = required(fields.beneficiary, 'Person or capability served');
    const action = required(fields.action, 'Next action');
    const outcome = required(fields.outcome, 'Definition of done');
    const permission = required(fields.permission, 'Authority or permission');
    const due = required(fields.due, 'Next check date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || Number.isNaN(Date.parse(due + 'T12:00:00Z'))) throw new Error('Choose a valid next check date.');
    const c = { id: this.nextId++, noteId: id, beneficiary, action, outcome, permission, due, owner: actor, status: 'open', proposedOwner: null, history: [{ event: 'accepted by creator', actor }], closure: null };
    this.commitments.push(c); note.commitmentId = c.id; return c;
  }
  owned(id, actor) {
    const c = this.commitments.find(c => c.id === id);
    if (!c || c.owner !== actor) throw new Error('Only the current demo owner can perform this action.');
    if (CLOSED.includes(c.status)) throw new Error('This commitment is already closed.');
    return c;
  }
  proposeHandoff(id, actor, receiver) {
    const c = this.owned(id, actor);
    if (!ROLES.includes(receiver) || receiver === actor) throw new Error('Choose a different demo role.');
    if (c.proposedOwner) throw new Error('Resolve the existing handoff first.');
    c.proposedOwner = receiver; c.history.push({ event: 'handoff requested', actor, receiver }); return c;
  }
  respondHandoff(id, actor, accepted) {
    const c = this.commitments.find(c => c.id === id);
    if (!c || c.proposedOwner !== actor || CLOSED.includes(c.status)) throw new Error('No pending handoff for this demo role.');
    const previous = c.owner;
    if (accepted) c.owner = actor;
    c.proposedOwner = null; c.history.push({ event: accepted ? 'handoff accepted' : 'handoff declined', actor, previous }); return c;
  }
  continue(id, actor, status, due, reason) {
    const c = this.owned(id, actor);
    if (!['open', 'waiting', 'blocked'].includes(status)) throw new Error('Choose open, waiting, or blocked.');
    required(due, 'Next check');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || Number.isNaN(Date.parse(due + 'T12:00:00Z'))) throw new Error('Choose a valid next check date.');
    required(reason, 'What happens next');
    c.status = status; c.due = due; c.action = reason.trim(); c.history.push({ event: status, actor, due }); return c;
  }
  close(id, actor, disposition, evidence, returnRecord) {
    const c = this.owned(id, actor);
    if (!CLOSED.includes(disposition)) throw new Error('Choose an honest closing disposition.');
    required(evidence, disposition === 'fulfilled' ? 'Completion evidence' : 'Disposition evidence');
    required(returnRecord, 'Return to person or reason return was not possible');
    if (c.proposedOwner) throw new Error('Resolve the pending handoff before closing.');
    c.status = disposition; c.closure = { evidence: evidence.trim(), returnRecord: returnRecord.trim() };
    c.history.push({ event: disposition, actor }); return c;
  }
  visible(actor) { return this.commitments.filter(c => c.owner === actor || c.proposedOwner === actor); }
  endDay(actor) {
    const own = this.visible(actor);
    return { open: own.filter(c => !CLOSED.includes(c.status)).length, closed: own.filter(c => CLOSED.includes(c.status)).length, pendingHandoffs: own.filter(c => c.proposedOwner).length };
  }
}
