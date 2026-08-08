import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { getMySupportTeam } from '@recoveryos/data-access';
import type { SupportTeamMember } from '@recoveryos/domain';
import { MessageThread } from '../../messaging/MessageThread';
import {
  useConversationThread,
  useEnsureConversation,
  useSendMessage,
} from '../../messaging/useMessaging';
import { participantKeys } from '../../lib/query';
import { track } from '../../lib/analytics';

/**
 * The participant's private conversations (P4D, multi-thread in P4E). Each
 * thread is clearly labeled with WHO it's with — "Jordan B. — Recovery Coach",
 * "Alex M. — Navigator" — separate professional relationships stay separate
 * conversations. Same engine, different contexts.
 */
export function MessagesPage() {
  const { person } = useAuth();
  const personId = person?.id ?? 0;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const team = useQuery({
    queryKey: participantKeys.supportTeam(personId),
    queryFn: () => getMySupportTeam(),
    enabled: personId > 0,
  });
  const members = team.data ?? [];
  const memberKey = (m: SupportTeamMember) => `${m.context}-${m.support_person_id}`;
  const active =
    members.find((m) => memberKey(m) === selectedKey) ??
    members.find((m) => m.context === 'coaching') ??
    members[0];

  const context =
    active?.context === 'navigation'
      ? ('navigation' as const)
      : active?.context === 'residence'
        ? ('residence' as const)
        : ('coaching' as const);
  const ensure = useEnsureConversation(active?.support_person_id ?? null, Boolean(active), context);
  const conversationId = ensure.data?.ok ? ensure.data.conversationId : null;
  const thread = useConversationThread(conversationId);
  const send = useSendMessage(conversationId, { role: 'participant', messages: thread.messages });

  useEffect(() => {
    track('messages_page_viewed');
  }, []);
  useEffect(() => {
    if (conversationId) track('conversation_opened');
  }, [conversationId]);

  if (team.isPending || (active && ensure.isPending)) {
    return <LoadingState label="Opening your messages…" />;
  }

  if (!active || (ensure.data && !ensure.data.ok)) {
    return (
      <div className="space-y-4">
        <PageHeader title="Messages" />
        <EmptyState
          title="Messaging opens once you’re connected"
          message="When you’re connected with a coach or navigator, this is where you’ll talk."
        />
        <p className="text-sm text-ink-muted">
          <Link to="/vrcc/connect" className="underline underline-offset-2">
            Go to Connect
          </Link>{' '}
          to reach out for support.
        </p>
      </div>
    );
  }

  if (thread.hasError) {
    return (
      <ErrorState message="We couldn’t load your conversation right now." onRetry={thread.refetch} />
    );
  }

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-[24rem] flex-col space-y-4">
      <PageHeader title="Messages" />
      {members.length > 1 ? (
        <nav aria-label="Conversations" className="-mt-2 flex flex-wrap gap-2">
          {members.map((m) => {
            const isActive = memberKey(m) === memberKey(active);
            return (
              <button
                key={memberKey(m)}
                type="button"
                onClick={() => setSelectedKey(memberKey(m))}
                aria-current={isActive ? 'true' : undefined}
                className={
                  isActive
                    ? 'rounded-full bg-experience-600 px-4 py-1.5 text-sm font-semibold text-white'
                    : 'rounded-full border border-line bg-surface px-4 py-1.5 text-sm text-ink hover:border-experience-500'
                }
              >
                {m.display_name} — {m.role_label}
              </button>
            );
          })}
        </nav>
      ) : (
        <p className="-mt-2 text-sm text-ink-muted">
          Your conversation with {active.display_name} ({active.role_label})
        </p>
      )}
      {thread.isLoading ? (
        <LoadingState label="Loading your conversation…" />
      ) : (
        <MessageThread
          messages={thread.messages}
          myPersonId={personId}
          otherName={active.display_name}
          onSend={async (body) => {
            try {
              await send.mutateAsync(body);
              return true;
            } catch {
              return false;
            }
          }}
          sending={send.isPending}
          sendError={send.isError ? 'send_failed' : null}
        />
      )}
    </div>
  );
}
