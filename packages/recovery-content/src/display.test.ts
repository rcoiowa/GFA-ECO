import { describe, expect, it } from 'vitest';
import { SLOGANS } from './slogans.generated';
import { WELLNESS_DISPLAY, icarePhaseWhy, wellnessDisplayLabel } from './display';

/**
 * P1.5 pins — participant surfaces never print raw taxonomy: every wellness tag
 * actually carried by the 59 slogans has a humanized label, and the ICARE phase
 * reads as method context (a sentence), not a status badge.
 */

describe('wellness display language (P1.5)', () => {
  it('covers every wellness tag present in the slogan set', () => {
    const tags = [...new Set(SLOGANS.map((s) => s.wellnessDomain))].filter(Boolean);
    for (const tag of tags) {
      const label = wellnessDisplayLabel(tag);
      expect(label, `missing humanized label for '${tag}'`).not.toBe(tag);
      expect(label).not.toBe('');
    }
  });

  it('humanizes the SAMHSA words without renaming the underlying taxonomy', () => {
    expect(wellnessDisplayLabel('Occupational')).toBe('Work life');
    expect(wellnessDisplayLabel('Environmental')).toBe('Surroundings & stability');
    expect(wellnessDisplayLabel('Social')).toBe('Connection with others');
    // The taxonomy keys themselves stay the SAMHSA eight — display is a lens.
    expect(Object.keys(WELLNESS_DISPLAY)).toHaveLength(8);
  });

  it('degrades gracefully on unknown or missing tags', () => {
    expect(wellnessDisplayLabel('SomethingNew')).toBe('SomethingNew');
    expect(wellnessDisplayLabel(null)).toBe('');
  });

  it('speaks the ICARE phase as method context, never a participant status', () => {
    expect(icarePhaseWhy('Empower')).toBe('Part of the Empower rhythm of the ICARE method.');
    expect(icarePhaseWhy(null)).toBeNull();
  });
});
