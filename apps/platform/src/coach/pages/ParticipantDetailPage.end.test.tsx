import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ParticipantDetailPage } from './ParticipantDetailPage';

/**
 * P0.5-B regression: relationships were one-way doors — creatable, never
 * endable. Pins: the coach can end a connection with a reason through the
 * lifecycle RPC (history preserved server-side), and a refusal surfaces
 * instead of silently pretending.
 */

const mocks = vi.hoisted(() => ({
  useCoachWorkspace: vi.fn(),
  useCreateFollowUp: vi.fn(),
  useCompleteFollowUp: vi.fn(),
  endCoachingRelationship: vi.fn(),
}));
vi.mock('../hooks/useCoachWorkspace', () => ({
  useCoachWorkspace: mocks.useCoachWorkspace,
  useCreateFollowUp: mocks.useCreateFollowUp,
  useCompleteFollowUp: mocks.useCompleteFollowUp,
}));
vi.mock('@recoveryos/data-access', () => ({
  endCoachingRelationship: mocks.endCoachingRelationship,
}));
vi.mock('../components/SchedulingCard', () => ({ SchedulingCard: () => null }));
vi.mock('../components/SessionRow', () => ({ SessionRow: () => null }));

const entry = {
  relationship_id: 42,
  participant_person_id: 11,
  display_name: 'Jordan R.',
  pronouns: null,
  relationship_type: 'coach',
  is_primary: true,
  started_at: '2026-08-01',
  origin_request_type: 'recovery_coach',
  origin_focus: null,
};

const wrap = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/coach/participants/11']}>
        <Routes>
          <Route path="/coach/participants/:personId" element={<ParticipantDetailPage />} />
          <Route path="/coach/participants" element={<p>roster page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useCoachWorkspace.mockReturnValue({
    roster: [entry],
    todaySessions: [],
    followUps: [],
    isLoading: false,
    hasError: false,
    refetch: vi.fn(),
  });
  mocks.useCreateFollowUp.mockReturnValue({ mutateAsync: vi.fn(), isError: false, isPending: false });
  mocks.useCompleteFollowUp.mockReturnValue({ mutate: vi.fn() });
});

describe('ParticipantDetailPage — ending a connection', () => {
  it('ends the relationship with a reason through the lifecycle RPC', async () => {
    mocks.endCoachingRelationship.mockResolvedValue({ ok: true, code: 'ended' });
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /end this coaching connection/i }));
    expect(screen.getByText(/will be told the connection ended/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'moving out of state' } });
    fireEvent.click(screen.getByRole('button', { name: 'End the connection' }));
    await waitFor(() =>
      expect(mocks.endCoachingRelationship).toHaveBeenCalledWith({
        relationshipId: 42,
        reason: 'moving out of state',
      }),
    );
    expect(await screen.findByText('roster page')).toBeInTheDocument();
  });

  it('surfaces a refusal instead of navigating away', async () => {
    mocks.endCoachingRelationship.mockResolvedValue({
      ok: false,
      code: 'not_authorized',
      message: 'Only the coach on this connection can end it.',
    });
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /end this coaching connection/i }));
    fireEvent.click(screen.getByRole('button', { name: 'End the connection' }));
    expect(
      await screen.findByText('Only the coach on this connection can end it.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('roster page')).not.toBeInTheDocument();
  });
});
