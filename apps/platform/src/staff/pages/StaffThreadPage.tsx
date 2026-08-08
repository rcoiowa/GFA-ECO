import { useEffect } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { useAuth } from '@recoveryos/auth';
import { getSupabase } from '@recoveryos/data-access';
import { MessageThread } from '../../messaging/MessageThread';
import {
  useConversationThread,
  useEnsureConversation,
  useSendMessage,
} from '../../messaging/useMessaging';
import { track } from '../../lib/analytics';

/** One resident conversation, residence-support context (P4F). */
export function StaffThreadPage() {
  const { personId: raw } = useParams();
  const residentPersonId = Number(raw);
  const { person } = useAuth();
  const myPersonId = person?.id ?? 0;

  const name = useQuery({
    queryKey: ['staff', 'residentName', residentPersonId],
    queryFn: async () => {
      const { data } = await getSupabase()
        .from('people')
        .select('first_name, last_name, preferred_name')
        .eq('id', residentPersonId)
        .maybeSingle();
      return (
        (data?.preferred_name as string | null)?.trim() ||
        `${data?.first_name ?? ''} ${data?.last_name ?? ''}`.trim() ||
        'Resident'
      );
    },
    enabled: residentPersonId > 0,
  });

  const ensure = useEnsureConversation(residentPersonId, residentPersonId > 0, 'residence');
  const conversationId = ensure.data?.ok ? ensure.data.conversationId : null;
  const thread = useConversationThread(conversationId);
  const send = useSendMessage(conversationId, { role: 'coach', messages: thread.messages });

  useEffect(() => {
    if (conversationId) track('conversation_opened');
  }, [conversationId]);

  if (ensure.isPending) return <LoadingState label="Opening the conversation…" />;
  if (ensure.data && !ensure.data.ok) {
    return (
      <ErrorState message="Messaging is available for residents you’re designated to support." />
    );
  }
  if (thread.hasError) {
    return (
      <ErrorState message="We couldn’t load this conversation right now." onRetry={thread.refetch} />
    );
  }

  const displayName = name.data ?? 'Resident';
  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[24rem] flex-col space-y-4">
      <PageHeader
        title={`Messages — ${displayName}`}
        crumbs={[{ label: 'Messages', to: '/staff/messages' }]}
      />
      {thread.isLoading ? (
        <LoadingState label="Loading the conversation…" />
      ) : (
        <MessageThread
          messages={thread.messages}
          myPersonId={myPersonId}
          otherName={displayName}
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
