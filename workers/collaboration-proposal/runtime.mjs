// Node 22.13+ / 24 service composition; no listener or deployment side effects.
// Deliberately separate from Cloudflare's public assets/weather Worker.
import { createEndpoint } from './endpoint.mjs';
import { createTokenVerifier,createAuthorizer } from './oauth.mjs';
import { ExchangeStore } from './store.mjs';
import { createAdapters } from './adapters.mjs';
export function createRuntime(config,{query,encryptionKey,fetcher,post}) {
  if(config.localPrototype!==true)throw new Error('deployment_transport_unverified');
  if(config.enabled!==true||config.retentionApproved!==true||!config.storagePath||!config.appOrigin)throw new Error('approved_configuration_required');
  const verifyAccessToken=createTokenVerifier({...config.oauth,audience:config.resource,channel:'mcp'},{fetcher});
  const verifyApp=createTokenVerifier({...config.oauth,audience:config.appAudience,channel:'app'},{fetcher});
  const authorize=createAuthorizer(query);
  const store=new ExchangeStore(config.storagePath,encryptionKey);
  const adapters=createAdapters({store,verifyAccessToken,authorize,post});
  const mcp=createEndpoint({...config,issuer:config.oauth.issuer},adapters);
  return {
    close:()=>store.close(),
    deliverOne:adapters.deliverOne,
    async fetch(request) {
      const url=new URL(request.url);
      if(url.pathname!=='/app/requests')return mcp(request);
      const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
      if(url.origin!==new URL(config.resource).origin||request.headers.get('origin')!==config.appOrigin||request.method!=='POST'||!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'not_allowed'},403);
      // Same-origin reverse proxy is required for the app; no CORS/cookie auth fallback.
      try {
        const token=/^Bearer ([^\s]+)$/.exec(request.headers.get('authorization')??'')?.[1];
        const principal=await verifyApp(token);
        // Bound before parsing, even when Content-Length is missing or dishonest.
        const reader=request.body.getReader();const chunks=[];let size=0;
        try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>24576)throw new Error();chunks.push(value);}}finally{await reader.cancel();}
        const input=JSON.parse(Buffer.concat(chunks));
        if(input.action==='status') {
          if(Object.keys(input).some(k=>!['action','residence_id','request_id'].includes(k)))throw new Error();
          return reply(await adapters.exchange('request_status',principal,input));
        }
        if(Object.keys(input).some(k=>!['residence_id','operation_id','context','approved'].includes(k)))throw new Error();
        return reply(await adapters.enqueue(principal,input));
      }catch{return reply({error:'request_refused'},403);}
    },
  };
}
