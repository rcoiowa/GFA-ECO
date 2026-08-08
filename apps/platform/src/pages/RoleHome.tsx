import { Navigate } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { homePathForRoles } from '@recoveryos/domain';
import { LoadingState } from '@recoveryos/ui';

/**
 * /home — the single role-aware landing resolver. Sign-in and onboarding send
 * people here; the highest-privilege workspace wins as the default, and
 * multi-role users switch workspaces from within the shells. Route checks are
 * UX only — RLS/RPCs remain the security boundary.
 */
export function RoleHome() {
  const { ready, session, person, roles } = useAuth();
  if (!ready) return <LoadingState label="Getting things ready…" />;
  if (!session) return <Navigate to="/sign-in" replace />;
  if (!person) return <Navigate to="/onboarding" replace />;
  return <Navigate to={homePathForRoles(roles)} replace />;
}
