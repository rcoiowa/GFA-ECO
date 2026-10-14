import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReopenApplication } from './ReopenApplication';
import { ResidenceBedSetup } from './ResidenceBedSetup';

const api = vi.hoisted(() => ({
  reopenHousingApplication: vi.fn(),
  setResidenceCapacity: vi.fn(),
  addResidenceRoomBeds: vi.fn(),
}));
vi.mock('@recoveryos/data-access', () => api);
beforeEach(() => {
  vi.resetAllMocks();
});

it('requires a reason and carries the expected decision into a correction', async () => {
  const saved = vi.fn().mockResolvedValue(undefined);
  render(<ReopenApplication applicationId={4} status="approved" onSaved={saved} />);
  fireEvent.click(screen.getByRole('button', { name: 'Return to review' }));
  expect(screen.getByRole('button', { name: 'Confirm return to review' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Reason for returning to review'), {
    target: { value: 'Decision entered before review was complete.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm return to review' }));
  await waitFor(() =>
    expect(api.reopenHousingApplication).toHaveBeenCalledWith(
      4,
      'approved',
      'Decision entered before review was complete.',
    ),
  );
  await waitFor(() => expect(saved).toHaveBeenCalledOnce());
});

it('shows a blocked correction without claiming success', async () => {
  api.reopenHousingApplication.mockRejectedValue(new Error('A residency already exists.'));
  const saved = vi.fn();
  render(<ReopenApplication applicationId={4} status="approved" onSaved={saved} />);
  fireEvent.click(screen.getByText('Return to review'));
  fireEvent.change(screen.getByLabelText('Reason for returning to review'), {
    target: { value: 'Correcting an earlier decision.' },
  });
  fireEvent.click(screen.getByText('Confirm return to review'));
  expect(await screen.findByText('A residency already exists.')).toBeInTheDocument();
  expect(saved).not.toHaveBeenCalled();
});

it('does not treat an empty capacity as zero and preserves residence scope', async () => {
  render(
    <ResidenceBedSetup
      residenceId={2}
      initialCapacity={null}
      onSaved={vi.fn().mockResolvedValue(undefined)}
    />,
  );
  expect(screen.getByText('Save capacity')).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Confirmed bed capacity'), { target: { value: '6' } });
  fireEvent.click(screen.getByText('Save capacity'));
  await waitFor(() => expect(api.setResidenceCapacity).toHaveBeenCalledWith(2, 6, null));
  expect(await screen.findByText('Capacity saved.')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Unit or floor name'), {
    target: { value: 'First floor' },
  });
  fireEvent.change(screen.getByLabelText('Room name'), { target: { value: 'Room A' } });
  fireEvent.change(screen.getByLabelText('Beds in this room'), { target: { value: '2' } });
  fireEvent.click(screen.getByText('Add room and beds'));
  await waitFor(() =>
    expect(api.addResidenceRoomBeds).toHaveBeenCalledWith(2, 'First floor', 'Room A', 2),
  );
});
