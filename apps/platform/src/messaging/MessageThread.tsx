import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Alert, Button } from '@recoveryos/ui';
import { groupMessagesByDay, type MessageRow } from '@recoveryos/domain';

/**
 * The conversation surface both roles share. Supportive communication, not
 * entertainment chat: chronological, clearly attributed, quiet. The draft
 * belongs to the composer and survives a failed send; auto-scroll follows new
 * messages only when the reader is already at the bottom — it never yanks
 * someone away from re-reading older messages.
 */

const clock = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export function MessageThread({
  messages,
  myPersonId,
  otherName,
  onSend,
  sending,
  sendError,
}: {
  messages: MessageRow[];
  myPersonId: number;
  otherName: string;
  /** Resolves true when the send succeeded (the composer then clears). */
  onSend: (body: string) => Promise<boolean>;
  sending: boolean;
  sendError: string | null;
}) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  // Messages present at mount render still; only genuinely new arrivals get
  // the settle motion (approved moment #4) — never the whole list (§47).
  const initialCount = useRef(messages.length);
  const lastId = messages.length > 0 ? messages[messages.length - 1]!.id : null;
  const animateLast = messages.length > initialCount.current;
  const groups = groupMessagesByDay(messages);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    nearBottom.current = true;
    const ok = await onSend(body);
    if (ok) setDraft('');
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-lg border border-line bg-surface-raised p-4"
        aria-label={`Conversation with ${otherName}`}
      >
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            No messages yet. Say hello when you’re ready.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.key}>
              <p className="mb-2 text-center text-xs font-medium text-ink-faint">{group.label}</p>
              <ul className="space-y-2">
                {group.messages.map((m) => {
                  const mine = m.sender_person_id === myPersonId;
                  return (
                    <li key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                      <div
                        className={`${
                          mine
                            ? 'max-w-[85%] rounded-2xl rounded-br-md bg-experience-600 px-3.5 py-2 text-white'
                            : 'max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2 text-ink'
                        }${animateLast && m.id === lastId ? ' settle-in' : ''}`}
                      >
                        <p className="sr-only">{mine ? 'You' : otherName} said:</p>
                        <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                        <p className={mine ? 'mt-1 text-right text-xs text-white/80' : 'mt-1 text-xs text-ink-faint'}>
                          {clock.format(new Date(m.created_at))}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="mt-3 space-y-2">
        {sendError ? (
          <Alert tone="critical">Your message didn’t send. It’s still here — try again.</Alert>
        ) : null}
        <div className="flex items-end gap-2">
          <label htmlFor="message-composer" className="sr-only">
            Message {otherName}
          </label>
          <textarea
            id="message-composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={4000}
            placeholder={`Message ${otherName}…`}
            className="min-h-[3rem] flex-1 resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-experience-500"
          />
          <Button type="submit" disabled={sending || draft.trim() === ''}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}
