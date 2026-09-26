// GFA public website cutover. Only GFA hostnames adopt this front door;
// RecoveryOS and residence domains retain their existing application routing.
export const GFA_HOSTS = new Set(['www.graceforaddictions.org', 'graceforaddictions.org']);
export const GFA_REDIRECTS = {
  '/bylaws-articles': '/connect.html#documents',
  '/copy-of-faqs': '/connect.html',
  '/copy-of-mission': '/#about',
  '/inititiave': '/#about',
  '/gfa-apparel': '/give.html',
  '/cart-page': '/give.html',
  '/groups': '/members.html',
  '/feed': '/members.html',
  '/coaches': '/connect.html',
  '/search': '/',
  '/donation-thank-you-page': '/give.html',
  '/thank-you-page': '/connect.html',
  '/gfa-summer-soirée': '/#community',
  '/shana-lapointe': '/connect.html',
  '/maha-khaliq': '/connect.html',
  '/nathan-tolman': '/connect.html',
  '/april-goodman': '/connect.html',
  '/mark-brown': '/connect.html',
  '/scott-houston': '/connect.html',
  '/halina-cegielski': '/connect.html',
  '/nav-jhansall': '/connect.html',
  '/liz-landon': '/connect.html',
  '/dan-becco': '/connect.html',
  '/veronica-kaldis': '/connect.html',
  '/kel-beddard': '/connect.html',
  '/copy-of-halina-cegielski': '/connect.html',
  '/contact': '/connect.html',
  '/contact-connect': '/connect.html',
  '/donate': '/give.html',
  '/volunteer': '/connect.html#volunteer',
  '/about': '/#about',
  '/mission': '/#about',
  '/core-values': '/#about',
  '/grace-addiction': '/#about',
  '/services': '/#support',
  '/services-7': '/#support',
  '/anchor-justice': '/#support',
  '/live-out-program': '/#support',
  '/gfa-recovery-circle': '/#community',
  '/events-meetings': '/#community',
  '/testimonials': '/#community',
  '/sponsors-partners': '/#involved',
  '/faqs': '/connect.html',
  '/faq': '/connect.html',
  '/privacy-policy': '/privacy.html',
  '/vrcc': '/community-center',
  '/app-landing-page': '/community-center',
  '/grace-house': '/housing.html#grace-house',
};
const pages = new Set([
  'index.html',
  'connect.html',
  'housing.html',
  'give.html',
  'privacy.html',
  'members.html',
]);

export async function gfaRoute(request, env) {
  const url = new URL(request.url);
  if (!GFA_HOSTS.has(url.hostname)) return null;
  if (!['GET', 'HEAD'].includes(request.method)) return null;
  let path;
  try {
    path = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/';
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }
  if (GFA_REDIRECTS[path]) return Response.redirect(new URL(GFA_REDIRECTS[path], url.origin), 301);
  // Root-level assets and public pages are served from the same reviewed /gfa build.
  const file = path === '/' ? 'index.html' : path.slice(1);
  if (
    !pages.has(file) &&
    !['site.css', 'site.js', 'contact.js', 'contact-config.json'].includes(file) &&
    !file.startsWith('assets/original-logo') &&
    !file.startsWith('assets/horizon')
  )
    return null;
  const asset = new URL(`/gfa/${file}`, url.origin);
  const response = await env.ASSETS.fetch(new Request(asset, request));
  if (!pages.has(file) || request.method === 'HEAD' || !response.ok) return response;
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('etag');
  headers.set('cache-control', 'no-cache');
  const html = (await response.text())
    .replace('<meta name="robots" content="noindex,nofollow">', '')
    .replace(
      '</head>',
      `<link rel="canonical" href="https://www.graceforaddictions.org/${file === 'index.html' ? '' : file}"></head>`,
    );
  return new Response(html, { status: response.status, headers });
}
