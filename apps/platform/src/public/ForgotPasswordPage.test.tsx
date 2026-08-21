import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ForgotPasswordPage } from './ForgotPasswordPage';

/**
 * Regression guard for launch blocker #2: the original defect sent the reset
 * email to /sign-in, which has no recovery handler. The redirect target is
 * the load-bearing value — it must point at /reset-password.
 */
const mocks = vi.hoisted(() => ({ requestPasswordReset: vi.fn() }));
vi.mock('@recoveryos/auth', () => ({ requestPasswordReset: mocks.requestPasswordReset }));

const wrap = () =>
  render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requestPasswordReset.mockResolvedValue(null);
});

describe('ForgotPasswordPage', () => {
  it('sends the reset email pointed at /reset-password (the recovery handler)', async () => {
    wrap();
    await userEvent.type(screen.getByLabelText('Email'), 'sam@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(mocks.requestPasswordReset).toHaveBeenCalledWith(
      'sam@example.com',
      `${window.location.origin}/reset-password`,
    );
  });

  it('confirms identically whether or not the account exists (no enumeration)', async () => {
    mocks.requestPasswordReset.mockResolvedValue('rate limit');
    wrap();
    await userEvent.type(screen.getByLabelText('Email'), 'unknown@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText(/a reset link is on its way/)).toBeInTheDocument();
  });
});
