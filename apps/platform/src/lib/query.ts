import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { captureError } from './monitor';

/**
 * Canonical server-state layer (P4B). One QueryClient at the root; intentional
 * query-key factories (never ad-hoc strings in components); retries only for
 * plausibly-transient failures — authorization and domain rejections are
 * final answers, not flakiness.
 */

function isTransient(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes('permission') || message.includes('denied') || message.includes('jwt'))
    return false;
  if (message.includes('violates') || message.includes('constraint')) return false;
  return true;
}

export const queryClient = new QueryClient({
  // Operational failure capture (P4H §22): query keys are process metadata
  // (our own key factories — never user content); errors pass through the
  // monitor's structural redaction.
  queryCache: new QueryCache({
    onError: (error, query) => captureError(`query:${String(query.queryKey[0])}`, error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => captureError('mutation', error),
  }),
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => isTransient(error) && failureCount < 2,
    },
    mutations: {
      // Mutations never auto-retry: server idempotency is protection, not
      // permission for duplicate attempts.
      retry: false,
    },
  },
});

/** Query-key factory — participant domain. Invalidate the narrowest key that changed. */
export const participantKeys = {
  all: ['participant'] as const,
  connection: (personId: number) => ['participant', personId, 'connection'] as const,
  supportRequests: (personId: number) => ['participant', personId, 'supportRequests'] as const,
  supportTeam: (personId: number) => ['participant', personId, 'supportTeam'] as const,
  appointments: (personId: number) => ['participant', personId, 'appointments'] as const,
  bookings: (personId: number) => ['participant', personId, 'bookings'] as const,
  notifications: (personId: number) => ['participant', personId, 'notifications'] as const,
  unreadCount: (personId: number) => ['participant', personId, 'notifications', 'unread'] as const,
};

/** Query-key factory — messaging domain (shared by participant + coach surfaces). */
export const messageKeys = {
  all: ['messages'] as const,
  conversations: ['messages', 'conversations'] as const,
  conversation: (conversationId: number) => ['messages', 'conversation', conversationId] as const,
  ensure: (otherPersonId: number | null) => ['messages', 'ensure', otherPersonId] as const,
  unread: (personId: number) => ['messages', 'unread', personId] as const,
};

/** Query-key factory — coach workspace domain. */
export const coachKeys = {
  all: ['coach'] as const,
  openRequests: ['coach', 'openRequests'] as const,
  roster: ['coach', 'roster'] as const,
  todayAppointments: (personId: number) => ['coach', personId, 'todayAppointments'] as const,
  followUps: (personId: number) => ['coach', personId, 'followUps'] as const,
  bookings: (personId: number) => ['coach', personId, 'bookings'] as const,
};

/** Query-key factory — admin command center (P4G). Aggregates + governance surfaces. */
export const adminKeys = {
  all: ['admin'] as const,
  operations: ['admin', 'operations'] as const,
  evidence: ['admin', 'evidence'] as const,
  people: ['admin', 'people'] as const,
  invitations: ['admin', 'invitations'] as const,
  residences: ['admin', 'residences'] as const,
  audit: ['admin', 'audit'] as const,
};

/** Query-key factory — navigator workspace domain (P4E). */
export const navigatorKeys = {
  all: ['navigator'] as const,
  pool: ['navigator', 'pool'] as const,
  roster: ['navigator', 'roster'] as const,
  needs: ['navigator', 'needs'] as const,
  referrals: ['navigator', 'referrals'] as const,
  followUps: (personId: number) => ['navigator', personId, 'followUps'] as const,
};
