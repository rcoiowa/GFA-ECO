import { useReducer } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider, Link, useNavigate } from 'react-router';
import { CircleMeetingsPage } from './CircleMeetingsPage';
// jsdom's AbortSignal is not accepted by Node's native Request used by data routers.
const { transferableAbortController } = await vi.importActual<{
  transferableAbortController: () => AbortController;
}>('node:util');
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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: '*', element: <CircleMeetingsPage /> }]);
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.stubGlobal(
    'AbortController',
    class {
      constructor() {
        return transferableAbortController();
      }
    },
  );
  vi.clearAllMocks();
  mocks.personId = 202;
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  mocks.get.mockResolvedValue(workspace);
  mocks.save.mockResolvedValue({ ok: true, code: 'recorded', meeting_id: 1 });
});
afterEach(() => vi.unstubAllGlobals());
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
const notesField = () => screen.getByLabelText('Facilitator notes (optional, shared)');
describe('Extended Circle documentation', () => {
  beforeEach(() => mocks.get.mockResolvedValue(v2Workspace));
  it('shows authorized shared documentation read-only with its Circle timezone', async () => {
    mocks.get.mockResolvedValue({
      ...v2Workspace,
      series: [],
      readOnlySeries: [{ ...workspace.series[0], timezone: 'Pacific/Honolulu' }],
      meetings: [
        {
          id: 7,
          series_id: 1,
          title: 'Shared meeting',
          location_name: 'Hope+Elim',
          starts_at: '2026-11-09T23:30:00Z',
          occurrence_status: 'held',
          participant_count: 12,
          facilitator_names: ['Facilitator'],
          total_attendance: 13,
          facilitator_notes: 'Allow more time for closing.',
          first_time_participant_count: 2,
        },
      ],
    });
    renderPage();
    expect(await screen.findByText(/Read-only Circle access/)).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Circle meeting record' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save Circle meeting' })).not.toBeInTheDocument();
    expect(screen.getByText('Facilitator notes')).toBeInTheDocument();
    expect(screen.getByText('Allow more time for closing.')).toBeInTheDocument();
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Pacific/Honolulu',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date('2026-11-09T23:30:00Z'));
    expect(screen.getByText(`${time} · held`)).toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('keeps read-only Circles out of the recording selector and stores no note draft on device', async () => {
    mocks.get.mockResolvedValue({
      ...v2Workspace,
      readOnlySeries: [{ ...workspace.series[0], id: 2, name: 'Read-only circle' }],
    });
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    renderPage();
    const user = await fillMeeting();
    expect(screen.queryByRole('option', { name: /Read-only circle/ })).not.toBeInTheDocument();
    await user.type(notesField(), 'Plan more reflection time.');
    expect(screen.getByText(/Shared with authorized GFA staff and leadership/)).toBeInTheDocument();
    expect(screen.queryByText(/Visible only to you/)).not.toBeInTheDocument();
    expect(storage).not.toHaveBeenCalled();
    storage.mockRestore();
  });
  it('hides unsupported fields and uses the existing input contract', async () => {
    mocks.get.mockResolvedValue(workspace);
    renderPage();
    const user = await fillMeeting();
    expect(screen.queryByLabelText('First-time participants (optional)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Facilitator notes (optional, shared)')).not.toBeInTheDocument();
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
      expect(
        screen.getByText(/Shared with authorized GFA staff and leadership/),
      ).toBeInTheDocument();
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
    let refreshPerson!: () => void;
    const PersonPage = () => {
      const [, refresh] = useReducer((n: number) => n + 1, 0);
      refreshPerson = refresh;
      return <CircleMeetingsPage />;
    };
    const router = createMemoryRouter([{ path: '*', element: <PersonPage /> }]);
    const page = () => (
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
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
    act(() => refreshPerson());
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
    expect(screen.queryByLabelText('Facilitator notes (optional, shared)')).not.toBeInTheDocument();
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
    expect(screen.queryByText('Facilitator notes')).not.toBeInTheDocument();
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

function renderNavigationPage(entries = ['/coach/circles'], index = entries.length - 1) {
  function NavigationPage() {
    const navigate = useNavigate();
    return (
      <>
        <Link to="/other">Sidebar destination</Link>
        <button onClick={() => void navigate('/other')}>Programmatic destination</button>
        <CircleMeetingsPage />
      </>
    );
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: '/coach/circles', element: <NavigationPage /> },
      { path: '/other', element: <p>Other page</p> },
    ],
    { initialEntries: entries, initialIndex: index },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe('Circle draft navigation and refresh safety', () => {
  beforeEach(() => mocks.get.mockResolvedValue(v2Workspace));
  it.each(['Sidebar destination', 'Programmatic destination'])(
    'blocks %s until departure is allowed',
    async (name) => {
      const router = renderNavigationPage();
      const user = await fillMeeting();
      await user.type(notesField(), 'Keep this draft.');
      vi.mocked(window.confirm).mockReturnValue(false);
      await user.click(screen.getByText(name));
      expect(router.state.location.pathname).toBe('/coach/circles');
      expect(notesField()).toHaveValue('Keep this draft.');
      expect(window.confirm).toHaveBeenCalledTimes(1);
      vi.mocked(window.confirm).mockReturnValue(true);
      await user.click(screen.getByText(name));
      expect(await screen.findByText('Other page')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/other');
      expect(window.confirm).toHaveBeenCalledTimes(2);
    },
  );
  it.each([-1, 1])(
    'guards history navigation direction %s and resumes only on approval',
    async (direction) => {
      const router = renderNavigationPage(
        direction === -1 ? ['/other', '/coach/circles'] : ['/coach/circles', '/other'],
        direction === -1 ? 1 : 0,
      );
      const user = await fillMeeting();
      await user.type(notesField(), 'Keep this history draft.');
      vi.mocked(window.confirm).mockReturnValue(false);
      await act(async () => {
        await router.navigate(direction);
      });
      expect(router.state.location.pathname).toBe('/coach/circles');
      expect(notesField()).toHaveValue('Keep this history draft.');
      vi.mocked(window.confirm).mockReturnValue(true);
      await act(async () => {
        await router.navigate(direction);
      });
      expect(await screen.findByText('Other page')).toBeInTheDocument();
      expect(window.confirm).toHaveBeenCalledTimes(2);
    },
  );
  it('does not prompt for clean forms', async () => {
    renderNavigationPage();
    await screen.findByLabelText('Date');
    await userEvent.setup().click(screen.getByText('Sidebar destination'));
    expect(await screen.findByText('Other page')).toBeInTheDocument();
    expect(window.confirm).not.toHaveBeenCalled();
  });
  it('warns on document unload only while dirty and permits in-page anchors', async () => {
    renderNavigationPage();
    await screen.findByLabelText('Date');
    const cleanUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(cleanUnload);
    expect(cleanUnload.defaultPrevented).toBe(false);
    const user = await fillMeeting();
    const dirtyUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirtyUnload);
    expect(dirtyUnload.defaultPrevented).toBe(true);
    const dateNode = screen.getByLabelText('Date');
    await user.click(screen.getByRole('link', { name: 'Facilitation guide' }));
    expect(screen.getByLabelText('Date')).toBe(dateNode);
    expect(window.confirm).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-09');
    await user.click(screen.getByRole('button', { name: 'Clear form for another meeting' }));
    const clearedUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(clearedUnload);
    expect(clearedUnload.defaultPrevented).toBe(false);
    vi.mocked(window.confirm).mockClear();
    await user.click(screen.getByText('Sidebar destination'));
    expect(await screen.findByText('Other page')).toBeInTheDocument();
    expect(window.confirm).not.toHaveBeenCalled();
  });
  it('allows leaving after a confirmed save without prompting', async () => {
    renderNavigationPage();
    const user = await fillMeeting();
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    await screen.findByText('Circle meeting saved.');
    await user.click(screen.getByText('Sidebar destination'));
    expect(await screen.findByText('Other page')).toBeInTheDocument();
    expect(window.confirm).not.toHaveBeenCalled();
  });
  it('keeps navigation guarded after an uncertain save', async () => {
    renderNavigationPage();
    const user = await fillMeeting();
    mocks.save.mockRejectedValueOnce(new Error('Response interrupted'));
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    await screen.findByText(/Save not confirmed/);
    vi.mocked(window.confirm).mockReturnValue(false);
    await user.click(screen.getByText('Sidebar destination'));
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-09');
  });
  it('keeps confirmed saves clean even when their subsequent refresh fails', async () => {
    renderNavigationPage();
    const user = await fillMeeting();
    const dateNode = screen.getByLabelText('Date');
    mocks.get.mockRejectedValueOnce(new Error('Refresh interrupted'));
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    await screen.findByText(/Recorded meetings could not be refreshed/);
    expect(screen.getByText('Circle meeting saved.')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBe(dateNode);
    expect(dateNode).toHaveValue('2026-11-09');
    await user.click(screen.getByText('Sidebar destination'));
    expect(await screen.findByText('Other page')).toBeInTheDocument();
    expect(window.confirm).not.toHaveBeenCalled();
  });
  it('preserves all entered values and exact retry after a cached refresh failure', async () => {
    renderPage();
    const user = await fillMeeting();
    await user.clear(screen.getByLabelText('Start time'));
    await user.type(screen.getByLabelText('Start time'), '18:00');
    await user.clear(screen.getByLabelText('End time (optional)'));
    await user.type(screen.getByLabelText('End time (optional)'), '19:00');
    await user.type(screen.getByLabelText('Topic (optional)'), 'Connection');
    await user.click(screen.getByText('Optional programming classifications'));
    await user.selectOptions(screen.getByLabelText('ICARE phase'), 'Connect');
    await user.type(screen.getByLabelText('Domain'), 'Community');
    await user.type(screen.getByLabelText('Theme'), 'Welcome');
    await user.type(firstTimeField(), '2');
    await user.type(notesField(), 'Plan a shorter opening.');
    const dateNode = screen.getByLabelText('Date');
    mocks.save.mockRejectedValueOnce(new Error('Response lost'));
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    await screen.findByText(/Save not confirmed/);
    const original = mocks.save.mock.calls[0]![0];
    mocks.get.mockRejectedValueOnce(new Error('Network unavailable'));
    await user.click(screen.getByRole('button', { name: 'Refresh recorded meetings' }));
    await screen.findByText(/Recorded meetings could not be refreshed/);
    expect(screen.getByLabelText('Date')).toBe(dateNode);
    expect(dateNode).toHaveValue('2026-11-09');
    expect(screen.getByLabelText('Topic (optional)')).toHaveValue('Connection');
    expect(notesField()).toHaveValue('Plan a shorter opening.');
    await user.click(screen.getByRole('button', { name: 'Retry refresh' }));
    await waitFor(() =>
      expect(
        screen.queryByText(/Recorded meetings could not be refreshed/),
      ).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Save Circle meeting' }));
    await screen.findByText('Circle meeting saved.');
    expect(mocks.save.mock.calls[1]![0]).toEqual(original);
  });
  it('shows initial load failure without a form and allows retry', async () => {
    mocks.get.mockRejectedValueOnce(new Error('Offline'));
    renderPage();
    await screen.findByText('We couldn’t load your available Circles.');
    expect(screen.queryByLabelText('Date')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /try again|retry/i }));
    expect(await screen.findByLabelText('Date')).toBeInTheDocument();
  });
  it('fails closed on an explicit access-denied refresh and clears prior draft', async () => {
    renderPage();
    const user = await fillMeeting();
    await user.type(notesField(), 'Old access draft.');
    mocks.get.mockRejectedValueOnce({ code: '42501', message: 'Permission denied' });
    await user.click(screen.getByRole('button', { name: 'Refresh recorded meetings' }));
    await screen.findByText('We couldn’t load your available Circles.');
    expect(screen.queryByLabelText('Date')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again|retry/i }));
    await screen.findByLabelText('Date');
    expect(notesField()).toHaveValue('');
  });
});
