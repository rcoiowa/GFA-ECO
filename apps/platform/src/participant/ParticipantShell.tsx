import { Link, Outlet } from 'react-router';
import { AppShell, type NavItem } from '@recoveryos/ui';
import { SupportNowButton } from '@recoveryos/safety';
import { useAuth } from '@recoveryos/auth';
import { ExperienceSwitcher } from '../components/ExperienceSwitcher';

/** The seven VRCC participant destinations. Do not add an eighth casually. */
const NAV_ITEMS: NavItem[] = [
  { to: '/app/today', label: 'Today' },
  { to: '/app/recovery', label: 'My Recovery', shortLabel: 'Recovery' },
  { to: '/app/connect', label: 'Connect' },
  { to: '/app/learn', label: 'Learn' },
  { to: '/app/tools', label: 'Tools' },
  { to: '/app/resources', label: 'Resources' },
  { to: '/app/journey', label: 'My Journey', shortLabel: 'Journey' },
];

export function ParticipantShell() {
  const { person, signOut } = useAuth();
  const displayName = person?.preferred_name || person?.first_name || 'Friend';

  return (
    <AppShell
      productName="VRCC"
      contextLabel={`Welcome, ${displayName}`}
      navItems={NAV_ITEMS}
      experience="vrcc"
      utilities={
        <div className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-3">
          <SupportNowButton basePath="/app" className="md:w-full" />
          <ExperienceSwitcher current="vrcc" />
          <div className="hidden md:flex md:items-center md:justify-between">
            <Link to="/app/profile" className="text-sm text-ink-muted hover:text-ink">
              Profile
            </Link>
            <Link to="/app/privacy" className="text-sm text-ink-muted hover:text-ink">
              Privacy
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-sm text-ink-muted hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}
