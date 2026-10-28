import { validateDevelopment } from '../../scripts/development-config.mjs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

if (process.env.RECOVERYOS_ENV === 'development') validateDevelopment(process.env);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'release-manifest',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'gfa/contact-config.json',
          source: JSON.stringify({
            siteKey: process.env.VITE_TURNSTILE_SITE_KEY ?? '',
            contactEndpoint: `${process.env.VITE_SUPABASE_URL ?? 'https://cqcxvwoukyhxyokfwnjm.supabase.co'}/functions/v1/lead-intake/contact`,
          }),
        });
        this.emitFile({
          type: 'asset',
          fileName: 'release.json',
          source: JSON.stringify({
            release: process.env.VITE_RELEASE ?? 'local-unreleased',
            environment: process.env.RECOVERYOS_ENV ?? 'production',
            supabaseProject: new URL(
              process.env.VITE_SUPABASE_URL ?? 'https://cqcxvwoukyhxyokfwnjm.supabase.co',
            ).hostname.split('.')[0],
          }),
        });
      },
    },
  ],
  server: { port: 5173 },
});
