import { useQuery } from '@tanstack/react-query';
import {
  adminListPeople,
  adminListResidences,
  getAdminEvidenceSummary,
  getAdminOperationsSummary,
  listAuditLog,
  listInvitations,
} from '@recoveryos/data-access';
import { adminKeys } from '../../lib/query';

/**
 * Admin Command Center reads (P4G). Every aggregate is computed in PostgreSQL
 * behind platform-admin-gated definer RPCs — these hooks only fetch and type
 * the results. Route guards are UX; the RPCs and RLS are the boundary, so a
 * `not_authorized` envelope here is a final answer, not a retryable error.
 */

export interface OperationsSummary {
  ok: boolean;
  code?: string;
  open_support_requests: number;
  oldest_open_request_hours: number;
  open_navigation_requests: number;
  overdue_follow_ups: number;
  sessions_today: number;
  open_referral_loops: number;
  unresolved_needs: number;
  residence_applications_waiting: number;
  active_residencies: number;
  unreviewed_incidents: number;
  pending_invitations: number;
}

export interface EvidenceSummary {
  ok: boolean;
  code?: string;
  funnel: {
    requests: number;
    claimed: number;
    still_waiting: number;
    median_minutes_to_claim: number;
    p90_minutes_to_claim: number;
  };
  relationships: {
    coaching_established: number;
    coaching_active: number;
    responded_t1: number;
    two_way_t4a: number;
  };
  navigation: {
    needs: number;
    needs_by_category: Record<string, number>;
    /** P1.6 domain lens (activity-level: identified needs rolled up through the ratified
     *  mapping; 'cross_cutting' carries identification_documents). Optional so the page
     *  degrades gracefully if the frontend deploys ahead of migration 0132. */
    needs_by_domain?: Record<string, number>;
    needs_resolved: number;
    needs_partially_resolved: number;
    needs_unresolved: number;
    referrals: number;
    warm_handoffs: number;
    connected: number;
    participant_declined: number;
    partner_unavailable: number;
  };
  residence: {
    applications: number;
    decisions: Record<string, number>;
    active_residencies: number;
    capacity: number;
    median_length_of_stay_days: number;
  };
  services: {
    people_served: number;
    events: number;
    by_type: Record<string, number>;
    funding_attributed: number;
    funding_unattributed: number;
  };
}

export function useOperationsSummary() {
  return useQuery({
    queryKey: adminKeys.operations,
    queryFn: async () => (await getAdminOperationsSummary()) as unknown as OperationsSummary,
  });
}

export function useEvidenceSummary() {
  return useQuery({
    queryKey: adminKeys.evidence,
    queryFn: async () => (await getAdminEvidenceSummary()) as unknown as EvidenceSummary,
  });
}

export function useAdminPeople() {
  return useQuery({ queryKey: adminKeys.people, queryFn: adminListPeople });
}

export function useAdminInvitations() {
  return useQuery({ queryKey: adminKeys.invitations, queryFn: listInvitations });
}

export function useAdminResidences() {
  return useQuery({ queryKey: adminKeys.residences, queryFn: adminListResidences });
}

export function useAdminAudit() {
  return useQuery({ queryKey: adminKeys.audit, queryFn: () => listAuditLog(100) });
}
