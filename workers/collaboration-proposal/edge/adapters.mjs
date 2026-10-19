import {secretBytes,signedMessage,sameChallenge} from './crypto.mjs';
export function createAdapters({store,verifyAccessToken,post,now=Date.now}) {
 const authorize=(p,r)=>store.authorize(p,r);
 return {
  verifyAccessToken,authorize,
  enqueue:(p,a)=>store.enqueue(p,a),exchange:(op,p,a)=>store.exchange(op,p,a),
  async subscriptions(op,p,a){const r=a.arguments.residence_id;if(!await authorize(p,r))throw new Error('not_authorized');
   const id=await store.subscriptionId(p,a);
   if(op==='events/unsubscribe')return store.unsubscribe(p,r,id);
   secretBytes(a.delivery.secret);await store.verificationAttempt(p,r);
   const expires=Math.min(now()+Math.min(a.ttlMs??3600000,3600000),p.expiresAt);if(expires<=now())throw new Error('expired');
   const challenge=crypto.randomUUID(),started=now();
   try {const response=await post(a.delivery.url,await signedMessage({id,delivery:a.delivery},crypto.randomUUID(),{type:'verification',challenge},now()));
    if(response.status<200||response.status>=300||now()-started>15000||!await sameChallenge(JSON.parse(response.body).challenge,challenge))throw new Error('challenge_failed');
   }catch{const error=new Error('callback_verification_failed');error.code=-32015;throw error;}
   if(!await authorize(p,r))throw new Error('not_authorized');
   const old=await store.getSubscription(p,r,id);return store.putSubscription(id,p,a,expires,old);
  },
  async deliverOne(){const row=await store.claim();if(!row)return false;if(row.skipped)return true;
   const sub=row.subscription,p=sub.principal;
   if(!await authorize(p,row.residence)){await store.finish(row.job,410);return true;}
   const event={eventId:row.job.id,name:'collaboration.requested',timestamp:new Date(row.created).toISOString(),data:{residence_id:row.residence,request_id:row.job.request},cursor:null};
   let status=0;try{status=(await post(sub.delivery.url,{...await signedMessage(sub,row.job.id,event,now()),beforeSend:()=>authorize(p,row.residence)})).status;}catch{/* bounded persistent retries, no payload logs */}
   await store.finish(row.job,status);return true;
  },
 };
}
