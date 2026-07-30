import { Outlet } from 'react-router';
import { AppShell, type NavItem } from '@recoveryos/ui';
import { useAuth } from '@recoveryos/auth';
import { useStaff } from './staffContext';

const NAV_ITEMS: NavItem[] = [
  { to: '/staff/today', label: 'Today' },
  { to: '/staff/beds', label: 'Bed Board', shortLabel: 'Beds' },
  { to: '/staff/applications', label: 'Applications', shortLabel: 'Apps' },
  { to: '/staff/screenings', label: 'Screenings' },
  { to: '/staff/incidents', label: 'Incidents' },
  { to: '/staff/compliance', label: 'Compliance' },
  { to: '/staff/fees', label: 'Fees' },
];

export function StaffShell() {
  const { signOut } = useAuth();
  const { residences, residence, setResidenceId } = useStaff();

  return (
    <AppShell
      productName="Residence Operations"
      contextLabel={residence?.name}
      navItems={NAV_ITEMS}
      experience="professional"
      utilities={
        <div className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-3">
          {residences.length > 1 ? (
            <select
              aria-label="Active residence"
              className="min-h-9 rounded-md border border-line bg-surface-raised px-2 text-sm text-ink"
              value={residence?.id ?? ''}
              onChange={(e) => setResidenceId(Number(e.target.value))}
            >
              {residences.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            onClick={() => void signOut()}
            className="hidden text-sm text-ink-muted hover:text-ink md:block"
          >
            Sign out
          </button>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}
