import { Navigate, Route, Routes } from 'react-router';
import { RequireRole } from '@recoveryos/auth';
import { GroundingPage } from '@recoveryos/safety';
import { ResidentShell } from './layout/ResidentShell';
import { SignInPage } from './pages/SignInPage';
import { ResidentTodayPage } from './pages/ResidentTodayPage';
import { MyResidencePage } from './pages/MyResidencePage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NotAuthorizedPage, NotFoundPage } from './pages/StatusPages';

/**
 * Resident experience: seven destinations combining recovery support with
 * residence responsibilities — related to, but never confused with, VRCC.
 * Access requires the `resident` role; RLS enforces the real boundary.
 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/today" replace />} />
      <Route path="/sign-in" element={<SignInPage />} />

      <Route
        element={
          <RequireRole anyOf={['resident']}>
            <ResidentShell />
          </RequireRole>
        }
      >
        <Route path="/today" element={<ResidentTodayPage />} />
        <Route path="/residence" element={<MyResidencePage />} />
        <Route
          path="/recovery"
          element={
            <PlaceholderPage
              title="My Recovery"
              lede="Your goals, plan, and recovery tools — the same tools as every VRCC participant."
              note="The shared recovery engines connect here in Phase 4."
            />
          }
        />
        <Route
          path="/connect"
          element={
            <PlaceholderPage
              title="Connect"
              lede="Your support team, housemates, and community."
              note="Connection features arrive with the shared engines in Phase 4."
            />
          }
        />
        <Route
          path="/schedule"
          element={
            <PlaceholderPage
              title="Schedule"
              lede="House meetings, appointments, and commitments in one calendar."
              note="Scheduling arrives in Phase 4."
            />
          }
        />
        <Route
          path="/documents"
          element={
            <PlaceholderPage
              title="Documents"
              lede="Your agreements, rights, and anything waiting for your signature."
              note="Document workflows arrive in Phase 4."
            />
          }
        />
        <Route
          path="/journey"
          element={
            <PlaceholderPage
              title="My Journey"
              lede="Your progress — in the residence and in recovery."
              note="Journey views arrive in Phase 4."
            />
          }
        />
        <Route path="/support/grounding" element={<GroundingPage />} />
      </Route>

      <Route path="/not-authorized" element={<NotAuthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
