import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { configureSupabase } from '@recoveryos/data-access';
import { AuthProvider } from '@recoveryos/auth';
import { App } from './App';
import './styles.css';

// Fallbacks target the canonical Grace For Addictions project. The
// publishable key is client-safe by design (it ships in every bundle and
// RLS is the authorization boundary), so builds without env vars — e.g.
// Cloudflare dashboard Git builds — still produce a working app. Set the
// VITE_* variables to point a build somewhere else.
configureSupabase({
  url:
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
    'https://ykykeioydvtxpyreshhs.supabase.co',
  anonKey:
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
    'sb_publishable_9NOklH5Dvj3PcQs2dCLdpg_zx4txe8a',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
