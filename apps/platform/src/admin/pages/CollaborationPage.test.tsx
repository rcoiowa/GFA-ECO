import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CollaborationWorkspace } from './CollaborationPage';
const api = vi.hoisted(() => ({
  gate: vi.fn(),
  residences: vi.fn(),
  intakes: vi.fn(),
  roster: vi.fn(),
}));
vi.mock('@recoveryos/data-access', () => ({
  getAdminOperationsSummary: api.gate,
  adminListResidences: api.residences,
  listApplicationIntake: api.intakes,
  listResidenceRoster: api.roster,
}));
beforeEach(() => {
  vi.resetAllMocks();
  api.gate.mockResolvedValue({ ok: true });
  api.residences.mockResolvedValue([{ id: 10 }]);
  api.intakes.mockResolvedValue([]);
  api.roster.mockResolvedValue([]);
});
describe('admin collaboration local workspace', () => {
  it('fails closed when backend administrator context is denied', async () => {
    api.gate.mockResolvedValue({ ok: false });
    render(<CollaborationWorkspace actorId={1} />);
    expect(await screen.findByText(/Administrator context unavailable/)).toBeInTheDocument();
    expect(api.residences).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Extract review batch' })).not.toBeInTheDocument();
  });
  it('extracts an anonymized batch with duplicate cues and an evidence review trail', async () => {
    render(<CollaborationWorkspace actorId={1} />);
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
    expect(screen.getByText(/Local review and edit history \(1\)/)).toBeInTheDocument();
  });
});
