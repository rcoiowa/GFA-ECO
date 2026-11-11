import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HousingFollowThrough } from './HousingFollowThrough';
import type { ResidenceApplicationIntake } from '@recoveryos/data-access';
const api = vi.hoisted(() => ({ load: vi.fn(), act: vi.fn(), contacts: vi.fn() }));
vi.mock('@recoveryos/auth', () => ({ useAuth: () => ({ person: { id: 2 } }) }));
vi.mock('@recoveryos/data-access', () => ({
  loadHousingFollowThrough: api.load,
  actHousingFollowThrough: api.act,
  loadLinkedHousingContacts: api.contacts,
}));
const intake = {
  id: 100,
  source: 'synthetic',
  status: 'converted',
  converted_person_id: 5,
  converted_application_id: 500,
  review_notes: 'Synthetic prior contact confirmed',
} as ResidenceApplicationIntake;
const state = {
  intake_id: 100,
  owner_person_id: 1,
  proposed_cover_person_id: 2,
  version: 7,
  next_action: 'Clarify timing',
  due_at: '2026-10-25T12:00:00Z',
  bed_state: 'unverified',
  closed_at: null,
};
beforeEach(() => {
  vi.stubEnv('VITE_HOUSING_FOLLOW_THROUGH_ENABLED', 'true');
  vi.resetAllMocks();
  api.load.mockResolvedValue({ state, events: [] });
  api.contacts.mockResolvedValue([]);
  api.act.mockResolvedValue({ ...state, owner_person_id: 2 });
});
afterEach(() => vi.unstubAllEnvs());
describe('housing controls', () => {
  it('requires explicit acceptance and keeps the open commitment visible after conversion', async () => {
    render(<HousingFollowThrough intake={intake} />);
    fireEvent.click(screen.getByText(/Housing follow-through · intake/));
    fireEvent.click(await screen.findByRole('button', { name: 'Accept housing ownership' }));
    await waitFor(() => expect(api.act).toHaveBeenCalledWith(100, 7, 'accept_cover', {}));
    expect(screen.getByText(/Outstanding housing commitment: Clarify timing/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close housing follow-through' })).toBeDisabled();
  });
  it('fails closed when the housing backend cannot be read', async () => {
    api.load.mockRejectedValue(new Error('not_authorized'));
    render(<HousingFollowThrough intake={intake} />);
    fireEvent.click(screen.getByText(/Housing follow-through · intake/));
    expect(await screen.findByText(/Housing follow-through unavailable/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Take housing ownership' })).toBeDisabled();
    expect(api.act).not.toHaveBeenCalled();
  });
  it('does not call unactivated housing or inquiry APIs', () => {
    vi.stubEnv('VITE_HOUSING_FOLLOW_THROUGH_ENABLED', 'false');
    render(<HousingFollowThrough intake={intake} />);
    expect(screen.getByText(/Housing controls await/)).toBeInTheDocument();
    expect(api.load).not.toHaveBeenCalled();
    expect(api.contacts).not.toHaveBeenCalled();
  });
});
