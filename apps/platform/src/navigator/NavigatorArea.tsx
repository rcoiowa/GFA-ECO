import { Route, Routes } from 'react-router';
import { RequireRole } from '@recoveryos/auth';
import { AppShell } from '@recoveryos/ui';
import { SupportNowButton } from '@recoveryos/safety';
import { ExperienceSwitcher } from '../components/ExperienceSwitcher';
import { NavigatorHomePage } from './pages/NavigatorHomePage';
import { NavRequestsPage } from './pages/NavRequestsPage';
import { NavPeoplePage } from './pages/NavPeoplePage';
import { NavPersonPage } from './pages/NavPersonPage';
import { NavConnectionsPage } from './pages/NavConnectionsPage';
import { NavFollowUpsPage } from './pages/NavFollowUpsPage';
import { NavMessagesListPage } from './pages/NavMessagesListPage';
import { NavThreadPage } from './pages/NavThreadPage';
import { NotFoundPage } from '../pages/StatusPages';

/**
 * Navigator Workspace (P4E) — closed-loop navigation, not a CRM pipeline.
 * Route guard is UX; the navigation-relationship RLS/RPCs are the boundary.
 */
const NAV_ITEMS = [
  { to: '/navigator', label: 'Home' },
  { to: '/navigator/requests', label: 'Waiting' },
  { to: '/navigator/people', label: 'My People', shortLabel: 'People' },
  { to: '/navigator/connections', label: 'Connections' },
  { to: '/navigator/follow-ups', label: 'Follow-Ups' },
  { to: '/navigator/messages', label: 'Messages' },
];

export function NavigatorArea() {
  return (
    <RequireRole anyOf={['navigator', 'administrator', 'system_administrator']}>
      <AppShell
        productName="RecoveryOS"
        experience="professional"
        contextLabel="Navigator Workspace"
        navItems={NAV_ITEMS}
        utilities={
          <div className="flex flex-col gap-3">
            <SupportNowButton basePath="/vrcc" />
            <ExperienceSwitcher current="navigator" />
          </div>
        }
      >
        <Routes>
          <Route index element={<NavigatorHomePage />} />
          <Route path="requests" element={<NavRequestsPage />} />
          <Route path="people" element={<NavPeoplePage />} />
          <Route path="people/:personId" element={<NavPersonPage />} />
          <Route path="connections" element={<NavConnectionsPage />} />
          <Route path="follow-ups" element={<NavFollowUpsPage />} />
          <Route path="messages" element={<NavMessagesListPage />} />
          <Route path="messages/:personId" element={<NavThreadPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </RequireRole>
  );
}
