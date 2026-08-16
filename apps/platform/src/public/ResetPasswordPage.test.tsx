import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { ResetPasswordPage } from './ResetPasswordPage';

/**
 * Regression guard for launch blocker #2 (password-reset completion was
 * BROKEN: reset email linked to /sign-in, updatePassword was unmounted —
 * fixed in b1eb4ef with no tests). These tests pin the repaired behavior:
 * the recovery arrival is handled without an auth guard, expired links get
 * a way forward instead of a dead-end, and completion goes through the
 * wrapped updatePassword action.
 */
const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  updatePassword: vi.fn(),
}));
vi.mock('@recoveryos/auth', () => ({
  useAuth: mocks.useAuth,
  updatePassword: mocks.updatePassword,
}));

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

const wrap = () =>
  render(
    <MemoryRouter initialEntries={['/reset-password']}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updatePassword.mockResolvedValue(null);
});

describe('ResetPasswordPage', () => {
  it('waits for the recovery token to resolve before judging the link', () => {
    mocks.useAuth.mockReturnValue({ ready: false, session: null });
    wrap();
    expect(screen.getByText('Checking your reset link…')).toBeInTheDocument();
    expect(screen.queryByText(/invalid or has expired/)).not.toBeInTheDocument();
  });

  it('gives an expired/invalid link a way forward, not a dead-end', () => {
    mocks.useAuth.mockReturnValue({ ready: true, session: null });
    wrap();
    expect(screen.getByText(/invalid or has expired/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Send a new reset link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('validates locally without calling the server', async () => {
    mocks.useAuth.mockReturnValue({ ready: true, session: { user: { id: 'u1' } } });
    wrap();
    await userEvent.type(screen.getByLabelText('New password'), 'short');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('New password'));
    await userEvent.clear(screen.getByLabelText('Confirm new password'));
    await userEvent.type(screen.getByLabelText('New password'), 'a-long-enough-password');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'a-different-password');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(screen.getByText('Those two passwords don’t match.')).toBeInTheDocument();
    expect(mocks.updatePassword).not.toHaveBeenCalled();
  });

  it('completes: updatePassword is called and the person can continue to /home', async () => {
    mocks.useAuth.mockReturnValue({ ready: true, session: { user: { id: 'u1' } } });
    wrap();
    await userEvent.type(screen.getByLabelText('New password'), 'a-long-enough-password');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'a-long-enough-password');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    await waitFor(() => expect(screen.getByText(/Your password is updated/)).toBeInTheDocument());
    expect(mocks.updatePassword).toHaveBeenCalledWith('a-long-enough-password');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/home');
  });

  it('surfaces a server failure and keeps the form usable', async () => {
    mocks.useAuth.mockReturnValue({ ready: true, session: { user: { id: 'u1' } } });
    mocks.updatePassword.mockResolvedValue('Something didn’t work. Please try again.');
    wrap();
    await userEvent.type(screen.getByLabelText('New password'), 'a-long-enough-password');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'a-long-enough-password');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(await screen.findByText('Something didn’t work. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save new password' })).toBeEnabled();
  });
});
