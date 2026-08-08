import { Link } from 'react-router';
import { EmptyState, LoadingState, PageHeader } from '@recoveryos/ui';
import { useCoachWorkspace } from '../hooks/useCoachWorkspace';
import { useMyConversations } from '../../messaging/useMessaging';

/**
 * The coach's active participant conversations (P4D-1). Membership/RLS scope
 * every read — this is "my threads", never a universal inbox. Names come from
 * the relationship-scoped roster RPC, the same disclosure boundary as P4C.
 */
export function MessagesListPage() {
  const { roster, isLoading: rosterLoading } = useCoachWorkspace();
  const { conversations, unreadByConversation, isLoading } = useMyConversations();
  const names = new Map(roster.map((r) => [r.participant_person_id, r.display_name]));

  if (isLoading || rosterLoading) return <LoadingState label="Loading your conversations…" />;

  // Threads for people currently on the roster first; historical ones after.
  const rows = conversations
    .map((c) => ({
      conversation: c,
      name: names.get(c.participant_person_id),
      unread: unreadByConversation.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.unread - a.unread);

  return (
    <div className="space-y-4">
      <PageHeader title="Messages" lede="Private conversations with your participants." />
      {rows.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          message="Open a participant and start the conversation when it feels right."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map(({ conversation, name, unread }) => (
            <li key={conversation.id}>
              <Link
                to={`/coach/messages/${conversation.participant_person_id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-raised p-4 hover:border-experience-500"
              >
                <span className="font-medium text-ink">
                  {name ?? 'Earlier participant'}
                  {!name && (
                    <span className="ml-2 text-xs font-normal text-ink-faint">
                      (no longer an active participant)
                    </span>
                  )}
                </span>
                {unread > 0 ? (
                  <span className="rounded-full bg-experience-700 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {unread} new
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
