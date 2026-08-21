import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { IncidentsPage } from './IncidentsPage';

/**
 * P0.5-A regression: incident review was a deployed RPC with no UI, so the
 * "waiting for review" counter could never clear. Pins: unreviewed reports get
 * a Review action, review calls the RPC wrapper (report stays append-only —
 * only reviewer/follow-up change), and refusals surface verbatim.
 */

const mocks = vi.hoisted(() => ({
  listIncidents: vi.fn(),
  listResidenceRoster: vi.fn(),
  reportIncident: vi.fn(),
  reviewIncident: vi.fn(),
  useAuth: vi.fn(),
  useStaff: vi.fn(),
}));
vi.mock('@recoveryos/data-access', () => ({
  listIncidents: mocks.listIncidents,
  listResidenceRoster: mocks.listResidenceRoster,
  reportIncident: mocks.reportIncident,
  reviewIncident: mocks.reviewIncident,
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('../staffContext', () => ({ useStaff: mocks.useStaff }));

const incident = (over: Record<string, unknown>) => ({
  id: 1,
  residence_id: 1,
  residency_id: null,
  occurred_at: new Date().toISOString(),
  category: 'medical',
  severity: 2,
  summary: 'Resident felt faint; staff sat with them.',
  follow_up: null,
  reported_by_person_id: 9,
  reviewed_by_person_id: null,
  reviewed_at: null,
  created_at: new Date().toISOString(),
  ...over,
});

const wrap = () =>
  render(
    <MemoryRouter>
      <IncidentsPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue({ person: { id: 9 } });
  mocks.useStaff.mockReturnValue({ residence: { id: 1, name: 'Grace House' } });
  mocks.listResidenceRoster.mockResolvedValue([]);
});

describe('IncidentsPage review', () => {
  it('separates unreviewed reports and offers the review action', async () => {
    mocks.listIncidents.mockResolvedValue([
      incident({ id: 1 }),
      incident({ id: 2, reviewed_at: new Date().toISOString(), follow_up: 'Support offered.' }),
    ]);
    wrap();
    expect(await screen.findByRole('button', { name: 'Review' })).toBeInTheDocument();
    expect(screen.getByText('Follow-up: Support offered.')).toBeInTheDocument();
  });

  it('records the review through the RPC with the optional follow-up', async () => {
    mocks.listIncidents
      .mockResolvedValueOnce([incident({ id: 1 })])
      .mockResolvedValueOnce([incident({ id: 1, reviewed_at: new Date().toISOString() })]);
    mocks.reviewIncident.mockResolvedValue(undefined);
    wrap();
    fireEvent.click(await screen.findByRole('button', { name: 'Review' }));
    fireEvent.change(screen.getByLabelText(/follow-up \(optional\)/i), {
      target: { value: 'Checked in the next morning.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mark reviewed' }));
    await waitFor(() =>
      expect(mocks.reviewIncident).toHaveBeenCalledWith(1, 'Checked in the next morning.'),
    );
    expect(await screen.findByText('Every report has been reviewed.')).toBeInTheDocument();
  });

  it('surfaces the server refusal verbatim', async () => {
    mocks.listIncidents.mockResolvedValue([incident({ id: 1 })]);
    mocks.reviewIncident.mockRejectedValue(
      new Error('Only a residence manager can review incidents.'),
    );
    wrap();
    fireEvent.click(await screen.findByRole('button', { name: 'Review' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark reviewed' }));
    expect(
      await screen.findByText('Only a residence manager can review incidents.'),
    ).toBeInTheDocument();
  });
});
