import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ExperienceSwitcher } from './ExperienceSwitcher';
const auth = vi.hoisted(() => ({
  roles: [] as string[],
  session: { user: { email: 'person@example.org' } },
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: () => auth }));
beforeEach(() => {
  auth.roles = [];
});
describe('Circle navigation hints', () => {
  it.each(['program_manager', 'administrator', 'executive'])(
    'offers documentation navigation to %s without granting recording',
    (role) => {
      auth.roles = [role];
      render(
        <MemoryRouter>
          <ExperienceSwitcher current="participant" />
        </MemoryRouter>,
      );
      expect(screen.getByRole('link', { name: 'Switch to Circle meetings' })).toHaveAttribute(
        'href',
        '/coach/circles',
      );
    },
  );
  it.each(['system_administrator', 'participant'])(
    'does not infer Circle eligibility from %s alone',
    (role) => {
      auth.roles = [role];
      render(
        <MemoryRouter>
          <ExperienceSwitcher current="participant" />
        </MemoryRouter>,
      );
      expect(
        screen.queryByRole('link', { name: 'Switch to Circle meetings' }),
      ).not.toBeInTheDocument();
    },
  );
});
