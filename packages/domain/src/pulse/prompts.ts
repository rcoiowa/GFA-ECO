/**
 * Recovery Pulse — the daily ICARE cycle (ADR-0015).
 *
 * Prompt definitions and the 2x2 hope/thankfulness x control matrix. The
 * quadrant is recorded from the prompt we chose, never inferred from what the
 * participant wrote: no text classification is performed on reflections
 * (ADR-0015 principles 6 and 7).
 */

/** Hope/thankfulness x agency/acceptance. */
export type PulseQuadrant =
  'hope_agency' | 'hope_acceptance' | 'thanks_agency' | 'thanks_acceptance';

export interface PulsePrompt {
  quadrant: PulseQuadrant;
  /** Recovery process the quadrant practices — shown in "why am I seeing this?". */
  process: 'agency' | 'acceptance';
  /** Asked with the morning intention. */
  morning: string;
  /** Asked in the evening, paired to the same quadrant. */
  evening: string;
}

export const PULSE_PROMPTS: Record<PulseQuadrant, PulsePrompt> = {
  hope_agency: {
    quadrant: 'hope_agency',
    process: 'agency',
    morning: "What is one thing you're hopeful about that you can influence today?",
    evening: 'How did that go today?',
  },
  hope_acceptance: {
    quadrant: 'hope_acceptance',
    process: 'acceptance',
    morning:
      "What is one thing you're hopeful about that you're trusting will unfold, even though you can't control it?",
    // Deliberately not "what did you learn" — that presumes insight happened.
    evening: 'What was it like to sit with that today?',
  },
  thanks_agency: {
    quadrant: 'thanks_agency',
    process: 'agency',
    morning: "What is one thing you're thankful for because of a choice or action you took?",
    evening: 'What did you choose today that you feel good about?',
  },
  thanks_acceptance: {
    quadrant: 'thanks_acceptance',
    process: 'acceptance',
    morning:
      "What is one thing you're thankful for that was simply a gift, blessing, or unexpected encouragement?",
    evening: 'What came to you today that you did not have to earn?',
  },
};

export const PULSE_QUADRANTS = Object.keys(PULSE_PROMPTS) as PulseQuadrant[];

/**
 * Stable per-person, per-day rotation: the same person sees the same prompt
 * all day (refreshing the page must not reroll it), and different people are
 * spread across quadrants. `skips` advances the rotation for "ask me something
 * different" without repeating what they already declined.
 */
export function selectQuadrant(personId: number, localDate: string, skips = 0): PulseQuadrant {
  let hash = 0;
  const seed = `${personId}:${localDate}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  const index = (hash + skips) % PULSE_QUADRANTS.length;
  return PULSE_QUADRANTS[index] as PulseQuadrant;
}

/** Labeled options; the ordinal is what gets stored (owner decision). */
export interface LabeledScale {
  key: string;
  question: string;
  /** Index 0 => value 1. */
  labels: [string, string, string, string, string];
}

export const MOOD_SCALE: LabeledScale = {
  key: 'mood',
  question: 'How are you feeling right now?',
  labels: ['Really low', 'Low', 'Okay', 'Good', 'Really good'],
};

export const CRAVING_SCALE: LabeledScale = {
  key: 'craving',
  question: 'How strong are cravings right now?',
  labels: ['None', 'Mild', 'Noticeable', 'Strong', 'Very strong'],
};

export const HOPE_SCALE: LabeledScale = {
  key: 'hope',
  question: 'Today I feel hopeful…',
  labels: ['Not at all', 'A little', 'Somewhat', 'Mostly', 'Very'],
};

export const CONFIDENCE_SCALE: LabeledScale = {
  key: 'confidence',
  question: 'How confident do you feel about taking your next healthy step?',
  labels: ['Not at all', 'A little', 'Somewhat', 'Mostly', 'Very'],
};

export const PURPOSE_SCALE: LabeledScale = {
  key: 'purpose',
  question: 'I have something worth showing up for today.',
  labels: ['Not really', 'A little', 'Somewhat', 'Mostly', 'Definitely'],
};

/** Retrospective by nature, so it is asked in the evening only. */
export const CONNECTION_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'some', label: 'Some' },
  { value: 'none', label: 'Not today' },
] as const;

export type ConnectionAnswer = (typeof CONNECTION_OPTIONS)[number]['value'];

export const CONNECTION_QUESTION = 'Did you experience meaningful connection today?';

/**
 * One-tap barriers. Unlike a rating these are actionable — they route to
 * navigation support and supply barrier data for Exhibit E reporting.
 */
export const CHALLENGE_CHIPS = [
  'Work',
  'Family',
  'Housing',
  'Transportation',
  'Court',
  'Finances',
  'Mental health',
  'Cravings',
  'Relationships',
  'Childcare',
  'Health',
] as const;
