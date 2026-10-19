import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CollaborationWorkspace } from './CollaborationPage';
const api = vi.hoisted(() => ({
  gate: vi.fn(),
  residences: vi.fn(),
  intakes: vi.fn(),
  roster: vi.fn(),
  load: vi.fn(),
  save: vi.fn(),
}));
vi.mock('@recoveryos/data-access', () => ({
  getAdminOperationsSummary: api.gate,
  adminListResidences: api.residences,
  listApplicationIntake: api.intakes,
  listResidenceRoster: api.roster,
  loadCollaborationWorkspace: api.load,
  saveCollaborationWorkspace: api.save,
}));
beforeEach(() => {
  vi.resetAllMocks();
  api.gate.mockResolvedValue({ ok: true });
  api.residences.mockResolvedValue([{ id: 10 }]);
  api.intakes.mockResolvedValue([]);
  api.roster.mockResolvedValue([]);
  api.load.mockResolvedValue({
    version: 0,
    saved_at: null,
    document: { brief: '', notes: '', intakeId: null, batches: [] },
    audit: [],
  });
});
describe('admin collaboration durable workspace', () => {
  it('fails closed when backend administrator context is denied', async () => {
    api.gate.mockResolvedValue({ ok: false });
    render(<CollaborationWorkspace actorId={1} />);
    expect(await screen.findByText(/Administrator context unavailable/)).toBeInTheDocument();
    expect(api.residences).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Extract review batch' })).not.toBeInTheDocument();
  });
  it('extracts an anonymized batch with duplicate cues and an evidence review trail', async () => {
    render(<CollaborationWorkspace actorId={1} />);
    fireEvent.change(await screen.findByLabelText('Authorized residence'), {
      target: { value: '10' },
    });
    await screen.findByRole('button', { name: 'Extract review batch' });
    fireEvent.change(screen.getByLabelText(/Source date/), { target: { value: 'unknown' } });
    fireEvent.change(screen.getByLabelText(/Coverage window/), {
      target: { value: 'last 100 messages, overlaps prior 60 unread' },
    });
    fireEvent.change(screen.getByLabelText('Anonymized summary events'), {
      target: {
        value: 'Reported household comfort compromise\nReported household comfort compromise',
      },
    });
    fireEvent.click(screen.getByLabelText(/I removed names/));
    fireEvent.click(screen.getByRole('button', { name: 'Extract review batch' }));
    expect(screen.getByText(/Exact normalized duplicates skipped: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Execution: unavailable/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Reason for next review decision'), {
      target: { value: 'Need original decision evidence' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Request evidence' }));
    expect(screen.getByText(/Decision: evidence requested/)).toBeInTheDocument();
    expect(screen.getByText(/Draft review annotations \(1\)/)).toBeInTheDocument();
  });
});

it('fails closed when persistence schema is unavailable', async () => {
  api.load.mockRejectedValue(new Error('missing rpc'));
  render(<CollaborationWorkspace actorId={1} />);
  fireEvent.change(await screen.findByLabelText('Authorized residence'), {
    target: { value: '10' },
  });
  expect(
    await screen.findByText(/Persistence unavailable. This residence workspace/),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText('Brief for manual handoff')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save review workspace' })).toBeDisabled();
  expect(api.save).not.toHaveBeenCalled();
});
it('restores server content and saves with an optimistic version', async () => {
  const document = { brief: 'Restored synthetic brief', notes: '', intakeId: null, batches: [] };
  api.load.mockResolvedValue({ version: 4, saved_at: '2026-10-19T12:00:00Z', document, audit: [] });
  api.save.mockResolvedValue({
    version: 5,
    saved_at: '2026-10-19T13:00:00Z',
    document: { ...document, notes: 'Synthetic update' },
    audit: [{ version: 5, actor_person_id: 1, saved_at: '2026-10-19T13:00:00Z' }],
  });
  render(<CollaborationWorkspace actorId={1} />);
  fireEvent.change(await screen.findByLabelText('Authorized residence'), {
    target: { value: '10' },
  });
  expect(await screen.findByDisplayValue('Restored synthetic brief')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Administrator notes and proposed actions'), {
    target: { value: 'Synthetic update' },
  });
  expect(screen.getByLabelText('Authorized residence')).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Save review workspace' }));
  expect(await screen.findByText(/Server revision 5/)).toBeInTheDocument();
  expect(api.save).toHaveBeenCalledWith(10, 4, { ...document, notes: 'Synthetic update' });
});
it('does not imply success or retry a stale/uncertain save', async () => {
  api.save.mockRejectedValue(
    new Error('Another session saved this workspace. Reload server state.'),
  );
  render(<CollaborationWorkspace actorId={1} />);
  fireEvent.change(await screen.findByLabelText('Authorized residence'), {
    target: { value: '10' },
  });
  fireEvent.change(await screen.findByLabelText('Brief for manual handoff'), {
    target: { value: 'Unsaved synthetic edit' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save review workspace' }));
  expect(await screen.findByText(/Another session saved this workspace/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save review workspace' })).toBeDisabled();
  expect(screen.getByDisplayValue('Unsaved synthetic edit')).toBeDisabled();
  expect(api.save).toHaveBeenCalledTimes(1);
});
