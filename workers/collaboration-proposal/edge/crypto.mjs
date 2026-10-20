const utf8 = new TextEncoder();
export const bytes = value => utf8.encode(value);
export const base64 = value => btoa(String.fromCharCode(...new Uint8Array(value)));
export const unbase64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
export const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function boundedJson(response,limit=24576) {
 if(!response.body)throw new Error('body_required');
 const reader=response.body.getReader(),chunks=[];let size=0;
 try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw new Error('body_limit');chunks.push(value);}}finally{await reader.cancel();}
 const output=new Uint8Array(size);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(output));
}
export function createCipher({activeKeyId,keys}) {
 if(!activeKeyId||!keys?.[activeKeyId]||Object.values(keys).some(key=>!(key instanceof Uint8Array)||key.length!==32))throw new Error('external_keyring_required');
 return {
  async seal(value,aad) {const iv=crypto.getRandomValues(new Uint8Array(12)),key=await crypto.subtle.importKey('raw',keys[activeKeyId],'AES-GCM',false,['encrypt']);
   const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:bytes(aad)},key,bytes(JSON.stringify(value)));
   return {v:1,kid:activeKeyId,iv:base64(iv),ciphertext:base64(ciphertext)};},
  async open(envelope,aad) {if(envelope?.v!==1||!keys[envelope.kid])throw new Error('unknown_encryption_key');
   const key=await crypto.subtle.importKey('raw',keys[envelope.kid],'AES-GCM',false,['decrypt']);
   return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unbase64(envelope.iv),additionalData:bytes(aad)},key,unbase64(envelope.ciphertext))));}
 };
}
export function secretBytes(secret) {
 if(typeof secret!=='string'||!/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(secret))throw new Error('invalid_secret');
 const key=unbase64(secret.slice(6));if(key.length<24||key.length>64)throw new Error('invalid_secret');return key;
}
export async function signedMessage(sub,id,value,now=Date.now()) {
 const body=JSON.stringify(value),timestamp=String(Math.floor(now/1000));
 const sign=async secret=>{const key=await crypto.subtle.importKey('raw',secretBytes(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return 'v1,'+base64(await crypto.subtle.sign('HMAC',key,bytes(`${id}.${timestamp}.${body}`)));};
 let signature=await sign(sub.delivery.secret);
 if(sub.previousDelivery&&sub.previousUntil>now)signature+=' '+await sign(sub.previousDelivery.secret);
 return {body,headers:{'content-type':'application/json','webhook-id':id,'webhook-timestamp':timestamp,'webhook-signature':signature,'X-MCP-Subscription-Id':sub.id}};
}
// Compare fixed-length challenge digests, avoiding variable-prefix equality.
export async function sameChallenge(actual,expected) {
 if(typeof actual!=='string'||actual.length>128)return false;
 const a=await hash(actual),b=await hash(expected);let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;
}
