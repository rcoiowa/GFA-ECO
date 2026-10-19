import { lookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';

// Conservative public-address allowlist. Reject transition/mapped IPv6 and special ranges.
export function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a,b,c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) !== 6 || address.includes('.')) return false;
  const halves = address.toLowerCase().split('::');
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves[1] ? halves[1].split(':') : [];
  const words = halves.length === 1 ? left : [...left, ...Array(8-left.length-right.length).fill('0'), ...right];
  const first = parseInt(words[0],16), second = parseInt(words[1],16);
  return first >= 0x2000 && first <= 0x3fff && first !== 0x2002 && first !== 0x3fff &&
    !(first === 0x2001 && (second < 0x200 || second === 0xdb8));
}

export function createPinnedPoster({ resolve = lookup, connect = httpsRequest } = {}) {
  return async (destination, { headers, body }) => {
    const url = new URL(destination);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || (url.port && url.port !== '443')) throw new Error('unsafe_callback');
    const hostname = url.hostname.replace(/^\[|\]$/g,'');
    // Do not let a slow resolver leave an unbounded verification promise.
    let timer;
    const addresses = await Promise.race([
      resolve(hostname, { all: true, verbatim: true }),
      new Promise((_,reject) => { timer = setTimeout(() => reject(new Error('dns_timeout')),5000); }),
    ]).finally(() => clearTimeout(timer));
    if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw new Error('unsafe_callback');
    const pinned = addresses[0];
    return new Promise((resolveResult,reject) => {
      const req = connect(url, {
        method: 'POST', agent: false, servername: isIP(hostname) ? undefined : hostname,
        rejectUnauthorized: true, timeout: 10000, maxHeaderSize: 16384,
        headers: { ...headers, 'content-length': Buffer.byteLength(body) },
        // TLS still verifies the original URL hostname; connection uses only this vetted address.
        lookup: (_host, options, callback) => options.all ? callback(null,[pinned]) : callback(null,pinned.address,pinned.family),
      }, response => {
        let size=0; const chunks=[];
        response.on('data', chunk => { size += chunk.length; if (size>8192) response.destroy(new Error('callback_response_too_large')); else chunks.push(chunk); });
        response.on('error',reject);
        response.on('end',() => resolveResult({ status: response.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      });
      const deadline=setTimeout(()=>req.destroy(new Error('callback_deadline')),10000);
      req.on('close',()=>clearTimeout(deadline));
      req.on('timeout',() => req.destroy(new Error('callback_timeout')));
      req.on('error',reject); req.end(body);
    });
  };
}
