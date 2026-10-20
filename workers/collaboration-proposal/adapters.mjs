import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createPinnedPoster } from './egress.mjs';
function signingKey(secret) {
  if(typeof secret!=='string'||!/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(secret))throw new Error('invalid_signing_secret');
  const key=Buffer.from(secret.slice(6),'base64');if(key.length<24||key.length>64)throw new Error('invalid_signing_secret');return key;
}
export function signedMessage(subscription,id,value,now=Date.now()) {
  const body=JSON.stringify(value), timestamp=String(Math.floor(now/1000));
  let signature=createHmac('sha256',signingKey(subscription.delivery.secret)).update(`${id}.${timestamp}.${body}`).digest('base64');
  signature=`v1,${signature}`;
  if(subscription.previousDelivery && subscription.previousUntil>now)signature+=' v1,'+createHmac('sha256',signingKey(subscription.previousDelivery.secret)).update(`${id}.${timestamp}.${body}`).digest('base64');
  return {body,headers:{'content-type':'application/json','webhook-id':id,'webhook-timestamp':timestamp,'webhook-signature':signature,'X-MCP-Subscription-Id':subscription.id}};
}
export function createAdapters({store,verifyAccessToken,authorize,post=createPinnedPoster(),now=Date.now}) {
  return {
    verifyAccessToken, authorize,
    async enqueue(principal,a) { if(!await authorize(principal,a.residence_id))throw new Error('not_authorized');return store.enqueue(principal,a); },
    async exchange(method,principal,a) { if(!await authorize(principal,a.residence_id))throw new Error('not_authorized');return store.exchange(method,principal,a); },
    async subscriptions(method,principal,p) {
      if(!await authorize(principal,p.arguments.residence_id))throw new Error('not_authorized');
      const id=store.subscriptionId(principal,p);
      if(method==='events/unsubscribe')return store.unsubscribe(id,principal.subject);
      signingKey(p.delivery.secret);
      store.verificationAttempt(principal.subject);
      const expires=Math.min(now()+Math.min(p.ttlMs??3600000,3600000),principal.expiresAt);
      if(expires<=now())throw new Error('expired_principal');
      const challenge=randomUUID(),started=now();
      try {
        const response=await post(p.delivery.url,signedMessage({id,delivery:p.delivery},randomUUID(),{type:'verification',challenge},now()));
        const got=Buffer.from(JSON.parse(response.body).challenge??'');const expected=Buffer.from(challenge);
        if(response.status<200||response.status>=300||now()-started>15000||got.length!==expected.length||!timingSafeEqual(got,expected))throw new Error();
      }catch {const e=new Error('callback_verification_failed');e.code=-32015;e.reason='challenge_failed';throw e;}
      if(!await authorize(principal,p.arguments.residence_id))throw new Error('not_authorized');
      return store.putSubscription(id,principal,p,expires);
    },
    async deliverOne() {
      store.prune();const row=store.claim();if(!row)return false;
      const sub=store.getSubscription(row.subscription);
      if(!sub||sub.owner!==row.owner||sub.residence!==row.residence||!await authorize(sub.principal,row.residence)) {store.unsubscribe(row.subscription,row.owner);return true;}
      const event={eventId:row.id,name:'collaboration.requested',timestamp:new Date(row.created).toISOString(),data:{residence_id:row.residence,request_id:row.request},cursor:null};
      let status=0;
      try {status=(await post(sub.delivery.url,signedMessage(sub,row.id,event,now()))).status;}catch{/* bounded retries, no payload/error logging */}
      store.finish(row,status);return true;
    },
  };
}
