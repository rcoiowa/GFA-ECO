import { describe, expect, it } from 'vitest';
import { ENNEAGRAM_MAPPINGS, ENNEAGRAM_TYPES } from './enneagram.generated';
import { SLOGANS } from './slogans.generated';
import {
  bestSlogan,
  CHALLENGE_DOMAIN_MAP,
  domainCoverage,
  recommendSlogans,
  slogansForStrength,
  slogansForType,
  viaStrengths,
} from './recommend';

describe('the imported content', () => {
  it('has all 59 slogans, contiguously numbered', () => {
    expect(SLOGANS).toHaveLength(59);
    expect(SLOGANS.map((s) => s.number).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 59 }, (_, i) => i + 1),
    );
  });

  it('carries commentary, practice and strengths for every slogan', () => {
    for (const s of SLOGANS) {
      expect(s.condensedCommentary.length, `slogan ${s.number}`).toBeGreaterThan(0);
      expect(s.commentary.length, `slogan ${s.number}`).toBeGreaterThan(0);
      expect(s.practice.length, `slogan ${s.number}`).toBeGreaterThan(0);
      expect(s.viaStrengths.length, `slogan ${s.number}`).toBeGreaterThan(0);
      expect(s.theme.length, `slogan ${s.number}`).toBeGreaterThan(0);
    }
  });

  it('uses the rebalanced ICARE distribution, not the book arc', () => {
    const counts = SLOGANS.reduce<Record<string, number>>((acc, s) => {
      acc[s.icarePhase] = (acc[s.icarePhase] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      Identify: 12,
      Connect: 12,
      Assess: 12,
      Respond: 12,
      Empower: 11,
    });
  });

  it('maps every slogan to at least one Enneagram type', () => {
    for (const s of SLOGANS) {
      expect(
        ENNEAGRAM_MAPPINGS.some((m) => m.sloganNumber === s.number),
        `slogan ${s.number}`,
      ).toBe(true);
    }
    expect(ENNEAGRAM_TYPES).toHaveLength(9);
  });

  it('records the real, uneven domain coverage rather than assuming it', () => {
    // The master source uses seven of the eight SAMHSA domains. Financial has
    // no slogans at all and Environmental has one, so barrier matching is deep
    // for Cravings/Mental health and shallow-to-absent elsewhere. This test
    // exists so a content change that closes the gap is noticed here first.
    expect(domainCoverage()).toEqual({
      Emotional: 19,
      Intellectual: 15,
      Spiritual: 12,
      Social: 7,
      Occupational: 3,
      Physical: 2,
      Environmental: 1,
    });
    expect(domainCoverage().Financial).toBeUndefined();
  });

  it('maps every challenge chip to a SAMHSA domain name', () => {
    const samhsa = new Set([
      'Physical',
      'Emotional',
      'Social',
      'Spiritual',
      'Environmental',
      'Occupational',
      'Intellectual',
      'Financial',
    ]);
    for (const [chip, domain] of Object.entries(CHALLENGE_DOMAIN_MAP)) {
      expect(samhsa.has(domain), `${chip} → ${domain}`).toBe(true);
    }
  });
});

describe('the chain', () => {
  it('recommends nothing when nothing is known', () => {
    expect(recommendSlogans({})).toHaveLength(0);
    expect(bestSlogan({})).toBeNull();
  });

  it('matches a barrier to its wellness domain', () => {
    const matches = recommendSlogans({ challengeTags: ['Cravings'] });
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) expect(m.slogan.wellnessDomain).toBe('Emotional');
  });

  it('stays silent rather than substituting an unrelated practice', () => {
    // "Finances" maps to a domain with no slogans — recommending a random one
    // would be worse than recommending nothing.
    expect(recommendSlogans({ challengeTags: ['Finances'] })).toHaveLength(0);
  });

  it('explains every recommendation in plain language', () => {
    const matches = recommendSlogans({
      challengeTags: ['Housing'],
      icarePhase: 'Respond',
      enneagramType: 4,
      viaStrengths: ['Hope'],
    });
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) {
      expect(m.reasons.length).toBeGreaterThan(0);
      for (const r of m.reasons) expect(r.length).toBeGreaterThan(10);
    }
  });

  it('is deterministic — identical input, identical output', () => {
    const input = { challengeTags: ['Cravings'], enneagramType: 6 };
    expect(recommendSlogans(input)).toEqual(recommendSlogans(input));
  });

  it('ranks a slogan written for your type above a generic domain match', () => {
    // Type 6's core slogan 2 (craving awareness) should beat other Emotional ones.
    const matches = recommendSlogans({ challengeTags: ['Cravings'], enneagramType: 6 }, 5);
    const top = matches[0];
    expect(top).toBeDefined();
    const mapping = ENNEAGRAM_MAPPINGS.find(
      (m) => m.sloganNumber === top!.slogan.number && m.type === 6,
    );
    expect(mapping).toBeDefined();
  });

  it('pushes recently seen slogans down', () => {
    const fresh = recommendSlogans({ challengeTags: ['Cravings'] }, 5);
    const first = fresh[0]!.slogan.number;
    const after = recommendSlogans(
      { challengeTags: ['Cravings'], recentSloganNumbers: [first] },
      5,
    );
    expect(after[0]?.slogan.number).not.toBe(first);
  });

  it('never recommends more than asked', () => {
    expect(recommendSlogans({ challengeTags: ['Cravings'] }, 2).length).toBeLessThanOrEqual(2);
  });

  it('combines signals — more context scores higher than less', () => {
    const domainOnly = bestSlogan({ challengeTags: ['Cravings'] });
    const withType = bestSlogan({ challengeTags: ['Cravings'], enneagramType: 6 });
    expect(withType!.score).toBeGreaterThan(domainOnly!.score);
  });
});

describe('lookups', () => {
  it('returns a type’s slogans strongest first', () => {
    const forType = slogansForType(1);
    expect(forType.length).toBeGreaterThan(0);
    const weights = forType.map((r) => r.weight);
    expect([...weights].sort((a, b) => b - a)).toEqual(weights);
  });

  it('finds slogans by VIA strength', () => {
    const all = viaStrengths();
    expect(all.length).toBeGreaterThan(5);
    expect(slogansForStrength(all[0]!).length).toBeGreaterThan(0);
  });
});
