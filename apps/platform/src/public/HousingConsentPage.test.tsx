import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { HousingConsentPage } from './HousingConsentPage';
const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  listActiveConsentTypes: vi.fn(),
  listMyConsentGrants: vi.fn(),
  recordResidenceConsentGrant: vi.fn(),
  revokeConsentGrant: vi.fn(),
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@recoveryos/data-access', () => mocks);
const wrap = () =>
  render(
    <MemoryRouter>
      <HousingConsentPage />
    </MemoryRouter>,
  );
beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue({ person: { id: 44 } });
  mocks.listMyConsentGrants.mockResolvedValue([]);
  mocks.listActiveConsentTypes.mockResolvedValue([
    { id: 1, key: 'residence_screening', name: 'Screening' },
    { id: 2, key: 'information_disclosure', name: 'Release of information' },
  ]);
  mocks.recordResidenceConsentGrant.mockResolvedValue({ ok: true });
  mocks.revokeConsentGrant.mockResolvedValue({ ok: true });
});
describe('housing consent', () => {
  it('uses the validated self consent RPC; never offers blanket disclosure', async () => {
    wrap();
    fireEvent.click(await screen.findByRole('button', { name: 'I give screening consent' }));
    await waitFor(() =>
      expect(mocks.recordResidenceConsentGrant).toHaveBeenCalledWith({
        personId: 44,
        typeKey: 'residence_screening',
      }),
    );
    expect(screen.queryByRole('button', { name: 'Allow' })).not.toBeInTheDocument();
    expect(mocks.listMyConsentGrants).toHaveBeenCalledWith(44);
  });
  it('revokes the existing grant rather than appending a contradictory decision', async () => {
    mocks.listMyConsentGrants.mockResolvedValue([
      { id: 7, consent_type_id: 1, status: 'granted', revoked_at: null, expires_at: null },
    ]);
    wrap();
    fireEvent.click(await screen.findByRole('button', { name: 'Withdraw this permission' }));
    await waitFor(() => expect(mocks.revokeConsentGrant).toHaveBeenCalledWith({ grantId: 7 }));
  });
  it('does not present an unscoped release as usable permission', async () => {
    mocks.listMyConsentGrants.mockResolvedValue([
      { id: 8, consent_type_id: 2, status: 'granted', revoked_at: null, expires_at: null, scope: {} },
    ]);
    wrap();
    expect(await screen.findByText('Permission recorded — review the details below')).toBeInTheDocument();
    expect(screen.queryByText('Currently allowed')).not.toBeInTheDocument();
    expect(screen.getByText(/this screen does not establish permission to share/)).toBeInTheDocument();
    expect(mocks.recordResidenceConsentGrant).not.toHaveBeenCalled();
    expect(mocks.revokeConsentGrant).not.toHaveBeenCalled();
  });
  it('does not describe expired permission as active', async () => {
    mocks.listMyConsentGrants.mockResolvedValue([
      { id: 7, consent_type_id: 1, status: 'granted', revoked_at: null, expires_at: '2000-01-01' },
    ]);
    wrap();
    expect(
      await screen.findByRole('button', { name: 'I give screening consent' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Currently allowed')).not.toBeInTheDocument();
  });
});
