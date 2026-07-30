import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { LoadingState } from '@recoveryos/ui';
import { LandingPage } from './public/LandingPage';
import { SignInPage } from './public/SignInPage';
import { RegisterPage } from './public/RegisterPage';
import { GraceHousePage } from './public/GraceHousePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { NotAuthorizedPage, NotFoundPage } from './pages/StatusPages';
import { RequireAuth } from '@recoveryos/auth';

/**
 * One platform, several intentional front doors (ADR-0010).
 * Experience areas are lazy-loaded so each front door only downloads its own
 * shell; the public entrance stays light.
 */
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
      {/* Public entrance */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/recovery-residences/grace-house" element={<GraceHousePage />} />

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
