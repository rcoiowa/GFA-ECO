/**
 * Adaptive responses (ICARE Assess → Respond, ADR-0015).
 *
 * Deterministic rules over the participant's own recent entries. No model, no
 * inference on free text: every response names the specific inputs that
 * triggered it, so "Why am I seeing this?" always has a truthful answer, and
 * the same inputs always produce the same output.
 */

import type { ConnectionAnswer } from './prompts';

export interface PulseReadings {
  mood?: number | null;
  craving?: number | null;
  hope?: number | null;
  confidence?: number | null;
  purpose?: number | null;
  connection?: ConnectionAnswer | null;
}

export type PulseResponseKind =
  | 'support_now' // elevated risk — never silently recorded
  | 'invite' // an optional follow-up question
  | 'affirm' // name something that went well
  | 'practice' // offer a grounding practice or slogan
  | 'connect'; // offer a person to reach

export interface PulseResponse {
  id: string;
  kind: PulseResponseKind;
  message: string;
  /** Plain-language provenance, shown verbatim under "Why am I seeing this?". */
  because: string;
  /** Optional follow-up captured with the check-in. */
  followUpPrompt?: string;
}

const RISK_MOOD = 2;
const RISK_CRAVING = 4;

/**
 * Ordered by urgency: the caller shows the first `support_now` if present, and
 * may show one additional non-risk response. Rules read only the participant's
 * own data.
 */
export function evaluatePulseResponses(
  current: PulseReadings,
  previous?: PulseReadings | null,
  priorConnection?: ConnectionAnswer | null,
): PulseResponse[] {
  const out: PulseResponse[] = [];
  const { mood, craving, hope } = current;

  // --- Risk first. Elevated risk is never met with a generic thank-you. ---
  if ((mood != null && mood <= RISK_MOOD) || (craving != null && craving >= RISK_CRAVING)) {
    const parts: string[] = [];
    if (mood != null && mood <= RISK_MOOD) parts.push(`you rated your mood ${mood} of 5`);
    if (craving != null && craving >= RISK_CRAVING)
      parts.push(`you rated cravings ${craving} of 5`);
    out.push({
      id: 'risk_support_now',
      kind: 'support_now',
      message: "That sounds like a lot to carry right now. You don't have to do it alone.",
      because: `You're seeing this because ${parts.join(' and ')} in this check-in.`,
    });
  }

  // --- Meaningful drops invite a story, never a diagnosis. ---
  if (previous?.hope != null && hope != null && previous.hope - hope >= 3) {
    out.push({
      id: 'hope_drop',
      kind: 'invite',
      message: 'Hope looks different today than last time.',
      because: `You're seeing this because hope moved from ${previous.hope} to ${hope} since your last check-in.`,
      followUpPrompt: 'Would you like to tell us what changed?',
    });
  } else if (previous?.mood != null && mood != null && previous.mood - mood >= 2) {
    out.push({
      id: 'mood_drop',
      kind: 'invite',
      message: 'Today looks heavier than last time.',
      because: `You're seeing this because mood moved from ${previous.mood} to ${mood} since your last check-in.`,
      followUpPrompt: 'What happened?',
    });
  }

  // --- Steadiness is worth naming out loud. ---
  if (previous?.mood != null && mood != null && mood >= 4 && previous.mood >= 4) {
    out.push({
      id: 'steady',
      kind: 'affirm',
      message: "You've been steady across your last two check-ins.",
      because: `You're seeing this because mood was ${previous.mood} and then ${mood}.`,
      followUpPrompt: 'What helped you stay steady?',
    });
  }

  // --- Rising cravings get a practice, not a lecture. ---
  if (previous?.craving != null && craving != null && craving - previous.craving >= 2) {
    out.push({
      id: 'craving_rise',
      kind: 'practice',
      message: 'Cravings are stronger than last time. A grounding moment can take the edge off.',
      because: `You're seeing this because cravings moved from ${previous.craving} to ${craving}.`,
    });
  }

  // --- Connection Prevents Crisis: two quiet days is an offer, not an alarm. ---
  if (current.connection === 'none' && priorConnection === 'none') {
    out.push({
      id: 'connection_gap',
      kind: 'connect',
      message: 'It has been a couple of quiet days. Reaching one person can change a day.',
      because:
        'You\'re seeing this because you marked "Not today" for meaningful connection twice in a row.',
    });
  }

  return out;
}

/** The single most urgent response, if any. */
export function primaryPulseResponse(responses: PulseResponse[]): PulseResponse | null {
  return responses.find((r) => r.kind === 'support_now') ?? responses[0] ?? null;
}

/** True when the check-in must not end on a generic acknowledgment. */
export function requiresSupportPathway(responses: PulseResponse[]): boolean {
  return responses.some((r) => r.kind === 'support_now');
}
