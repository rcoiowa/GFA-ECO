/**
 * Recovery content — the 59 slogans of *Recovering the Mind* (ADR-0016).
 *
 * Slogans are intervention assets, not decoration (ADR-0015 principle 4):
 * each carries commentary and a concrete practice, and is linkable to a
 * wellness domain, theme, and ICARE stage.
 */

export type IcarePhase = 'Identify' | 'Connect' | 'Assess' | 'Respond' | 'Empower';

/** SAMHSA-style wellness domains, as tagged in the book. */
export type WellnessDomain =
  | 'Emotional'
  | 'Spiritual'
  | 'Intellectual'
  | 'Physical'
  | 'Environmental'
  | 'Financial'
  | 'Occupational'
  | 'Social';

export interface Slogan {
  /** 1–59, the book's numbering. */
  number: number;
  text: string;
  /**
   * The book's ICARE tagging, which follows the seven-point arc of the book
   * (Points Six and Seven are both Empower, so the distribution is skewed
   * toward Empower by design). This describes *where the slogan sits in the
   * journey* — see `matchPhase` for surfacing.
   */
  icarePhase: string;
  wellnessDomain: string;
  theme: string;
  /** Which of the book's seven movements this slogan belongs to. */
  point: string;
  /** Sub-points printed under the slogan heading, where present. */
  leadIn: string[];
  /** Full commentary, one entry per paragraph. */
  commentary: string[];
  /** The concrete practice — what to actually do. */
  practice: string;
}
