import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { authFlowPath, locationReturnPath, type RoleKey } from '@recoveryos/domain';
import { LoadingState } from '@recoveryos/ui';
import { useAuth } from './AuthContext';

/** Accessible top-level loading boundary shown while the session/identity resolves. */
function AuthLoading() {
  return <LoadingState label="Getting things ready…" />;
}

/**
 * Route guards. These protect navigation only — real enforcement lives in
 * Postgres row-level security. Never treat a passing guard as authorization.
 */

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, session } = useAuth();
  const location = useLocation();
  if (!ready) return <AuthLoading />;
  if (!session) {
    return <Navigate to={authFlowPath('/sign-in', locationReturnPath(location))} replace />;
  }
  return <>{children}</>;
}

/** Requires a provisioned person record; otherwise routes to onboarding. */
export function RequirePerson({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { ready, session, person } = useAuth();
  if (!ready) return <AuthLoading />;
  if (!session)
    return <Navigate to={authFlowPath('/sign-in', locationReturnPath(location))} replace />;
  if (!person)
    return <Navigate to={authFlowPath('/onboarding', locationReturnPath(location))} replace />;
  return <>{children}</>;
}

export function RequireRole({
  anyOf,
  children,
  fallbackPath = '/not-authorized',
}: {
  anyOf: readonly RoleKey[];
  children: ReactNode;
  fallbackPath?: string;
}) {
  const location = useLocation();
  const { ready, session, person, roles } = useAuth();
  if (!ready) return <AuthLoading />;
  if (!session)
    return <Navigate to={authFlowPath('/sign-in', locationReturnPath(location))} replace />;
  if (!person)
    return <Navigate to={authFlowPath('/onboarding', locationReturnPath(location))} replace />;
  if (!anyOf.some((r) => roles.includes(r))) {
    return <Navigate to={fallbackPath} replace />;
  }
  return <>{children}</>;
}
