#!/usr/bin/env node
// check-grace-disclosure-sync.mjs — Grace disclosure drift guard (P0-3, 2026-08-21).
//
// The required Grace disclosure (Grace Authority §4) exists twice by necessity:
//   server: supabase/functions/grace/policy.ts   (the model self-identifies on request)
//   client: apps/platform/src/participant/pages/GracePage.tsx (visible pre-generation banner)
// Only the client copy is visible before a reply is generated, so silent divergence would let
// participants see a different disclosure than the one the model is bound to. This guard fails
// CI when the two DISCLOSURE literals stop matching.
//
// Comparison is on normalized content: string-literal concatenation, quotes, and whitespace are
// stripped; apostrophe variants (' vs ’) are unified so a typographic-quote edit alone doesn't
// mask (or fake) a real wording change.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');

const SOURCES = [
  ['server', 'supabase/functions/grace/policy.ts'],
  ['client', 'apps/platform/src/participant/pages/GracePage.tsx'],
];

function extractDisclosure(label, relPath) {
  const text = readFileSync(join(repoRoot, relPath), 'utf8');
  const m = text.match(/(?:export\s+)?const\s+DISCLOSURE\s*=\s*([\s\S]*?);/);
  if (!m) {
    console.error(`✖ grace-disclosure-sync: no DISCLOSURE declaration found in ${relPath}`);
    process.exit(1);
  }
  // Evaluate the concatenated string literals structurally: keep only quoted segments.
  const parts = m[1].match(/(['"`])(?:\\.|(?!\1).)*\1/g);
  if (!parts || parts.length === 0) {
    console.error(`✖ grace-disclosure-sync: DISCLOSURE in ${relPath} is not a string literal`);
    process.exit(1);
  }
  const joined = parts.map((p) => p.slice(1, -1)).join('');
  // Normalize: unescape, unify apostrophes, collapse whitespace.
  const normalized = joined
    .replace(/\\(['"`])/g, '$1')
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return { label, relPath, normalized };
}

const [server, client] = SOURCES.map(([label, p]) => extractDisclosure(label, p));

if (server.normalized !== client.normalized) {
  console.error('✖ grace-disclosure-sync: the server and client Grace disclosures have diverged.\n');
  console.error(`  server (${server.relPath}):\n    ${server.normalized}\n`);
  console.error(`  client (${client.relPath}):\n    ${client.normalized}\n`);
  console.error('  Update both in the same commit — the participant-visible banner and the');
  console.error('  model-bound disclosure must state the same thing.');
  process.exit(1);
}

console.log('✓ grace-disclosure-sync: server and client disclosures match.');
