import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { getMyActiveResidency } from '@recoveryos/data-access';
import type { Residence, Residency } from '@recoveryos/domain';
import { Alert, Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';

export function MyResidencePage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [residency, setResidency] = useState<(Residency & { residence: Residence }) | null>(null);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      setResidency(await getMyActiveResidency(person.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="My Residence"
        lede="Your home, your rights, and what living here involves."
        crumbs={[{ to: '/residence/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : !residency ? (
        <Alert tone="attention">No active residency found for your account.</Alert>
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle>{residency.residence.name}</CardTitle>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-ink-muted">Location</dt>
                <dd className="font-medium text-ink">
                  {[residency.residence.address_city, residency.residence.address_state]
                    .filter(Boolean)
                    .join(', ') || 'On file with staff'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-muted">Home here since</dt>
                <dd className="font-medium text-ink">
                  {residency.admission_date
                    ? new Date(residency.admission_date).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardTitle>Passes</CardTitle>
            <p className="text-ink-muted">Request time away and see where requests stand.</p>
            <Link
              to="/residence/passes"
              className="mt-2 inline-block font-medium text-experience-700 underline underline-offset-2"
            >
              Request or review passes
            </Link>
          </Card>

          <Card>
            <CardTitle>Your rights and agreements</CardTitle>
            <p className="text-ink-muted">
              Your residence agreement, resident rights, and house expectations live in
              Documents. You can reread them any time.
            </p>
            <Link
              to="/residence/documents"
              className="mt-2 inline-block font-medium text-experience-700 underline underline-offset-2"
            >
              Open Documents
            </Link>
          </Card>

          <Card>
            <CardTitle>Raise a concern</CardTitle>
            <p className="text-ink-muted">
              Filing a grievance is a protected right and will never be held against you.
            </p>
            <Link
              to="/residence/grievance"
              className="mt-2 inline-block font-medium text-experience-700 underline underline-offset-2"
            >
              File a grievance
            </Link>
          </Card>
        </div>
      )}
    </>
  );
}
