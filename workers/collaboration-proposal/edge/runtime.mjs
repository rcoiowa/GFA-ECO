import {createEndpoint} from '../endpoint.mjs';
import {createVerifier} from './oauth.mjs';
import {createCipher,boundedJson} from './crypto.mjs';
import {createPostgresStore} from './postgres.mjs';
import {createAdapters} from './adapters.mjs';
import {createPinnedPoster} from './egress.mjs';
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
/** @param {any} config @param {any} [dependencies] */
export function createEdgeRuntime(config,dependencies={}) {
 const {query,keys,fetcher,post,waitUntil=(_promise)=>{}}=dependencies;
 if(config.enabled!==true||config.egressVerified!==true)return {fetch:async()=>json({error:'bridge_not_activated',connected:false},503),deliverOne:async()=>{throw new Error('bridge_not_activated');}};
 if(!config.appOrigin||!config.resource||!config.activeKeyId||!query)throw new Error('configuration_required');
 if(new URL(config.resource).protocol!=='https:'||new URL(config.appOrigin).origin!==config.appOrigin||new URL(config.appOrigin).protocol!=='https:')throw new Error('https_origins_required');
 const store=createPostgresStore({query,cipher:createCipher({activeKeyId:config.activeKeyId,keys})});
 const mcpVerifier=createVerifier({...config.oauth,audience:config.resource,channel:'mcp'},{fetcher});
 const appVerifier=createVerifier({...config.oauth,audience:'authenticated',channel:'app'},{fetcher});
 const adapters=createAdapters({store,verifyAccessToken:mcpVerifier,post:post??createPinnedPoster({verified:config.egressVerified})});
 const basePath=new URL(config.resource).pathname.replace(/\/[^/]*$/,'');
 const appPath=basePath+'/app/requests',deliveryPath=basePath+'/app/deliver';
 const mcp=createEndpoint({...config,metadataPath:basePath+'/.well-known/oauth-protected-resource',issuer:config.oauth.issuer},adapters);
 const drain=async()=>{for(let i=0;i<5;i++)if(!await adapters.deliverOne())break;};
 return {
  deliverOne:adapters.deliverOne,
  async fetch(request){const url=new URL(request.url);
   if(![appPath,deliveryPath].includes(url.pathname)){
    const response=await mcp(request);
    if(request.method==='POST'&&response.ok){const body=await response.clone().json();if(body.result!==undefined)waitUntil(drain().catch(()=>{}));}
    return response;
   }
   if(url.origin!==new URL(config.resource).origin||request.headers.get('origin')!==config.appOrigin)return json({error:'not_allowed'},403);
   const cors={'access-control-allow-origin':config.appOrigin,'vary':'Origin'};
   const reply=(value,status=200)=>{const response=json(value,status);for(const [k,v] of Object.entries(cors))response.headers.set(k,v);return response;};
   if(request.method==='OPTIONS'){
    const requested=(request.headers.get('access-control-request-headers')??'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
    if(request.headers.get('access-control-request-method')!=='POST'||requested.some(x=>!['authorization','content-type'].includes(x)))return reply({error:'not_allowed'},403);
    return new Response(null,{status:204,headers:{...cors,'access-control-allow-methods':'POST','access-control-allow-headers':'authorization,content-type','access-control-max-age':'600'}});
   }
   if(request.method!=='POST'||!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'not_allowed'},403);
   try {const token=/^Bearer ([^\s]+)$/.exec(request.headers.get('authorization')??'')?.[1],p=await appVerifier(token);
    if(!await store.authorize(p,null))throw new Error('not_authorized');
    const a=await boundedJson(request);
    if(!a||typeof a!=='object'||Array.isArray(a))throw new Error('invalid_request');
    if(url.pathname===deliveryPath){if(Object.keys(a).length)throw new Error('invalid_request');await drain();return reply({checked:true});}
    if(a.action==='status'){
     if(Object.keys(a).some(k=>!['action','residence_id','request_id'].includes(k)))throw new Error('invalid_request');
     return reply(await store.exchange('request_status',p,a));
    }
    if(Object.keys(a).some(k=>!['residence_id','operation_id','context','approved'].includes(k)))throw new Error('invalid_request');
    const result=await store.enqueue(p,a);waitUntil(drain().catch(()=>{}));return reply(result);
   }catch{return reply({error:'request_refused'},403);}
  },
 };
}
