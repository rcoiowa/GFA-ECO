import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { AppShell, type NavItem } from '@recoveryos/ui';
import { SupportNowButton } from '@recoveryos/safety';
import { useAuth } from '@recoveryos/auth';
import { getMyActiveResidency } from '@recoveryos/data-access';
import { ExperienceSwitcher } from '../components/ExperienceSwitcher';

/** The seven resident destinations. */
const NAV_ITEMS: NavItem[] = [
  { to: '/residence/today', label: 'Today' },
  { to: '/residence/house', label: 'My Residence', shortLabel: 'Residence' },
  { to: '/residence/recovery', label: 'My Recovery', shortLabel: 'Recovery' },
  { to: '/residence/connect', label: 'Connect' },
  { to: '/residence/schedule', label: 'Schedule' },
  { to: '/residence/documents', label: 'Documents' },
  { to: '/residence/journey', label: 'My Journey', shortLabel: 'Journey' },
];

export function ResidentShell() {
  const { person, signOut } = useAuth();
  const [residenceName, setResidenceName] = useState<string | null>(null);

  useEffect(() => {
    if (!person) return;
    let cancelled = false;
    getMyActiveResidency(person.id)
      .then((residency) => {
        if (!cancelled) setResidenceName(residency?.residence.name ?? null);
      })
      .catch(() => {
        // Context label is informational; failure is non-fatal.
      });
    return () => {
      cancelled = true;
    };
  }, [person]);

  return (
    <AppShell
      productName="My Residence"
      contextLabel={residenceName ?? undefined}
      navItems={NAV_ITEMS}
      experience="residence"
      utilities={
        <div className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-3">
          <SupportNowButton basePath="/residence" className="md:w-full" />
          <ExperienceSwitcher current="residence" />
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
