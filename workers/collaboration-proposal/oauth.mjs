import { createPublicKey, verify } from 'node:crypto';
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
async function readKeys(url, fetcher) {
  const r = await fetcher(url,{ redirect:'error', signal:AbortSignal.timeout(5000) });
  if (!r.ok || !r.body) throw new Error('jwks_unavailable');
  const reader=r.body.getReader(); const chunks=[]; let size=0;
  try { while(true) { const {done,value}=await reader.read(); if(done)break; size+=value.length; if(size>65536)throw new Error('jwks_too_large'); chunks.push(value); } }
  finally { await reader.cancel(); }
  const keys=JSON.parse(Buffer.concat(chunks)).keys;
  if(!Array.isArray(keys)||keys.length>32)throw new Error('invalid_jwks'); return keys;
}
// Trusted config supplies issuer/JWKS, never token jku/x5u. No symmetric-key fallback.
export function createTokenVerifier(config,{fetcher=fetch,now=Date.now}={}) {
  if (!config.issuer?.startsWith('https://') || !config.jwksUrl?.startsWith('https://') || new URL(config.issuer).origin !== new URL(config.jwksUrl).origin || !config.audience) throw new Error('oauth_configuration_required');
  let cached=[], validUntil=0;
  return async token => {
    if(typeof token!=='string'||token.length>16384)throw new Error('invalid_token');
    const parts=token.split('.'); if(parts.length!==3||parts.some(p=>!p||!/^[A-Za-z0-9_-]+$/.test(p)))throw new Error('invalid_token');
    const header=JSON.parse(Buffer.from(parts[0],'base64url')); const claims=JSON.parse(Buffer.from(parts[1],'base64url'));
    if(!['RS256','ES256'].includes(header.alg)||typeof header.kid!=='string'||header.crit||header.jku||header.x5u||!['JWT','at+jwt'].includes(header.typ))throw new Error('invalid_token');
    if(now()>=validUntil) { cached=await readKeys(config.jwksUrl,fetcher); validUntil=now()+60000; }
    const matches=cached.filter(k=>k.kid===header.kid&&k.alg===header.alg&&(k.use===undefined||k.use==='sig')&&(!k.key_ops||k.key_ops.includes('verify')));
    if(matches.length!==1)throw new Error('unknown_signing_key');
    const jwk=matches[0]; if((header.alg==='RS256'&&jwk.kty!=='RSA')||(header.alg==='ES256'&&(jwk.kty!=='EC'||jwk.crv!=='P-256')))throw new Error('invalid_key');
    const key=createPublicKey({key:jwk,format:'jwk'});
    if(header.alg==='RS256'&&key.asymmetricKeyDetails?.modulusLength<2048)throw new Error('weak_key');
    if(!verify('sha256',Buffer.from(`${parts[0]}.${parts[1]}`),{key,dsaEncoding:'ieee-p1363'},Buffer.from(parts[2],'base64url')))throw new Error('invalid_signature');
    const seconds=Math.floor(now()/1000);
    if(claims.iss!==config.issuer || claims.aud!==config.audience || !Number.isInteger(claims.exp)||claims.exp<=seconds||
      !Number.isInteger(claims.iat)||claims.iat>seconds+30||claims.exp-claims.iat>3600||
      (claims.nbf!==undefined&&(!Number.isInteger(claims.nbf)||claims.nbf>seconds))||!uuid(claims.sub)||!uuid(claims.session_id))throw new Error('invalid_claims');
    if(config.channel==='mcp' && (!config.clientIds?.includes(claims.client_id)||claims.role!=='recoveryos_bridge_client'||claims.recoveryos_permission!=='collaboration:exchange'||(claims.scope!==undefined&&(typeof claims.scope!=='string'||!claims.scope.split(' ').includes('openid')))))throw new Error('invalid_client_scope');
    if(config.channel==='app' && (claims.client_id||claims.role!=='authenticated'))throw new Error('first_party_session_required');
    return {subject:claims.sub,sessionId:claims.session_id,clientId:claims.client_id??null,expiresAt:claims.exp*1000,channel:config.channel};
  };
}
// A narrowly granted read-only DB function checks current session/consent and canonical roles.
// query is a parameterized PostgreSQL connection, NOT a service-role HTTP client.
export function createAuthorizer(query) {
  return async (principal,residenceId) => {
    if(!principal?.subject||!principal.sessionId||principal.expiresAt<=Date.now())return false;
    if(residenceId!==null&&!/^[1-9][0-9]*$/.test(String(residenceId)))return false;
    const r=await query('select recoveryos_bridge_private.authorized($1::uuid,$2::uuid,$3::uuid,$4::bigint) as allowed',
      [principal.subject,principal.sessionId,principal.clientId,residenceId]);
    return r.rows?.[0]?.allowed===true;
  };
}
