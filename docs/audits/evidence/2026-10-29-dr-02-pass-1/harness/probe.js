const { chromium } = require('playwright');
const fs = require('fs');
const out = process.argv[2];
const targets = [
  ['recoverycommunity.center','/'],['recoverycommunity.app','/'],['vrcc.app','/'],
  ['vrcc.app','/vrcc/today'],['vrcc.app','/app/today'],['vrcc.app','/staff'],['vrcc.app','/admin'],['vrcc.app','/my-housing'],
  ['vrcc.app','/sign-in'],['vrcc.app','/register'],['vrcc.app','/support'],['vrcc.app','/community-center'],
  ['vrcc.app','/recovery-residences'],['vrcc.app','/recovery-residences/grace-house/apply'],['vrcc.app','/recovery-residences/ejwrh/apply'],
  ['vrcc.app','/recovery-residences/list-your-residence'],['vrcc.app','/recovery-residences/my-application'],
];
(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const [host, path] of targets) {
    const ctx = await browser.newContext();               // fresh, no session per target
    const page = await ctx.newPage();
    const reqs = [], blocked = [];
    await page.route('**/*', (route) => {
      const r = route.request();
      if (!['GET','HEAD','OPTIONS'].includes(r.method())) { blocked.push(`${r.method()} ${r.url().split('?')[0]}`); return route.abort(); }
      return route.continue();
    });
    page.on('request', (r) => { const u = new URL(r.url()); reqs.push(`${r.method()} ${u.host}${u.pathname}`); });
    page.on('websocket', (ws) => reqs.push(`WS ${new URL(ws.url()).host}${new URL(ws.url()).pathname}`));
    const ts = new Date().toISOString();
    let status = null;
    try { const resp = await page.goto(`https://${host}${path}`, { waitUntil: 'networkidle', timeout: 30000 }); status = resp && resp.status(); } catch (e) { status = 'ERR ' + e.message.split('\n')[0]; }
    await page.waitForTimeout(1500);
    const finalUrl = page.url();
    const title = await page.title();
    const text = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g,' ').trim();
    const forms = await page.evaluate(() => Array.from(document.querySelectorAll('input,select,textarea')).map(e => `${e.tagName.toLowerCase()}[${e.type||''}] name=${e.name||''} label=${(e.labels&&e.labels[0]?e.labels[0].innerText:e.getAttribute('aria-label')||'').replace(/\s+/g,' ').slice(0,60)}`));
    const storage = await page.evaluate(() => Object.keys(localStorage));
    const cookies = (await ctx.cookies()).map(c => `${c.domain} ${c.name}`);
    await page.screenshot({ path: `${out}/${host}${path.replace(/\//g,'_')}.png`, fullPage: false });
    fs.writeFileSync(`${out}/${host}${path.replace(/\//g,'_')}.txt`, text);
    results.push({ ts, host, path, status, finalUrl, title, requests: [...new Set(reqs)], blocked, forms, storage, cookies, textSample: text.slice(0, 300) });
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 1));
})();
