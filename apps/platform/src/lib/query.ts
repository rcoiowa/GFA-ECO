import { QueryClient } from '@tanstack/react-query';

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
