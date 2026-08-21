import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { IntakeQueuePage } from './IntakeQueuePage';

/**
 * P0.5-A regression: the 0122 intake queue must be reviewable — this page is
 * the precondition for opening the public write path at all. Pins: rows
 * render, lifecycle actions call the audited RPC wrapper, refusals surface
 * verbatim, and the empty state stays honest about RLS scoping.
 */

const mocks = vi.hoisted(() => ({
  listApplicationIntake: vi.fn(),
  reviewApplicationIntake: vi.fn(),
}));
vi.mock('@recoveryos/data-access', () => ({
  listApplicationIntake: mocks.listApplicationIntake,
  reviewApplicationIntake: mocks.reviewApplicationIntake,
}));

const row = {
  id: 7,
  residence_id: 1,
  applicant_name: 'PUBLIC-INTAKE-TEST Person',
  applicant_email: 'test@example.org',
  applicant_phone: '555-0100',
  preferred_contact: 'phone',
  referral_source: 'friend',
  answers: { why_now: 'ready for a change' },
  consent_to_contact: true,
  status: 'received' as const,
  reviewed_at: null,
  reviewed_by_person_id: null,
  review_notes: null,
  converted_person_id: null,
  converted_application_id: null,
  source: 'gracehouse4',
  test_fixture: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const wrap = () =>
  render(
    <MemoryRouter>
      <IntakeQueuePage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('IntakeQueuePage', () => {
  it('renders received intake with contact details and lifecycle actions', async () => {
    mocks.listApplicationIntake.mockResolvedValue([row]);
    wrap();
    expect(await screen.findByText('PUBLIC-INTAKE-TEST Person')).toBeInTheDocument();
    expect(screen.getByText(/consented to contact/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark contacted' })).toBeInTheDocument();
  });

  it('moves a row through the audited review RPC', async () => {
    mocks.listApplicationIntake
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([{ ...row, status: 'contacted' as const }]);
    mocks.reviewApplicationIntake.mockResolvedValue(undefined);
    wrap();
    fireEvent.click(await screen.findByRole('button', { name: 'Mark contacted' }));
    await waitFor(() =>
      expect(mocks.reviewApplicationIntake).toHaveBeenCalledWith({
        intakeId: 7,
        status: 'contacted',
        notes: undefined,
      }),
    );
    expect(await screen.findByText(/Contacted ·/)).toBeInTheDocument();
  });

  it('surfaces a server refusal verbatim instead of pretending success', async () => {
    mocks.listApplicationIntake.mockResolvedValue([row]);
    mocks.reviewApplicationIntake.mockRejectedValue(new Error('not_authorized'));
    wrap();
    fireEvent.click(await screen.findByRole('button', { name: 'Waitlist' }));
    expect(await screen.findByText('not_authorized')).toBeInTheDocument();
  });

  it('keeps the empty state honest about scoped visibility', async () => {
    mocks.listApplicationIntake.mockResolvedValue([]);
    wrap();
    expect(await screen.findByText(/visibility is scoped/)).toBeInTheDocument();
  });
});
