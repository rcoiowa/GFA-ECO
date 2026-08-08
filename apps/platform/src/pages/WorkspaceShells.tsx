import { Navigate, useLocation } from 'react-router';
import { RequireRole, useAuth } from '@recoveryos/auth';
import { AppShell, Card, CardTitle, EmptyState, LoadingState } from '@recoveryos/ui';
import { workspacesForRoles } from '@recoveryos/domain';
import { Link } from 'react-router';

/**
 * P4A canonical workspace shells. Honest arrival states for the workspaces
 * whose product slices land later (Coach P4C, Navigator P4E, Admin P4G) —
 * role-guarded routes with a real shell so navigation, switching, and
 * deep-link behavior are correct from day one. No fake UI.
 */

function WorkspaceArrival({
  title,
  lede,
  arriving,
}: {
  title: string;
  lede: string;
  arriving: string;
}) {
  const { roles } = useAuth();
  const workspaces = workspacesForRoles(roles);
  return (
    <AppShell
      productName="RecoveryOS"
      experience="professional"
      contextLabel={title}
      navItems={[{ to: '.', label: 'Home' }]}
      utilities={null}
    >
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <Card>
          <CardTitle>{title}</CardTitle>
          <p className="mt-1 text-ink-muted">{lede}</p>
        </Card>
        <EmptyState
          title={`${title} is on its way`}
          message={`This workspace arrives in ${arriving}. Your account and role are already set up — nothing to do here yet.`}
        />
        {workspaces.length > 1 ? (
          <Card>
            <CardTitle>Your workspaces</CardTitle>
            <ul className="mt-2 space-y-1">
              {workspaces.map((w) => (
                <li key={w.key}>
                  <Link className="text-experience-700 underline-offset-2 hover:underline" to={w.path}>
                    {w.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

export function CoachWorkspaceShell() {
  return (
    <RequireRole anyOf={['coach', 'administrator', 'system_administrator']}>
      <WorkspaceArrival
        title="Coach Workspace"
        lede="Who needs you, who you're meeting today, and who's waiting for connection."
        arriving="the Coach Workspace release (P4C)"
      />
    </RequireRole>
  );
}

export function NavigatorWorkspaceShell() {
  return (
    <RequireRole anyOf={['navigator', 'administrator', 'system_administrator']}>
      <WorkspaceArrival
        title="Navigator Workspace"
        lede="Navigation requests, resources, referrals, and warm handoffs."
        arriving="the Navigator release (P4E)"
      />
    </RequireRole>
  );
}

/**
 * /residences — role-aware dispatcher for the residence umbrella. Residents go
 * to their residence experience, residence staff to operations; the full
 * consolidation under this path is P4F. Public directory stays at
 * /recovery-residences (live links preserved).
 */
export function ResidencesDispatcher() {
  const { ready, session, person, roles } = useAuth();
  if (!ready) return <LoadingState label="Opening residences…" />;
  if (!session) return <Navigate to="/sign-in" replace />;
  if (!person) return <Navigate to="/onboarding" replace />;
  if (roles.some((r) => r === 'residence_staff' || r === 'residence_manager' || r === 'program_manager'))
    return <Navigate to="/staff/today" replace />;
  if (roles.includes('resident')) return <Navigate to="/residence/today" replace />;
  return <Navigate to="/recovery-residences" replace />;
}

/** Splat-preserving redirect for the legacy /app/* participant paths → /vrcc/*. */
export function LegacyAppRedirect() {
  const location = useLocation();
  const target = location.pathname.replace(/^\/app/, '/vrcc') + location.search;
  return <Navigate to={target} replace />;
}
