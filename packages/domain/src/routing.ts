import type { RoleKey } from './enums';

/**
 * Role-aware home resolution — the single answer to "where does this person
 * land after sign-in?". Route guards remain navigation-only; RLS/RPCs are the
 * authorization boundary. A person may hold several roles; the highest-privilege
 * workspace wins as the default landing, and the ExperienceSwitcher lets
 * legitimate multi-role users move between their workspaces.
 */
const ROLE_HOME_PRIORITY: Array<{ roles: RoleKey[]; home: string }> = [
  { roles: ['system_administrator', 'administrator', 'executive'], home: '/admin' },
  { roles: ['coach'], home: '/coach' },
  { roles: ['navigator'], home: '/navigator' },
  { roles: ['residence_manager', 'residence_staff', 'program_manager'], home: '/staff/today' },
  { roles: ['resident'], home: '/residence/today' },
  { roles: ['participant'], home: '/vrcc/today' },
];

export function homePathForRoles(roles: readonly RoleKey[]): string {
  for (const entry of ROLE_HOME_PRIORITY) {
    if (entry.roles.some((r) => roles.includes(r))) return entry.home;
  }
  // A signed-in person with no roles yet (mid-provisioning) starts as a participant.
  return '/vrcc/today';
}

/** The workspaces a multi-role person can switch between, in display order. */
export function workspacesForRoles(
  roles: readonly RoleKey[],
): Array<{ key: string; label: string; path: string }> {
  const out: Array<{ key: string; label: string; path: string }> = [];
  if (roles.includes('participant')) out.push({ key: 'vrcc', label: 'My Recovery', path: '/vrcc/today' });
  if (roles.includes('resident')) out.push({ key: 'residence', label: 'My Residence', path: '/residence/today' });
  if (roles.includes('coach')) out.push({ key: 'coach', label: 'Coach Workspace', path: '/coach' });
  if (roles.includes('navigator')) out.push({ key: 'navigator', label: 'Navigator', path: '/navigator' });
  if (roles.some((r) => r === 'residence_staff' || r === 'residence_manager' || r === 'program_manager'))
    out.push({ key: 'staff', label: 'Residence Operations', path: '/staff/today' });
  if (roles.some((r) => r === 'administrator' || r === 'executive' || r === 'system_administrator'))
    out.push({ key: 'admin', label: 'Administration', path: '/admin' });
  return out;
}
