import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { HousingApplicationPage } from './HousingApplicationPage';
import { safeAuthReturnPath } from './authReturnPath';
const mocks = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock('@recoveryos/auth', () => ({ useAuth: () => ({ session: null }) }));
vi.mock('@recoveryos/data-access', () => ({ submitResidenceApplicationIntake: mocks.submit }));
vi.mock('./TurnstileWidget', () => ({
  TURNSTILE_SITE_KEY: 'test-widget',
  TurnstileWidget: ({ onToken }: { onToken: (token: string) => void }) => (
    <button type="button" onClick={() => onToken('verified-test-token')}>
      Verify test
    </button>
  ),
}));
beforeEach(() => {
  vi.clearAllMocks();
  window.scrollTo = vi.fn();
});
function fill() {
  fireEvent.change(screen.getByLabelText(/Applicant’s name/), {
    target: { value: 'Test Applicant' },
  });
  fireEvent.change(screen.getByLabelText(/Phone number/), { target: { value: '5155550100' } });
  fireEvent.click(screen.getByLabelText(/18 or older/));
  fireEvent.click(screen.getByLabelText(/I agree that/));
  fireEvent.click(screen.getByRole('button', { name: 'Verify test' }));
}
describe('shared housing application', () => {
  it.each([
    ['grace-house', 1],
    ['ejwrh', 2],
  ] as const)(
    'submits %s without an account and offers account setup only after receipt',
    async (residence, id) => {
      mocks.submit.mockResolvedValue({ intakeId: 123 });
      render(
        <MemoryRouter>
          <HousingApplicationPage residence={residence} />
        </MemoryRouter>,
      );
      expect(screen.queryByRole('link', { name: 'Create my free account' })).toBeNull();
      fill();
      fireEvent.click(screen.getByRole('button', { name: 'Send my application' }));
      await screen.findByText('Application reference: 123');
      expect(mocks.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          residenceId: id,
          consentToContact: true,
          source: `recoveryos-${residence}`,
          turnstileToken: 'verified-test-token',
        }),
      );
      expect(screen.getByRole('link', { name: 'Create my free account' })).toHaveAttribute(
        'href',
        '/register?next=%2Frecovery-residences%2Fmy-application',
      );
    },
  );
  it('retains entries and does not claim success when receipt is missing', async () => {
    mocks.submit.mockResolvedValue({ intakeId: undefined });
    render(
      <MemoryRouter>
        <HousingApplicationPage residence="ejwrh" />
      </MemoryRouter>,
    );
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send my application' }));
    await waitFor(() => expect(screen.getByText(/couldn’t confirm receipt/)).toBeInTheDocument());
    expect(screen.getByLabelText(/Applicant’s name/)).toHaveValue('Test Applicant');
    expect(screen.queryByText('Your application was received.')).toBeNull();
  });
  it('blocks a contact method that has no destination', async () => {
    render(
      <MemoryRouter>
        <HousingApplicationPage residence="ejwrh" />
      </MemoryRouter>,
    );
    fill();
    fireEvent.change(screen.getByLabelText('Best way to reach you'), {
      target: { value: 'email' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send my application' }));
    expect(mocks.submit).not.toHaveBeenCalled();
  });
});
describe('authentication return routes', () => {
  it('retains the housing status route but refuses external or arbitrary destinations', () => {
    expect(safeAuthReturnPath('/recovery-residences/my-application')).toBe(
      '/recovery-residences/my-application',
    );
    for (const path of ['https://example.com', '//example.com', '/admin', '/\\example.com', null])
      expect(safeAuthReturnPath(path)).toBeNull();
  });
});
