import { Link, Route, Routes } from 'react-router';
import { RequireAuth, useAuth } from '@recoveryos/auth';
import { Alert } from '@recoveryos/ui';
import { MyApplicationPage } from './MyApplicationPage';
import { DocumentsPage } from '../resident/pages/DocumentsPage';
import { DocumentDetailPage } from '../resident/pages/DocumentDetailPage';
import { HousingConsentPage } from './HousingConsentPage';
import { NotFoundPage } from '../pages/StatusPages';

/** Own-record entry point: no resident/staff role and no VRCC enrollment gate.
 * All data access remains bound to the signed-in person by existing RLS/RPCs.
 * Never provision or link a person by matching a name/email in this screen.
 */
function HousingIntakeContent() {
  const { person, signOut } = useAuth();
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <nav aria-label="My housing intake" className="mb-5 flex flex-wrap gap-4">
        <Link className="min-h-11 py-2 underline" to="/my-housing">
          My application
        </Link>
        <Link className="min-h-11 py-2 underline" to="/my-housing/documents">
          My documents
        </Link>
        <Link className="min-h-11 py-2 underline" to="/my-housing/consent">
          My consent choices
        </Link>
        <button className="min-h-11 py-2 underline" onClick={() => void signOut()}>
          Sign out
        </button>
      </nav>
      {!person ? (
        <Alert tone="attention">
          Your login is not linked to a person record yet. If you already applied, do not apply
          again. Call 515-220-8771 with your application reference so staff can verify your identity
          and arrange linking. Staff can continue your intake without a login.
        </Alert>
      ) : (
        <Routes>
          <Route index element={<MyApplicationPage />} />
          <Route path="documents" element={<DocumentsPage basePath="/my-housing" assignedOnly />} />
          <Route
            path="documents/:key"
            element={<DocumentDetailPage basePath="/my-housing" assignedOnly />}
          />
          <Route path="consent" element={<HousingConsentPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      )}
    </main>
  );
}

export function HousingIntakeArea() {
  return (
    <RequireAuth>
      <HousingIntakeContent />
    </RequireAuth>
  );
}
