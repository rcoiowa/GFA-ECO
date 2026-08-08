import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { OpenPoolRow } from '@recoveryos/domain';
import { RequestsPage } from './RequestsPage';

const mocks = vi.hoisted(() => ({
  useCoachWorkspace: vi.fn(),
  useClaimRequest: vi.fn(),
}));
vi.mock('../hooks/useCoachWorkspace', () => ({
  useCoachWorkspace: mocks.useCoachWorkspace,
  useClaimRequest: mocks.useClaimRequest,
}));
const navigate = vi.fn();
vi.mock('react-router', async (orig) => ({
  ...(await orig<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));

// Since 0112 the pool projection carries NO participant free text at all —
// the OpenPoolRow type has no `focus` field, so pre-claim disclosure is
// impossible at the type level, not merely unrendered.
const row: OpenPoolRow = {
  support_request_id: 1,
  participant_person_id: 101,
  participant_name: 'Casey',
  request_type: 'recovery_coach',
  preferred_modality: 'video',
  created_at: '2026-08-08T10:00:00Z',
};

function setup(pool: OpenPoolRow[], outcome: string = 'connected') {
  mocks.useCoachWorkspace.mockReturnValue({
    pool,
    roster: [],
    todaySessions: [],
    followUps: [],
    attention: [],
    isLoading: false,
    hasError: false,
    refetch: vi.fn(),
  });
  mocks.useClaimRequest.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(outcome),
    isPending: false,
  });
}

const wrap = () => render(<MemoryRouter><RequestsPage /></MemoryRouter>);

beforeEach(() => vi.clearAllMocks());

describe('RequestsPage — progressive disclosure', () => {
  it('shows only decision-necessary fields (the projection has no free text at all)', () => {
    setup([row]);
    wrap();
    expect(screen.getByText('Casey')).toBeInTheDocument();
    expect(screen.getByText('Talk with a recovery coach')).toBeInTheDocument();
    expect(screen.getByText(/Prefers video · waiting/)).toBeInTheDocument();
  });

  it('navigation requests are the Navigator Workspace’s, not the coach pool’s', () => {
    setup([row, { ...row, support_request_id: 2, request_type: 'navigation', participant_name: 'Nav Person' }]);
    wrap();
    expect(screen.getByText('Casey')).toBeInTheDocument();
    expect(screen.queryByText('Nav Person')).not.toBeInTheDocument();
  });

  it('no database vocabulary anywhere', () => {
    setup([row]);
    wrap();
    expect(screen.queryByText(/claim/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unassigned/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ticket/i)).not.toBeInTheDocument();
  });

  it('calm empty state', () => {
    setup([]);
    wrap();
    expect(screen.getByText('No one is waiting right now')).toBeInTheDocument();
  });
});

describe('RequestsPage — connect outcomes', () => {
  it('winner routes to the new participant', async () => {
    setup([row], 'connected');
    wrap();
    await userEvent.click(screen.getByRole('button', { name: 'Connect with this person' }));
    expect(navigate).toHaveBeenCalledWith('/coach/participants/101');
  });

  it('race loser gets a graceful, humane explanation', async () => {
    setup([row], 'race_lost');
    wrap();
    await userEvent.click(screen.getByRole('button', { name: 'Connect with this person' }));
    expect(
      await screen.findByText(/Someone else just connected with this person/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/409/)).not.toBeInTheDocument();
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('failure copy is humane and technical detail is absent', async () => {
    setup([row], 'failed');
    wrap();
    await userEvent.click(screen.getByRole('button', { name: 'Connect with this person' }));
    expect(await screen.findByText(/We couldn’t complete that connection/)).toBeInTheDocument();
  });
});
