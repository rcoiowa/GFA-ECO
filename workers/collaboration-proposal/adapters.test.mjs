import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateKeyPairSync,sign,createHmac } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { createTokenVerifier } from './oauth.mjs';
import { publicAddress,createPinnedPoster } from './egress.mjs';
import { ExchangeStore } from './store.mjs';
import { createAdapters } from './adapters.mjs';
const owner='00000000-0000-0000-0000-000000000004';
const session='00000000-0000-0000-0000-000000000008';
const client='00000000-0000-0000-0000-000000000009';
const principal={subject:owner,sessionId:session,clientId:client,expiresAt:Date.now()+3600000,channel:'mcp'};
const app={...principal,clientId:null,channel:'app'};
const secret=`whsec_${Buffer.alloc(32,7).toString('base64')}`; // synthetic test key only
const params={name:'collaboration.requested',arguments:{residence_id:'10'},delivery:{mode:'webhook',url:'https://callback.synthetic.example/events',secret}};
function fixture(t) {
  const dir=mkdtempSync(join(tmpdir(),'recoveryos-bridge-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const path=join(dir,'store.sqlite'),key=Buffer.alloc(32,8);const store=new ExchangeStore(path,key);t.after(()=>{try{store.close();}catch{}});
  return {store,path,key};
}
function cryptoFixture() {
 const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});const jwk={...publicKey.export({format:'jwk'}),kid:'synthetic-key',alg:'ES256',use:'sig'};
 const config={issuer:'https://auth.synthetic.example',jwksUrl:'https://auth.synthetic.example/keys',audience:'https://app.synthetic.example/mcp',clientIds:[client],channel:'mcp'};
 const claims={iss:config.issuer,aud:config.audience,sub:owner,session_id:session,client_id:client,scope:'collaboration:exchange',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+600};
 const token=(overrides={},header={})=>{const h=Buffer.from(JSON.stringify({alg:'ES256',typ:'at+jwt',kid:jwk.kid,...header})).toString('base64url'),p=Buffer.from(JSON.stringify({...claims,...overrides})).toString('base64url');return `${h}.${p}.${sign('sha256',Buffer.from(`${h}.${p}`),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url')}`;};
 return {config,token,fetcher:async()=>new Response(JSON.stringify({keys:[jwk]}))};
}
test('OAuth validates signature, audience, issuer, expiry, client, scope and session',async()=>{
 const f=cryptoFixture(),verify=createTokenVerifier(f.config,{fetcher:f.fetcher});assert.equal((await verify(f.token())).subject,owner);
 for(const bad of [{aud:'authenticated'},{iss:'https://wrong.example'},{exp:1},{client_id:'other'},{scope:'openid'},{session_id:null},{nbf:Math.floor(Date.now()/1000)+5000}])await assert.rejects(verify(f.token(bad)));
 await assert.rejects(verify(f.token({}, {alg:'HS256'})));await assert.rejects(verify(f.token({}, {jku:'https://wrong.example/key'})));
 const parts=f.token().split('.');parts[1]=Buffer.from(JSON.stringify({sub:owner})).toString('base64url');await assert.rejects(verify(parts.join('.')));
});
test('first-party verifier rejects OAuth token even when audience matches',async()=>{
 const f=cryptoFixture();const verify=createTokenVerifier({...f.config,channel:'app'},{fetcher:f.fetcher});await assert.rejects(verify(f.token()));
 assert.equal((await verify(f.token({client_id:undefined}))).channel,'app');
});
test('public egress blocks private/reserved/mapped/transition addresses',()=>{
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','100.64.1.1','192.0.2.1','198.18.0.1','203.0.113.8','224.1.1.1','::1','fc00::1','fe80::1','::ffff:8.8.8.8','2002:808:808::1','2001:db8::1','3fff::1'])assert.equal(publicAddress(ip),false,ip);
 assert.equal(publicAddress('8.8.8.8'),true);assert.equal(publicAddress('2606:4700::1111'),true);
});
test('egress pins validated resolution and rejects mixed DNS answers before connecting',async()=>{
 let connections=0;const bad=createPinnedPoster({resolve:async()=>[{address:'8.8.8.8',family:4},{address:'127.0.0.1',family:4}],connect:()=>{connections++;}});
 await assert.rejects(bad('https://callback.synthetic.example',{body:'{}',headers:{}}));assert.equal(connections,0);
 const post=createPinnedPoster({resolve:async()=>[{address:'8.8.8.8',family:4}],connect:(url,options,done)=>{
  connections++;assert.equal(url.hostname,'callback.synthetic.example');assert.equal(options.servername,url.hostname);assert.equal(options.agent,false);assert.equal(options.rejectUnauthorized,true);
  options.lookup(url.hostname,{},(_error,address)=>assert.equal(address,'8.8.8.8'));
  const req=new EventEmitter();req.end=()=>{const res=new EventEmitter();res.statusCode=302;done(res);queueMicrotask(()=>{res.emit('end');req.emit('close');});};return req;
 }});
 assert.equal((await post('https://callback.synthetic.example',{body:'{}',headers:{}})).status,302);assert.equal(connections,1);
});
test('durable encrypted requests survive restart; ownership and immutable reply enforced',t=>{
 const f=fixture(t);const request=f.store.enqueue(app,{residence_id:'10',operation_id:'op-1',context:'Synthetic confidential note',approved:true});
 assert.equal(f.store.enqueue(app,{residence_id:'10',operation_id:'op-1',context:'Synthetic confidential note',approved:true}).request_id,request.request_id);
 assert.throws(()=>f.store.enqueue(app,{residence_id:'10',operation_id:'op-1',context:'Changed',approved:true}));
 f.store.close();const restored=new ExchangeStore(f.path,f.key);t.after(()=>restored.close());
 const a={residence_id:'10',request_id:request.request_id};assert.equal(restored.exchange('read_request',principal,a).selectedContext,'Synthetic confidential note');
 assert.throws(()=>restored.exchange('read_request',{...principal,subject:'other'},a));assert.throws(()=>restored.exchange('read_request',principal,{...a,residence_id:'20'}));
 const reply={...a,operation_id:'reply-1',text:'Synthetic proposal'};restored.exchange('reply_to_request',principal,reply);restored.exchange('reply_to_request',principal,reply);
 assert.throws(()=>restored.exchange('reply_to_request',principal,{...reply,text:'Changed'}));assert.equal(restored.exchange('request_status',app,a).reply,'Synthetic proposal');
 assert.equal(readFileSync(f.path).includes(Buffer.from('Synthetic confidential note')),false);
});
test('verified subscription, stable signed event, reply status, replay and unsubscribe',async t=>{
 const f=fixture(t);const received=[];let allow=true;
 const adapters=createAdapters({store:f.store,verifyAccessToken:async()=>principal,authorize:async(p,r)=>allow&&p.subject===owner&&(r===null||r==='10'),post:async(_url,message)=>{
  const body=JSON.parse(message.body);const expected=createHmac('sha256',Buffer.from(secret.slice(6),'base64')).update(`${message.headers['webhook-id']}.${message.headers['webhook-timestamp']}.${message.body}`).digest('base64');assert.equal(message.headers['webhook-signature'],`v1,${expected}`);
  if(body.type==='verification')return {status:200,body:JSON.stringify({challenge:body.challenge})};received.push(body);return {status:200,body:'{}'};
 }});
 const sub=await adapters.subscriptions('events/subscribe',principal,params);const again=await adapters.subscriptions('events/subscribe',principal,params);assert.equal(sub.id,again.id);
 const req=await adapters.enqueue(app,{residence_id:'10',operation_id:'op-1',context:'Synthetic review',approved:true});await adapters.deliverOne();assert.equal(received.length,1);assert.deepEqual(Object.keys(received[0].data).sort(),['request_id','residence_id']);assert.equal(await adapters.deliverOne(),false);
 assert.equal((await adapters.exchange('request_status',app,{residence_id:'10',request_id:req.request_id})).status,'event_accepted');
 await adapters.subscriptions('events/unsubscribe',principal,params);assert.equal(f.store.getSubscription(sub.id),null);
 allow=false;await assert.rejects(adapters.enqueue(app,{residence_id:'10',operation_id:'op-2',context:'Synthetic',approved:true}));
});
test('bad challenge stores no subscription, expired/revoked principals stop delivery',async t=>{
 const f=fixture(t);const a=createAdapters({store:f.store,authorize:async()=>true,post:async()=>({status:200,body:'{"challenge":"wrong"}'})});await assert.rejects(a.subscriptions('events/subscribe',principal,params));assert.equal(f.store.db.prepare('SELECT count(*) n FROM subscriptions').get().n,0);
 f.store.putSubscription(f.store.subscriptionId(principal,params),principal,params,Date.now()+60000);f.store.enqueue(app,{residence_id:'10',operation_id:'op-1',context:'Synthetic',approved:true});
 let calls=0;const revoked=createAdapters({store:f.store,authorize:async()=>false,post:async()=>{calls++;}});await revoked.deliverOne();assert.equal(calls,0);assert.equal(f.store.db.prepare('SELECT count(*) n FROM subscriptions').get().n,0);
});
test('outbox leases prevent duplicate claims and terminal responses prevent retries',t=>{
 const f=fixture(t);f.store.putSubscription('sub',principal,params,Date.now()+60000);f.store.enqueue(app,{residence_id:'10',operation_id:'op-1',context:'Synthetic',approved:true});
 const second=new ExchangeStore(f.path,f.key);t.after(()=>second.close());const row=f.store.claim();assert.equal(second.claim(),null);f.store.finish(row,410);assert.equal(second.claim(),null);
});
test('retention deletes request content/replies and expires encrypted subscriptions',t=>{
 const f=fixture(t);f.store.enqueue(app,{residence_id:'10',operation_id:'op-1',context:'Synthetic',approved:true});f.store.putSubscription('sub',principal,params,Date.now()+1000);
 f.store.now=()=>Date.now()+91*86400000;f.store.prune();for(const table of ['requests','replies','subscriptions','outbox','audit'])assert.equal(f.store.db.prepare(`SELECT count(*) n FROM ${table}`).get().n,0);
});

