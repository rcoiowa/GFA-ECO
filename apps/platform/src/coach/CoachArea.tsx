import { Route, Routes } from 'react-router';
import { RequireRole } from '@recoveryos/auth';
import { AppShell } from '@recoveryos/ui';
import { SupportNowButton } from '@recoveryos/safety';
import { ExperienceSwitcher } from '../components/ExperienceSwitcher';
import { CoachHomePage } from './pages/CoachHomePage';
import { RequestsPage } from './pages/RequestsPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { ParticipantDetailPage } from './pages/ParticipantDetailPage';
import { SessionsPage } from './pages/SessionsPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { MessagesListPage } from './pages/MessagesListPage';
import { CoachThreadPage } from './pages/CoachThreadPage';
import { NotFoundPage } from '../pages/StatusPages';

/**
 * Coach Workspace (P4C/P4D) — a relational support workspace, not a CRM.
 * Route guard is UX; RLS/RPCs remain the security boundary.
 */
const NAV_ITEMS = [
  { to: '/coach', label: 'Home' },
  { to: '/coach/requests', label: 'Waiting', shortLabel: 'Waiting' },
  { to: '/coach/participants', label: 'My Participants', shortLabel: 'People' },
  { to: '/coach/messages', label: 'Messages' },
  { to: '/coach/sessions', label: "Today's Sessions", shortLabel: 'Sessions' },
  { to: '/coach/follow-ups', label: 'Follow-Ups', shortLabel: 'Follow-Ups' },
];

export function CoachArea() {
  return (
    <RequireRole anyOf={['coach', 'administrator', 'system_administrator']}>
      <AppShell
        productName="RecoveryOS"
        experience="professional"
        contextLabel="Coach Workspace"
        navItems={NAV_ITEMS}
        utilities={
          <div className="flex flex-col gap-3">
            <SupportNowButton basePath="/vrcc" />
            <ExperienceSwitcher current="coach" />
          </div>
        }
      >
        <Routes>
          <Route index element={<CoachHomePage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="participants" element={<ParticipantsPage />} />
          <Route path="participants/:personId" element={<ParticipantDetailPage />} />
          <Route path="messages" element={<MessagesListPage />} />
          <Route path="messages/:personId" element={<CoachThreadPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="follow-ups" element={<FollowUpsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </RequireRole>
  );
}
