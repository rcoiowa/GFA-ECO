import { Route, Routes } from 'react-router';
import { RequireRole } from '@recoveryos/auth';
import { AppShell } from '@recoveryos/ui';
import { ExperienceSwitcher } from '../components/ExperienceSwitcher';
import { AdminHomePage } from './pages/AdminHomePage';
import { OperationsPage } from './pages/OperationsPage';
import { AccessPage } from './pages/AccessPage';
import { PeoplePage } from './pages/PeoplePage';
import { ResidencesPage } from './pages/ResidencesPage';
import { DirectorySubmissionsPage } from './pages/DirectorySubmissionsPage';
import { EvidencePage } from './pages/EvidencePage';
import { SystemPage } from './pages/SystemPage';
import { AuditPage } from './pages/AuditPage';
import { NotFoundPage } from '../pages/StatusPages';

/**
 * Admin Command Center (P4G). The route guard is UX only — every privileged
 * read is a platform-admin-gated definer RPC and every privileged write is
 * RPC-only with server-derived actors, so this shell grants nothing by itself.
 * Admin sees operations, access, and aggregate evidence; never private
 * conversation bodies, never individual recovery narrative. Executives may
 * enter (their role home is /admin) but the server limits them to the
 * aggregate evidence view — everything else answers not_authorized/empty.
 */
const NAV_ITEMS = [
  { to: '/admin', label: 'Home' },
  { to: '/admin/operations', label: 'Operations', shortLabel: 'Ops' },
  { to: '/admin/access', label: 'Access' },
  { to: '/admin/people', label: 'People' },
  { to: '/admin/residences', label: 'Residences', shortLabel: 'Homes' },
  { to: '/admin/directory/submissions', label: 'Directory', shortLabel: 'Dir' },
  { to: '/admin/evidence', label: 'Evidence' },
  { to: '/admin/system', label: 'System' },
  { to: '/admin/audit', label: 'Audit' },
];

export function AdminArea() {
  return (
    <RequireRole anyOf={['administrator', 'executive', 'system_administrator']}>
      <AppShell
        productName="RecoveryOS"
        experience="professional"
        contextLabel="Command Center"
        navItems={NAV_ITEMS}
        utilities={<ExperienceSwitcher current="admin" />}
      >
        {/* Crisp register (spec §3): tighter radii + tabular numerals via
            token overrides — same components, sharper rendering. */}
        <div data-register="crisp">
          <Routes>
            <Route index element={<AdminHomePage />} />
            <Route path="operations" element={<OperationsPage />} />
            <Route path="access" element={<AccessPage />} />
            <Route path="people" element={<PeoplePage />} />
            <Route path="residences" element={<ResidencesPage />} />
            <Route path="directory/submissions" element={<DirectorySubmissionsPage />} />
            <Route path="evidence" element={<EvidencePage />} />
            <Route path="system" element={<SystemPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AppShell>
    </RequireRole>
  );
}