test('composed local runtime: signed auth, explicit app queue, event, scoped reply and app restore',async t=>{
 const {createRuntime}=await import('./runtime.mjs');const f=cryptoFixture();const dir=mkdtempSync(join(tmpdir(),'recoveryos-runtime-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));let events=0;
 const runtime=createRuntime({enabled:true,retentionApproved:true,storagePath:join(dir,'store.sqlite'),appOrigin:'https://app.synthetic.example',resource:f.config.audience,appAudience:'authenticated',oauth:f.config}, {
  query:async()=>({rows:[{allowed:true}]}),encryptionKey:Buffer.alloc(32,9),fetcher:f.fetcher,
  post:async(_url,message)=>{const b=JSON.parse(message.body);if(b.type==='verification')return {status:200,body:JSON.stringify({challenge:b.challenge})};events++;return {status:200,body:'{}'};},
 });t.after(()=>runtime.close());
 const rpc=async(method,params)=> (await runtime.fetch(new Request(f.config.audience,{method:'POST',headers:{authorization:`Bearer ${f.token()}`},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}))).json();
 assert.ok((await rpc('events/subscribe',params)).result);
 const appCall=async data=>(await runtime.fetch(new Request('https://app.synthetic.example/app/requests',{method:'POST',headers:{authorization:`Bearer ${f.token({aud:'authenticated',client_id:undefined})}`,origin:'https://app.synthetic.example','content-type':'application/json'},body:JSON.stringify(data)}))).json();
 const queued=await appCall({residence_id:'10',operation_id:'synthetic-operation',context:'Synthetic selected context',approved:true});assert.ok(queued.request_id);
 await runtime.deliverOne();assert.equal(events,1);
 const args={residence_id:'10',request_id:queued.request_id};const read=await rpc('tools/call',{name:'read_request',arguments:args});assert.equal(JSON.parse(read.result.content[0].text).selectedContext,'Synthetic selected context');
 const written=await rpc('tools/call',{name:'reply_to_request',arguments:{...args,operation_id:'synthetic-reply',text:'Synthetic review-only reply'}});assert.ok(written.result);
 assert.equal((await appCall({action:'status',...args})).reply,'Synthetic review-only reply');
 assert.equal(await runtime.deliverOne(),false);
});

test('transient outbox retry preserves event identity and signs with a fresh timestamp',async t=>{
 const f=fixture(t);let now=Date.now();f.store.now=()=>now;
 f.store.putSubscription('sub',principal,params,now+60000);f.store.enqueue(app,{residence_id:'10',operation_id:'op-retry',context:'Synthetic',approved:true});
 const sent=[];const a=createAdapters({store:f.store,now:()=>now,authorize:async()=>true,post:async(_url,message)=>{sent.push(message);return {status:sent.length===1?503:200,body:'{}'};}});
 await a.deliverOne();assert.equal(await a.deliverOne(),false);now+=3000;await a.deliverOne();
 assert.equal(sent[0].headers['webhook-id'],sent[1].headers['webhook-id']);assert.equal(sent[0].body,sent[1].body);assert.notEqual(sent[0].headers['webhook-timestamp'],sent[1].headers['webhook-timestamp']);
 assert.equal(await a.deliverOne(),false);
});
