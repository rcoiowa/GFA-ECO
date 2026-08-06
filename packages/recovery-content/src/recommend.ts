/**
 * The slogan-to-everything chain.
 *
 * A slogan is the join between what a person reported today and everything the
 * system knows about them: the barrier they named, the ICARE stage they are
 * in, the character strengths the practice trains, and — when they have chosen
 * to share it — their Enneagram type.
 *
 * Deterministic and explainable by construction (ADR-0015 principles 5 and 7):
 * every recommendation returns the signals that produced it, in plain
 * language, so "Why am I seeing this?" is answered from real data rather than
 * asserted. Nothing here infers anything from free text.
 */

import { ENNEAGRAM_MAPPINGS, ENNEAGRAM_TYPES } from './enneagram.generated';
import { SLOGANS } from './slogans.generated';
import type { EnneagramContext, Slogan } from './types';

/**
 * Check-in challenge chips → SAMHSA wellness domains. The chips are what a
 * participant actually taps; the domains are how slogans are tagged. This map
 * is the seam between them.
 *
 * COVERAGE IS UNEVEN, and deliberately not faked. The master source tags
 * across only seven of the eight SAMHSA domains: Emotional 19, Intellectual
 * 15, Spiritual 12, Social 7, Occupational 3, Physical 2, Environmental 1 —
 * and **Financial 0**. So a participant naming "Finances" has no slogan to
 * match on, and the housing/transportation/court chips all reach the single
 * Environmental slogan. `recommendSlogans` returns nothing rather than
 * substituting an unrelated practice; callers fall back to `dailySlogan`.
 * Closing the gap is a content decision (write or retag), not a code one.
 */
export const CHALLENGE_DOMAIN_MAP: Record<string, string> = {
  Work: 'Occupational',
  Family: 'Social',
  Housing: 'Environmental',
  Transportation: 'Environmental',
  Court: 'Environmental',
  Finances: 'Financial',
  'Mental health': 'Emotional',
  Cravings: 'Emotional',
  Relationships: 'Social',
  Childcare: 'Social',
  Health: 'Physical',
};

/** Context multipliers: a slogan written *for* your type outranks a stretch. */
const CONTEXT_WEIGHT: Record<EnneagramContext, number> = {
  core: 1,
  growth: 0.8,
  stress: 0.8,
  wing: 0.6,
};

const DOMAIN_POINTS = 3;
const PHASE_POINTS = 2;
const VIA_POINTS = 1;
/** Strong enough to push a recent slogan below fresh ones without banning it. */
const REPEAT_PENALTY = 12;

export interface SloganMatchInput {
  /** Challenge chips from the check-in, e.g. ["Housing", "Court"]. */
  challengeTags?: string[];
  /** Which ICARE stage the participant is being served in right now. */
  icarePhase?: string;
  /** 1–9, only if the participant has shared it. */
  enneagramType?: number;
  /** VIA strengths the participant is working with. */
  viaStrengths?: string[];
  /** Slogan numbers seen recently, to keep recommendations fresh. */
  recentSloganNumbers?: number[];
}

export interface SloganMatch {
  slogan: Slogan;
  score: number;
  /** Plain-language signals, shown verbatim under "Why am I seeing this?". */
  reasons: string[];
}

/**
 * Rank slogans against what is known right now. Returns only slogans with a
 * positive score — when nothing is known, nothing is recommended, and the
 * caller should fall back to `dailySlogan`.
 */
