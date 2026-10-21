import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { PrivacyConsentPage } from './PrivacyConsentPage';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  listActiveConsentTypes: vi.fn(),
  listMyConsentGrants: vi.fn(),
  recordConsentDecision: vi.fn(),
}));

vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@recoveryos/data-access', () => ({
  listActiveConsentTypes: mocks.listActiveConsentTypes,
  listMyConsentGrants: mocks.listMyConsentGrants,
  recordConsentDecision: mocks.recordConsentDecision,
}));

const grant = {
  id: 5,
  person_id: 21,
  consent_type_id: 9,
  status: 'granted',
  revoked_at: null,
  expires_at: null,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <PrivacyConsentPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue({ person: { id: 21 } });
  mocks.listActiveConsentTypes.mockResolvedValue([
    { id: 9, key: 'community_outreach', name: 'Community outreach', description: 'Optional contact' },
  ]);
  mocks.listMyConsentGrants.mockResolvedValue([]);
});

describe('general privacy consent state', () => {
  it('shows currently allowed only for an active, unrevoked grant', async () => {
    mocks.listMyConsentGrants.mockResolvedValue([grant]);
    renderPage();
    expect(await screen.findByText('Currently: allowed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Withdraw' })).toBeInTheDocument();
  });

  it('treats an expired grant as not allowed, without relying on status alone', async () => {
    mocks.listMyConsentGrants.mockResolvedValue([{ ...grant, expires_at: '2000-01-01T00:00:00Z' }]);
    renderPage();
    expect(await screen.findByText('Currently: not allowed (permission expired or withdrawn)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow' })).toBeInTheDocument();
    expect(screen.queryByText('Currently: allowed')).not.toBeInTheDocument();
  });

  it('treats a revoked grant as not allowed even if its stored status is granted', async () => {
    mocks.listMyConsentGrants.mockResolvedValue([{ ...grant, revoked_at: '2026-10-15T12:00:00Z' }]);
    renderPage();
    expect(await screen.findByText('Currently: not allowed (permission expired or withdrawn)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow' })).toBeInTheDocument();
  });

  it('does not render housing consent as a blanket general-consent toggle', async () => {
    mocks.listActiveConsentTypes.mockResolvedValue([
      { id: 7, key: 'information_disclosure', name: 'Information disclosure' },
    ]);
    renderPage();
    expect(await screen.findByText('Housing consent choices')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Allow' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage my housing consent' })).toHaveAttribute('href', '/my-housing/consent');
  });
});
