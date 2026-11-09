import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { CircleMeetingsPage } from './CircleMeetingsPage';
const mocks = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn(), personId: 202 }));
vi.mock('@recoveryos/auth', () => ({ useAuth: () => ({ person: { id: mocks.personId } }) }));
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
  mocks.personId = 202;
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

const v2Workspace = { ...workspace, capabilities: { circle_documentation_v2: true } };
async function fillMeeting() {
  const user = userEvent.setup();
  await screen.findByLabelText('Date');
  await user.type(screen.getByLabelText('Date'), '2026-11-09');
  await user.type(screen.getByLabelText('Participants present (exclude facilitators)'), '12');
  await user.type(screen.getByLabelText('Facilitators present — one name per line'), 'Facilitator');
  return user;
}
const firstTimeField = () => screen.getByLabelText('First-time participants (optional)');
const notesField = () => screen.getByLabelText('Facilitator notes (optional, private)');
describe('Extended Circle documentation', () => {
  beforeEach(() => mocks.get.mockResolvedValue(v2Workspace));
  it('hides unsupported fields and uses the existing input contract', async () => {
    mocks.get.mockResolvedValue(workspace);
    renderPage();
    const user = await fillMeeting();
    expect(screen.queryByLabelText('First-time participants (optional)')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Facilitator notes (optional, private)'),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    await screen.findByText('Circle meeting saved.');
    expect(mocks.save.mock.calls[0]![0]).not.toHaveProperty('documentationV2');
  });
  it.each(['', '0', '3'])(
    'saves optional first-time count %j without adding to attendance',
    async (value) => {
      renderPage();
      const user = await fillMeeting();
      if (value) await user.type(firstTimeField(), value);
      await user.type(notesField(), '  Allow more time for closing.  ');
      expect(screen.getByText(/Visible only to you, the author/)).toHaveTextContent(
        'not to cofacilitators',
      );
      await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
      await screen.findByText('Circle meeting saved.');
      expect(mocks.save).toHaveBeenCalledWith(
        expect.objectContaining({
          documentationV2: true,
          participants: 12,
          firstTimeParticipants: value === '' ? null : Number(value),
          facilitatorNotes: 'Allow more time for closing.',
        }),
      );
    },
  );
  it('clears private drafts and prior records when the signed-in person changes', async () => {
    mocks.get.mockResolvedValue({
      ...v2Workspace,
      meetings: [
        {
          id: 7,
          series_id: 1,
          title: 'Prior author meeting',
          location_name: 'Hope+Elim',
          starts_at: '2026-11-09T23:30:00Z',
          occurrence_status: 'held',
          participant_count: 12,
          facilitator_names: ['Facilitator'],
          total_attendance: 13,
          facilitator_notes: 'Prior author saved note.',
          first_time_participant_count: 2,
        },
      ],
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const page = () => (
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <CircleMeetingsPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    const view = render(page());
    const user = await fillMeeting();
    await user.type(notesField(), 'Prior author draft.');
    await user.type(firstTimeField(), '2');
    // A different person must receive a fresh query and an empty form, never the prior draft.
    expect(screen.getByText('Prior author saved note.')).toBeInTheDocument();
    mocks.get.mockResolvedValue(v2Workspace);
    mocks.personId = 303;
    view.rerender(page());
    expect(screen.queryByText('Prior author saved note.')).not.toBeInTheDocument();
    await screen.findByLabelText('Date');
    expect(screen.queryByText('Prior author saved note.')).not.toBeInTheDocument();
    expect(notesField()).toHaveValue('');
    expect(firstTimeField()).toHaveValue(null);
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });
  it('removes private state on access revocation, even if access is later restored', async () => {
    renderPage();
    const user = await fillMeeting();
    await user.type(notesField(), 'Prior access draft.');
    mocks.get.mockResolvedValue({ ...v2Workspace, series: [], meetings: [] });
    await user.click(screen.getByRole('button', { name: 'Refresh recorded meetings' }));
    await screen.findByText(/You don’t have Circle recording access/);
    expect(
      screen.queryByLabelText('Facilitator notes (optional, private)'),
    ).not.toBeInTheDocument();
    mocks.get.mockResolvedValue(v2Workspace);
    await user.click(screen.getByRole('button', { name: 'Refresh recorded meetings' }));
    await screen.findByLabelText('Date');
    expect(notesField()).toHaveValue('');
  });
  it('does not silently drop entered documentation if server capability disappears', async () => {
    renderPage();
    const user = await fillMeeting();
    await user.type(firstTimeField(), '2');
    await user.type(notesField(), 'Use a shorter opening.');
    mocks.get.mockResolvedValue(workspace);
    await user.click(screen.getByRole('button', { name: 'Refresh recorded meetings' }));
    await screen.findByText(
      /First-time participant counts and facilitator notes are not yet supported/,
    );
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('requires current server support');
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('rejects invalid first-time counts and overly long Unicode notes', async () => {
    renderPage();
    const user = await fillMeeting();
    // Submit directly as well as browser constraints: validation must survive programmatic submits.
    for (const value of ['13', '-1', '1.5']) {
      await user.clear(firstTimeField());
      await user.type(firstTimeField(), value);
      fireEvent.submit(screen.getByRole('form', { name: 'Circle meeting record' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('whole number');
    }
    await user.clear(firstTimeField());
    fireEvent.change(notesField(), { target: { value: '🌱'.repeat(2001) } });
    fireEvent.submit(screen.getByRole('form', { name: 'Circle meeting record' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('2,000 characters');
    expect(mocks.save).not.toHaveBeenCalled();
    fireEvent.change(notesField(), { target: { value: '🌱'.repeat(2000) } });
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    await screen.findByText('Circle meeting saved.');
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });
  it('retains fields through an uncertain save and refresh, then retries the same payload', async () => {
    mocks.save.mockRejectedValueOnce(new Error('Network interrupted'));
    renderPage();
    const user = await fillMeeting();
    await user.type(firstTimeField(), '2');
    await user.type(notesField(), 'Leave time for reflection.');
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Refresh recorded meetings' }));
    expect(firstTimeField()).toHaveValue(2);
    expect(notesField()).toHaveValue('Leave time for reflection.');
    mocks.save.mockResolvedValue({ ok: true, code: 'already_recorded', meeting_id: 1 });
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    await screen.findByText('This meeting was already saved. No duplicate was added.');
    expect(mocks.save.mock.calls[1]![0]).toEqual(mocks.save.mock.calls[0]![0]);
  });
  it('preserves conflicting documentation and prevents simultaneous submissions', async () => {
    let finish!: (value: unknown) => void;
    mocks.save.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderPage();
    const user = await fillMeeting();
    await user.type(notesField(), 'Use a shorter opening.');
    const form = screen.getByRole('form', { name: 'Circle meeting record' });
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(notesField()).toBeDisabled();
    await act(async () => finish({ ok: false, code: 'conflict', meeting_id: 1 }));
    expect(await screen.findByRole('alert')).toHaveTextContent('different details');
    expect(notesField()).toHaveValue('Use a shorter opening.');
  });
  it('clears optional fields on explicit reset and confirmed Circle switch', async () => {
    mocks.get.mockResolvedValue({
      ...v2Workspace,
      series: [...workspace.series, { ...workspace.series[0], id: 2 }],
    });
    renderPage();
    const user = await fillMeeting();
    await user.type(firstTimeField(), '2');
    await user.type(notesField(), 'Use a shorter opening.');
    vi.mocked(window.confirm).mockReturnValue(false);
    await user.selectOptions(screen.getByLabelText('Circle'), '2');
    expect(notesField()).toHaveValue('Use a shorter opening.');
    vi.mocked(window.confirm).mockReturnValue(true);
    await user.selectOptions(screen.getByLabelText('Circle'), '2');
    expect(firstTimeField()).toHaveValue(null);
    expect(notesField()).toHaveValue('');
    await user.type(notesField(), 'Try a quieter room.');
    await user.click(screen.getByRole('button', { name: 'Clear form for another meeting' }));
    expect(notesField()).toHaveValue('');
    expect(screen.getByLabelText('Date')).toHaveValue('');
  });
  it('clears first-time attendance on cancellation and does not restore stale counts', async () => {
    renderPage();
    const user = await fillMeeting();
    await user.type(firstTimeField(), '2');
    await user.selectOptions(screen.getByLabelText('Meeting status'), 'cancelled');
    expect(screen.queryByLabelText('First-time participants (optional)')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    await screen.findByText('Circle meeting saved.');
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({ firstTimeParticipants: null, participants: null }),
    );
    await user.selectOptions(screen.getByLabelText('Meeting status'), 'held');
    expect(firstTimeField()).toHaveValue(null);
  });
  it('reads back private notes and treats historical missing counts as unknown', async () => {
    const meeting = {
      id: 1,
      series_id: 1,
      title: 'Historical circle',
      starts_at: '2026-11-09T23:30:00Z',
      location_name: 'Hope+Elim',
      occurrence_status: 'held',
      participant_count: 12,
      facilitator_names: ['Facilitator'],
      total_attendance: 13,
    };
    mocks.get.mockResolvedValue({ ...v2Workspace, meetings: [meeting] });
    renderPage();
    expect(await screen.findByText('First-time participants: Not collected')).toBeInTheDocument();
    expect(screen.queryByText('Your private facilitator notes')).not.toBeInTheDocument();
    mocks.get.mockResolvedValue({
      ...v2Workspace,
      meetings: [
        {
          ...meeting,
          first_time_participant_count: 0,
          facilitator_notes: 'Leave time for closing.',
        },
      ],
    });
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Refresh recorded meetings' }));
    expect(await screen.findByText('First-time participants: 0')).toBeInTheDocument();
    expect(screen.getByText('Leave time for closing.')).toBeInTheDocument();
    expect(screen.getByText(/1 held meetings · 12 participant attendances/)).toBeInTheDocument();
  });
});
