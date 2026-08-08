import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import {
  ensureRelationshipConversation,
  getConversationMessages,
  getMyConversations,
  getUnreadMessageCounts,
  markConversationRead,
  sendConversationMessage,
  subscribeToConversation,
} from '@recoveryos/data-access';
import type { ConversationRow, MessageRow } from '@recoveryos/domain';
import { messageKeys, participantKeys } from '../lib/query';
import { track } from '../lib/analytics';

/**
 * Shared messaging state (P4D-1) — one canonical set of hooks used by both the
 * participant and coach surfaces; only presentation differs by role. Realtime
 * is a doorbell that triggers refetch through the canonical read path; a 15s
 * polling heartbeat remains the fallback whenever the channel can't connect.
 */

/**
 * Server-authoritative conversation resolution. `not_authorized` is a final
 * answer (no relationship), not flakiness — it renders as a gentle explanation,
 * never a retry loop.
 */
export function useEnsureConversation(
  otherPersonId: number | null,
  enabled = true,
  context?: 'coaching' | 'navigation' | 'residence',
) {
  const { person } = useAuth();
  return useQuery({
    queryKey: [...messageKeys.ensure(otherPersonId), context ?? 'default'],
    queryFn: () => ensureRelationshipConversation(otherPersonId ?? undefined, context),
    enabled: enabled && Boolean(person),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** The caller's conversations where they are personally one of the two people. */
export function useMyConversations(): {
  conversations: ConversationRow[];
  unreadByConversation: Map<number, number>;
  isLoading: boolean;
} {
  const { person } = useAuth();
  const personId = person?.id ?? 0;
  const enabled = personId > 0;
  const conversations = useQuery({
    queryKey: messageKeys.conversations,
    queryFn: () => getMyConversations(),
    enabled,
  });
  const unread = useQuery({
    queryKey: messageKeys.unread(personId),
    queryFn: () => getUnreadMessageCounts(personId),
    enabled,
    refetchInterval: 20_000,
  });
  return {
    // Admin metadata visibility exists at the RLS layer; this surface is
    // strictly "my own threads", so filter to conversations I belong to.
    conversations: (conversations.data ?? []).filter(
      (c) => c.participant_person_id === personId || c.coach_person_id === personId,
    ),
    unreadByConversation: unread.data ?? new Map(),
    isLoading: enabled && conversations.isPending,
  };
}

export function useConversationThread(conversationId: number | null): {
  messages: MessageRow[];
  isLoading: boolean;
  hasError: boolean;
  refetch: () => void;
} {
  const { person } = useAuth();
  const personId = person?.id ?? 0;
  const queryClient = useQueryClient();
  const enabled = Boolean(conversationId) && personId > 0;

  const thread = useQuery({
    queryKey: messageKeys.conversation(conversationId ?? 0),
    queryFn: () => getConversationMessages(conversationId as number),
    enabled,
    refetchInterval: 15_000,
  });

  // Realtime doorbell → invalidate canonical queries. Never a second store.
  useEffect(() => {
    if (!enabled || !conversationId) return;
    return subscribeToConversation(conversationId, () => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.conversation(conversationId) });
      void queryClient.invalidateQueries({ queryKey: messageKeys.unread(personId) });
    });
  }, [enabled, conversationId, personId, queryClient]);

  // The thread is PRESENTED here, so incoming messages become read — this and
  // only this marks read; background fetches never do. Server clears the
  // thread's message notifications in the same RPC.
  const hasUnseen = (thread.data ?? []).some(
    (m) => m.sender_person_id !== personId && m.read_at === null,
  );
  const marking = useRef(false);
  useEffect(() => {
    if (!enabled || !conversationId || !hasUnseen || marking.current) return;
    marking.current = true;
    void markConversationRead(conversationId).finally(() => {
      marking.current = false;
      void queryClient.invalidateQueries({ queryKey: messageKeys.conversation(conversationId) });
      void queryClient.invalidateQueries({ queryKey: messageKeys.unread(personId) });
      void queryClient.invalidateQueries({ queryKey: participantKeys.notifications(personId) });
      void queryClient.invalidateQueries({ queryKey: participantKeys.unreadCount(personId) });
    });
  }, [enabled, conversationId, hasUnseen, personId, queryClient]);

  return {
    messages: thread.data ?? [],
    isLoading: enabled && thread.isPending,
    hasError: Boolean(thread.error),
    refetch: () => void thread.refetch(),
  };
}

/**
 * Send through the canonical RPC. The component owns the draft — it clears the
 * composer only when this resolves, so a failed send never loses what was
 * written. `role` + current thread feed process-only instrumentation (canonical
 * timestamps in the database remain the measurement authority).
 */
export function useSendMessage(
  conversationId: number | null,
  context: { role: 'participant' | 'coach'; messages: MessageRow[] },
) {
  const { person } = useAuth();
  const personId = person?.id ?? 0;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      track('message_send_attempted');
      if (!conversationId) throw new Error('no_conversation');
      const result = await sendConversationMessage(conversationId, body);
      if (!result.ok) throw new Error(String(result.code ?? 'failed'));
      return result;
    },
    onSuccess: () => {
      track('message_sent');
      const mineBefore = context.messages.some((m) => m.sender_person_id === personId);
      const theirsBefore = context.messages.some((m) => m.sender_person_id !== personId);
      if (context.role === 'coach' && !mineBefore) track('first_human_response_observed');
      if (!mineBefore && theirsBefore) track('first_two_way_exchange_observed');
      if (conversationId) {
        void queryClient.invalidateQueries({ queryKey: messageKeys.conversation(conversationId) });
      }
    },
  });
}
