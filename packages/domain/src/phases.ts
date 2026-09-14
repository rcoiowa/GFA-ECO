/**
 * The Grace House phase structure as canonical code.
 * Sources: GH-CURFEW-001 v3.0 (phase-based curfew, employment-only
 * exception) and GH-RECOVERY-001 v2.0 (phase-based recovery activity
 * requirement) in the operational document set.
 */

export type Phase = 1 | 2 | 3;

export interface PhaseDefinition {
  phase: Phase;
  label: string;
  dayRange: string;
  weeknightCurfew: string;
  weekendCurfew: string;
  activitiesPerWeek: number;
  coachingCadence: 'weekly' | 'biweekly' | 'monthly';
}

export const PHASE_DEFINITIONS: Record<Phase, PhaseDefinition> = {
  1: {
    phase: 1,
    label: 'Phase 1',
    dayRange: 'Days 1–30',
    weeknightCurfew: '9:00 PM',
    weekendCurfew: '10:00 PM',
    activitiesPerWeek: 4,
    coachingCadence: 'weekly',
  },
  2: {
    phase: 2,
    label: 'Phase 2',
    dayRange: 'Days 31–90',
    weeknightCurfew: '10:00 PM',
    weekendCurfew: '11:00 PM',
    activitiesPerWeek: 3,
    coachingCadence: 'biweekly',
  },
  3: {
    phase: 3,
    label: 'Phase 3',
    dayRange: 'Days 91+',
    weeknightCurfew: '11:00 PM',
    weekendCurfew: 'Midnight',
    activitiesPerWeek: 2,
    coachingCadence: 'monthly',
  },
};

export interface PhaseInfo extends PhaseDefinition {
  dayInResidence: number;
  /** ISO date the next phase begins by time-in-residence, null in Phase 3. */
  nextPhaseOn: string | null;
  /** True when a staff-recorded phase row overrides the derived phase. */
  isOverride: boolean;
  /** Tonight's curfew given the phase (Fri/Sat = weekend). */
  curfewTonight: string;
}

export function phaseForDay(dayInResidence: number): Phase {
  if (dayInResidence <= 30) return 1;
  if (dayInResidence <= 90) return 2;
  return 3;
}

/**
 * Compute the participant's phase picture. `overridePhase` is the latest
 * staff-recorded residency_phases row (accountability reset or approved
 * advancement); when present it wins over the derived phase.
 */
export function getPhaseInfo(
  admissionDate: string,
  overridePhase?: Phase | null,
  now: Date = new Date(),
): PhaseInfo {
  const admitted = new Date(`${admissionDate}T00:00:00`);
  const dayInResidence = Math.max(
    1,
    Math.floor((now.getTime() - admitted.getTime()) / 86_400_000) + 1,
  );
  const derived = phaseForDay(dayInResidence);
  const phase = overridePhase ?? derived;
  const def = PHASE_DEFINITIONS[phase];

  let nextPhaseOn: string | null = null;
  if (!overridePhase && phase < 3) {
    const boundaryDay = phase === 1 ? 31 : 91;
    const next = new Date(admitted);
    next.setDate(next.getDate() + boundaryDay - 1);
    nextPhaseOn = next.toISOString().slice(0, 10);
  }

  const day = now.getDay();
  const isWeekend = day === 5 || day === 6; // Fri/Sat nights
  return {
    ...def,
    dayInResidence,
    nextPhaseOn,
    isOverride: overridePhase != null,
    curfewTonight: isWeekend ? def.weekendCurfew : def.weeknightCurfew,
  };
}
