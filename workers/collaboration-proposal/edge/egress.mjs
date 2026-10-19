import {bytes} from './crypto.mjs';
// Conservative public IP policy, independent of Node compatibility shims.
export function publicAddress(address) {
 if(typeof address!=='string')return false;
 if(/^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(address)){
  const [a,b,c,...rest]=address.split('.').map(Number);if([a,b,c,...rest].some(n=>n>255))return false;
  return !(a===0||a===10||a===127||a>=224||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&(b===168||b===0||(b===88&&c===99)))||(a===198&&(b===18||b===19||(b===51&&c===100)))||(a===203&&b===0&&c===113));
 }
 if(!/^[a-f0-9:]+$/i.test(address)||!address.includes(':'))return false;
 try {new URL('https://['+address+']/');}catch{return false;}
 const halves=address.toLowerCase().split('::'),left=halves[0]?halves[0].split(':'):[],right=halves[1]?halves[1].split(':'):[];
 const words=halves.length===1?left:[...left,...Array(8-left.length-right.length).fill('0'),...right];
 const first=parseInt(words[0],16),second=parseInt(words[1],16);
 return first>=0x2000&&first<=0x3fff&&first!==0x2002&&first!==0x3fff&&!(first===0x2001&&(second<0x200||second===0xdb8));
}
export function parseHttp(raw) {
 // latin1 preserves byte offsets, unlike UTF-8 decoding before framing validation.
 const text=Array.from(raw,b=>String.fromCharCode(b)).join(''),end=text.indexOf('\r\n\r\n');
 if(end<0||end>16384)throw new Error('invalid_response_headers');
 const lines=text.slice(0,end).split('\r\n'),match=/^HTTP\/1\.[01] ([2-5][0-9]{2})(?: [\x20-\x7e]*)?$/.exec(lines.shift());if(!match)throw new Error('invalid_status');
 const headers={};for(const line of lines){const m=/^([!#$%&'*+.^_`|~0-9A-Za-z-]+):[ \t]*([^\r\n]*)$/.exec(line);if(!m)throw new Error('invalid_header');const k=m[1].toLowerCase();if(k in headers)throw new Error('duplicate_header');headers[k]=m[2].trim();}
 let body=raw.slice(end+4);
 if(headers['content-encoding']&&headers['content-encoding']!=='identity')throw new Error('unsupported_encoding');
 if(headers['transfer-encoding']){
  if(headers['transfer-encoding'].toLowerCase()!=='chunked'||headers['content-length']!==undefined)throw new Error('ambiguous_framing');
  const chunks=[];let offset=0,total=0;
  while(true){let next=offset;while(next+1<body.length&&!(body[next]===13&&body[next+1]===10))next++;
   const line=new TextDecoder().decode(body.slice(offset,next));if(!/^[0-9a-f]{1,8}$/i.test(line))throw new Error('invalid_chunk');const size=parseInt(line,16);offset=next+2;
   if(size===0){if(offset+2!==body.length||body[offset]!==13||body[offset+1]!==10)throw new Error('unsupported_trailer');break;}
   total+=size;if(total>8192||offset+size+2>body.length||body[offset+size]!==13||body[offset+size+1]!==10)throw new Error('invalid_chunk');chunks.push(body.slice(offset,offset+size));offset+=size+2;
  }
  body=new Uint8Array(total);let cursor=0;for(const chunk of chunks){body.set(chunk,cursor);cursor+=chunk.length;}
 } else if(headers['content-length']!==undefined&&(!/^\d+$/.test(headers['content-length'])||Number(headers['content-length'])!==body.length))throw new Error('invalid_content_length');
 if(body.length>8192)throw new Error('response_body_limit');
 return {status:Number(match[1]),body:new TextDecoder('utf-8',{fatal:true}).decode(body)};
}
export function createPinnedPoster({verified=false,net=globalThis.Deno,timeoutMs=10000}={}) {
 return async(destination,message)=>{
  if(!verified)throw new Error('managed_egress_not_verified');
  const url=new URL(destination),host=url.hostname.replace(/^\[|\]$/g,'');
  if(url.protocol!=='https:'||url.username||url.password||url.hash||(url.port&&url.port!=='443'))throw new Error('unsafe_callback');
  if(!net?.resolveDns||!net.connect||!net.startTls)throw new Error('missing_pinned_tls');
  if(bytes(message.body).length>262144)throw new Error('request_limit');
  let conn,expired=false,timer;
  const operation=async()=>{
   let addresses;
   if(/^[0-9.]+$/.test(host)||host.includes(':'))addresses=[host];
   else {const resolve=async type=>{try{return await net.resolveDns(host,type);}catch(e){if(net.errors?.NotFound&&e instanceof net.errors.NotFound)return [];throw e;}};
    addresses=(await Promise.all([resolve('A'),resolve('AAAA')])).flat();}
   if(expired)throw new Error('callback_deadline');
   if(!addresses.length||addresses.some(ip=>!publicAddress(ip)))throw new Error('unsafe_dns');
   conn=await net.connect({hostname:addresses[0],port:443,transport:'tcp'});
   if(expired){conn.close();throw new Error('callback_deadline');}
   conn=await net.startTls(conn,{hostname:host}); // default public trust store, original hostname/SNI
   if(expired){conn.close();throw new Error('callback_deadline');}
   await conn.handshake();
   if(message.beforeSend&&!await message.beforeSend())throw new Error('authorization_revoked');
   const headers={...message.headers,host:url.host,connection:'close','content-length':String(bytes(message.body).length)};
   for(const [key,value] of Object.entries(headers))if(!/^[a-zA-Z0-9-]+$/.test(key)||typeof value!=='string'||/[^\x20-\x7e]/.test(value))throw new Error('invalid_request_header');
   const request=bytes(`POST ${url.pathname}${url.search} HTTP/1.1\r\n${Object.entries(headers).map(([k,v])=>`${k}: ${v}`).join('\r\n')}\r\n\r\n${message.body}`);
   let sent=0;while(sent<request.length){const n=await conn.write(request.subarray(sent));if(!n)throw new Error('connection_closed');sent+=n;}
   const chunks=[];let total=0;while(true){const buffer=new Uint8Array(4096),n=await conn.read(buffer);if(n===null)break;if(!n)throw new Error('empty_read');total+=n;if(total>32768)throw new Error('response_limit');chunks.push(buffer.slice(0,n));}
   const raw=new Uint8Array(total);let offset=0;for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.length;}
   return parseHttp(raw); // 3xx is returned as failure; never follows Location.
  };
  try {return await Promise.race([operation(),new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;try{conn?.close();}catch{}reject(new Error('callback_deadline'));},timeoutMs);})]);}
  finally{clearTimeout(timer);try{conn?.close();}catch{}}
 };
}
