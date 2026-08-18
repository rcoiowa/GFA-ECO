/**
 * BARC-10 — Brief Assessment of Recovery Capital (10 items, 1–6 Likert).
 * Canonical instrument definition, merged from the strongest source
 * implementation (vrcc.app MVP module) per the feature matrix. The
 * parable-of-the-sower soil framing is preserved Grace For Addictions IP.
 */

export const BARC10_INSTRUMENT_KEY = 'barc10';

export const BARC10_ITEMS = [
  'I have the support of people who believe in my recovery.',
  'I feel like I belong to a community that supports my recovery.',
  'The things I do add value to the people and world around me.',
  'I get emotional support from friends or family when I need it.',
  'I have enough energy to complete the things I set out to do.',
  'My life is meaningful and fulfilling without needing to use.',
  'In general, I am happy with my life today.',
  'I have people I can rely on to stand with me in my recovery.',
  'I am making good progress on my recovery journey.',
  'There are things in my life I look forward to.',
] as const;

export const BARC10_SCALE = [
  { value: 1, label: 'Strongly disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Slightly disagree' },
  { value: 4, label: 'Slightly agree' },
  { value: 5, label: 'Agree' },
  { value: 6, label: 'Strongly agree' },
] as const;

/**
 * 47 is a research-informed BARC-10 benchmark (exact provenance/population is an
 * OPEN binding — see docs/product/recoveryos-icare-integration-authority-v1.0.md
 * §4). It is used here ONLY as a participant-facing reflection boundary for the
 * soil metaphor — never a clinical cutoff, access gate, risk flag, or automated
 * trigger. BARC-10 remains one 10–60 total; there is no subdomain scoring and no
 * ≤35 "crisis" logic.
 */
export const BARC10_THRESHOLD = 47;

export interface SoilType {
  code: 'good' | 'thorny' | 'rocky' | 'path';
  label: string;
  emoji: string;
  description: string;
}

export function soilForScore(total: number): SoilType {
  if (total >= BARC10_THRESHOLD)
    return { code: 'good', label: 'Good Soil', emoji: '🌱', description: 'Grounded and open' };
  if (total >= 38)
    return {
      code: 'thorny',
      label: 'Thorny Soil',
      emoji: '🌓',
      description: 'Growth crowded by worries',
    };
  if (total >= 26)
    return {
      code: 'rocky',
      label: 'Rocky Soil',
      emoji: '🌒',
      description: 'Struggling to find roots',
    };
  return {
    code: 'path',
    label: 'Path Soil',
    emoji: '🌑',
    description: 'Hard and exposed right now',
  };
}

export function barc10Insight(total: number): string {
  const insights: Record<SoilType['code'], string> = {
    good: 'You have real recovery capital to build on — supportive people, energy, and meaning. A coach can help you protect and grow it.',
    thorny:
      'There is genuine growth happening, but worries and pressures are crowding it. A coach can help clear space for what matters.',
    rocky:
      'You are working hard to find footing. A coach can help you put down roots one connection at a time.',
    path: 'Right now things feel hard and exposed — and you still showed up. That matters. A coach will meet you exactly where you are.',
  };
  return insights[soilForScore(total).code];
}

export function barc10Total(answers: readonly number[]): number {
  return answers.reduce((sum, a) => sum + a, 0);
}
