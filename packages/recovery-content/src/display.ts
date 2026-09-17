/**
 * Participant-facing display language for the content taxonomies (P1.5, RATIFIED 2026-08-21).
 *
 * The SAMHSA eight-domain wellness model and the ICARE phase names stay intact as the
 * UNDERLYING content taxonomy (types.ts, slogans.generated.ts are untouched) — but raw
 * taxonomy words are staff/system vocabulary, not something to print at a person mid-practice.
 * These helpers translate at the display boundary only. They are NOT the canonical
 * operational domains (packages/domain/src/domains.ts) — wellness tags classify content,
 * never people, and never feed reporting.
 */

/** Humanized labels for the SAMHSA wellness tags carried by slogans. */
export const WELLNESS_DISPLAY: Readonly<Record<string, string>> = {
  Physical: 'Body & health',
  Emotional: 'Emotions',
  Social: 'Connection with others',
  Spiritual: 'Spirit & meaning',
  Environmental: 'Surroundings & stability',
  Occupational: 'Work life',
  Intellectual: 'Mind & learning',
  Financial: 'Money',
} as const;

/** Participant-facing wellness label; unknown/blank tags fall back gracefully. */
export function wellnessDisplayLabel(domain: string | null | undefined): string {
  if (!domain) return '';
  return WELLNESS_DISPLAY[domain] ?? domain;
}

/**
 * The ICARE phase as a sentence for "Why am I seeing this?" — method context a person
 * opted into reading, never a badge stamped on them (ICARE is a workflow, not a status).
 */
export function icarePhaseWhy(phase: string | null | undefined): string | null {
  if (!phase) return null;
  return `Part of the ${phase} rhythm of the ICARE method.`;
}
