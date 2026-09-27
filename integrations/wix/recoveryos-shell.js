(() => {
  'use strict';
  if (!['www.graceforaddictions.org', 'graceforaddictions.org'].includes(location.hostname)) return;
  if (window.top !== window.self || document.getElementById('gfa-recoveryos-shell')) return;
  const PREVIEW_ONLY = true;
  if (PREVIEW_ONLY && new URLSearchParams(location.search).get('gfa-preview') !== '1') return;
  const routes = {
  "/bylaws-articles": "/gfa/connect.html#documents",
  "/copy-of-faqs": "/gfa/connect.html",
  "/copy-of-mission": "/gfa/#about",
  "/inititiave": "/gfa/#about",
  "/coaches": "/gfa/connect.html",
  "/search": "/gfa/",
  "/gfa-summer-soir\u00e9e": "/gfa/#community",
  "/shana-lapointe": "/gfa/connect.html",
  "/maha-khaliq": "/gfa/connect.html",
  "/nathan-tolman": "/gfa/connect.html",
  "/april-goodman": "/gfa/connect.html",
  "/mark-brown": "/gfa/connect.html",
  "/scott-houston": "/gfa/connect.html",
  "/halina-cegielski": "/gfa/connect.html",
  "/nav-jhansall": "/gfa/connect.html",
  "/liz-landon": "/gfa/connect.html",
  "/dan-becco": "/gfa/connect.html",
  "/veronica-kaldis": "/gfa/connect.html",
  "/kel-beddard": "/gfa/connect.html",
  "/copy-of-halina-cegielski": "/gfa/connect.html",
  "/contact": "/gfa/connect.html",
  "/contact-connect": "/gfa/connect.html",
  "/volunteer": "/gfa/connect.html#volunteer",
  "/about": "/gfa/#about",
  "/mission": "/gfa/#about",
  "/core-values": "/gfa/#about",
  "/grace-addiction": "/gfa/#about",
  "/services": "/gfa/#support",
  "/services-7": "/gfa/#support",
  "/anchor-justice": "/gfa/#support",
  "/live-out-program": "/gfa/#support",
  "/gfa-recovery-circle": "/gfa/#community",
  "/events-meetings": "/gfa/#community",
  "/testimonials": "/gfa/#community",
  "/sponsors-partners": "/gfa/#involved",
  "/faqs": "/gfa/connect.html",
  "/faq": "/gfa/connect.html",
  "/privacy-policy": "/gfa/privacy.html",
  "/vrcc": "/community-center",
  "/app-landing-page": "/community-center",
  "/grace-house": "/gfa/housing.html#grace-house",
  "/": "/gfa/"
};
  let path;
  try { path = decodeURIComponent(location.pathname).replace(/\/$/, '') || '/'; } catch { return; }
  const destination = routes[path];
  // Wix uses client-side navigation; force a fresh document for shell/public transitions.
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest && event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target === '_blank') return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
    let nextPath;
    try { nextPath = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/'; } catch { return; }
    if (routes[nextPath] || anchor.closest('#gfa-recoveryos-shell')) {
      event.preventDefault(); event.stopImmediatePropagation(); location.assign(url.href);
    }
  }, true);
  const start = () => {
    const shell = document.createElement('section');
    shell.id = 'gfa-recoveryos-shell';
    shell.setAttribute('aria-label', 'Grace For Addictions website');
    const style = document.createElement('style');
    style.textContent = `
      #gfa-recoveryos-shell {position:fixed;inset:0;z-index:100000;background:#0b1d20;display:flex;flex-direction:column;font:15px/1.4 Arial,sans-serif;color:white}
      #gfa-recoveryos-shell nav {display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:10px 16px;background:#0b1d20;color:white}
      #gfa-recoveryos-shell a {color:white;text-decoration:underline;text-underline-offset:4px;padding:6px;display:inline-block}
      #gfa-recoveryos-shell a:focus-visible {outline:3px solid #5ab2b4;outline-offset:2px}
      #gfa-recoveryos-shell iframe {width:100%;flex:1;border:0;min-height:0;background:#fff}
      #gfa-recoveryos-shell.gfa-return {position:relative;inset:auto;z-index:100000}
      html.gfa-embedded,html.gfa-embedded body {overflow:hidden!important}
      html.gfa-embedded #SITE_CONTAINER {display:none!important}
    `;
    shell.append(style);
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Website and donation navigation');
    const home = document.createElement('a');
    home.href = '/'; home.textContent = destination ? 'Grace For Addictions' : '← Return to GFA';
    nav.append(home);
    if (destination) {
      const donate = document.createElement('a');
      donate.href = '/donate'; donate.textContent = 'Donate';
      nav.append(donate);
      const direct = document.createElement('a');
      direct.href = 'https://recoveryos-staging.thomas-499.workers.dev' + destination;
      direct.target = '_blank'; direct.rel = 'noopener'; direct.textContent = 'Open full screen ↗';
      nav.append(direct);
    }
    shell.append(nav);
    if (destination) {
      const frame = document.createElement('iframe');
      frame.title = 'Grace For Addictions — Powered by RecoveryOS';
      frame.src = 'https://recoveryos-staging.thomas-499.workers.dev' + destination + (destination.includes('#') ? '' : (location.hash || ''));
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      shell.append(frame);
      document.documentElement.classList.add('gfa-embedded');
      document.title = 'Grace For Addictions | No Shame. No Stigma. Just Grace.';
    } else {
      shell.classList.add('gfa-return');
    }
    document.body.prepend(shell);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
