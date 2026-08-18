import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import {
  cancelMySupportRequest,
  createSupportRequest,
  getMyBookingStates,
  getMyCoach,
  getMyNotifications,
  getMySupportRequests,
  getMySupportTeam,
  getMyUpcomingAppointments,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@recoveryos/data-access';
import {
  deriveConnectionState,
  type ConnectionState,
  type NotificationRow,
  type SupportRequestType,
} from '@recoveryos/domain';
import { participantKeys } from '../../lib/query';
import { track } from '../../lib/analytics';

/**
 * The participant connection view — one hook that resolves canonical truth
 * into the ConnectionState the UI renders. Parallel queries (no waterfall);
 * a failure in one optional slice degrades that slice, not the whole page.
 * While waiting for a connection, the state refetches gently so "We're finding
 * someone" becomes "You're connected" without a manual refresh (realtime
 * subscription is a next-slice upgrade; refresh semantics are the baseline).
 */
export function useConnection(): {
  state: ConnectionState | null;
  isLoading: boolean;
  hasError: boolean;
  refetch: () => void;
} {
  const { person } = useAuth();
  const personId = person?.id ?? 0;
  const enabled = personId > 0;

  const results = useQueries({
    queries: [
      {
        queryKey: participantKeys.supportRequests(personId),
        queryFn: () => getMySupportRequests(personId),
        enabled,
        refetchInterval: 20_000,
      },
      {
        queryKey: participantKeys.supportTeam(personId),
        queryFn: () => getMySupportTeam(),
        enabled,
        refetchInterval: 20_000,
      },
      {
        queryKey: [...participantKeys.supportTeam(personId), 'primary'],
        queryFn: () => getMyCoach(personId),
        enabled,
      },
      {
        queryKey: participantKeys.bookings(personId),
        queryFn: () => getMyBookingStates(personId),
        enabled,
      },
      {
        queryKey: participantKeys.appointments(personId),
        queryFn: () => getMyUpcomingAppointments(personId),
        enabled,
      },
    ],
  });

  const [requests, team, coach, bookings, appointments] = results;
  const isLoading = enabled && results.some((r) => r.isPending);
  // The headline state needs requests + relationship; bookings/appointments
  // are enhancers whose failure must not blank the page.
  const hasError = Boolean(requests.error && team.error);

  const state =
    !enabled || isLoading || hasError
      ? null
      : deriveConnectionState({
          requests: requests.data ?? [],
          supportTeam: team.data ?? [],
          relationship: coach.data ?? null,
          bookings: bookings.data ?? [],
          appointments: appointments.data ?? [],
        });

  return {
    state,
    isLoading,
    hasError,
    refetch: () => results.forEach((r) => r.refetch()),
  };
}

export function useCreateSupportRequest() {
  const { person } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      requestType: SupportRequestType;
      preferredModality: 'in_person' | 'video' | 'phone' | 'chat';
      focus?: string;
    }) => {
      if (!person) throw new Error('not signed in');
      return createSupportRequest({
        personId: person.id,
        requestType: input.requestType,
        preferredModality: input.preferredModality,
        focus: input.focus,
      });
    },
    onSuccess: () => {
      track('support_request_submitted');
      if (person) {
        void queryClient.invalidateQueries({ queryKey: participantKeys.supportRequests(person.id) });
      }
    },
  });
}

export function useCancelSupportRequest() {
  const { person } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => cancelMySupportRequest(requestId),
    onSuccess: () => {
      track('support_request_cancelled');
      if (person) {
        void queryClient.invalidateQueries({ queryKey: participantKeys.supportRequests(person.id) });
      }
    },
  });
}

export function useNotifications(limit = 20): {
  notifications: NotificationRow[];
  unread: number;
  isLoading: boolean;
  markRead: (id: number) => void;
  markAllRead: () => void;
} {
  const { person } = useAuth();
  const personId = person?.id ?? 0;
  const enabled = personId > 0;
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: participantKeys.notifications(personId),
    queryFn: () => getMyNotifications(personId, limit),
    enabled,
    refetchInterval: 30_000,
  });
  const unread = useQuery({
    queryKey: participantKeys.unreadCount(personId),
    queryFn: () => getUnreadNotificationCount(personId),
    enabled,
    refetchInterval: 30_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: participantKeys.notifications(personId) });
    void queryClient.invalidateQueries({ queryKey: participantKeys.unreadCount(personId) });
  };

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: invalidate,
  });
  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(personId),
    onSuccess: invalidate,
  });

  return {
    notifications: list.data ?? [],
    unread: unread.data ?? 0,
    isLoading: enabled && list.isPending,
    markRead: (id) => markReadMutation.mutate(id),
    markAllRead: () => markAllMutation.mutate(),
  };
}
