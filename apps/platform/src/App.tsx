import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { LoadingState } from '@recoveryos/ui';
import { LandingPage } from './public/LandingPage';
import { SignInPage } from './public/SignInPage';
import { RegisterPage } from './public/RegisterPage';
import { GraceHousePage } from './public/GraceHousePage';
import { ResidenceDirectoryPage } from './public/ResidenceDirectoryPage';
import { ResidenceApplyPage } from './public/ResidenceApplyPage';
import { MyApplicationPage } from './public/MyApplicationPage';
import { ListYourResidencePage } from './public/ListYourResidencePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { NotAuthorizedPage, NotFoundPage } from './pages/StatusPages';
import { RequireAuth } from '@recoveryos/auth';

/**
 * One platform, several intentional front doors (ADR-0010), now also
 * domain-scoped (ADR-0014): the same deployment answers every domain, and
 * the hostname picks the front door — vrcc.app is the community-center hub,
 * recoveryresidence.org opens the housing directory, recoveryresidence.app
 * opens the operator entrance, and Grace House vanity hosts open the Grace
 * House page. Every route stays reachable on every domain; only `/` differs.
 */
const HOST_HOMES: Record<string, string> = {
  'recoveryresidence.org': '/recovery-residences',
  'www.recoveryresidence.org': '/recovery-residences',
  'recoveryresidence.app': '/recovery-residences/list-your-residence',
  'www.recoveryresidence.app': '/recovery-residences/list-your-residence',
  'gracehouse.graceforaddictions.org': '/recovery-residences/grace-house',
};

function HostHome() {
  const home = HOST_HOMES[window.location.hostname.toLowerCase()];
  return home ? <Navigate to={home} replace /> : <LandingPage />;
}
const ParticipantArea = lazy(() =>
  import('./participant/ParticipantArea').then((m) => ({ default: m.ParticipantArea })),
);
const ResidentArea = lazy(() =>
  import('./resident/ResidentArea').then((m) => ({ default: m.ResidentArea })),
);
const StaffArea = lazy(() => import('./staff/StaffArea').then((m) => ({ default: m.StaffArea })));

export function App() {
  return (
    <Routes>
      {/* Public entrance — front door chosen by domain (ADR-0014) */}
      <Route path="/" element={<HostHome />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/recovery-residences" element={<ResidenceDirectoryPage />} />
      <Route path="/recovery-residences/list-your-residence" element={<ListYourResidencePage />} />
      <Route path="/recovery-residences/grace-house" element={<GraceHousePage />} />
      <Route path="/recovery-residences/grace-house/apply" element={<ResidenceApplyPage />} />
      <Route
        path="/recovery-residences/my-application"
        element={
          <RequireAuth>
            <MyApplicationPage />
          </RequireAuth>
        }
      />

      {/* Signed in, but person record may not exist yet */}
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />

      {/* Experience shells */}
      <Route
        path="/app/*"
        element={
          <Suspense fallback={<LoadingState label="Opening the VRCC…" />}>
            <ParticipantArea />
          </Suspense>
        }
      />
      <Route
        path="/residence/*"
        element={
          <Suspense fallback={<LoadingState label="Opening your residence…" />}>
            <ResidentArea />
          </Suspense>
        }
      />
      <Route
        path="/staff/*"
        element={
          <Suspense fallback={<LoadingState label="Opening residence operations…" />}>
            <StaffArea />
          </Suspense>
        }
      />

      <Route path="/not-authorized" element={<NotAuthorizedPage />} />
      <Route path="/home" element={<Navigate to="/app/today" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
