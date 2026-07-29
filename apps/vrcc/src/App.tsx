import { Navigate, Route, Routes } from 'react-router';
import { RequireAuth, RequirePerson } from '@recoveryos/auth';
import { GroundingPage } from '@recoveryos/safety';
import { ParticipantShell } from './layout/ParticipantShell';
import { LandingPage } from './pages/public/LandingPage';
import { SignInPage } from './pages/public/SignInPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TodayPage } from './pages/app/TodayPage';
import { MyRecoveryPage } from './pages/app/MyRecoveryPage';
import { ConnectPage } from './pages/app/ConnectPage';
import { LearnPage } from './pages/app/LearnPage';
import { ToolsPage } from './pages/app/ToolsPage';
import { ResourcesPage } from './pages/app/ResourcesPage';
import { MyJourneyPage } from './pages/app/MyJourneyPage';
import { ProfilePage } from './pages/app/ProfilePage';
import { PrivacyConsentPage } from './pages/app/PrivacyConsentPage';
import { NotAuthorizedPage, NotFoundPage } from './pages/StatusPages';

export function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Signed in, but person record may not exist yet */}
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />

      {/* Participant experience */}
      <Route
        element={
          <RequirePerson>
            <ParticipantShell />
          </RequirePerson>
        }
      >
        <Route path="/today" element={<TodayPage />} />
        <Route path="/recovery" element={<MyRecoveryPage />} />
        <Route path="/connect" element={<ConnectPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/journey" element={<MyJourneyPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/privacy" element={<PrivacyConsentPage />} />
        <Route path="/support/grounding" element={<GroundingPage />} />
      </Route>

      <Route path="/not-authorized" element={<NotAuthorizedPage />} />
      <Route path="/home" element={<Navigate to="/today" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
