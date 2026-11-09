import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { configureSupabase } from '@recoveryos/data-access';
import { AuthProvider } from '@recoveryos/auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query';
import { installGlobalMonitor } from './lib/monitor';
import { App } from './App';
import './styles.css';

installGlobalMonitor();

// Fallbacks target the canonical RecoveryOS-Launch project — the only
// backend this application knows. The publishable key is client-safe by
// design (it ships in every bundle and RLS is the authorization boundary),
// so builds without env vars — e.g. Cloudflare dashboard Git builds — still
// produce a working app. Set the VITE_* variables to point a build at a
// staging branch instead.
configureSupabase({
  url:
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
    'https://cqcxvwoukyhxyokfwnjm.supabase.co',
  anonKey:
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
    'sb_publishable_OMRkXXJ71z9RlUIAAfy2Jw_h04TYK3x',
});

// PWA shell worker (production builds only): app-shell + static assets, and
// structurally nothing else — cross-origin (Supabase) requests are never
// intercepted, so no private data can be cached (see public/sw.js).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failure degrades to a plain web app — never fatal.
    });
  });
}

// A data router enables supported navigation blockers for unsaved meeting records.
// Keep the existing App route tree and providers intact under the catch-all shell.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </AuthProvider>
    ),
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
