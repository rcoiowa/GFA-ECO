import { useEffect } from 'react';
import { useParams } from 'react-router';
import { ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { MessageThread } from '../../messaging/MessageThread';
import {
  useConversationThread,
  useEnsureConversation,
  useSendMessage,
} from '../../messaging/useMessaging';
import { useCoachWorkspace } from '../hooks/useCoachWorkspace';
import { useAuth } from '@recoveryos/auth';
import { track } from '../../lib/analytics';

/** One participant conversation, coach side (P4D-1). */
export function CoachThreadPage() {
  const { personId: raw } = useParams();
  const participantPersonId = Number(raw);
  const { person } = useAuth();
  const myPersonId = person?.id ?? 0;
  const { roster } = useCoachWorkspace();
  const entry = roster.find((r) => r.participant_person_id === participantPersonId);

  const ensure = useEnsureConversation(participantPersonId, participantPersonId > 0);
  const conversationId = ensure.data?.ok ? ensure.data.conversationId : null;
  const thread = useConversationThread(conversationId);
  const send = useSendMessage(conversationId, { role: 'coach', messages: thread.messages });

  useEffect(() => {
    if (conversationId) track('conversation_opened');
  }, [conversationId]);

  if (ensure.isPending) return <LoadingState label="Opening the conversation…" />;
  if (ensure.data && !ensure.data.ok) {
    return (
      <ErrorState message="Messaging is available for your own active participants." />
    );
  }
  if (thread.hasError) {
    return (
      <ErrorState message="We couldn’t load this conversation right now." onRetry={thread.refetch} />
    );
  }

  const name = entry?.display_name ?? 'your participant';
  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[24rem] flex-col space-y-4">
      <PageHeader
        title={`Messages — ${entry?.display_name ?? 'Participant'}`}
        crumbs={[{ label: 'Messages', to: '/coach/messages' }]}
      />
      {thread.isLoading ? (
        <LoadingState label="Loading the conversation…" />
      ) : (
        <MessageThread
          messages={thread.messages}
          myPersonId={myPersonId}
          otherName={name}
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
