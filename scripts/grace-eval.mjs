#!/usr/bin/env node
/**
 * Grace Evaluation Harness (directive §21/§22). Runs the policy-outcome
 * scenario suites against the DEPLOYED, server-authoritative Grace Edge
 * Function on RecoveryOS-Launch — never against a raw provider, so what is
 * scored is exactly what a participant would receive (canonical prompt,
 * consent gate, safety routing, retrieval, bounds all applied server-side).
 *
 * This harness is model-agnostic: it evaluates whichever model the launch
 * project has configured via the GRACE_MODEL secret. To compare candidates,
 * set GRACE_MODEL to each and re-run; scores are written per model.
 *
 * REQUIREMENTS to actually score (all server-side / human-provisioned):
 *   • ANTHROPIC_API_KEY and GRACE_MODEL set on the launch project (Grace
 *     Edge Function secrets) — otherwise the function returns `ai_unconfigured`
 *     and this harness exits BLOCKED without inventing results (§22: "Do not
 *     manufacture a comparative result").
 *   • GRACE_EVAL_JWT — a signed-in fixture participant JWT WITH an active
 *     ai_features consent grant (use the seeded p4h-participant fixture).
 *   • SUPABASE_FUNCTIONS_URL — e.g. https://<ref>.functions.supabase.co
 *
 * Scoring is done by a SEPARATE judge model call (not Grace) against each
 * scenario's policy_outcomes / prohibited lists; this file only orchestrates
 * and records. The judge is intentionally left as an explicit integration
 * point so the judge model + rubric are reviewed before any model is locked.
 *
 * Categories scored (§22): Safety, Dignity, Warmth, Recovery-orientation,
 * Truthfulness, Grounding, Sycophancy-resistance, Dependency-resistance,
 * Multi-pathway respect, Faith-boundary adherence, Medical/legal boundaries,
 * Canonical-content fidelity, Prompt-injection resistance, Tool honesty,
 * Latency, Cost. A model that fails ANY critical safety/privacy category
 * cannot win on average (enforced by the caller reviewing thresholds).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const FUNCTIONS_URL = process.env.SUPABASE_FUNCTIONS_URL;
const JWT = process.env.GRACE_EVAL_JWT;
const ANON = process.env.SUPABASE_ANON_KEY;

function loadSuite(name) {
  return JSON.parse(readFileSync(join(__dir, '..', 'apps/platform/e2e/grace', name), 'utf8'));
}

async function callGrace(userMessages) {
  const messages = userMessages.map((c) => ({ role: 'user', content: c }));
  const t0 = Date.now();
  const res = await fetch(`${FUNCTIONS_URL}/grace`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: ANON ?? '',
      authorization: `Bearer ${JWT}`,
    },
    body: JSON.stringify({ messages }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, latencyMs: Date.now() - t0 };
}

async function main() {
  if (!FUNCTIONS_URL || !JWT) {
    console.error(
      'grace-eval: BLOCKED — SUPABASE_FUNCTIONS_URL and GRACE_EVAL_JWT are required. ' +
        'No results manufactured.',
    );
    process.exit(2);
  }
  const evalSuite = loadSuite('eval-scenarios.json');
  const redTeam = loadSuite('red-team-scenarios.json');

  // Probe configuration first. If Grace is not configured for generation,
  // exit BLOCKED rather than scoring the un-configured stub (§22).
  const probe = await callGrace(['hello']);
  if (probe.body?.code === 'ai_unconfigured') {
    console.error(
      'grace-eval: BLOCKED — Grace Edge Function returns ai_unconfigured ' +
        '(ANTHROPIC_API_KEY / GRACE_MODEL not set on the launch project). ' +
        'Provision the provider secret, then re-run. No results manufactured.',
    );
    process.exit(2);
  }
  if (probe.body?.code === 'consent_required') {
    console.error('grace-eval: BLOCKED — GRACE_EVAL_JWT lacks an active ai_features consent grant.');
    process.exit(2);
  }

  const results = [];
  for (const scenario of [...evalSuite, ...redTeam]) {
    const r = await callGrace(scenario.user_messages);
    results.push({
      id: scenario.id,
      category: scenario.category,
      severity: scenario.severity,
      safety_category: scenario.safety_category,
      transport_ok: r.body?.ok === true || r.body?.code === 'ok',
      surface_support_now: r.body?.safety?.surface_support_now ?? null,
      latency_ms: r.latencyMs,
      // The generated content is passed to an external judge (integration
      // point) against policy_outcomes/prohibited. Not persisted to disk with
      // the participant-style body beyond this ephemeral run buffer.
      content_len: (r.body?.content ?? '').length,
      policy_version: r.body?.policy_version ?? null,
      // JUDGE: to be filled by the reviewed judge model + rubric.
      judged: null,
    });
  }
  process.stdout.write(JSON.stringify({ model: probe.body?.model_id ?? 'unknown', results }, null, 2));
}

main().catch((e) => {
  console.error('grace-eval: harness error', e?.message ?? e);
  process.exit(1);
});
