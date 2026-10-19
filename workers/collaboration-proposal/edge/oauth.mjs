import {boundedJson,unbase64,bytes} from './crypto.mjs';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const decode=v=>unbase64(v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4));
export function createVerifier(config,{fetcher=fetch,now=Date.now}={}) {
 if(!config.issuer?.startsWith('https://')||!config.jwksUrl?.startsWith('https://')||new URL(config.jwksUrl).origin!==new URL(config.issuer).origin||!config.audience)throw new Error('oauth_configuration_required');
 if(config.channel==='mcp'&&(!Array.isArray(config.clientIds)||!config.clientIds.length||config.clientIds.some(id=>!uuid(id))))throw new Error('approved_clients_required');
 let keys=[],until=0;
 return async token=>{
  if(typeof token!=='string'||token.length>16384)throw new Error('invalid_token');
  const parts=token.split('.');if(parts.length!==3||parts.some(p=>!p||!/^[A-Za-z0-9_-]+$/.test(p)))throw new Error('invalid_token');
  const header=JSON.parse(new TextDecoder().decode(decode(parts[0]))),claims=JSON.parse(new TextDecoder().decode(decode(parts[1])));
  if(!['RS256','ES256'].includes(header.alg)||typeof header.kid!=='string'||header.crit||header.jku||header.x5u||!['JWT','at+jwt'].includes(header.typ))throw new Error('invalid_header');
  if(now()>=until){const response=await fetcher(config.jwksUrl,{redirect:'error',signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error('jwks_unavailable');keys=(await boundedJson(response,65536)).keys;if(!Array.isArray(keys)||keys.length>32)throw new Error('invalid_keys');until=now()+60000;}
  const matches=keys.filter(k=>k.kid===header.kid&&k.alg===header.alg&&(!k.use||k.use==='sig')&&(!k.key_ops||k.key_ops.includes('verify')));if(matches.length!==1)throw new Error('unknown_key');
  const jwk=matches[0],rsa=header.alg==='RS256';
  if(rsa?(jwk.kty!=='RSA'||decode(jwk.n).length<256):(jwk.kty!=='EC'||jwk.crv!=='P-256'))throw new Error('invalid_key');
  const algorithm=rsa?{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}:{name:'ECDSA',namedCurve:'P-256',hash:'SHA-256'};
  const key=await crypto.subtle.importKey('jwk',jwk,algorithm,false,['verify']);
  if(!await crypto.subtle.verify(algorithm,key,decode(parts[2]),bytes(`${parts[0]}.${parts[1]}`)))throw new Error('invalid_signature');
  const seconds=Math.floor(now()/1000);
  if(claims.iss!==config.issuer||claims.aud!==config.audience||!Number.isInteger(claims.exp)||claims.exp<=seconds||!Number.isInteger(claims.iat)||claims.iat>seconds+30||claims.exp-claims.iat>3600||(claims.nbf!==undefined&&(!Number.isInteger(claims.nbf)||claims.nbf>seconds))||!uuid(claims.sub)||!uuid(claims.session_id))throw new Error('invalid_claims');
  if(config.channel==='mcp'&&(!config.clientIds?.includes(claims.client_id)||claims.role!=='recoveryos_bridge_client'||claims.recoveryos_permission!=='collaboration:exchange'||typeof claims.scope!=='string'||!claims.scope.split(' ').includes('openid')))throw new Error('invalid_permission');
  if(config.channel==='app'&&(claims.client_id||claims.role!=='authenticated'))throw new Error('first_party_required');
  return {subject:claims.sub,sessionId:claims.session_id,clientId:claims.client_id??null,expiresAt:claims.exp*1000,channel:config.channel};
 };
}
