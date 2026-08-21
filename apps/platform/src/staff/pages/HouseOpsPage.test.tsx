import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { HouseOpsPage } from './HouseOpsPage';

/**
 * P0.5-C regression: meetings/attendance and chore assignment had no write
 * path, so funder-facing meeting counts were structurally 0/0 and resident
 * chore cards were permanently empty. Pins: recording goes through the 0128
 * RPCs and refusals surface.
 */

const mocks = vi.hoisted(() => ({
  listResidenceMeetings: vi.fn(),
  listResidenceChores: vi.fn(),
  listChoreAssignmentsForResidence: vi.fn(),
  listResidenceRoster: vi.fn(),
  recordMeeting: vi.fn(),
  recordMeetingAttendance: vi.fn(),
  assignChore: vi.fn(),
  completeChoreAssignment: vi.fn(),
  useStaff: vi.fn(),
}));
vi.mock('@recoveryos/data-access', () => ({
  listResidenceMeetings: mocks.listResidenceMeetings,
  listResidenceChores: mocks.listResidenceChores,
  listChoreAssignmentsForResidence: mocks.listChoreAssignmentsForResidence,
  listResidenceRoster: mocks.listResidenceRoster,
  recordMeeting: mocks.recordMeeting,
  recordMeetingAttendance: mocks.recordMeetingAttendance,
  assignChore: mocks.assignChore,
  completeChoreAssignment: mocks.completeChoreAssignment,
}));
vi.mock('../staffContext', () => ({ useStaff: mocks.useStaff }));

const resident = {
  id: 21,
  person_id: 11,
  residence_id: 1,
  residency_status: 'active',
  person: { id: 11, first_name: 'Sam', last_name: 'T.', preferred_name: null },
};

const meeting = {
  id: 5,
  organization_id: 1,
  residence_id: 1,
  title: 'House meeting',
  description: null,
  starts_at: new Date().toISOString(),
  ends_at: null,
  is_required_for_residents: true,
  created_at: new Date().toISOString(),
};

const wrap = () =>
  render(
    <MemoryRouter>
      <HouseOpsPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useStaff.mockReturnValue({ residence: { id: 1, name: 'Grace House' } });
  mocks.listResidenceMeetings.mockResolvedValue([meeting]);
  mocks.listResidenceChores.mockResolvedValue([
    { id: 2, residence_id: 1, name: 'Kitchen reset', description: null, is_active: true },
  ]);
  mocks.listChoreAssignmentsForResidence.mockResolvedValue([]);
  mocks.listResidenceRoster.mockResolvedValue([resident]);
});

describe('HouseOpsPage', () => {
  it('records attendance per person through the 0128 RPC', async () => {
    mocks.recordMeetingAttendance.mockResolvedValue(undefined);
    wrap();
    fireEvent.click(await screen.findByRole('button', { name: 'Record attendance' }));
    fireEvent.click(screen.getByRole('button', { name: 'present' }));
    await waitFor(() =>
      expect(mocks.recordMeetingAttendance).toHaveBeenCalledWith({
        meetingId: 5,
        personId: 11,
        status: 'present',
      }),
    );
  });

  it('assigns a chore to a residency for a date', async () => {
    mocks.assignChore.mockResolvedValue(undefined);
    wrap();
    fireEvent.change(await screen.findByLabelText('Chore'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Resident'), { target: { value: '21' } });
    fireEvent.click(screen.getByRole('button', { name: 'Assign' }));
    await waitFor(() =>
      expect(mocks.assignChore).toHaveBeenCalledWith(
        expect.objectContaining({ choreId: 2, residencyId: 21 }),
      ),
    );
  });

  it('surfaces a refusal verbatim', async () => {
    mocks.recordMeeting.mockRejectedValue(new Error('not_authorized'));
    wrap();
    fireEvent.change(await screen.findByLabelText('When'), {
      target: { value: '2026-08-22T18:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record meeting' }));
    expect(await screen.findByText('not_authorized')).toBeInTheDocument();
  });
});
