import { Navigate, Route, Routes } from 'react-router';
import { RequirePerson } from '@recoveryos/auth';
import { GroundingPage } from '@recoveryos/safety';
import { ParticipantShell } from './ParticipantShell';
import { TodayPage } from './pages/TodayPage';
import { MyRecoveryPage } from './pages/MyRecoveryPage';
import { ConnectPage } from './pages/ConnectPage';
import { LearnPage } from './pages/LearnPage';
import { ToolsPage } from './pages/ToolsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { MyJourneyPage } from './pages/MyJourneyPage';
import { ProfilePage } from './pages/ProfilePage';
import { PrivacyConsentPage } from './pages/PrivacyConsentPage';
import { NotFoundPage } from '../pages/StatusPages';

/** The VRCC participant front door: vrcc.app/app */
export function ParticipantArea() {
  return (
    <RequirePerson>
      <Routes>
        <Route element={<ParticipantShell />}>
          <Route index element={<Navigate to="today" replace />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="recovery" element={<MyRecoveryPage />} />
          <Route path="connect" element={<ConnectPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="journey" element={<MyJourneyPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="privacy" element={<PrivacyConsentPage />} />
          <Route path="support/grounding" element={<GroundingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </RequirePerson>
  );
}
