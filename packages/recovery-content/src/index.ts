/**
 * The 59 slogans of *Recovering the Mind* (Thomas DeGarmeaux, Grace For
 * Addictions), imported verbatim from the book — see ADR-0016.
 *
 * Attribution must stay visible wherever slogans are displayed.
 */

export type {
  EnneagramContext,
  EnneagramMapping,
  EnneagramType,
  IcarePhase,
  Slogan,
  ViaStrengthLink,
  WellnessDomain,
} from './types';
export { SLOGANS } from './slogans.generated';
export { ENNEAGRAM_MAPPINGS, ENNEAGRAM_TYPES } from './enneagram.generated';
export {
  bestSlogan,
  CHALLENGE_DOMAIN_MAP,
  domainCoverage,
  recommendSlogans,
  slogansForStrength,
  slogansForType,
  viaStrengths,
  type SloganMatch,
  type SloganMatchInput,
} from './recommend';

import { SLOGANS } from './slogans.generated';
import type { Slogan } from './types';

export const SLOGAN_COUNT = SLOGANS.length;

export const SLOGAN_ATTRIBUTION =
  'Thomas DeGarmeaux, *Recovering the Mind: 59 Practices for Hope, Healing, and Transformation*';

export function getSlogan(number: number): Slogan | undefined {
  return SLOGANS.find((s) => s.number === number);
}

export function slogansByPhase(phase: string): Slogan[] {
  return SLOGANS.filter((s) => s.icarePhase === phase);
}

export function slogansByDomain(domain: string): Slogan[] {
  return SLOGANS.filter((s) => s.wellnessDomain === domain);
}

export function slogansByTheme(theme: string): Slogan[] {
  const needle = theme.toLowerCase();
  return SLOGANS.filter((s) => s.theme.toLowerCase() === needle);
}

/** The book's seven movements, in order. */
export function sloganPoints(): string[] {
  return [...new Set(SLOGANS.map((s) => s.point))].filter(Boolean);
}

/** Every wellness domain present in the set. */
export function sloganDomains(): string[] {
  return [...new Set(SLOGANS.map((s) => s.wellnessDomain))].filter(Boolean).sort();
}

/**
 * A stable slogan for a person on a given day. Same person + same day always
 * resolves to the same slogan, and consecutive days walk the full 59 before
 * repeating — no randomness, so "why am I seeing this?" stays answerable.
 */
export function dailySlogan(personId: number, localDate: string): Slogan {
  let hash = 0;
  for (const ch of `${personId}:${localDate}`) {
    hash = (hash * 31 + ch.charCodeAt(0)) % 1000003;
  }
  return SLOGANS[hash % SLOGANS.length] as Slogan;
}
