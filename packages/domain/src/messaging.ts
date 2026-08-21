import type { MessageRow } from './coaching';

/**
 * Messaging view models (P4D-1). Pure derivations over canonical message rows —
 * no fetching, no clocks unless injected. The database remains the authority
 * for every timestamp; these functions only arrange what it said.
 */

export interface MessageDayGroup {
  /** Stable key for rendering (local calendar date). */
  key: string;
  /** Human label: Today / Yesterday / "Tue, Aug 5". */
  label: string;
  messages: MessageRow[];
}

function localDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * Groups a chronological thread into local calendar days so long conversations
 * stay readable. Assumes input is already sorted ascending by created_at
 * (the read layer orders server-side).
 */
export function groupMessagesByDay(messages: MessageRow[], now: Date = new Date()): MessageDayGroup[] {
  const todayKey = localDayKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = localDayKey(yesterday.toISOString());

  const groups: MessageDayGroup[] = [];
  for (const message of messages) {
    const key = localDayKey(message.created_at);
    const current = groups[groups.length - 1];
    if (current && current.key === key) {
      current.messages.push(message);
      continue;
    }
    const label =
      key === todayKey
        ? 'Today'
        : key === yesterdayKey
          ? 'Yesterday'
          : new Intl.DateTimeFormat(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }).format(new Date(message.created_at));
    groups.push({ key, label, messages: [message] });
  }
  return groups;
}

/** Messages sent to me that I have not read yet. */
export function unreadIncomingCount(messages: MessageRow[], myPersonId: number): number {
  return messages.filter((m) => m.sender_person_id !== myPersonId && m.read_at === null).length;
}

export interface ThreadAttention {
  /** Incoming messages not yet read — the strongest "look at this" signal. */
  unreadIncoming: number;
  /**
   * The last word is mine — I'm waiting on them, not the other way around.
   * Deliberately NOT an urgency signal (§40): it only prevents falsely nudging
   * someone to "respond" to a thread where they already did.
   */
  lastMessageIsMine: boolean;
}

export function deriveThreadAttention(messages: MessageRow[], myPersonId: number): ThreadAttention {
  const last = messages.length > 0 ? messages[messages.length - 1] : undefined;
  return {
    unreadIncoming: unreadIncomingCount(messages, myPersonId),
    lastMessageIsMine: last !== undefined && last.sender_person_id === myPersonId,
  };
}
