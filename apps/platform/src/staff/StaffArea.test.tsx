import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { ROLE_KEYS, homePathForRoles, workspacesForRoles, type RoleKey } from '@recoveryos/domain';
import { StaffArea } from './StaffArea';

/**
 * Routing/authorization consistency guard (PR #6 review, P1). The defect: the
 * domain routing sent program_manager to /staff/today while StaffArea's gate
 * admitted only residence_staff/residence_manager, so a person whose highest
 * role is program_manager landed on the not-authorized page with no enterable
 * workspace. These tests pin the general invariant — every role the router
 * homes at /staff/today, and every role offered the staff workspace by the
 * switcher, must pass StaffArea's RequireRole gate. Route guards stay
 * navigation-only; RLS bounds what such a person can actually see.
 */
const mocks = vi.hoisted(() => ({
  capturedAnyOf: [] as Array<readonly string[]>,
}));
vi.mock('@recoveryos/auth', () => ({
  useAuth: vi.fn(),
  RequireRole: ({ anyOf }: { anyOf: readonly string[]; children?: ReactNode }) => {
    mocks.capturedAnyOf.push(anyOf);
    return null;
  },
}));

function gateRoles(): readonly string[] {
  mocks.capturedAnyOf.length = 0;
  render(
    <MemoryRouter initialEntries={['/staff/today']}>
      <StaffArea />
    </MemoryRouter>,
  );
  const first = mocks.capturedAnyOf[0];
  expect(first).toBeDefined();
  return first!;
}

// Real RequireRole semantics (packages/auth/src/guards.tsx): pass iff the
// person holds at least one of the gate's roles.
const passesGate = (anyOf: readonly string[], roles: readonly RoleKey[]) =>
  anyOf.some((r) => roles.includes(r as RoleKey));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('StaffArea gate stays consistent with role routing', () => {
  it('admits every role that homePathForRoles sends to /staff/today', () => {
    const anyOf = gateRoles();
    const homedAtStaff = ROLE_KEYS.filter((r) => homePathForRoles([r]) === '/staff/today');
    expect(homedAtStaff.length).toBeGreaterThan(0);
    for (const role of homedAtStaff) {
      expect(anyOf, `role "${role}" is homed at /staff/today but cannot enter StaffArea`).toContain(
        role,
      );
    }
  });

  it('admits every role the workspace switcher offers the staff workspace', () => {
    const anyOf = gateRoles();
    for (const role of ROLE_KEYS) {
      const offeredStaff = workspacesForRoles([role]).some((w) => w.path === '/staff/today');
      if (offeredStaff) {
        expect(passesGate(anyOf, [role]), `switcher offers /staff/today to "${role}"`).toBe(true);
      }
    }
  });

  it('program_manager specifically reaches an authorized workspace (the P1 regression)', () => {
    const anyOf = gateRoles();
    expect(homePathForRoles(['program_manager'])).toBe('/staff/today');
    expect(passesGate(anyOf, ['program_manager'])).toBe(true);
  });

  it('still rejects roles with no staff-workspace claim', () => {
    const anyOf = gateRoles();
    expect(passesGate(anyOf, ['participant'])).toBe(false);
    expect(passesGate(anyOf, ['resident'])).toBe(false);
  });
});
