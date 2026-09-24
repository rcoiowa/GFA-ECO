import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { App } from './App';
vi.mock('./public/useDesMoinesSky', () => ({
  useDesMoinesSky: () => ({ isDay: true, condition: 'clear', live: false, time: '2:00 PM' }),
}));

/**
 * Route-mount regression guard. Launch blocker #2 was exactly this failure
 * mode: the password-recovery arrival had no mounted handler (the email
 * linked to /sign-in and the set-new-password component was unmounted), so
 * the flow broke with every unit still "passing". These tests pin that the
 * service-critical public routes actually mount their pages.
 */
const mocks = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('@recoveryos/auth', () => ({
  useAuth: mocks.useAuth,
  RequireAuth: ({ children }: { children: ReactNode }) => <>{children}</>,
  RequireRole: ({ children }: { children: ReactNode }) => <>{children}</>,
  updatePassword: vi.fn(),
  requestPasswordReset: vi.fn(),
}));

const anonymous = {
  ready: true,
  session: null,
  person: null,
  roles: [],
  roleAssignments: [],
  refreshIdentity: vi.fn(),
  signOut: vi.fn(),
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue(anonymous);
});

describe('service-critical public routes stay mounted', () => {
  it('/community-center exposes the same four doors without requiring a custom hostname', () => {
    renderAt('/community-center');
    expect(
      screen.getByRole('heading', { name: 'Iowa’s Recovery Community Center' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'Enter the Recovery Community Center and choose what you need',
      }),
    ).toHaveAttribute('href', '#front-door');
    for (const [name, path] of [
      ['I need support now', '/support'],
      ['I want to connect and grow', '/register'],
      ['I am looking for recovery housing', '/recovery-residences'],
      ['I already have an account', '/sign-in'],
    ] as const) {
      expect(screen.getByRole('link', { name: new RegExp(name) })).toHaveAttribute('href', path);
    }
    expect(screen.getByRole('status')).toHaveTextContent('Live weather unavailable');
  });

  it('/reset-password mounts the recovery handler (not sign-in, not 404)', () => {
    renderAt('/reset-password');
    expect(screen.getByText('Choose a new password')).toBeInTheDocument();
  });

  it('/forgot-password mounts the reset-request page', () => {
    renderAt('/forgot-password');
    expect(screen.getByText('Reset your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
  });

  it('/support mounts the anonymous safety path', () => {
    renderAt('/support');
    expect(screen.getByRole('heading', { name: 'Support, right now' })).toBeInTheDocument();
  });
});
