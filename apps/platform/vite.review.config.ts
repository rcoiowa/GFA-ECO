import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
/** Separate synthetic localhost harness; never imported by the application or production build. */
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
const preview = new URL('../../docs/proposals/housing-follow-through/preview/', import.meta.url);
export default defineConfig({
  root: fileURLToPath(preview),
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'synthetic-only-persistence',
      configureServer(server) {
        const path = '/tmp/recoveryos-synthetic-review.json';
        const read = () =>
          existsSync(path)
            ? JSON.parse(readFileSync(path, 'utf8'))
            : {
                version: 0,
                saved_at: null,
                document: { brief: '', notes: '', intakeId: null, batches: [] },
                audit: [],
              };
        server.middlewares.use('/__synthetic/workspace', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          if (req.method === 'GET') {
            res.end(JSON.stringify(read()));
            return;
          }
          if (
            req.method !== 'POST' ||
            req.headers['content-type'] !== 'application/json' ||
            !['http://127.0.0.1:5174', 'http://localhost:5174'].includes(req.headers.origin ?? '')
          ) {
            res.statusCode = 403;
            res.end('{}');
            return;
          }
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 1048576) req.destroy();
          });
          req.on('end', () => {
            try {
              const input = JSON.parse(body);
              const current = read();
              if (input.version !== current.version) {
                res.statusCode = 409;
                res.end('{}');
                return;
              }
              const saved_at = new Date().toISOString();
              const version = current.version + 1;
              const record = {
                version,
                saved_at,
                document: input.document,
                audit: [...current.audit, { version, actor_person_id: 9001, saved_at }],
              };
              writeFileSync(path + '.tmp', JSON.stringify(record), { mode: 0o600 });
              renameSync(path + '.tmp', path);
              res.end(JSON.stringify(record));
            } catch {
              res.statusCode = 503;
              res.end('{}');
            }
          });
        });
      },
    },
  ],
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
