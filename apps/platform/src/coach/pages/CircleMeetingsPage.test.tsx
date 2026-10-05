import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { CircleMeetingsPage } from './CircleMeetingsPage';
const mocks = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn() }));
vi.mock('@recoveryos/auth', () => ({ useAuth: () => ({ person: { id: 202 } }) }));
vi.mock('@recoveryos/data-access', () => ({
  getMyCircleWorkspace: mocks.get,
  recordCircleMeeting: mocks.save,
}));
const workspace = {
  series: [
    {
      id: 1,
      name: 'GFARC',
      location_name: 'Hope+Elim',
      timezone: 'America/Chicago',
      facilitators: [],
    },
  ],
  meetings: [],
};
function renderPage() {
  return render(
    <MemoryRouter>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <CircleMeetingsPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue(workspace);
  mocks.save.mockResolvedValue({ ok: true, code: 'recorded', meeting_id: 1 });
});
describe('Circle logging', () => {
  it('saves 15 participants and two facilitators separately with Chicago times', async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findByLabelText('Date');
    await user.type(screen.getByLabelText('Date'), '2026-09-29');
    await user.type(screen.getByLabelText('Start time'), '18:30');
    await user.type(screen.getByLabelText('End time (optional)'), '19:30');
    await user.type(screen.getByLabelText('Participants present (exclude facilitators)'), '15');
    await user.type(
      screen.getByLabelText('Facilitators present — one name per line'),
      'Thomas\nArchaletta',
    );
    expect(
      screen.getByText('15 participants + 2 facilitators = 17 people present'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    expect(await screen.findByText('Circle meeting saved.')).toBeInTheDocument();
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        participants: 15,
        facilitators: ['Thomas', 'Archaletta'],
        startsAt: '2026-09-29T23:30:00.000Z',
        endsAt: '2026-09-30T00:30:00.000Z',
      }),
    );
  });
  it('does not offer a form without an assignment', async () => {
    mocks.get.mockResolvedValue({ series: [], meetings: [] });
    renderPage();
    expect(await screen.findByText(/You don’t have a Circle assignment/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save Circle meeting' })).not.toBeInTheDocument();
  });
});
