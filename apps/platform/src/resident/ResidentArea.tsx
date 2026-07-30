import { Navigate, Route, Routes } from 'react-router';
import { RequireRole } from '@recoveryos/auth';
import { GroundingPage } from '@recoveryos/safety';
import { ResidentShell } from './ResidentShell';
import { ResidentTodayPage } from './pages/ResidentTodayPage';
import { MyResidencePage } from './pages/MyResidencePage';
import { SchedulePage } from './pages/SchedulePage';
import { HouseBoardPage } from './pages/HouseBoardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { GrievancePage } from './pages/GrievancePage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NotFoundPage } from '../pages/StatusPages';

/**
 * The resident front door: vrcc.app/residence.
 * Requires the resident role; residence data itself is RLS-scoped.
 */
export function ResidentArea() {
  return (
    <RequireRole anyOf={['resident']}>
      <Routes>
        <Route element={<ResidentShell />}>
          <Route index element={<Navigate to="today" replace />} />
          <Route path="today" element={<ResidentTodayPage />} />
          <Route path="house" element={<MyResidencePage />} />
          <Route
            path="recovery"
            element={
              <PlaceholderPage
                title="My Recovery"
                lede="Your goals, plan, and recovery tools — the same tools as every VRCC participant."
                note="The shared recovery engines connect here in the resident-experience phase. Until then, they're available in the VRCC."
              />
            }
          />
          <Route path="connect" element={<HouseBoardPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/grievance" element={<GrievancePage />} />
          <Route path="documents/:key" element={<DocumentDetailPage />} />
          <Route
            path="journey"
            element={
              <PlaceholderPage
                title="My Journey"
                lede="Your progress — in the residence and in recovery."
                note="Journey views arrive with the shared engines."
              />
            }
          />
          <Route path="support/grounding" element={<GroundingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </RequireRole>
  );
}
