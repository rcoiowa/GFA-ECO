import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { workspacesForRoles } from '@recoveryos/domain';

/**
 * Shown only when the person holds more than one authorized workspace.
 * Explicit about the active context; never implies universal access. The
 * workspace list comes from the canonical role→workspace mapping in
 * @recoveryos/domain (coach/navigator/admin included as those slices land).
 */
export function ExperienceSwitcher({ current }: { current: string }) {
  const { roles } = useAuth();
  // Every provisioned person may use the VRCC participant experience, even
  // before an explicit participant role lands.
  const workspaces = workspacesForRoles(
    roles.includes('participant') ? roles : (['participant', ...roles] as typeof roles),
  );

  if (workspaces.length < 2) return null;
  const active = workspaces.find((w) => w.key === current);
  const targets = workspaces.filter((w) => w.key !== current);
  if (targets.length === 0) return null;

  return (
    <div className="rounded-md border border-line bg-surface-sunken/60 px-3 py-2 text-sm">
      <p className="text-ink-faint">
        You're viewing <span className="font-medium text-ink-muted">{active?.label ?? 'this workspace'}</span>
      </p>
      {targets.map((target) => (
        <Link
          key={target.key}
          to={target.path}
          className="block font-medium text-experience-700 underline underline-offset-2"
        >
          Switch to {target.label}
        </Link>
      ))}
    </div>
  );
}
