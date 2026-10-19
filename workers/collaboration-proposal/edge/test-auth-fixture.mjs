import {base64,bytes} from './crypto.mjs';
const owner='00000000-0000-0000-0000-000000000004',session='00000000-0000-0000-0000-000000000008',client='00000000-0000-0000-0000-000000000009';
export async function authFixture(){
 const keys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const jwk={...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'synthetic-key',alg:'ES256',use:'sig'};
 const config={issuer:'https://auth.synthetic.example',jwksUrl:'https://auth.synthetic.example/keys',audience:'https://app.synthetic.example/mcp',clientIds:[client],channel:'mcp'};
 const claims={iss:config.issuer,aud:config.audience,sub:owner,session_id:session,client_id:client,scope:'openid',role:'recoveryos_bridge_client',recoveryos_permission:'collaboration:exchange',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+600};
 const enc=v=>base64(bytes(JSON.stringify(v))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 return {config,claims,fetcher:async()=>new Response(JSON.stringify({keys:[jwk]})),token:async(overrides={})=>{
  const raw=enc({alg:'ES256',typ:'at+jwt',kid:jwk.kid})+'.'+enc({...claims,...overrides});
  return raw+'.'+base64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,bytes(raw))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 }};
}
