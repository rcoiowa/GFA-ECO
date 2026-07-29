import { useCallback, useEffect, useState } from 'react';
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
        crumbs={[{ to: '/today', label: 'Today' }]}
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
                <dt className="text-sm text-ink-muted">Your status</dt>
                <dd className="font-medium text-ink">{residency.residency_status}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <CardTitle>House expectations and your rights</CardTitle>
            <p className="text-ink-muted">
              Your residence agreement, resident rights, house expectations, chores, curfew, and
              pass requests will all live here as residence operations arrive in Phase 4.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
