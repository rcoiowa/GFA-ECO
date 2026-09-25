import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'release-manifest',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'release.json',
          source: JSON.stringify({
            release: process.env.VITE_RELEASE ?? 'local-unreleased',
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
