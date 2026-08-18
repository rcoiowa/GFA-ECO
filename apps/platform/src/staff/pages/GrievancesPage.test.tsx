import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { Grievance } from '@recoveryos/domain';
import { GrievancesPage } from './GrievancesPage';

/**
 * Regression guard for launch blocker #4 (grievance dead-end): residents
 * could file a grievance but no staff surface ever showed it — the durable
 * fix is this queue. These tests pin that filings are visible, that
 * disposition goes through the server RPC (including its conflict-of-
 * interest refusal), and that the empty state explains manager-scoped
 * visibility instead of implying "nothing was ever filed".
 */
const mocks = vi.hoisted(() => ({
  useStaff: vi.fn(),
  listResidenceGrievances: vi.fn(),
  resolveGrievance: vi.fn(),
}));
vi.mock('../staffContext', () => ({ useStaff: mocks.useStaff }));
vi.mock('@recoveryos/data-access', () => ({
  listResidenceGrievances: mocks.listResidenceGrievances,
  resolveGrievance: mocks.resolveGrievance,
}));

const residence = { id: 7, name: 'Grace House' };

const grievance = (partial: Partial<Grievance> & { id: number }): Grievance => ({
  residence_id: 7,
  filed_by_person_id: 30,
  summary: 'The hot water has been out for three days.',
  status: 'open',
  filed_at: '2026-08-10T12:00:00Z',
  resolved_at: null,
  resolved_by_person_id: null,
  ...partial,
});

const wrap = () =>
  render(
    <MemoryRouter initialEntries={['/staff/grievances']}>
      <GrievancesPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useStaff.mockReturnValue({ residence });
  mocks.listResidenceGrievances.mockResolvedValue([]);
  mocks.resolveGrievance.mockResolvedValue(undefined);
});

describe('GrievancesPage — staff follow-through queue', () => {
  it('shows filed grievances with policy-timeline framing', async () => {
    mocks.listResidenceGrievances.mockResolvedValue([grievance({ id: 1 })]);
    wrap();
    expect(await screen.findByText(/hot water has been out/)).toBeInTheDocument();
    expect(screen.getByText(/acknowledge within 2 business days/)).toBeInTheDocument();
    expect(mocks.listResidenceGrievances).toHaveBeenCalledWith(7);
  });

  it('moves a grievance through disposition via the server RPC and reloads', async () => {
    mocks.listResidenceGrievances.mockResolvedValue([grievance({ id: 1 })]);
    wrap();
    await userEvent.click(await screen.findByRole('button', { name: 'Start review' }));
    await waitFor(() => expect(mocks.resolveGrievance).toHaveBeenCalledWith(1, 'in_review'));
    expect(mocks.listResidenceGrievances).toHaveBeenCalledTimes(2);
  });

  it('surfaces the server’s conflict-of-interest refusal verbatim', async () => {
    mocks.listResidenceGrievances.mockResolvedValue([grievance({ id: 1 })]);
    mocks.resolveGrievance.mockRejectedValue(
      new Error('Someone else must handle a grievance you filed.'),
    );
    wrap();
    await userEvent.click(await screen.findByRole('button', { name: 'Mark resolved' }));
    expect(
      await screen.findByText('Someone else must handle a grievance you filed.'),
    ).toBeInTheDocument();
  });

  it('separates settled grievances and offers no actions on closed ones', async () => {
    mocks.listResidenceGrievances.mockResolvedValue([
      grievance({ id: 1, status: 'closed', summary: 'Resolved months ago.' }),
    ]);
    wrap();
    expect(await screen.findByText('Resolved and closed')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Start review|Mark resolved|Close/ }),
    ).not.toBeInTheDocument();
  });

  it('empty state explains manager-scoped visibility instead of implying nothing exists', async () => {
    wrap();
    expect(
      await screen.findByText(/visibility is limited to residence managers/),
    ).toBeInTheDocument();
  });

  it('asks for a residence when none is selected', () => {
    mocks.useStaff.mockReturnValue({ residence: null });
    wrap();
    expect(screen.getByText('Select a residence to view grievances.')).toBeInTheDocument();
    expect(mocks.listResidenceGrievances).not.toHaveBeenCalled();
  });
});
