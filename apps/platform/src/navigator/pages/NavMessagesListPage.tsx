import { Link } from 'react-router';
import { EmptyState, LoadingState, PageHeader } from '@recoveryos/ui';
import { useMyConversations } from '../../messaging/useMessaging';
import { useNavigatorWorkspace } from '../hooks/useNavigatorWorkspace';

/** The navigator's private participant conversations — navigation context only. */
export function NavMessagesListPage() {
  const { roster, isLoading: rosterLoading } = useNavigatorWorkspace();
  const { conversations, unreadByConversation, isLoading } = useMyConversations();
  const names = new Map(roster.map((r) => [r.participant_person_id, r.display_name]));

  if (isLoading || rosterLoading) return <LoadingState label="Loading your conversations…" />;

  const rows = conversations
    .filter((c) => c.context === 'navigation')
    .map((c) => ({
      conversation: c,
      name: names.get(c.participant_person_id),
      unread: unreadByConversation.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.unread - a.unread);

  return (
    <div className="space-y-4">
      <PageHeader title="Messages" lede="Private conversations with your people." />
      {rows.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          message="Open one of your people and start the conversation when it feels right."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map(({ conversation, name, unread }) => (
            <li key={conversation.id}>
              <Link
                to={`/navigator/messages/${conversation.participant_person_id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-raised p-4 hover:border-experience-500"
              >
                <span className="font-medium text-ink">{name ?? 'Earlier participant'}</span>
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
