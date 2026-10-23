import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { RequireAuth, RequireRole } from '@recoveryos/auth';
import { SignInPage } from './SignInPage';
import { RegisterPage } from './RegisterPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { OnboardingConsentGate } from '../components/OnboardingConsentGate';
const m = vi.hoisted(() => ({
  state: { ready: true, session: null as unknown, person: null as unknown, roles: [] as string[] },
  signIn: vi.fn(),
  signUp: vi.fn(),
  reset: vi.fn(),
  update: vi.fn(),
  missing: vi.fn(),
  ensure: vi.fn(),
}));
vi.mock('@recoveryos/data-access', () => ({
  getSupabase: () => ({
    auth: {
      signInWithPassword: m.signIn,
      signUp: m.signUp,
      resetPasswordForEmail: m.reset,
      updateUser: m.update,
    },
  }),
  listMissingRequiredConsents: m.missing,
  ensureMyPerson: m.ensure,
  recordConsentDecision: vi.fn(),
}));
vi.mock('../../../../packages/auth/src/AuthContext', () => ({ useAuth: () => m.state }));
vi.mock('../lib/analytics', () => ({ track: vi.fn() }));
function Probe() {
  const l = useLocation();
  return <p data-testid="destination">{l.pathname + l.search + l.hash}</p>;
}
function mount(entry: string | { pathname: string; state: unknown }) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/my-housing/*"
          element={
            <RequireAuth>
              <Probe />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/access"
          element={
            <RequireRole anyOf={['administrator']}>
              <Probe />
            </RequireRole>
          }
        />
        <Route
          path="/vrcc/resources"
          element={
            <RequireAuth>
              <OnboardingConsentGate>
                <Probe />
              </OnboardingConsentGate>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  );
}
function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
beforeEach(() => {
  vi.clearAllMocks();
  m.state = { ready: true, session: null, person: null, roles: [] };
  m.signIn.mockImplementation(async () => {
    m.state.session = { user: { id: 'synthetic' } };
    return { error: null };
  });
  m.signUp.mockResolvedValue({ data: { session: null }, error: null });
  m.reset.mockResolvedValue({ error: null });
  m.update.mockResolvedValue({ error: null });
  m.missing.mockResolvedValue([]);
});
describe('auth destination journeys', () => {
  it.each(['/my-housing/documents/resident_handbook', '/residence/documents/resident_handbook'])(
    'preserves document intent through sign-in/register links and successful return: %s',
    async (destination) => {
      mount(`/sign-in?next=${encodeURIComponent(destination)}`);
      expect(screen.getByRole('link', { name: 'Create your account' })).toHaveAttribute(
        'href',
        `/register?next=${encodeURIComponent(destination)}`,
      );
      fill('Email', 'synthetic@example.test');
      fill('Password', 'synthetic-passphrase');
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
      expect(await screen.findByTestId('destination')).toHaveTextContent(destination);
    },
  );

  it('keeps guarded housing intent through registration, email callback, refresh and sign-in', async () => {
    const first = mount('/my-housing/consent?tab=overview#main');
    fireEvent.click(await screen.findByRole('link', { name: 'Create your account' }));
    fill('First name', 'Synthetic');
    fill('Last name', 'Example');
    fill('Email', 'synthetic@example.test');
    fill('Password', 'synthetic-passphrase');
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await screen.findByText(/One more step/);
    const callback = m.signUp.mock.calls[0]![0].options.emailRedirectTo;
    expect(callback).toContain('/sign-in?next=%2Fmy-housing%2Fconsent%3Ftab%3Doverview%23main');
    expect(screen.getByRole('button', { name: 'Go to sign in' })).toBeInTheDocument();
    first.unmount();
    const url = new URL(callback);
    mount(url.pathname + url.search);
    fill('Email', 'synthetic@example.test');
    fill('Password', 'synthetic-passphrase');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByTestId('destination')).toHaveTextContent(
      '/my-housing/consent?tab=overview#main',
    );
    expect(m.ensure).not.toHaveBeenCalled();
  });
  it('returns immediate-session housing signup without participant provisioning', async () => {
    m.signUp.mockImplementation(async () => {
      m.state.session = { user: { id: 'synthetic' } };
      return { data: { session: m.state.session }, error: null };
    });
    mount('/register?next=%2Fmy-housing%2Fconsent');
    fill('First name', 'Synthetic');
    fill('Last name', 'Example');
    fill('Email', 'synthetic@example.test');
    fill('Password', 'synthetic-passphrase');
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByTestId('destination')).toHaveTextContent('/my-housing/consent');
    expect(m.ensure).not.toHaveBeenCalled();
  });
  it('retains intent when an expired recovery link must be requested again', async () => {
    mount('/reset-password?next=%2Fmy-housing%2Fdocuments');
    expect(screen.getByRole('link', { name: 'Send a new reset link' })).toHaveAttribute(
      'href',
      '/forgot-password?next=%2Fmy-housing%2Fdocuments',
    );
  });
  it('carries recovery intent into a new-tab reset callback and completion', async () => {
    const first = mount('/sign-in?next=%2Fmy-housing%2Fdocuments');
    fireEvent.click(screen.getByRole('link', { name: 'Forgot your password?' }));
    fill('Email', 'synthetic@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    await screen.findByText(/reset link is on its way/);
    const callback = new URL(m.reset.mock.calls[0]![1].redirectTo);
    expect(callback.searchParams.get('next')).toBe('/my-housing/documents');
    first.unmount();
    m.state.session = { user: { id: 'synthetic' } };
    mount(callback.pathname + callback.search);
    fill('New password', 'synthetic-passphrase');
    fill('Confirm new password', 'synthetic-passphrase');
    fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    expect(await screen.findByTestId('destination')).toHaveTextContent('/my-housing/documents');
  });
  it('rechecks role authorization after sign-in instead of treating next as authority', async () => {
    mount('/admin/access');
    fill('Email', 'synthetic@example.test');
    fill('Password', 'synthetic-passphrase');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    m.state.person = { id: 1 };
    await waitFor(() =>
      expect(screen.getByTestId('destination')).toHaveTextContent('/not-authorized'),
    );
  });
  it('rejects an untrusted legacy router-state destination', async () => {
    mount({ pathname: '/sign-in', state: { from: '//evil.test' } });
    fill('Email', 'synthetic@example.test');
    fill('Password', 'synthetic-passphrase');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByTestId('destination')).toHaveTextContent('/home');
  });
  it('preserves an interrupted onboarding destination while signed out', async () => {
    mount('/onboarding?next=%2Fvrcc%2Fresources');
    expect(await screen.findByRole('link', { name: 'Create your account' })).toHaveAttribute(
      'href',
      '/register?next=%2Fvrcc%2Fresources',
    );
  });
  it('returns through consent onboarding to the guarded destination once complete', async () => {
    m.state.session = { user: { id: 'synthetic' } };
    m.state.person = { id: 1 };
    m.state.roles = ['participant'];
    m.missing.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValue([]);
    mount('/vrcc/resources?tab=overview#main');
    expect(await screen.findByTestId('destination')).toHaveTextContent(
      '/vrcc/resources?tab=overview#main',
    );
    expect(m.missing).toHaveBeenCalledTimes(3);
  });
});
