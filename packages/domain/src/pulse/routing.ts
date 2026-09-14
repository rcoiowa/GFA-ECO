/**
 * State-aware check-in routing. "Morning" is not a clock time — it is the
 * first meaningful interaction of the participant's day. A person who first
 * opens the app at 8 PM is never asked to set an intention for a day that is
 * already over.
 */

/** Participant-day boundary. Iowa; configurable per person later. */
export const DEFAULT_PULSE_TIMEZONE = 'America/Chicago';
/** Evening begins at 5 PM local unless configured otherwise. */
export const DEFAULT_EVENING_HOUR = 17;

export type PulseMode = 'morning' | 'evening' | 'evening_streamlined' | 'complete';

export interface PulseRouting {
  mode: PulseMode;
  /** Plain-language reason, surfaced by "Why am I seeing this?". */
  reason: string;
  /** Local calendar date (YYYY-MM-DD) the check-in belongs to. */
  localDate: string;
  localHour: number;
}

export interface PulseDaySummary {
  hasMorning: boolean;
  hasEvening: boolean;
}

/** Local calendar date in the participant's timezone. */
export function participantLocalDate(now: Date, timeZone = DEFAULT_PULSE_TIMEZONE): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Hour (0–23) in the participant's timezone. */
export function participantLocalHour(now: Date, timeZone = DEFAULT_PULSE_TIMEZONE): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    hour12: false,
  }).format(now);
  // Midnight can format as "24" in some runtimes.
  return Number(hour) % 24;
}

/**
 * Which experience this check-in gets.
 *
 * - First check-in before the evening threshold → morning.
 * - A second check-in, or the first after the threshold → evening.
 * - A late first check-in → streamlined evening (no retroactive intention).
 * - Both already recorded → complete (no duplicate submissions; amendments are
 *   a separate, explicit product decision).
 */
export function routePulse(input: {
  now: Date;
  today: PulseDaySummary;
  timeZone?: string;
  eveningHour?: number;
}): PulseRouting {
  const timeZone = input.timeZone ?? DEFAULT_PULSE_TIMEZONE;
  const eveningHour = input.eveningHour ?? DEFAULT_EVENING_HOUR;
  const localDate = participantLocalDate(input.now, timeZone);
  const localHour = participantLocalHour(input.now, timeZone);
  const isEvening = localHour >= eveningHour;
  const base = { localDate, localHour };

  if (input.today.hasMorning && input.today.hasEvening) {
    return {
      ...base,
      mode: 'complete',
      reason: "You've already checked in this morning and this evening.",
    };
  }

  if (input.today.hasMorning) {
    return {
      ...base,
      mode: 'evening',
      reason: 'You checked in earlier today, so this one closes the day.',
    };
  }

  if (isEvening) {
    return {
      ...base,
      mode: 'evening_streamlined',
      // The day is nearly over; asking for an intention now would be hollow.
      reason: "It's evening and today's first check-in, so we'll keep it short.",
    };
  }

  return {
    ...base,
    mode: 'morning',
    reason: "This is your first check-in today, so we'll start with how you're arriving.",
  };
}

/** True when the mode collects an intention + morning prompt. */
export function isMorningMode(mode: PulseMode): boolean {
  return mode === 'morning';
}

/** True when the mode collects a reflection. */
export function isEveningMode(mode: PulseMode): boolean {
  return mode === 'evening' || mode === 'evening_streamlined';
}
