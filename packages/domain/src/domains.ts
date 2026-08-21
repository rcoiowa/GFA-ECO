/**
 * Canonical operational domains — the TypeScript mirror of `recoveryos.domains` and
 * `recoveryos.domain_subcategories` (migration 0129), RATIFIED 2026-08-21
 * (docs/architecture/domain-vocabulary-v1.0.md).
 *
 * Machine keys are PERMANENT identifiers; labels are presentation language and may evolve.
 * Recovery and Community are deliberately separate domains — the hard semantic boundary.
 * Safety and Trauma are deliberately absent (cross-cutting / prohibited by ratification).
 * `scripts/verify-domain-vocabulary.mjs` (CI) pins this file against the 0129 seed and the
 * live `need_category` keys in `navigation.ts` — a drifted label or renamed key fails the build.
 *
 * DOMAIN answers "where is the work occurring?" — never what service was provided (service
 * types), what capital exists (BARC stays one locked total), what outcome occurred, or what
 * ICARE method is in use. Domains are a lens over evidence, not evidence.
 */

export interface DomainDef {
  key: string;
  participantLabel: string;
  staffLabel: string;
  sort: number;
}

export const DOMAINS: readonly DomainDef[] = [
  { key: 'recovery', participantLabel: 'My recovery', staffLabel: 'Recovery', sort: 1 },
  { key: 'community', participantLabel: 'My community', staffLabel: 'Community', sort: 2 },
  { key: 'housing', participantLabel: 'Housing', staffLabel: 'Housing', sort: 3 },
  {
    key: 'employment_purpose',
    participantLabel: 'Work & purpose',
    staffLabel: 'Employment & Purpose',
    sort: 4,
  },
  { key: 'health', participantLabel: 'Health & wellbeing', staffLabel: 'Health & Wellness', sort: 5 },
  {
    key: 'family',
    participantLabel: 'Family & relationships',
    staffLabel: 'Family & Relationships',
    sort: 6,
  },
  { key: 'transportation', participantLabel: 'Getting around', staffLabel: 'Transportation', sort: 7 },
  { key: 'education', participantLabel: 'Learning & skills', staffLabel: 'Education & Skills', sort: 8 },
  {
    key: 'financial_stability',
    participantLabel: 'Money & basics',
    staffLabel: 'Financial Stability & Basic Needs',
    sort: 9,
  },
  { key: 'justice', participantLabel: 'Legal & courts', staffLabel: 'Justice & Reentry', sort: 10 },
  {
    key: 'other',
    participantLabel: 'Something else',
    staffLabel: 'Other / Participant-defined',
    sort: 11,
  },
] as const;

export type DomainKey = (typeof DOMAINS)[number]['key'];

/**
 * Subcategory → domain mapping. Keys are byte-identical to the live
 * `navigation_needs.need_category` values (NEVER renamed). `null` marks the
 * cross-cutting subcategory (`identification_documents`): nested work inherits
 * the parent loop's domain; standalone work gets a human choice.
 */
export const SUBCATEGORY_DOMAIN: Readonly<Record<string, DomainKey | null>> = {
  recovery_support: 'recovery',
  social_connection: 'community',
  housing: 'housing',
  recovery_residence: 'housing',
  employment: 'employment_purpose',
  treatment_healthcare: 'health',
  mental_health: 'health',
  family_childcare: 'family',
  transportation: 'transportation',
  education_training: 'education',
  benefits_financial: 'financial_stability',
  food_basic_needs: 'financial_stability',
  digital_access: 'financial_stability',
  legal_reentry: 'justice',
  identification_documents: null,
  other: 'other',
} as const;

const byKey = new Map(DOMAINS.map((d) => [d.key, d]));

/** Participant-facing label ("My recovery"); falls back to the raw key, humanized. */
export function domainParticipantLabel(key: string | null | undefined): string {
  if (!key) return '';
  return byKey.get(key)?.participantLabel ?? key.replace(/_/g, ' ');
}

/** Staff-facing label ("Justice & Reentry"); falls back to the raw key, humanized. */
export function domainStaffLabel(key: string | null | undefined): string {
  if (!key) return '';
  return byKey.get(key)?.staffLabel ?? key.replace(/_/g, ' ');
}

/** The domain a subcategory belongs to, or null for cross-cutting subcategories. */
export function domainForSubcategory(subcategoryKey: string): DomainKey | null {
  return SUBCATEGORY_DOMAIN[subcategoryKey] ?? null;
}
