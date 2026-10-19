/** Separate synthetic localhost harness; never imported by the application or production build. */
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
const preview = new URL('../../docs/proposals/housing-follow-through/preview/', import.meta.url);
export default defineConfig({
  root: fileURLToPath(preview),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@recoveryos/data-access': fileURLToPath(new URL('synthetic-api.ts', preview)),
      '@recoveryos/auth': fileURLToPath(new URL('synthetic-api.ts', preview)),
      react: fileURLToPath(new URL('./node_modules/react', import.meta.url)),
      'react-dom': fileURLToPath(new URL('./node_modules/react-dom', import.meta.url)),
      '@recoveryos/design-tokens': fileURLToPath(
        new URL('../../packages/design-tokens/src', import.meta.url),
      ),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] },
  },
});
