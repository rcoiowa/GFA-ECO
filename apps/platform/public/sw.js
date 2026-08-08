/*
 * RecoveryOS service worker — application shell only (P4H directive §3).
 *
 * PRIVATE DATA CACHE POLICY (structural, not advisory):
 * this worker NEVER calls respondWith() for cross-origin requests or for
 * non-GET requests. Every Supabase Auth/PostgREST/RPC/Realtime request is
 * cross-origin and therefore passes straight to the network untouched —
 * message bodies, Recovery Pulse data, assessments, navigation notes,
 * residence records, application answers, and consent data are never
 * intercepted, cached, or served stale by this worker. RecoveryOS is
 * OFFLINE-AWARE, not an offline-sensitive-data application.
 *
 * What IS cached (same-origin only):
 *  - /assets/*  — Vite build output with content-hashed filenames
 *                 (immutable → cache-first);
 *  - icons/manifest and other static public files (cache-first);
 *  - navigations — network-first with the cached shell as offline fallback,
 *                  so the app opens offline and the in-app OfflineNotice
 *                  tells the truth about connectivity.
 *
 * Update lifecycle: bump CACHE_VERSION on deploy (any asset change produces
 * new hashed URLs anyway). A new worker installs alongside the old one,
 * pre-caches the fresh shell, and activates on the next navigation
 * (standard waiting behavior — no forced skipWaiting mid-session, so an
 * open session is never switched under a person's feet); activation prunes
 * old cache generations.
 */

const CACHE_VERSION = 'recoveryos-shell-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Structural privacy boundary: only same-origin GETs are ever handled.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network first, cached shell as offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // Hashed build assets + static public files: cache first.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest') {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
  // Everything else same-origin (e.g. dev-time modules) goes to the network.
});
