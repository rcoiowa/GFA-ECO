import { describe, expect, it } from 'vitest';
import { decideReview, editReview, extractReviewItems, type ReviewBatch } from './reviewModel';
let sequence = 0;
const id = () => String(++sequence);
const item = () =>
  extractReviewItems('Reported waste collection question for Friday', [], id).items[0]!;
const matched = () => ({
  ...item(),
  residenceId: 10,
  matchingConfirmed: true,
  currentRecord: 'Collection schedule not yet verified',
  proposedChange: 'Request collection schedule evidence',
});
describe('review-only summary intake', () => {
  it('deduplicates normalized lines within and across overlapping recaps without inferring dates', () => {
    const first = extractReviewItems(
      'Reported question for Friday\n  REPORTED question   for Friday ',
      [],
      id,
    );
    expect(first.duplicates).toBe(1);
    expect(first.items[0]?.text).toBe('Reported question for Friday');
    const batch = { items: first.items } as ReviewBatch;
    const second = extractReviewItems(
      'Reported question for Friday\nDifferent wording requires manual comparison',
      [batch],
      id,
    );
    expect(second.duplicates).toBe(1);
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.reportState).toBe('reported');
    expect(second.items[0]?.residenceId).toBeNull();
  });
  it('denies an unauthorized residence and unconfirmed matching', () => {
    expect(() =>
      decideReview(matched(), 'approved for review', 'Review', 1, [20], [], 'now'),
    ).toThrow('authorized residence');
    expect(() =>
      decideReview(
        { ...matched(), matchingConfirmed: false },
        'approved for review',
        'Review',
        1,
        [10],
        [],
        'now',
      ),
    ).toThrow('authorized residence');
  });
  it('requires explicit authorized resident matching for restricted questions', () => {
    const restricted = {
      ...matched(),
      type: 'restricted resident-specific question' as const,
      personId: 42,
    };
    expect(() =>
      decideReview(restricted, 'approved for review', 'Review', 1, [10], [43], 'now'),
    ).toThrow('authorized resident ID');
    expect(
      decideReview(restricted, 'approved for review', 'Review', 1, [10], [42], 'now').decision,
    ).toBe('approved for review');
  });
  it('does not mark reported policy verified without evidence', () => {
    expect(() =>
      decideReview(
        { ...matched(), type: 'policy clarification' },
        'approved for review',
        'Review',
        1,
        [10],
        [],
        'now',
      ),
    ).toThrow('policy remains pending');
    expect(() =>
      decideReview(
        { ...matched(), reportState: 'verified' },
        'approved for review',
        'Review',
        1,
        [10],
        [],
        'now',
      ),
    ).toThrow('Verification evidence');
  });
  it('records approval as review only and invalidates it after an edit', () => {
    const approved = decideReview(
      matched(),
      'approved for review',
      'Needs operational review',
      1,
      [10],
      [],
      'now',
    );
    expect(approved.history[0]?.actorId).toBe(1);
    const edited = editReview(approved, { proposedChange: 'Different proposal' }, 1, 'later');
    expect(edited.decision).toBe('pending');
    expect(edited.history).toHaveLength(2);
    expect(edited.history[1]?.snapshot).toContain('Request collection schedule evidence');
  });
  it('permits evidence requests and rejection before matching, but requires a reason', () => {
    expect(
      decideReview(item(), 'evidence requested', 'Need original evidence', 1, [], [], 'now')
        .decision,
    ).toBe('evidence requested');
    expect(() => decideReview(item(), 'rejected', '', 1, [], [], 'now')).toThrow('reason');
  });
});
