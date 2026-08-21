import { Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { useAdminResidences, useOperationsSummary } from '../hooks/useAdminData';

/**
 * Residences — the portfolio view. Day-to-day operations (beds, passes,
 * incidents, applications) live in the Residence Operations workspace where
 * the scoped staff work; this page shows what exists and what's waiting.
 */
export function ResidencesPage() {
  const residences = useAdminResidences();
  const summary = useOperationsSummary();

  if (residences.isLoading) return <LoadingState label="Loading residences…" />;
  if (residences.isError)
    return (
      <ErrorState
        message="We couldn’t load residences right now."
        onRetry={() => void residences.refetch()}
      />
    );

  const rows = residences.data ?? [];
  const ops = summary.data?.ok ? summary.data : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Residences"
        lede="Every recovery residence on the platform, and what's waiting across them."
      />

      {ops ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Active residencies', value: ops.active_residencies },
            { label: 'Applications waiting', value: ops.residence_applications_waiting },
            { label: 'Incidents awaiting review', value: ops.unreviewed_incidents },
          ].map((s) => (
            <Card key={s.label}>
              <p className="text-sm text-ink-muted">{s.label}</p>
              <p className="text-3xl font-semibold text-ink">{s.value}</p>
            </Card>
          ))}
        </div>
      ) : null}

      <Card>
        <CardTitle>Portfolio</CardTitle>
        {rows.length === 0 ? (
          <p className="mt-1 text-ink-muted">No residences yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="font-medium text-ink">{r.name}</p>
                  <p className="text-sm text-ink-muted">
                    {[r.population_served, r.level_of_support ? `Level ${r.level_of_support}` : null]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
                <span className="text-sm text-ink-muted">
                  {r.capacity != null ? `${r.capacity} beds` : 'capacity not set'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-sm text-ink-faint">
        Bed boards, passes, incidents, and applications are worked in the Residence Operations
        workspace by the staff scoped to each residence. New operators join through an operator
        invitation on the Access page.
      </p>
    </div>
  );
}
