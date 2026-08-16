import { Navigate, Route, Routes } from 'react-router';
import { RequireRole } from '@recoveryos/auth';
import { StaffProvider } from './staffContext';
import { StaffShell } from './StaffShell';
import { StaffTodayPage } from './pages/StaffTodayPage';
import { BedBoardPage } from './pages/BedBoardPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ScreeningsPage } from './pages/ScreeningsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { GrievancesPage } from './pages/GrievancesPage';
import { CompliancePage } from './pages/CompliancePage';
import { FeesPage } from './pages/FeesPage';
import { BoardPage } from './pages/BoardPage';
import { ReportsPage } from './pages/ReportsPage';
import { StaffMessagesPage } from './pages/StaffMessagesPage';
import { StaffThreadPage } from './pages/StaffThreadPage';
import { NotFoundPage } from '../pages/StatusPages';

/**
 * Room 1 — the Operator Dashboard (Integration Plan §2). Route guard is
 * navigation only; every query is bounded by the staff RLS policies.
 */
export function StaffArea() {
  return (
    <RequireRole anyOf={['residence_staff', 'residence_manager']}>
      <StaffProvider>
        <Routes>
          <Route element={<StaffShell />}>
            <Route index element={<Navigate to="today" replace />} />
            <Route path="today" element={<StaffTodayPage />} />
            <Route path="beds" element={<BedBoardPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="screenings" element={<ScreeningsPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="grievances" element={<GrievancesPage />} />
            <Route path="compliance" element={<CompliancePage />} />
            <Route path="fees" element={<FeesPage />} />
            <Route path="board" element={<BoardPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="messages" element={<StaffMessagesPage />} />
            <Route path="messages/:personId" element={<StaffThreadPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </StaffProvider>
    </RequireRole>
  );
}
