import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { EmptyState, LoadingState, PageHeader } from '@recoveryos/ui';
import { getSupabase } from '@recoveryos/data-access';
import { useMyConversations } from '../../messaging/useMessaging';

/**
 * Residence support conversations (P4F) — only the residents this staff member
 * was deliberately designated to support. Membership/RLS scope everything;
 * this is never a house-wide inbox.
 */
export function StaffMessagesPage() {
  const { conversations, unreadByConversation, isLoading } = useMyConversations();
  const residenceThreads = conversations.filter((c) => c.context === 'residence');

  const names = useQuery({
    queryKey: ['staff', 'residentNames', residenceThreads.map((c) => c.participant_person_id)],
    queryFn: async () => {
      const ids = residenceThreads.map((c) => c.participant_person_id);
      if (ids.length === 0) return new Map<number, string>();
      const { data } = await getSupabase()
        .from('people')
        .select('id, first_name, last_name, preferred_name')
        .in('id', ids);
      return new Map(
        (data ?? []).map((p) => [
          p.id as number,
          (p.preferred_name as string | null)?.trim() ||
            `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() ||
            'Resident',
        ]),
      );
    },
    enabled: residenceThreads.length > 0,
  });

  if (isLoading) return <LoadingState label="Loading your conversations…" />;

  const rows = residenceThreads
    .map((c) => ({
      conversation: c,
      name: names.data?.get(c.participant_person_id) ?? 'Resident',
      unread: unreadByConversation.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.unread - a.unread);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Messages"
        lede="Private conversations with residents you’re designated to support."
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          message="When a manager designates you as someone’s residence support, your conversation with them lives here."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map(({ conversation, name, unread }) => (
            <li key={conversation.id}>
              <Link
                to={`/staff/messages/${conversation.participant_person_id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-raised p-4 hover:border-experience-500"
              >
                <span className="font-medium text-ink">{name}</span>
                {unread > 0 ? (
                  <span className="rounded-full bg-experience-600 px-2.5 py-0.5 text-xs font-semibold text-white">
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
