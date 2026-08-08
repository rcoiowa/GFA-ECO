import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import {
  claimSupportRequest,
  completeFollowUp,
  createFollowUp,
  getCoachUpcomingAppointments,
  getMyAssignedFollowUps,
  getMyParticipantsRoster,
  getOpenSupportRequestPool,
} from '@recoveryos/data-access';
import {
  deriveCoachAttention,
  todaysAppointments,
  type CanonicalAppointmentRow,
  type CoachAttentionItem,
  type CoachRosterEntry,
  type FollowUpRow,
  type OpenPoolRow,
} from '@recoveryos/domain';
import { coachKeys, participantKeys } from '../../lib/query';
import { track } from '../../lib/analytics';

/**
 * Coach workspace state — parallel canonical reads, pure derivations, narrow
 * invalidation. The open pool refetches gently (20s) so waiting people appear
 * without manual refresh (realtime remains the documented next upgrade).
 */
export function useCoachWorkspace(): {
  pool: OpenPoolRow[];
  roster: CoachRosterEntry[];
  todaySessions: CanonicalAppointmentRow[];
  followUps: FollowUpRow[];
  attention: CoachAttentionItem[];
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
        queryKey: coachKeys.openRequests,
        queryFn: () => getOpenSupportRequestPool(),
        enabled,
        refetchInterval: 20_000,
      },
      { queryKey: coachKeys.roster, queryFn: () => getMyParticipantsRoster(), enabled },
      {
        queryKey: coachKeys.todayAppointments(personId),
        queryFn: () => getCoachUpcomingAppointments(personId),
        enabled,
      },
      {
        queryKey: coachKeys.followUps(personId),
        queryFn: () => getMyAssignedFollowUps(personId),
        enabled,
      },
    ],
  });

  const [pool, roster, appointments, followUps] = results;
  const isLoading = enabled && results.some((r) => r.isPending);
  const hasError = Boolean(pool.error && roster.error);

  const todaySessions = todaysAppointments(appointments.data ?? []);
  const rosterNames = new Map(
    (roster.data ?? []).map((r) => [r.participant_person_id, r.display_name]),
  );
  const attention = deriveCoachAttention({
    todayAppointments: todaySessions,
    openPool: pool.data ?? [],
    followUps: followUps.data ?? [],
    rosterNames,
  });

  return {
    pool: pool.data ?? [],
    roster: roster.data ?? [],
    todaySessions,
    followUps: followUps.data ?? [],
    attention,
    isLoading,
    hasError,
    refetch: () => results.forEach((r) => r.refetch()),
  };
}

export type ClaimOutcome = 'connected' | 'race_lost' | 'has_coach' | 'failed';

/** Connect-with-this-person mutation. The RPC owns concurrency; server truth wins. */
export function useClaimRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (supportRequestId: number): Promise<ClaimOutcome> => {
      track('support_request_claim_attempted');
      const result = await claimSupportRequest(supportRequestId);
      if (result.ok && (result.code === 'claimed' || result.code === 'already_yours')) {
        track('support_request_claimed');
        track('support_relationship_established');
        return 'connected';
      }
      if (result.code === 'already_claimed' || result.code === 'not_open' || result.code === 'not_found')
        return 'race_lost';
      if (result.code === 'participant_has_coach') return 'has_coach';
      return 'failed';
    },
    onSettled: () => {
      // Server truth wins for everyone: pool, roster, and any participant-side state.
      void queryClient.invalidateQueries({ queryKey: coachKeys.openRequests });
      void queryClient.invalidateQueries({ queryKey: coachKeys.roster });
      void queryClient.invalidateQueries({ queryKey: participantKeys.all });
    },
  });
}

export function useCompleteFollowUp() {
  const { person } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (followUpId: number) => {
      const result = await completeFollowUp(followUpId);
      if (!result.ok) throw new Error(result.code);
      track('follow_up_completed');
      return result;
    },
    onSettled: () => {
      if (person) void queryClient.invalidateQueries({ queryKey: coachKeys.followUps(person.id) });
    },
  });
}

export function useCreateFollowUp() {
  const { person } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { personId: number; dueAt: string; note?: string }) => {
      const result = await createFollowUp(input);
      if (!result.ok) throw new Error(result.code);
      return result;
    },
    onSettled: () => {
      if (person) void queryClient.invalidateQueries({ queryKey: coachKeys.followUps(person.id) });
    },
  });
}
