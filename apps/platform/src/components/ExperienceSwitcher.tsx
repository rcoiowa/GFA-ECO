import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';

/**
 * Shown only when the person holds more than one authorized experience.
 * Explicit about the active context; never implies universal access.
 */
export function ExperienceSwitcher({ current }: { current: 'vrcc' | 'residence' }) {
  const { roles } = useAuth();
  const hasResidence = roles.includes('resident');
  // Every provisioned person may use the VRCC participant experience.
  const options = [
    { key: 'vrcc' as const, label: 'VRCC', to: '/app/today' },
    ...(hasResidence
      ? [{ key: 'residence' as const, label: 'My Residence', to: '/residence/today' }]
      : []),
  ];

  if (options.length < 2) return null;

  const target = options.find((o) => o.key !== current);
  if (!target) return null;

  return (
    <div className="rounded-md border border-line bg-surface-sunken/60 px-3 py-2 text-sm">
      <p className="text-ink-faint">
        You're viewing{' '}
        <span className="font-medium text-ink-muted">
          {options.find((o) => o.key === current)?.label}
        </span>
      </p>
      <Link to={target.to} className="font-medium text-experience-700 underline underline-offset-2">
        Switch to {target.label}
      </Link>
    </div>
  );
}