export function recommendSlogans(input: SloganMatchInput, limit = 3): SloganMatch[] {
  const domains = new Set(
    (input.challengeTags ?? [])
      .map((tag) => CHALLENGE_DOMAIN_MAP[tag])
      .filter((d): d is string => Boolean(d)),
  );
  const tagsByDomain = new Map<string, string[]>();
  for (const tag of input.challengeTags ?? []) {
    const domain = CHALLENGE_DOMAIN_MAP[tag];
    if (!domain) continue;
    tagsByDomain.set(domain, [...(tagsByDomain.get(domain) ?? []), tag]);
  }

  const strengths = new Set((input.viaStrengths ?? []).map((s) => s.toLowerCase()));
  const recent = new Set(input.recentSloganNumbers ?? []);

  const matches: SloganMatch[] = [];

  for (const slogan of SLOGANS) {
    let score = 0;
    const reasons: string[] = [];

    if (domains.has(slogan.wellnessDomain)) {
      score += DOMAIN_POINTS;
      const tags = tagsByDomain.get(slogan.wellnessDomain) ?? [];
      reasons.push(
        `You named ${formatList(tags)} today, and this practice works in the ${slogan.wellnessDomain.toLowerCase()} area of life.`,
      );
    }

    if (input.icarePhase && slogan.icarePhase === input.icarePhase) {
      score += PHASE_POINTS;
      reasons.push(`It belongs to the ${slogan.icarePhase} stage of the ICARE cycle.`);
    }

    if (input.enneagramType) {
      const mapping = ENNEAGRAM_MAPPINGS.find(
        (m) => m.sloganNumber === slogan.number && m.type === input.enneagramType,
      );
      if (mapping) {
        score += mapping.weight * CONTEXT_WEIGHT[mapping.context];
        const typeName = ENNEAGRAM_TYPES.find((t) => t.type === mapping.type)?.name ?? '';
        reasons.push(
          mapping.context === 'core'
            ? `This one speaks straight to the ${typeName} pattern you identified with.`
            : `For the ${typeName} pattern, this is ${mapping.context} work.`,
        );
      }
    }

    for (const via of slogan.viaStrengths) {
      if (strengths.has(via.strength.toLowerCase())) {
        score += VIA_POINTS;
        reasons.push(`It trains ${via.strength}, a strength you're building.`);
      }
    }

    if (score > 0 && recent.has(slogan.number)) {
      score -= REPEAT_PENALTY;
      reasons.push('You saw this one recently.');
    }

    if (score > 0) matches.push({ slogan, score, reasons });
  }

  return matches
    .sort((a, b) => b.score - a.score || a.slogan.number - b.slogan.number)
    .slice(0, limit);
}

/** The single best match, or null when nothing is known well enough to match. */
export function bestSlogan(input: SloganMatchInput): SloganMatch | null {
  return recommendSlogans(input, 1)[0] ?? null;
}

/** Every slogan written for an Enneagram type, strongest first. */
export function slogansForType(
  type: number,
): { slogan: Slogan; weight: number; context: EnneagramContext }[] {
  return ENNEAGRAM_MAPPINGS.filter((m) => m.type === type)
    .map((m) => ({
      slogan: SLOGANS.find((s) => s.number === m.sloganNumber) as Slogan,
      weight: m.weight,
      context: m.context,
    }))
    .filter((r) => r.slogan)
    .sort((a, b) => b.weight - a.weight || a.slogan.number - b.slogan.number);
}

/** Slogans that train a given VIA character strength. */
export function slogansForStrength(strength: string): Slogan[] {
  const needle = strength.toLowerCase();
  return SLOGANS.filter((s) => s.viaStrengths.some((v) => v.strength.toLowerCase() === needle));
}

/** Every VIA strength referenced across the set. */
export function viaStrengths(): string[] {
  return [...new Set(SLOGANS.flatMap((s) => s.viaStrengths.map((v) => v.strength)))].sort();
}

/** Slogans available per wellness domain — the chain is only as deep as this. */
export function domainCoverage(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of SLOGANS) counts[s.wellnessDomain] = (counts[s.wellnessDomain] ?? 0) + 1;
  return counts;
}

function formatList(items: string[]): string {
  const lower = items.map((i) => i.toLowerCase());
  if (lower.length <= 1) return lower[0] ?? '';
  return `${lower.slice(0, -1).join(', ')} and ${lower[lower.length - 1]}`;
}
