/**
 * Recovery content — the 59 slogans of *Recovering the Mind* and the
 * personality layer that makes them matchable (ADR-0016).
 *
 * Slogans are intervention assets, not decoration (ADR-0015 principle 4):
 * each carries commentary and a concrete practice, and links out to a wellness
 * domain, VIA character strengths, ICARE stage, and Enneagram types.
 */

export type IcarePhase = 'Identify' | 'Connect' | 'Assess' | 'Respond' | 'Empower';

/** SAMHSA eight-domain wellness model. */
export type WellnessDomain =
  | 'Physical'
  | 'Emotional'
  | 'Social'
  | 'Spiritual'
  | 'Environmental'
  | 'Occupational'
  | 'Intellectual'
  | 'Financial';

export interface ViaStrengthLink {
  /** VIA character strength, e.g. "Self-Regulation". */
  strength: string;
  /** Why this slogan trains or requires that strength. */
  rationale: string;
}

export interface Slogan {
  /** 1–59, the book's numbering. */
  number: number;
  text: string;
  /** Rebalanced across all five stages (12/12/12/12/11) by the master source. */
  icarePhase: string;
  /** identify=1 connect=2 assess=3 respond=4 empower=5. */
  icarePhaseId: number;
  wellnessDomain: string;
  /** Stable key, e.g. "craving_awareness". */
  theme: string;
  /** Which of the book's seven movements this slogan belongs to. */
  point: string;
  /** Grace-ready summary — the short form shown in-app. */
  condensedCommentary: string;
  /** Full commentary, one entry per paragraph. */
  commentary: string[];
  viaStrengths: ViaStrengthLink[];
  /** The concrete practice — what to actually do. */
  practice: string;
}

/** How a slogan relates to an Enneagram type. */
export type EnneagramContext = 'core' | 'growth' | 'stress' | 'wing';

export interface EnneagramMapping {
  sloganNumber: number;
  /** 1–9. */
  type: number;
  /** 1–5; 5 means the slogan was written for this type. */
  weight: number;
  context: EnneagramContext;
}

export interface EnneagramType {
  type: number;
  /** e.g. "Reformer". */
  name: string;
  /** The type this one grows toward. */
  growthDirection: number;
  signatureSlogans: number[];
}
