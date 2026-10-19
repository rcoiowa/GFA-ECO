/** Local review decisions only. No execution transport, resident writes, or automated inference. */
export const ITEM_TYPES = [
  'facilities issue',
  'household decision',
  'policy clarification',
  'meeting follow-through',
  'restricted resident-specific question',
] as const;
export const REPORT_STATES = [
  'reported',
  'requested',
  'proposed',
  'announced',
  'verified',
] as const;
export type Decision = 'approved for review' | 'rejected' | 'evidence requested' | 'edited';
export interface ReviewItem {
  id: string;
  text: string;
  type: (typeof ITEM_TYPES)[number];
  reportState: (typeof REPORT_STATES)[number];
  residenceId: number | null;
  personId: number | null;
  matchingConfirmed: boolean;
  currentRecord: string;
  proposedChange: string;
  evidence: string;
  decision: Decision | 'pending';
  history: { at: string; actorId: number; decision: Decision; reason: string; snapshot: string }[];
}
export interface ReviewBatch {
  id: string;
  sourceType: 'AI-generated GroupMe recap' | 'manual anonymized summary';
  sourceDate: string;
  coverage: string;
  importedAt: string;
  overlapNote: string;
  duplicates: number;
  items: ReviewItem[];
}
export const normalizeEvent = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();
export function extractReviewItems(text: string, existing: ReviewBatch[], id: () => string) {
  const known = new Set(existing.flatMap((b) => b.items.map((i) => normalizeEvent(i.text))));
  let duplicates = 0;
  const items: ReviewItem[] = [];
  for (const line of text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const key = normalizeEvent(line);
    if (known.has(key)) {
      duplicates++;
      continue;
    }
    known.add(key);
    items.push({
      id: id(),
      text: line,
      type: 'meeting follow-through',
      reportState: 'reported',
      residenceId: null,
      personId: null,
      matchingConfirmed: false,
      currentRecord: 'Not verified',
      proposedChange: '',
      evidence: '',
      decision: 'pending',
      history: [],
    });
  }
  return { items, duplicates };
}
export function decideReview(
  item: ReviewItem,
  decision: Decision,
  reason: string,
  actorId: number,
  authorizedResidenceIds: number[],
  authorizedPersonIds: number[],
  at: string,
): ReviewItem {
  if (!reason.trim()) throw new Error('A review reason is required.');
  if (decision === 'approved for review') {
    if (
      !item.residenceId ||
      !authorizedResidenceIds.includes(item.residenceId) ||
      !item.matchingConfirmed
    )
      throw new Error('Confirm an authorized residence match.');
    if (
      item.type === 'restricted resident-specific question' &&
      (!item.personId || !authorizedPersonIds.includes(item.personId))
    )
      throw new Error('Explicitly match an authorized resident ID. Never match by first name.');
    if (
      !item.proposedChange.trim() ||
      item.currentRecord === 'Not verified' ||
      !item.currentRecord.trim()
    )
      throw new Error('Review the current record and proposed change.');
    if (
      (item.reportState === 'verified' || item.type === 'policy clarification') &&
      !item.evidence.trim()
    )
      throw new Error('Verification evidence is required; policy remains pending.');
  }
  return {
    ...item,
    decision,
    history: [
      ...item.history,
      {
        at,
        actorId,
        decision,
        reason: reason.trim(),
        snapshot: JSON.stringify({ ...item, history: undefined }),
      },
    ],
  };
}
export function editReview(
  item: ReviewItem,
  patch: Partial<ReviewItem>,
  actorId: number,
  at: string,
): ReviewItem {
  // Any content/matching change invalidates prior approval. Preserve previous snapshot.
  return {
    ...item,
    ...patch,
    decision: 'pending',
    history: [
      ...item.history,
      {
        at,
        actorId,
        decision: 'edited',
        reason: 'Draft edited; previous review invalidated.',
        snapshot: JSON.stringify({ ...item, history: undefined }),
      },
    ],
  };
}
export const destination = (type: ReviewItem['type']) =>
  ({
    'facilities issue': 'Facilities queue',
    'household decision': 'Decision log',
    'policy clarification': 'Policy review',
    'meeting follow-through': 'Meeting agenda',
    'restricted resident-specific question': 'Restricted follow-up',
  })[type];
