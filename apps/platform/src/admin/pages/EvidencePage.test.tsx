import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { EvidencePage } from './EvidencePage';

/**
 * Evidence-integrity regression pins (P0-4, 2026-08-21):
 * 1. The coaching-relationships card is badged OUTPUT — its rows are engagement
 *    signals (relationship records, message existence), never outcomes.
 * 2. Funding-attribution rows stay off the page while no workflow writes
 *    service_events.funding_source_id — a structural 0/N is not evidence.
 */

const mocks = vi.hoisted(() => ({ useEvidenceSummary: vi.fn() }));
vi.mock('../hooks/useAdminData', () => ({ useEvidenceSummary: mocks.useEvidenceSummary }));
vi.mock('../../lib/analytics', () => ({ track: vi.fn() }));

const data = {
  ok: true,
  funnel: {
    requests: 10,
    claimed: 8,
    still_waiting: 2,
    median_minutes_to_claim: 30,
    p90_minutes_to_claim: 120,
  },
  relationships: { coaching_established: 6, coaching_active: 4, responded_t1: 5, two_way_t4a: 3 },
  navigation: {
    needs: 7,
    needs_by_category: { housing: 3 },
    needs_by_domain: { housing: 3, health: 2, cross_cutting: 1, financial_stability: 1 },
    needs_resolved: 2,
    needs_partially_resolved: 1,
    needs_unresolved: 4,
    referrals: 5,
    warm_handoffs: 2,
    connected: 1,
    participant_declined: 0,
    partner_unavailable: 1,
  },
  residence: {
    applications: 3,
    decisions: { approved: 2 },
    active_residencies: 2,
    capacity: 8,
    median_length_of_stay_days: 40,
  },
  services: {
    people_served: 9,
    events: 15,
    by_type: { 'Recovery coaching session': 6 },
    funding_attributed: 0,
    funding_unattributed: 15,
  },
};

describe('EvidencePage evidence integrity', () => {
  it('badges coaching relationships as OUTPUT, never OUTCOME', () => {
    mocks.useEvidenceSummary.mockReturnValue({ data, isLoading: false, isError: false });
    render(<EvidencePage />);
    const header = screen.getByText('Coaching relationships').parentElement!;
    expect(within(header).getByText('output')).toBeInTheDocument();
    expect(within(header).queryByText('outcome')).not.toBeInTheDocument();
  });

  it('does not publish the structurally-zero funding split, and says why', () => {
    mocks.useEvidenceSummary.mockReturnValue({ data, isLoading: false, isError: false });
    render(<EvidencePage />);
    expect(screen.queryByText(/with a funding source recorded/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not yet attributed to funding/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/funding attribution is not yet recorded by any workflow/i),
    ).toBeInTheDocument();
  });

  it('keeps the navigation outcome badge (confirmed connections are real outcomes)', () => {
    mocks.useEvidenceSummary.mockReturnValue({ data, isLoading: false, isError: false });
    render(<EvidencePage />);
    const header = screen.getByText('Navigation').parentElement!;
    expect(within(header).getByText('outcome')).toBeInTheDocument();
  });

  it('shows the domain lens beside categories, labeled activity, with human labels (P1.6)', () => {
    mocks.useEvidenceSummary.mockReturnValue({ data, isLoading: false, isError: false });
    render(<EvidencePage />);
    // The lens is explicitly ladder-classified and additive — categories stay too.
    expect(screen.getByText('Needs by domain (activity)')).toBeInTheDocument();
    expect(screen.getByText('Needs by category')).toBeInTheDocument();
    expect(screen.getByText(/Financial Stability & Basic Needs · 1/)).toBeInTheDocument();
    expect(screen.getByText(/Cross-cutting · 1/)).toBeInTheDocument();
    // Raw machine keys never render.
    expect(screen.queryByText(/financial_stability/)).not.toBeInTheDocument();
  });

  it('degrades gracefully when the summary predates the domain lens', () => {
    const { needs_by_domain: _omit, ...navigationLegacy } = data.navigation;
    mocks.useEvidenceSummary.mockReturnValue({
      data: { ...data, navigation: navigationLegacy },
      isLoading: false,
      isError: false,
    });
    render(<EvidencePage />);
    expect(screen.queryByText('Needs by domain (activity)')).not.toBeInTheDocument();
    expect(screen.getByText('Needs by category')).toBeInTheDocument();
  });
});
