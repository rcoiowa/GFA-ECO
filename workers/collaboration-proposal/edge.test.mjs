import test from 'node:test';
import assert from 'node:assert/strict';
import {createCipher,bytes,base64,signedMessage,sameChallenge} from './edge/crypto.mjs';
import {createVerifier} from './edge/oauth.mjs';
import {createPinnedPoster,parseHttp,publicAddress} from './edge/egress.mjs';
import {createEdgeRuntime} from './edge/runtime.mjs';
const owner='00000000-0000-0000-0000-000000000004',session='00000000-0000-0000-0000-000000000008',client='00000000-0000-0000-0000-000000000009';
import {authFixture} from './edge/test-auth-fixture.mjs';
test('Edge WebCrypto verifies signatures and rejects broad, expired, wrong audience or forged tokens',async()=>{
 const f=await authFixture(),verify=createVerifier(f.config,{fetcher:f.fetcher});assert.equal((await verify(await f.token())).subject,owner);
 for(const bad of [{role:'authenticated'},{aud:'authenticated'},{client_id:undefined},{recoveryos_permission:undefined},{scope:'email'},{exp:1},{session_id:undefined},{iss:'https://bad.example'}])await assert.rejects(verify(await f.token(bad)));
 const token=await f.token(),parts=token.split('.');parts[1]=parts[1].slice(0,-2)+'AA';await assert.rejects(verify(parts.join('.')));
});
test('Edge AES envelopes bind owner/context, survive new adapter, support explicit key rotation',async()=>{
 const keys={first:new Uint8Array(32).fill(7),second:new Uint8Array(32).fill(8)},a=createCipher({activeKeyId:'first',keys});
 const envelope=await a.seal({text:'Synthetic selected text'},'owner/context');assert.ok(!JSON.stringify(envelope).includes('Synthetic'));
 const b=createCipher({activeKeyId:'second',keys});assert.equal((await b.open(envelope,'owner/context')).text,'Synthetic selected text');
 await assert.rejects(b.open(envelope,'other/context'));await assert.rejects(b.open({...envelope,ciphertext:base64(bytes('tampered'))},'owner/context'));
});
test('WebCrypto signed challenge is verifiable and rotation dual-signs briefly',async()=>{
 const secret='whsec_'+base64(new Uint8Array(32).fill(7));const sub={id:'synthetic',delivery:{secret},previousDelivery:{secret},previousUntil:2000};
 const message=await signedMessage(sub,'event-1',{challenge:'test'},1000);assert.equal(message.headers['webhook-signature'].split(' ').length,2);
 const key=await crypto.subtle.importKey('raw',new Uint8Array(32).fill(7),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const signature=Uint8Array.from(atob(message.headers['webhook-signature'].split(' ')[0].slice(3)),x=>x.charCodeAt(0));
 assert.ok(await crypto.subtle.verify('HMAC',key,signature,bytes('event-1.1.'+message.body)));assert.ok(await sameChallenge('test','test'));assert.equal(await sameChallenge('other','test'),false);
});
function fakeNet(response,{addresses=['8.8.8.8'],writeSize=99999}={}){
 let read=false;const calls=[];return {calls,resolveDns:async(_host,type)=>type==='A'?addresses:[],connect:async options=>{calls.push(options);return {close(){}};},startTls:async(_conn,options)=>{calls.push(options);return {handshake:async()=>{},close:()=>calls.push('closed'),write:async data=>Math.min(data.length,writeSize),read:async buffer=>{if(read)return null;read=true;buffer.set(bytes(response));return bytes(response).length;}};}};
}
test('Edge transport pins public address, retains TLS hostname, handles partial writes, never follows redirects',async()=>{
 const net=fakeNet('HTTP/1.1 302 Found\r\nLocation: https://private.invalid/\r\nContent-Length: 0\r\n\r\n',{writeSize:5});
 const result=await createPinnedPoster({verified:true,net})('https://callback.synthetic.example/events',{body:'{}',headers:{}});
 assert.equal(result.status,302);assert.equal(net.calls[0].hostname,'8.8.8.8');assert.equal(net.calls[1].hostname,'callback.synthetic.example');assert.equal(net.calls.length,3);
});
test('Edge transport fails closed when unverified, private/mixed DNS, resolution failure or stalled connection',async()=>{
 await assert.rejects(createPinnedPoster()('https://callback.synthetic.example',{}),/not_verified/);
 for(const addresses of [['127.0.0.1'],['8.8.8.8','10.0.0.1'],['::ffff:8.8.8.8'],[]]){
  const net=fakeNet('',{addresses});await assert.rejects(createPinnedPoster({verified:true,net})('https://callback.synthetic.example',{body:'{}',headers:{}}));assert.equal(net.calls.length,0);
 }
 await assert.rejects(createPinnedPoster({verified:true,timeoutMs:10,net:{resolveDns:()=>new Promise(()=>{}),connect(){},startTls(){}}})('https://callback.synthetic.example',{body:'{}',headers:{}}),/deadline/);
 for(const ip of ['10.0.0.1','2001:db8::1','2002:808::1','3fff::1','999.0.0.1','::1'])assert.equal(publicAddress(ip),false);
 assert.ok(publicAddress('2606:4700::1111'));
});
test('HTTP response parser rejects ambiguous framing, oversized bodies and malformed chunks',()=>{
 assert.equal(parseHttp(bytes('HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n2\r\n{}\r\n0\r\n\r\n')).body,'{}');
 for(const raw of ['HTTP/1.1 200 OK\r\nContent-Length: 9\r\n\r\n{}','HTTP/1.1 200 OK\r\nContent-Length: 0\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n','HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\nffff\r\n{}','HTTP/1.1 200 OK\r\n\r\n'+'x'.repeat(8193)])assert.throws(()=>parseHttp(bytes(raw)));
});
test('managed deployment path is disabled until both activation gates pass',async()=>{
 for(const config of [{},{enabled:true},{egressVerified:true}])assert.equal((await createEdgeRuntime(config).fetch(new Request('https://app.synthetic.example/mcp'))).status,503);
});
test('managed app preflight permits only the configured origin and expected headers',async()=>{
 const f=await authFixture();const runtime=createEdgeRuntime({enabled:true,egressVerified:true,resource:f.config.audience,appOrigin:'https://admin.synthetic.example',activeKeyId:'test',oauth:f.config},{query:async()=>[],keys:{test:new Uint8Array(32).fill(7)},fetcher:f.fetcher});
 const request=origin=>new Request('https://app.synthetic.example/app/requests',{method:'OPTIONS',headers:{origin,'access-control-request-method':'POST','access-control-request-headers':'authorization,content-type'}});
 const accepted=await runtime.fetch(request('https://admin.synthetic.example'));assert.equal(accepted.status,204);assert.equal(accepted.headers.get('access-control-allow-origin'),'https://admin.synthetic.example');
 assert.equal((await runtime.fetch(request('https://wrong.synthetic.example'))).status,403);
});
test('Edge transport rechecks delivery authorization after TLS and before writing bytes',async()=>{
 const net=fakeNet('HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n');let writes=0;
 const start=net.startTls;net.startTls=async(...args)=>{const conn=await start(...args);conn.write=async()=>{writes++;return 1;};return conn;};
 await assert.rejects(createPinnedPoster({verified:true,net})('https://callback.synthetic.example',{body:'{}',headers:{},beforeSend:async()=>false}),/authorization_revoked/);
 assert.equal(writes,0);
});
