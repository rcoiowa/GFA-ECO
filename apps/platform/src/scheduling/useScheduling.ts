import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  acceptBookingProposal,
  cancelBooking,
  counterProposeBookingTimes,
  createBookingRequest,
  rescheduleBooking,
} from '@recoveryos/data-access';
import { coachKeys, participantKeys } from '../lib/query';
import { track } from '../lib/analytics';

/**
 * Scheduling mutations (P4D-2) — thin, honest wrappers over the proven
 * canonical RPCs. The server owns every transition; the client renders the
 * outcome and invalidates. No optimistic confirmations, ever.
 */

export type AcceptOutcome = 'confirmed' | 'times_changed' | 'failed';

function invalidateSchedulingState(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: participantKeys.all });
  void queryClient.invalidateQueries({ queryKey: coachKeys.all });
}

/** Choose-this-time. Idempotent by design: a double tap returns the same session. */
export function useAcceptProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (proposalId: number): Promise<AcceptOutcome> => {
      const result = await acceptBookingProposal(proposalId);
      if (result.ok && (result.code === 'confirmed' || result.code === 'already_confirmed')) {
        track('proposal_accepted');
        return 'confirmed';
      }
      if (
        result.code === 'stale_proposal' ||
        result.code === 'confirmed_other_time' ||
        result.code === 'not_open' ||
        result.code === 'own_proposal'
      ) {
        return 'times_changed';
      }
      return 'failed';
    },
    onSettled: () => invalidateSchedulingState(queryClient),
  });
}

/** "These times don't work — suggest another time." */
export function useCounterPropose() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { bookingRequestId: number; starts: string[] }) => {
      const result = await counterProposeBookingTimes(input.bookingRequestId, input.starts);
      if (!result.ok) throw new Error(String(result.code));
      track('times_countered');
      return result;
    },
    onSettled: () => invalidateSchedulingState(queryClient),
  });
}

/** Coach opens scheduling with several possible times. */
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      participantPersonId: number;
      providerPersonId: number;
      modality?: 'in_person' | 'video' | 'phone' | 'chat';
      note?: string;
      starts: string[];
    }) => {
      track('scheduling_started');
      const result = await createBookingRequest({
        participantPersonId: input.participantPersonId,
        providerPersonId: input.providerPersonId,
        modality: input.modality,
        note: input.note,
        proposedStarts: input.starts,
      });
      if (!result.ok) throw new Error(String(result.code));
      track('times_proposed');
      return result;
    },
    onSettled: () => invalidateSchedulingState(queryClient),
  });
}

/** Cancel session — cancels the negotiation and any confirmed appointment canonically. */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { bookingRequestId: number; reason?: string }) => {
      const result = await cancelBooking(input.bookingRequestId, input.reason);
      if (!result.ok) throw new Error(String(result.code));
      track('session_cancelled');
      return result;
    },
    onSettled: () => invalidateSchedulingState(queryClient),
  });
}

/** Find another time — preserves lineage server-side. */
export function useRescheduleBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { appointmentId: number; starts: string[] }) => {
      const result = await rescheduleBooking(input.appointmentId, input.starts);
      if (!result.ok) throw new Error(String(result.code));
      track('session_rescheduled');
      return result;
    },
    onSettled: () => invalidateSchedulingState(queryClient),
  });
}
