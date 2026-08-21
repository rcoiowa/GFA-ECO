import { useEffect } from 'react';
import { useParams } from 'react-router';
import { ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { useAuth } from '@recoveryos/auth';
import { MessageThread } from '../../messaging/MessageThread';
import {
  useConversationThread,
  useEnsureConversation,
  useSendMessage,
} from '../../messaging/useMessaging';
import { useNavigatorWorkspace } from '../hooks/useNavigatorWorkspace';
import { track } from '../../lib/analytics';

/** One participant conversation, navigation context — never a pretend coaching thread. */
export function NavThreadPage() {
  const { personId: raw } = useParams();
  const participantPersonId = Number(raw);
  const { person } = useAuth();
  const myPersonId = person?.id ?? 0;
  const { roster } = useNavigatorWorkspace();
  const entry = roster.find((r) => r.participant_person_id === participantPersonId);

  const ensure = useEnsureConversation(participantPersonId, participantPersonId > 0, 'navigation');
  const conversationId = ensure.data?.ok ? ensure.data.conversationId : null;
  const thread = useConversationThread(conversationId);
  const send = useSendMessage(conversationId, { role: 'coach', messages: thread.messages });

  useEffect(() => {
    if (conversationId) track('conversation_opened');
  }, [conversationId]);

  if (ensure.isPending) return <LoadingState label="Opening the conversation…" />;
  if (ensure.data && !ensure.data.ok) {
    return <ErrorState message="Messaging is available for your own active people." />;
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
        crumbs={[{ label: 'Messages', to: '/navigator/messages' }]}
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
