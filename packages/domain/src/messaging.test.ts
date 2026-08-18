import { describe, expect, it } from 'vitest';
import { deriveThreadAttention, groupMessagesByDay, unreadIncomingCount } from './messaging';
import type { MessageRow } from './coaching';

const NOW = new Date('2026-08-08T15:00:00');

const msg = (over: Partial<MessageRow>): MessageRow => ({
  id: 1,
  conversation_id: 7,
  sender_person_id: 10,
  body: 'hello',
  read_at: null,
  created_at: '2026-08-08T10:00:00',
  ...over,
});

describe('groupMessagesByDay', () => {
  it('labels today and yesterday humanely, older days by date', () => {
    const groups = groupMessagesByDay(
      [
        msg({ id: 1, created_at: '2026-08-05T09:00:00' }),
        msg({ id: 2, created_at: '2026-08-07T09:00:00' }),
        msg({ id: 3, created_at: '2026-08-08T09:00:00' }),
        msg({ id: 4, created_at: '2026-08-08T10:00:00' }),
      ],
      NOW,
    );
    expect(groups).toHaveLength(3);
    expect(groups[0]?.label).toMatch(/Aug/);
    expect(groups[1]?.label).toBe('Yesterday');
    expect(groups[2]?.label).toBe('Today');
    expect(groups[2]?.messages.map((m) => m.id)).toEqual([3, 4]);
  });

  it('empty thread groups to nothing', () => {
    expect(groupMessagesByDay([], NOW)).toHaveLength(0);
  });
});

describe('unreadIncomingCount', () => {
  it('counts only unread messages from the other person', () => {
    const messages = [
      msg({ id: 1, sender_person_id: 10, read_at: null }),
      msg({ id: 2, sender_person_id: 10, read_at: '2026-08-08T11:00:00' }),
      msg({ id: 3, sender_person_id: 20, read_at: null }),
    ];
    expect(unreadIncomingCount(messages, 20)).toBe(1);
    expect(unreadIncomingCount(messages, 10)).toBe(1);
  });
});

describe('deriveThreadAttention', () => {
  it('unread incoming plus who spoke last', () => {
    const messages = [
      msg({ id: 1, sender_person_id: 10 }),
      msg({ id: 2, sender_person_id: 20, created_at: '2026-08-08T11:00:00' }),
    ];
    const mine = deriveThreadAttention(messages, 20);
    expect(mine.unreadIncoming).toBe(1);
    expect(mine.lastMessageIsMine).toBe(true);
    const theirs = deriveThreadAttention(messages, 10);
    expect(theirs.unreadIncoming).toBe(1);
    expect(theirs.lastMessageIsMine).toBe(false);
  });

  it('empty thread needs nothing', () => {
    const a = deriveThreadAttention([], 10);
    expect(a.unreadIncoming).toBe(0);
    expect(a.lastMessageIsMine).toBe(false);
  });
});
