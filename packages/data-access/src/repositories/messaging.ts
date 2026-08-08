import { getSupabase } from '../client';
import type { RpcEnvelope } from './coachWorkspace';

/**
 * Messaging data access (P4D-1). Reads are membership-scoped by RLS; every
 * write goes through a SECURITY DEFINER RPC (0109) — there is no direct INSERT
 * or UPDATE path on messages at all. Sender identity, timestamps, and the
 * active-relationship requirement are all pinned server-side.
 */

export interface EnsureConversationResult {
  ok: boolean;
  code: 'ready' | 'not_authorized' | 'no_person' | string;
  conversationId: number | null;
}

/**
 * Server-authoritative, idempotent conversation resolution for an active
 * coaching relationship. Participants may omit the counterpart (their primary
 * active coach is implied); coaches must name which participant.
 */
export async function ensureRelationshipConversation(
  otherPersonId?: number,
): Promise<EnsureConversationResult> {
  const { data, error } = await getSupabase().rpc('ensure_relationship_conversation', {
    p_other_person_id: otherPersonId ?? null,
  });
  if (error) return { ok: false, code: 'rpc_error', conversationId: null };
  const result = (data ?? {}) as { ok?: boolean; code?: string; conversation_id?: number };
  return {
    ok: Boolean(result.ok),
    code: result.code ?? 'unknown',
    conversationId: result.conversation_id ?? null,
  };
}

/** Send through the canonical RPC. Trim/empty/length rules live server-side too. */
export async function sendConversationMessage(
  conversationId: number,
  body: string,
): Promise<RpcEnvelope> {
  const { data, error } = await getSupabase().rpc('send_message', {
    p_conversation_id: conversationId,
    p_body: body,
  });
  if (error) return { ok: false, code: 'rpc_error' };
  return (data as RpcEnvelope) ?? { ok: false, code: 'empty' };
}

/**
 * Recipient-side read marking, called when a thread is actually presented —
 * never from background fetches. Also clears this thread's message
 * notifications server-side.
 */
export async function markConversationRead(conversationId: number): Promise<RpcEnvelope> {
  const { data, error } = await getSupabase().rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });
  if (error) return { ok: false, code: 'rpc_error' };
  return (data as RpcEnvelope) ?? { ok: false, code: 'empty' };
}

/**
 * Unread incoming per conversation for the caller. RLS already narrows rows to
 * the caller's conversations; the neq() narrows to messages they received.
 */
export async function getUnreadMessageCounts(myPersonId: number): Promise<Map<number, number>> {
  const { data, error } = await getSupabase()
    .from('messages')
    .select('conversation_id')
    .neq('sender_person_id', myPersonId)
    .is('read_at', null);
  if (error) throw error;
  const counts = new Map<number, number>();
  for (const row of (data ?? []) as Array<{ conversation_id: number }>) {
    counts.set(row.conversation_id, (counts.get(row.conversation_id) ?? 0) + 1);
  }
  return counts;
}

/**
 * Realtime subscription for one conversation's messages (INSERT + read-state
 * UPDATE). The event is only a doorbell — the caller refetches through the
 * canonical read path; no second message store is built from the socket.
 * RLS (member-only SELECT) gates which rows the server will ever deliver.
 * Returns an unsubscribe function; polling remains the documented fallback
 * when the channel cannot connect.
 */
export function subscribeToConversation(conversationId: number, onChange: () => void): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`recoveryos-messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'recoveryos',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Realtime doorbell for the caller's in-app notifications (recipient-scoped by RLS). */
export function subscribeToMyNotifications(personId: number, onChange: () => void): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`recoveryos-notifications-${personId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'recoveryos',
        table: 'notifications',
        filter: `recipient_person_id=eq.${personId}`,
      },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
