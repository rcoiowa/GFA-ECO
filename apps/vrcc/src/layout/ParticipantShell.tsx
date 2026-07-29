import { Link, Outlet } from 'react-router';
import { AppShell, type NavItem } from '@recoveryos/ui';
import { SupportNowButton } from '@recoveryos/safety';
import { useAuth } from '@recoveryos/auth';

/** The seven VRCC participant destinations. Do not add an eighth casually. */
const NAV_ITEMS: NavItem[] = [
  { to: '/today', label: 'Today' },
  { to: '/recovery', label: 'My Recovery', shortLabel: 'Recovery' },
  { to: '/connect', label: 'Connect' },
  { to: '/learn', label: 'Learn' },
  { to: '/tools', label: 'Tools' },
  { to: '/resources', label: 'Resources' },
  { to: '/journey', label: 'My Journey', shortLabel: 'Journey' },
];

export function ParticipantShell() {
  const { person, signOut } = useAuth();
  const displayName = person?.preferred_name || person?.first_name || 'Friend';

  return (
    <AppShell
      productName="VRCC"
      contextLabel={`Welcome, ${displayName}`}
      navItems={NAV_ITEMS}
      utilities={
        <div className="flex items-center gap-2 md:flex-col md:items-stretch">
          <SupportNowButton className="md:w-full" />
          <div className="hidden md:flex md:items-center md:justify-between md:pt-2">
            <Link to="/profile" className="text-sm text-ink-muted hover:text-ink">
              Profile
            </Link>
            <Link to="/privacy" className="text-sm text-ink-muted hover:text-ink">
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
