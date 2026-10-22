import json
from pathlib import Path

root = Path(__file__).parent
types = {'index.html': 'text/html', 'styles.css': 'text/css', 'app.js': 'application/javascript'}
assets = {'/' + name: {'body': (root / 'public' / name).read_text(), 'type': mime + '; charset=utf-8'} for name, mime in types.items()}
handler = '''
export default {
  async fetch(request) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', {status: 405, headers: {'Allow': 'GET, HEAD'}});
    }
    const path = new URL(request.url).pathname;
    const asset = Object.hasOwn(assets, path === '/' ? '/index.html' : path) ? assets[path === '/' ? '/index.html' : path] : null;
    if (!asset) return new Response(request.method === 'HEAD' ? null : 'Page not found', {status: 404});
    return new Response(request.method === 'HEAD' ? null : asset.body, {
      headers: {
        'Content-Type': asset.type,
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  }
};
'''
(root / 'worker.mjs').write_text('const assets = ' + json.dumps(assets, ensure_ascii=False) + ';\n' + handler)
