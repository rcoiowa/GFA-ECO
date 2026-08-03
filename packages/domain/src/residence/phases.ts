/**
 * Grace House phase model — the authority for curfew and screening cadence.
 * Source: GH-CURFEW-001 v3.0 and the Drug & Alcohol Screening Policy
 * (docs/content-intake/grace-house/INDEX.md). Policy values live here so the
 * resident and staff surfaces can never disagree about them.
 */

export type ResidencyPhase = 1 | 2 | 3;

export interface PhaseDefinition {
  phase: ResidencyPhase;
  label: string;
  dayRange: string;
  /** 24h "HH:MM" — weeknight and weekend curfew. */
  curfewWeeknight: string;
  curfewWeekend: string;
  screeningCadence: string;
}

/** No curfew extends past midnight in any phase (policy hard ceiling). */
export const CURFEW_HARD_CEILING = '00:00';

export const PHASES: Record<ResidencyPhase, PhaseDefinition> = {
  1: {
    phase: 1,
    label: 'Phase 1',
    dayRange: 'Days 1–30',
    curfewWeeknight: '21:00',
    curfewWeekend: '22:00',
    screeningCadence: 'At intake, then randomly up to twice weekly',
  },
  2: {
    phase: 2,
    label: 'Phase 2',
    dayRange: 'Days 31–90',
    curfewWeeknight: '22:00',
    curfewWeekend: '23:00',
    screeningCadence: 'Once weekly, on a random day',
  },
  3: {
    phase: 3,
    label: 'Phase 3',
    dayRange: 'Day 91 onward',
    curfewWeeknight: '23:00',
    curfewWeekend: '00:00',
    screeningCadence: 'Randomly, at least monthly',
  },
};

/** Weekend curfew applies to Friday and Saturday nights. */
export function curfewFor(phase: ResidencyPhase, date = new Date()): string {
  const day = date.getDay();
  const isWeekendNight = day === 5 || day === 6;
  const def = PHASES[phase];
  return isWeekendNight ? def.curfewWeekend : def.curfewWeeknight;
}

/** "9:00 PM" from "21:00" — plain language for resident-facing surfaces. */
export function formatCurfew(time24: string): string {
  const [h = '0', m = '00'] = time24.split(':');
  const hour = Number(h);
  if (hour === 0) return `12:${m} AM (midnight)`;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${suffix}`;
}

/** Phase suggested by tenure. Staff decide actual phase; this only informs. */
export function suggestedPhase(admissionDate: string, today = new Date()): ResidencyPhase {
  const days = Math.floor(
    (today.getTime() - new Date(admissionDate).getTime()) / 86_400_000,
  );
  if (days <= 30) return 1;
  if (days <= 90) return 2;
  return 3;
}
