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
  vi.spyOn(window, 'confirm').mockReturnValue(true);
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

describe('Facilitator workspace integration', () => {
  it('provides return paths and makes the persistence boundary visible', async () => {
    renderPage();
    await screen.findByRole('heading', { name: /Lead the circle/ });
    expect(
      screen.getAllByRole('link', { name: 'Back to Recovery Community Center' })[0],
    ).toHaveAttribute('href', '/vrcc');
    expect(screen.getByRole('link', { name: 'GFA website' })).toHaveAttribute(
      'href',
      'https://graceforaddictions.org',
    );
    expect(screen.getByRole('link', { name: 'Facilitation guide' })).toHaveAttribute(
      'href',
      '#facilitation-guide',
    );
    expect(
      screen.getByText(/First-time participant counts and facilitator notes are not yet supported/),
    ).toBeInTheDocument();
    expect(screen.getByText(/does not import records saved on a device/)).toBeInTheDocument();
  });

  it('preserves existing recorded meetings alongside the new workspace', async () => {
    mocks.get.mockResolvedValue({
      ...workspace,
      meetings: [
        {
          id: 1,
          series_id: 1,
          title: 'Existing gathering',
          starts_at: '2026-09-29T23:30:00Z',
          location_name: 'Hope+Elim',
          occurrence_status: 'held',
          participant_count: 15,
          facilitator_names: ['Thomas', 'Archaletta'],
          total_attendance: 17,
          county: 'Polk',
        },
      ],
    });
    renderPage();
    expect(await screen.findByText('Existing gathering · Hope+Elim')).toBeInTheDocument();
    expect(
      screen.getByText(/1 held meetings · 15 participant attendances · 2 facilitator attendances/),
    ).toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('keeps entered data and explains reconciliation after an uncertain save', async () => {
    mocks.save.mockRejectedValue(new Error('Network interrupted'));
    renderPage();
    const user = userEvent.setup();
    await screen.findByLabelText('Date');
    await user.type(screen.getByLabelText('Date'), '2026-11-09');
    await user.type(screen.getByLabelText('Participants present (exclude facilitators)'), '12');
    await user.type(
      screen.getByLabelText('Facilitators present — one name per line'),
      'Facilitator',
    );
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Save not confirmed');
    expect(screen.getByLabelText('Participants present (exclude facilitators)')).toHaveValue(12);
    await user.click(screen.getByRole('button', { name: 'Refresh recorded meetings' }));
    expect(mocks.get).toHaveBeenCalledTimes(2);
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });

  it('records a cancellation without attendance', async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findByLabelText('Date');
    await user.type(screen.getByLabelText('Date'), '2026-11-09');
    await user.selectOptions(screen.getByLabelText('Meeting status'), 'cancelled');
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    expect(await screen.findByText('Circle meeting saved.')).toBeInTheDocument();
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cancelled', participants: null, facilitators: [] }),
    );
  });

  it('does not send an invalid end time to the server', async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findByLabelText('Date');
    await user.type(screen.getByLabelText('Date'), '2026-11-09');
    await user.clear(screen.getByLabelText('End time (optional)'));
    await user.type(screen.getByLabelText('End time (optional)'), '17:00');
    await user.type(screen.getByLabelText('Participants present (exclude facilitators)'), '1');
    await user.type(
      screen.getByLabelText('Facilitators present — one name per line'),
      'Facilitator',
    );
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Save not confirmed');
    expect(mocks.save).not.toHaveBeenCalled();
  });
});

it('keeps unsaved entries when the facilitator cancels leaving', async () => {
  renderPage();
  const user = userEvent.setup();
  await screen.findByLabelText('Date');
  await user.type(screen.getByLabelText('Participants present (exclude facilitators)'), '7');
  vi.mocked(window.confirm).mockReturnValue(false);
  await user.click(screen.getAllByRole('link', { name: 'Back to Recovery Community Center' })[0]!);
  expect(window.confirm).toHaveBeenCalledWith(
    'Leave this meeting record? Unsaved changes will be lost.',
  );
  expect(screen.getByLabelText('Participants present (exclude facilitators)')).toHaveValue(7);
});
