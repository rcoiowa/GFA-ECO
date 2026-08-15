import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import type { ConsentType } from '@recoveryos/domain';
import { OnboardingPage } from './OnboardingPage';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  ensureMyPerson: vi.fn(),
  listMissingRequiredConsents: vi.fn(),
  recordConsentDecision: vi.fn(),
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@recoveryos/data-access', () => ({
  ensureMyPerson: mocks.ensureMyPerson,
  listMissingRequiredConsents: mocks.listMissingRequiredConsents,
  recordConsentDecision: mocks.recordConsentDecision,
}));

const TERMS: ConsentType = {
  id: 1,
  key: 'terms_of_use',
  category: 'account_identity' as ConsentType['category'],
  name: 'Terms of use and privacy notice',
  description: 'How RecoveryOS stores and protects your information.',
  is_required_for_service: true,
  is_active: true,
};
const SERVICE: ConsentType = {
  id: 2,
  key: 'service_participation',
  category: 'service_participation' as ConsentType['category'],
  name: 'Participation in recovery-support services',
  description: 'Consent to receive VRCC recovery-support services.',
  is_required_for_service: true,
  is_active: true,
};

const session = { user: { id: 'auth-1', user_metadata: { first_name: 'Sam', last_name: 'R' } } };
const person = { id: 10, first_name: 'Sam', preferred_name: null };

function authState(overrides: Record<string, unknown> = {}) {
  return {
    ready: true,
    session,
    person,
    roles: ['participant'],
    roleAssignments: [],
    refreshIdentity: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

const wrap = () =>
  render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue(authState());
  mocks.listMissingRequiredConsents.mockResolvedValue([TERMS, SERVICE]);
  mocks.recordConsentDecision.mockResolvedValue({});
});

describe('OnboardingPage — provisioning', () => {
  it('provisions the person for a signed-up user without one', async () => {
    const refreshIdentity = vi.fn();
    mocks.useAuth.mockReturnValue(authState({ person: null, roles: [], refreshIdentity }));
    mocks.ensureMyPerson.mockResolvedValue(person);
    wrap();
    await waitFor(() => expect(mocks.ensureMyPerson).toHaveBeenCalledOnce());
    expect(mocks.ensureMyPerson).toHaveBeenCalledWith({ firstName: 'Sam', lastName: 'R' });
    await waitFor(() => expect(refreshIdentity).toHaveBeenCalled());
  });
});

describe('OnboardingPage — minimal boundary for new participants', () => {
  it('asks the immediate-support question first (no diagnosis, no fields)', async () => {
    wrap();
    expect(await screen.findByText('Do you need support right now?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes — show me support options' })).toBeInTheDocument();
    // No data collection on this screen.
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('routes an immediate need straight to Support Now, before any consent', async () => {
    wrap();
    await userEvent.click(await screen.findByRole('button', { name: 'Yes — show me support options' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/support');
    expect(mocks.recordConsentDecision).not.toHaveBeenCalled();
  });

  it('keeps a public support path visible throughout the step', async () => {
    wrap();
    expect(await screen.findByRole('link', { name: 'Support options' })).toHaveAttribute(
      'href',
      '/support',
    );
  });

  it('shows each required consent as its own affirmative decision', async () => {
    wrap();
    await userEvent.click(
      await screen.findByRole('button', { name: /okay right now — continue/ }),
    );
    expect(screen.getByText('Terms of use and privacy notice')).toBeInTheDocument();
    expect(screen.getByText('Participation in recovery-support services')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    // Optional consents are not bundled into onboarding.
    expect(screen.queryByText(/Grace AI features/)).not.toBeInTheDocument();
    // Consent remains revocable and non-coercive: a person can leave.
    expect(screen.getByText(/withdraw any consent later/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out for now' })).toBeInTheDocument();
  });

  it('requires an affirmative check for every required consent', async () => {
    wrap();
    await userEvent.click(
      await screen.findByRole('button', { name: /okay right now — continue/ }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Agree and continue' }));
    expect(mocks.recordConsentDecision).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/needed to use the VRCC/);
    // Partial checking is still not enough.
    await userEvent.click(screen.getAllByRole('checkbox')[0]!);
    await userEvent.click(screen.getByRole('button', { name: 'Agree and continue' }));
    expect(mocks.recordConsentDecision).not.toHaveBeenCalled();
  });

  it('writes each consent through the existing append-only path, then continues', async () => {
    wrap();
    await userEvent.click(
      await screen.findByRole('button', { name: /okay right now — continue/ }),
    );
    for (const box of screen.getAllByRole('checkbox')) await userEvent.click(box);
    await userEvent.click(screen.getByRole('button', { name: 'Agree and continue' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/home'));
    expect(mocks.recordConsentDecision).toHaveBeenCalledTimes(2);
    expect(mocks.recordConsentDecision).toHaveBeenCalledWith({
      personId: 10,
      consentTypeId: 1,
      status: 'granted',
    });
    expect(mocks.recordConsentDecision).toHaveBeenCalledWith({
      personId: 10,
      consentTypeId: 2,
      status: 'granted',
    });
  });

  it('keeps what was chosen and says so when the save fails', async () => {
    mocks.recordConsentDecision.mockRejectedValue(new Error('offline'));
    wrap();
    await userEvent.click(
      await screen.findByRole('button', { name: /okay right now — continue/ }),
    );
    for (const box of screen.getAllByRole('checkbox')) await userEvent.click(box);
    await userEvent.click(screen.getByRole('button', { name: 'Agree and continue' }));
    expect(await screen.findByText(/couldn.t save your choices/)).toBeInTheDocument();
    for (const box of screen.getAllByRole('checkbox')) expect(box).toBeChecked();
  });
});

describe('OnboardingPage — pass-through (no loops, no capture)', () => {
  it('sends a participant who already satisfied the boundary straight on', async () => {
    mocks.listMissingRequiredConsents.mockResolvedValue([]);
    wrap();
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/home'));
    expect(screen.queryByText('Do you need support right now?')).not.toBeInTheDocument();
  });

  it('never captures staff roles in participant onboarding', async () => {
    mocks.useAuth.mockReturnValue(authState({ roles: ['coach'] }));
    wrap();
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/home'));
    expect(mocks.listMissingRequiredConsents).not.toHaveBeenCalled();
    expect(mocks.recordConsentDecision).not.toHaveBeenCalled();
  });

  it('honors a safe internal next parameter', async () => {
    mocks.listMissingRequiredConsents.mockResolvedValue([]);
    render(
      <MemoryRouter initialEntries={['/onboarding?next=/recovery-residences/my-application']}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/recovery-residences/my-application',
      ),
    );
  });
});
