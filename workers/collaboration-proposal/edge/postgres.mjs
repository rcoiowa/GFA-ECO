import {bytes,hash} from './crypto.mjs';
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v);
const residence=v=>typeof v==='string'&&/^[1-9][0-9]*$/.test(v);
// query is the dedicated worker DB connection, never a service-role credential.
export function createPostgresStore({query,cipher}) {
 const command=async(op,p={},a={})=>{const rows=await query('select recoveryos_bridge_private.exchange_command($1::text,$2::jsonb,$3::jsonb) as result',[op,JSON.stringify(p),JSON.stringify(a)]);return rows[0].result;};
 const aad=(p,r,op,kind)=>JSON.stringify([p.subject,String(r),op,kind]);
 return {
  command,
  async authorize(p,r){try{return await command('authorize',p,{residence_id:r})===true;}catch{return false;}},
  async enqueue(p,a){if(p.channel!=='app'||a.approved!==true||!residence(a.residence_id)||!id(a.operation_id)||typeof a.context!=='string'||!a.context.trim()||bytes(a.context).length>16000)throw new Error('explicit_selected_context_required');
   return command('enqueue',p,{residence_id:a.residence_id,operation_id:a.operation_id,approved:true,digest:await hash(JSON.stringify([a.residence_id,a.context])),envelope:await cipher.seal({context:a.context},aad(p,a.residence_id,a.operation_id,'request'))});},
  async exchange(op,p,a){if(!['read_request','request_status','reply_to_request'].includes(op)||!residence(a.residence_id)||!id(a.request_id))throw new Error('invalid_arguments');
   let input={residence_id:a.residence_id,request_id:a.request_id};
   if(op==='reply_to_request'){if(p.channel!=='mcp'||!id(a.operation_id)||typeof a.text!=='string'||!a.text.trim()||bytes(a.text).length>16000)throw new Error('invalid_reply');input={...input,operation_id:a.operation_id,digest:await hash(a.text),envelope:await cipher.seal({text:a.text},aad(p,a.residence_id,a.request_id,'reply'))};}
   const result=await command(op,p,input);
   if(op==='read_request'){result.selectedContext=(await cipher.open(result.envelope,aad(p,a.residence_id,result.operation,'request'))).context;}
   if(op==='request_status'){result.reply=result.envelope?(await cipher.open(result.envelope,aad(p,a.residence_id,a.request_id,'reply'))).text:null;}
   delete result.envelope;delete result.operation;return result;},
  subscriptionId:async(p,a)=>hash(JSON.stringify([p.subject,p.clientId,a.delivery.url,a.name,a.arguments.residence_id])),
  verificationAttempt:(p,r)=>command('verification_attempt',p,{residence_id:r}),
  async getSubscription(p,r,id){const row=await command('subscription_get',p,{residence_id:r,id});return row?{...row,...await cipher.open(row.envelope,'subscription/'+id)}:null;},
  async putSubscription(id,p,a,expiresAt,old){return command('subscription_put',p,{id,residence_id:a.arguments.residence_id,expiresAt,envelope:await cipher.seal({delivery:a.delivery,previousDelivery:old&&old.delivery.secret!==a.delivery.secret?old.delivery:null,previousUntil:Date.now()+60000},'subscription/'+id)});},
  unsubscribe:(p,r,id)=>command('unsubscribe',p,{residence_id:r,id}),
  async claim(){const row=await command('claim');if(row&&!row.skipped)row.subscription={...row.subscription,...await cipher.open(row.subscription.envelope,'subscription/'+row.subscription.id)};return row;},
  finish:(job,status)=>command('finish',{}, {id:job.id,lease_id:job.lease_id,status}),
 };
}
