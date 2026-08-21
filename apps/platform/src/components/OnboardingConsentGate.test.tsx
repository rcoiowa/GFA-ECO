import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { OnboardingConsentGate } from './OnboardingConsentGate';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  listMissingRequiredConsents: vi.fn(),
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@recoveryos/data-access', () => ({
  listMissingRequiredConsents: mocks.listMissingRequiredConsents,
}));

const person = { id: 10, first_name: 'Sam' };

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

const wrap = () =>
  render(
    <MemoryRouter initialEntries={['/vrcc/today']}>
      <Routes>
        <Route
          path="/vrcc/today"
          element={
            <OnboardingConsentGate>
              <p>participant space</p>
            </OnboardingConsentGate>
          }
        />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue({ person, roles: ['participant'] });
});

describe('OnboardingConsentGate', () => {
  it('routes a participant with missing required consent to onboarding', async () => {
    mocks.listMissingRequiredConsents.mockResolvedValue([{ id: 1, key: 'terms_of_use' }]);
    wrap();
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/onboarding'));
    expect(screen.queryByText('participant space')).not.toBeInTheDocument();
  });

  it('lets a participant who satisfied the boundary straight through (no loop)', async () => {
    mocks.listMissingRequiredConsents.mockResolvedValue([]);
    wrap();
    expect(await screen.findByText('participant space')).toBeInTheDocument();
  });

  it('never gates staff roles and reads nothing for them', async () => {
    mocks.useAuth.mockReturnValue({ person, roles: ['coach'] });
    wrap();
    expect(await screen.findByText('participant space')).toBeInTheDocument();
    expect(mocks.listMissingRequiredConsents).not.toHaveBeenCalled();
  });

  it('fails open on a read failure rather than locking the person out', async () => {
    mocks.listMissingRequiredConsents.mockRejectedValue(new Error('offline'));
    wrap();
    expect(await screen.findByText('participant space')).toBeInTheDocument();
  });
});
