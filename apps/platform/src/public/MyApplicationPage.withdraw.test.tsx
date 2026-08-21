import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MyApplicationPage } from './MyApplicationPage';

/**
 * P0.5-A regression: withdraw_my_application was a deployed RPC with no UI.
 * Pins: an open application offers withdrawal behind a confirm step, the RPC
 * wrapper is called, and terminal applications offer nothing.
 */

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  getMyLatestApplication: vi.fn(),
  getMyResidencyAt: vi.fn(),
  withdrawMyApplication: vi.fn(),
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@recoveryos/data-access', () => ({
  getMyLatestApplication: mocks.getMyLatestApplication,
  getMyResidencyAt: mocks.getMyResidencyAt,
  withdrawMyApplication: mocks.withdrawMyApplication,
}));

const application = (status: string) => ({
  id: 3,
  person_id: 10,
  residence_id: 1,
  status,
  submitted_at: new Date().toISOString(),
  residence: { id: 1, name: 'Grace House' },
});

const wrap = () =>
  render(
    <MemoryRouter>
      <MyApplicationPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue({ person: { id: 10 } });
  mocks.getMyResidencyAt.mockResolvedValue(null);
});

describe('MyApplicationPage withdraw', () => {
  it('offers withdrawal on an open application, behind a confirm step', async () => {
    mocks.getMyLatestApplication.mockResolvedValue(application('submitted'));
    mocks.withdrawMyApplication.mockResolvedValue(undefined);
    wrap();
    fireEvent.click(await screen.findByRole('button', { name: /withdraw my application/i }));
    expect(screen.getByText(/the door stays open/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /yes, withdraw it/i }));
    await waitFor(() => expect(mocks.withdrawMyApplication).toHaveBeenCalledWith(3));
    expect(await screen.findByText(/this application was withdrawn/i)).toBeInTheDocument();
  });

  it('offers no withdrawal on a decided application', async () => {
    mocks.getMyLatestApplication.mockResolvedValue(application('declined'));
    wrap();
    expect(await screen.findByText(/right fit this time/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /withdraw/i })).not.toBeInTheDocument();
  });

  it('surfaces a server refusal instead of lying about the state', async () => {
    mocks.getMyLatestApplication.mockResolvedValue(application('in_review'));
    mocks.withdrawMyApplication.mockRejectedValue(new Error('not_withdrawable'));
    wrap();
    fireEvent.click(await screen.findByRole('button', { name: /withdraw my application/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, withdraw it/i }));
    expect(await screen.findByText('not_withdrawable')).toBeInTheDocument();
  });
});
