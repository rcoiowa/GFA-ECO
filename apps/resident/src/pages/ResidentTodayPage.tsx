import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { getMyActiveResidency } from '@recoveryos/data-access';
import type { Residence, Residency } from '@recoveryos/domain';
import { Alert, Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active resident',
  on_pass: 'On an approved pass',
  transitioning: 'Preparing for transition',
};

/**
 * Resident home: residence identity and status up top, then today's
 * responsibilities and recovery focus — clearly labeled apart.
 */
export function ResidentTodayPage() {
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

  const displayName = person?.preferred_name || person?.first_name || 'Friend';

  return (
    <>
      <PageHeader title={`Good day, ${displayName}`} lede="Here's your day at a glance." />

      {loading ? (
        <LoadingState label="Loading your residence…" />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : !residency ? (
        <Alert tone="attention">
          We couldn't find an active residency for your account. If this seems wrong, please
          talk with your residence staff.
        </Alert>
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-ink-muted">Your residence</p>
                <p className="text-xl font-semibold text-ink">{residency.residence.name}</p>
              </div>
              <span className="rounded-full bg-experience-soft px-3 py-1 text-sm font-medium text-experience-700">
                {STATUS_LABELS[residency.residency_status] ?? residency.residency_status}
              </span>
            </div>
            {residency.admission_date ? (
              <p className="mt-2 text-sm text-ink-muted">
                Home here since{' '}
                {new Date(residency.admission_date).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            ) : null}
          </Card>

          <Card>
            <CardTitle>Residence responsibilities today</CardTitle>
            <p className="text-ink-muted">
              Chores, curfew, and required meetings will appear here as residence operations come
              online in Phase 4.
            </p>
            <Link
              to="/residence"
              className="mt-2 inline-block font-medium text-experience-700 underline underline-offset-2"
            >
              About my residence
            </Link>
          </Card>

          <Card>
            <CardTitle>Your recovery today</CardTitle>
            <p className="text-ink-muted">
              Your recovery goals and check-ins live in My Recovery — the same tools every VRCC
              participant uses, always yours regardless of where you live.
            </p>
            <Link
              to="/recovery"
              className="mt-2 inline-block font-medium text-experience-700 underline underline-offset-2"
            >
              Open My Recovery
            </Link>
          </Card>
        </div>
      )}
    </>
  );
}
