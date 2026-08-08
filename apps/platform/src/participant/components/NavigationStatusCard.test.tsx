import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationStatusCard } from './NavigationStatusCard';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  getNavigationNeeds: vi.fn(),
  getNavigationReferrals: vi.fn(),
  confirmMyConnection: vi.fn(),
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@recoveryos/data-access', () => ({
  getNavigationNeeds: mocks.getNavigationNeeds,
  getNavigationReferrals: mocks.getNavigationReferrals,
  confirmMyConnection: mocks.confirmMyConnection,
}));

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NavigationStatusCard />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue({ person: { id: 20 } });
  mocks.confirmMyConnection.mockResolvedValue({ ok: true, code: 'recorded' });
});

describe('NavigationStatusCard — participant navigation visibility', () => {
  it('renders nothing when there is no navigation activity', async () => {
    mocks.getNavigationNeeds.mockResolvedValue([]);
    mocks.getNavigationReferrals.mockResolvedValue([]);
    const { container } = wrap();
    await vi.waitFor(() => expect(mocks.getNavigationNeeds).toHaveBeenCalled());
    expect(container.textContent).toBe('');
  });

  it('speaks the participant’s language — no internal enums, and loop closure in their voice', async () => {
    mocks.getNavigationNeeds.mockResolvedValue([
      {
        id: 1,
        person_id: 20,
        navigation_relationship_id: 5,
        need_category: 'housing',
        status: 'in_progress',
        identified_at: '2026-08-08T10:00:00Z',
        resolved_at: null,
        note: null,
      },
    ]);
    mocks.getNavigationReferrals.mockResolvedValue([
      {
        id: 7,
        person_id: 20,
        navigation_need_id: 1,
        resource_id: null,
        organization_id: null,
        destination_name: 'Hope House',
        referral_type: 'referral',
        status: 'contact_attempted',
        connection_evidence: null,
        attempted_at: '2026-08-08T11:00:00Z',
        connected_at: null,
        created_at: '2026-08-08T10:30:00Z',
      },
    ]);
    wrap();
    expect(await screen.findByText('Housing')).toBeInTheDocument();
    expect(screen.getByText('We’re working on this with you.')).toBeInTheDocument();
    expect(screen.getByText('Hope House')).toBeInTheDocument();
    // Internal enums never render.
    expect(screen.queryByText(/contact_attempted|in_progress|warm_handoff/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Were you able to connect?' }));
    await userEvent.click(screen.getByRole('button', { name: 'Yes, I connected' }));
    expect(mocks.confirmMyConnection).toHaveBeenCalledWith(7, 'yes');
  });

  it('a connected warm handoff reads as the human help it was', async () => {
    mocks.getNavigationNeeds.mockResolvedValue([]);
    mocks.getNavigationReferrals.mockResolvedValue([
      {
        id: 8,
        person_id: 20,
        navigation_need_id: null,
        resource_id: null,
        organization_id: null,
        destination_name: 'New Directions Clinic',
        referral_type: 'warm_handoff',
        status: 'connected',
        connection_evidence: 'participant_report',
        attempted_at: '2026-08-08T11:00:00Z',
        connected_at: '2026-08-08T12:00:00Z',
        created_at: '2026-08-08T10:30:00Z',
      },
    ]);
    wrap();
    expect(
      await screen.findByText('Your navigator helped connect you directly.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Were you able to connect?' })).not.toBeInTheDocument();
  });
});
