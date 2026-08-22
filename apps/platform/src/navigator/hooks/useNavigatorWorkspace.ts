import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import {
  claimSupportRequest,
  createNavigationReferral,
  getMyAssignedFollowUps,
  getMyConversations,
  getMyNavigationParticipants,
  getNavigationNeeds,
  getNavigationReferrals,
  getOpenSupportRequestPool,
  getUnreadMessageCounts,
  identifyNavigationNeed,
  recordNavigationServiceEvent,
  recordReferralOutcome,
  updateNavigationNeedStatus,
} from '@recoveryos/data-access';
import {
  deriveNavigatorAttention,
  isNavigationRequest,
  type FollowUpRow,
  type NavRosterEntry,
  type NavigationNeedRow,
  type NavigationReferralRow,
  type NavigatorAttentionItem,
  type OpenPoolRow,
} from '@recoveryos/domain';
import { coachKeys, messageKeys, navigatorKeys, participantKeys } from '../../lib/query';
import { track } from '../../lib/analytics';

/**
 * Navigator workspace state (P4E) — parallel canonical reads, pure derivations,
 * narrow invalidation. The waiting pool refetches gently; realtime remains an
 * accelerator on a correct polling baseline.
 */
export function useNavigatorWorkspace(): {
  pool: OpenPoolRow[];
  roster: NavRosterEntry[];
  needs: NavigationNeedRow[];
  referrals: NavigationReferralRow[];
  followUps: FollowUpRow[];
  attention: NavigatorAttentionItem[];
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
        queryKey: navigatorKeys.pool,
        queryFn: () => getOpenSupportRequestPool(),
        enabled,
        refetchInterval: 20_000,
      },
      { queryKey: navigatorKeys.roster, queryFn: () => getMyNavigationParticipants(), enabled },
      { queryKey: navigatorKeys.needs, queryFn: () => getNavigationNeeds(), enabled },
      { queryKey: navigatorKeys.referrals, queryFn: () => getNavigationReferrals(), enabled },
      {
        queryKey: navigatorKeys.followUps(personId),
        queryFn: () => getMyAssignedFollowUps(personId),
        enabled,
      },
      {
        queryKey: messageKeys.unread(personId),
        queryFn: () => getUnreadMessageCounts(personId),
        enabled,
        refetchInterval: 20_000,
      },
      { queryKey: messageKeys.conversations, queryFn: () => getMyConversations(), enabled },
    ],
  });

  const [pool, roster, needs, referrals, followUps, unreadMessages, conversations] = results;
  const isLoading = enabled && results.some((r) => r.isPending);
  const hasError = Boolean(pool.error && roster.error);

  const rosterNames = new Map(
    (roster.data ?? []).map((r) => [r.participant_person_id, r.display_name]),
  );

  const unreadCounts = unreadMessages.data ?? new Map<number, number>();
  let unreadTotal = 0;
  unreadCounts.forEach((count) => {
    unreadTotal += count;
  });
  let unreadFrom: string | null = null;
  if (unreadCounts.size === 1) {
    const [conversationId] = [...unreadCounts.keys()];
    const conversation = (conversations.data ?? []).find((c) => c.id === conversationId);
    unreadFrom = conversation ? (rosterNames.get(conversation.participant_person_id) ?? null) : null;
  }

  const attention = deriveNavigatorAttention({
    openPool: pool.data ?? [],
    followUps: followUps.data ?? [],
    needs: needs.data ?? [],
    referrals: referrals.data ?? [],
    rosterNames,
    unreadMessages: { count: unreadTotal, from: unreadFrom },
  });

  return {
    pool: (pool.data ?? []).filter((r) => isNavigationRequest(r.request_type)),
    roster: roster.data ?? [],
    needs: needs.data ?? [],
    referrals: referrals.data ?? [],
    followUps: followUps.data ?? [],
    attention,
    isLoading,
    hasError,
    refetch: () => results.forEach((r) => void r.refetch()),
  };
}

export type NavClaimOutcome = 'connected' | 'race_lost' | 'has_navigator' | 'not_eligible' | 'failed';

/** Connect-with-this-person (navigation). Server routes the domain; server truth wins. */
export function useClaimNavigationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (supportRequestId: number): Promise<NavClaimOutcome> => {
      const result = await claimSupportRequest(supportRequestId);
      if (result.ok && (result.code === 'claimed' || result.code === 'already_yours')) {
        track('navigation_request_claimed');
        track('navigation_relationship_established');
        return 'connected';
      }
      if (result.code === 'already_claimed' || result.code === 'not_open' || result.code === 'not_found')
        return 'race_lost';
      if (result.code === 'participant_has_navigator') return 'has_navigator';
      if (result.code === 'not_eligible') return 'not_eligible';
      return 'failed';
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: navigatorKeys.all });
      void queryClient.invalidateQueries({ queryKey: coachKeys.openRequests });
      void queryClient.invalidateQueries({ queryKey: participantKeys.all });
    },
  });
}

function invalidateNavigation(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: navigatorKeys.needs });
  void queryClient.invalidateQueries({ queryKey: navigatorKeys.referrals });
  void queryClient.invalidateQueries({ queryKey: participantKeys.all });
}

export function useIdentifyNeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { personId: number; category: string; note?: string }) => {
      const result = await identifyNavigationNeed(input);
      if (!result.ok) throw new Error(String(result.code));
      track('need_identified');
      return result;
    },
    onSettled: () => invalidateNavigation(queryClient),
  });
}

export function useUpdateNeedStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { needId: number; status: string }) => {
      const result = await updateNavigationNeedStatus(input.needId, input.status);
      if (!result.ok) throw new Error(String(result.code));
      return result;
    },
    onSettled: () => invalidateNavigation(queryClient),
  });
}

export function useCreateReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      personId: number;
      referralType: 'information' | 'referral' | 'warm_handoff';
      needId?: number | null;
      destinationName: string;
    }) => {
      const result = await createNavigationReferral(input);
      if (!result.ok) throw new Error(String(result.code));
      track(input.referralType === 'warm_handoff' ? 'warm_handoff_recorded' : 'referral_created');
      return result;
    },
    onSettled: () => invalidateNavigation(queryClient),
  });
}

export type OutcomeResult = 'updated' | 'consent_required' | 'failed';

export function useRecordOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      referralId: number;
      status: string;
      evidence?: string;
    }): Promise<OutcomeResult> => {
      const result = await recordReferralOutcome(input);
      if (result.ok) {
        if (input.status === 'connected') track('connection_confirmed');
        if (input.status === 'not_connected') track('connection_not_confirmed');
        return 'updated';
      }
      if (result.code === 'consent_required') return 'consent_required';
      return 'failed';
    },
    onSettled: () => invalidateNavigation(queryClient),
  });
}

export function useRecordNavigationService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      personId: number;
      modality?: string;
      durationMinutes?: number;
      referralId?: number | null;
      dedupeKey?: string;
    }) => {
      const result = await recordNavigationServiceEvent(input);
      if (!result.ok) throw new Error(String(result.code));
      track('navigation_service_event_recorded');
      return result;
    },
    onSettled: () => invalidateNavigation(queryClient),
  });
}
