import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('fails safe on a read failure: blocks with a retry, never silently grants (P0-2)', async () => {
    mocks.listMissingRequiredConsents.mockRejectedValue(new Error('offline'));
    wrap();
    expect(
      await screen.findByText(/couldn’t confirm your consent choices/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('participant space')).not.toBeInTheDocument();
  });

  it('recovers through the retry action once the read succeeds', async () => {
    mocks.listMissingRequiredConsents
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([]);
    wrap();
    const retry = await screen.findByRole('button', { name: /try again/i });
    fireEvent.click(retry);
    expect(await screen.findByText('participant space')).toBeInTheDocument();
    expect(mocks.listMissingRequiredConsents).toHaveBeenCalledTimes(2);
  });
});
