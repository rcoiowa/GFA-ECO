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
      county: 'Polk',
      address: '2500 University Ave',
      room: '3rd Floor, Room #306',
      participation_access: 'public',
      start_time: '18:30:00',
      end_time: '19:30:00',
      schedule_note: 'Every Tuesday, 6:30–7:30 PM (America/Chicago)',
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
    expect(screen.getByLabelText('Start time')).toHaveValue('18:30');
    expect(screen.getByLabelText('County (meeting location)')).toHaveValue('Polk');
    expect(screen.getByLabelText('End time (optional)')).toHaveValue('19:30');
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
  it('labels CBH closed and clears attendance and time defaults when switching', async () => {
    mocks.get.mockResolvedValue({
      series: [
        ...workspace.series,
        {
          ...workspace.series[0],
          id: 2,
          location_name: 'Clive Behavioral Health (CBH) — Outpatient',
          participation_access: 'closed_cbh_clients',
          start_time: null,
          end_time: null,
          schedule_note: 'Selected Tuesdays; confirm with CBH',
        },
      ],
      meetings: [],
    });
    renderPage();
    const user = userEvent.setup();
    await screen.findByLabelText('Date');
    await user.type(screen.getByLabelText('Participants present (exclude facilitators)'), '15');
    await user.selectOptions(screen.getByLabelText('Circle'), '2');
    expect(
      screen.getByText('Closed — CBH clients only. Not open to the general public.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Start time')).toHaveValue('');
    expect(screen.getByLabelText('Participants present (exclude facilitators)')).toHaveValue(null);
  });
  it('does not offer a form without an assignment', async () => {
    mocks.get.mockResolvedValue({ series: [], meetings: [] });
    renderPage();
    expect(await screen.findByText(/You don’t have Circle recording access/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save Circle meeting' })).not.toBeInTheDocument();
  });
});
