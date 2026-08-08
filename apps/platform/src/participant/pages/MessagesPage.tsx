import { useEffect } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { getMySupportTeam } from '@recoveryos/data-access';
import { MessageThread } from '../../messaging/MessageThread';
import {
  useConversationThread,
  useEnsureConversation,
  useSendMessage,
} from '../../messaging/useMessaging';
import { participantKeys } from '../../lib/query';
import { track } from '../../lib/analytics';

/**
 * The participant's private conversation with their coach (P4D-1). One thread,
 * one relationship — the server resolves which. If there's no active support
 * relationship yet, this explains gently and points at Connect instead of
 * showing a dead surface.
 */
export function MessagesPage() {
  const { person } = useAuth();
  const personId = person?.id ?? 0;

  const team = useQuery({
    queryKey: participantKeys.supportTeam(personId),
    queryFn: () => getMySupportTeam(),
    enabled: personId > 0,
  });
  const coach = (team.data ?? []).find((m) => m.is_primary) ?? (team.data ?? [])[0];

  const ensure = useEnsureConversation(null, Boolean(coach));
  const conversationId = ensure.data?.ok ? ensure.data.conversationId : null;
  const thread = useConversationThread(conversationId);
  const send = useSendMessage(conversationId, { role: 'participant', messages: thread.messages });

  useEffect(() => {
    track('messages_page_viewed');
  }, []);
  useEffect(() => {
    if (conversationId) track('conversation_opened');
  }, [conversationId]);

  if (team.isPending || (coach && ensure.isPending)) {
    return <LoadingState label="Opening your messages…" />;
  }

  if (!coach || (ensure.data && !ensure.data.ok)) {
    return (
      <div className="space-y-4">
        <PageHeader title="Messages" />
        <EmptyState
          title="Messaging opens once you’re connected"
          message="When you’re connected with a coach, this is where you’ll talk."
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
      <ErrorState
        message="We couldn’t load your conversation right now."
        onRetry={thread.refetch}
      />
    );
  }

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-[24rem] flex-col space-y-4">
      <PageHeader title="Messages" lede={`Your conversation with ${coach.display_name} (${coach.role_label})`} />
      {thread.isLoading ? (
        <LoadingState label="Loading your conversation…" />
      ) : (
        <MessageThread
          messages={thread.messages}
          myPersonId={personId}
          otherName={coach.display_name}
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
