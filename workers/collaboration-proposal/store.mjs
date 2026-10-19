import { DatabaseSync } from 'node:sqlite';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { dirname, isAbsolute } from 'node:path';
import { closeSync, openSync, lstatSync, chmodSync } from 'node:fs';
const hash = value => createHash('sha256').update(value).digest('hex');
const DAY=86400000;
export class ExchangeStore {
  constructor(path,key,{now=Date.now}={}) {
    if(!Buffer.isBuffer(key)||key.length!==32)throw new Error('external_encryption_key_required');
    if(path===':memory:'||!isAbsolute(path))throw new Error('durable_storage_required');
    const directory=lstatSync(dirname(path));
    if(!directory.isDirectory()||directory.isSymbolicLink()||(directory.mode&0o077)!==0)throw new Error('private_storage_directory_required');
    try { closeSync(openSync(path,'wx',0o600)); } catch(e) { if(e.code!=='EEXIST')throw e; }
    if(!lstatSync(path).isFile()||lstatSync(path).isSymbolicLink())throw new Error('unsafe_storage_path');
    chmodSync(path,0o600); this.key=Buffer.from(key); this.now=now; this.db=new DatabaseSync(path);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA secure_delete=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,owner TEXT NOT NULL,residence TEXT NOT NULL,operation TEXT NOT NULL,digest TEXT NOT NULL,context BLOB NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,UNIQUE(owner,operation));
      CREATE TABLE IF NOT EXISTS replies(request TEXT PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,operation TEXT NOT NULL,digest TEXT NOT NULL,body BLOB NOT NULL,created INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS subscriptions(id TEXT PRIMARY KEY,owner TEXT NOT NULL,residence TEXT NOT NULL,body BLOB NOT NULL,expires INTEGER NOT NULL,revision INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,request TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,subscription TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL,lease_until INTEGER NOT NULL DEFAULT 0,lease_id TEXT,UNIQUE(request,subscription));
      CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,owner TEXT NOT NULL,request TEXT,kind TEXT NOT NULL,created INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS outbox_due ON outbox(status,next_at,lease_until);
    `);
  }
  seal(value,aad) { const nonce=randomBytes(12);const c=createCipheriv('aes-256-gcm',this.key,nonce);c.setAAD(Buffer.from(aad));const bytes=Buffer.concat([c.update(JSON.stringify(value)),c.final()]);return Buffer.concat([nonce,c.getAuthTag(),bytes]); }
  open(bytes,aad) { bytes=Buffer.from(bytes);const d=createDecipheriv('aes-256-gcm',this.key,bytes.subarray(0,12));d.setAAD(Buffer.from(aad));d.setAuthTag(bytes.subarray(12,28));return JSON.parse(Buffer.concat([d.update(bytes.subarray(28)),d.final()])); }
  tx(fn) { this.db.exec('BEGIN IMMEDIATE');try { const r=fn();this.db.exec('COMMIT');return r; }catch(e){this.db.exec('ROLLBACK');throw e;} }
  audit(owner,request,kind) { this.db.prepare('INSERT INTO audit VALUES(?,?,?,?,?)').run(randomUUID(),owner,request,kind,this.now()); }
  fanout(request,subscription) { this.db.prepare('INSERT OR IGNORE INTO outbox(id,request,subscription,next_at) VALUES(?,?,?,?)').run(randomUUID(),request,subscription,this.now()); }
  enqueue(principal,{residence_id,operation_id,context,approved}) {
    if(principal.channel!=='app'||approved!==true||typeof context!=='string'||!context.trim()||Buffer.byteLength(context)>16000||!/^[A-Za-z0-9_-]{1,128}$/.test(operation_id)||!/^[1-9][0-9]*$/.test(residence_id))throw new Error('explicit_bounded_context_required');
    const digest=hash(JSON.stringify([residence_id,context]));
    return this.tx(()=>{
      const old=this.db.prepare('SELECT id,digest FROM requests WHERE owner=? AND operation=?').get(principal.subject,operation_id);
      if(old) { if(old.digest!==digest)throw new Error('idempotency_conflict');return {request_id:old.id,status:'queued'}; }
      if(this.db.prepare('SELECT count(*) AS n FROM requests WHERE owner=? AND created>?').get(principal.subject,this.now()-3600000).n>=30)throw new Error('request_rate_limit');
      const id=randomUUID();this.db.prepare('INSERT INTO requests VALUES(?,?,?,?,?,?,?,?)').run(id,principal.subject,residence_id,operation_id,digest,this.seal({context},id),this.now(),this.now()+30*DAY);
      for(const sub of this.db.prepare('SELECT id FROM subscriptions WHERE owner=? AND residence=? AND expires>?').all(principal.subject,residence_id,this.now()))this.fanout(id,sub.id);
      this.audit(principal.subject,id,'request_queued');return {request_id:id,status:'queued'};
    });
  }
  exchange(method,principal,a) {
    return this.tx(()=>{
      const row=this.db.prepare('SELECT * FROM requests WHERE id=? AND owner=? AND residence=? AND expires>?').get(a.request_id,principal.subject,a.residence_id,this.now());
      if(!row)throw new Error('not_authorized');
      if(method==='reply_to_request') {
        if(principal.channel!=='mcp'||typeof a.text!=='string'||!a.text.trim()||Buffer.byteLength(a.text)>16000)throw new Error('invalid_reply');
        const digest=hash(a.text);const old=this.db.prepare('SELECT * FROM replies WHERE request=?').get(row.id);
        if(old) { if(old.digest!==digest||old.operation!==a.operation_id)throw new Error('reply_already_recorded'); }
        else { this.db.prepare('INSERT INTO replies VALUES(?,?,?,?,?)').run(row.id,a.operation_id,digest,this.seal({text:a.text},row.id+'/reply'),this.now());this.audit(principal.subject,row.id,'reply_received'); }
        return {request_id:row.id,status:'reply_received',reviewOnly:true};
      }
      const reply=this.db.prepare('SELECT body,created FROM replies WHERE request=?').get(row.id);
      const accepted=this.db.prepare("SELECT count(*) AS n FROM outbox WHERE request=? AND status='accepted'").get(row.id).n;
      const failed=this.db.prepare("SELECT count(*) AS n FROM outbox WHERE request=? AND status='failed'").get(row.id).n;
      const result={request_id:row.id,status:reply?'reply_received':accepted?'event_accepted':failed?'delivery_failed':'queued',reply:reply?this.open(reply.body,row.id+'/reply').text:null,reviewOnly:true};
      if(method==='read_request')result.selectedContext=this.open(row.context,row.id).context;
      if(method==='read_request')delete result.reply; // Bound response: context and reply are fetched separately.
      return result;
    });
  }
  verificationAttempt(owner) { this.tx(()=>{
    if(this.db.prepare("SELECT count(*) n FROM audit WHERE owner=? AND kind='subscription_attempt' AND created>?").get(owner,this.now()-3600000).n>=20)throw new Error('subscription_rate_limit');
    this.audit(owner,null,'subscription_attempt');
  }); }
  subscriptionId(principal,p) { return hash(JSON.stringify([principal.subject,p.delivery.url,p.name,p.arguments.residence_id])); }
  getSubscription(id) { const s=this.db.prepare('SELECT * FROM subscriptions WHERE id=? AND expires>?').get(id,this.now());return s?{...s,...this.open(s.body,id)}:null; }
  putSubscription(id,principal,p,expires) {
    return this.tx(()=>{
      const old=this.getSubscription(id);const revision=(old?.revision??0)+1;
      if(!old&&this.db.prepare('SELECT count(*) AS n FROM subscriptions WHERE owner=?').get(principal.subject).n>=10)throw new Error('subscription_limit');
      this.db.prepare('INSERT INTO subscriptions VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body,expires=excluded.expires,revision=excluded.revision').run(id,principal.subject,p.arguments.residence_id,this.seal({principal,delivery:p.delivery,previousDelivery:old && old.delivery.secret!==p.delivery.secret ? old.delivery : null,previousUntil:this.now()+60000},id),expires,revision);
      // A refreshed callback invalidates leases so old credentials cannot mark its deliveries accepted.
      this.db.prepare("UPDATE outbox SET lease_until=0,lease_id=NULL WHERE subscription=? AND status='pending'").run(id);
      for(const r of this.db.prepare('SELECT id FROM requests WHERE owner=? AND residence=? AND expires>? AND id NOT IN (SELECT request FROM replies)').all(principal.subject,p.arguments.residence_id,this.now()))this.fanout(r.id,id);
      this.audit(principal.subject,null,'subscription_verified');return {id,refreshBefore:new Date(expires).toISOString(),cursor:null,truncated:false};
    });
  }
  unsubscribe(id,owner) { this.tx(()=>{this.db.prepare('DELETE FROM subscriptions WHERE id=? AND owner=?').run(id,owner);this.audit(owner,null,'subscription_stopped');});return {}; }
  claim() {
    return this.tx(()=>{
      const row=this.db.prepare("SELECT o.*,r.owner,r.residence,r.created FROM outbox o JOIN requests r ON r.id=o.request JOIN subscriptions s ON s.id=o.subscription WHERE o.status='pending' AND o.next_at<=? AND o.lease_until<=? AND s.expires>? AND r.expires>? ORDER BY o.next_at LIMIT 1").get(this.now(),this.now(),this.now(),this.now());
      if(!row)return null;const leaseId=randomUUID();this.db.prepare('UPDATE outbox SET lease_until=?,lease_id=?,attempts=attempts+1 WHERE id=?').run(this.now()+30000,leaseId,row.id);return {...row,lease_id:leaseId,attempts:row.attempts+1};
    });
  }
  finish(row,status) {
    const accepted=status>=200&&status<300;
    const terminal=accepted||status===410||status===413||(status>=300&&status<500&&status!==429)||row.attempts>=5;
    this.db.prepare('UPDATE outbox SET status=?,next_at=?,lease_until=0,lease_id=NULL WHERE id=? AND lease_id=?').run(accepted?'accepted':terminal?'failed':'pending',this.now()+Math.min(300000,1000*2**row.attempts),row.id,row.lease_id);
  }
  prune() { this.tx(()=>{this.db.prepare('DELETE FROM requests WHERE expires<=?').run(this.now());this.db.prepare('DELETE FROM subscriptions WHERE expires<=?').run(this.now());this.db.prepare('DELETE FROM audit WHERE created<=?').run(this.now()-90*DAY);});this.db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); }
  close() { this.db.close(); this.key.fill(0); }
}
