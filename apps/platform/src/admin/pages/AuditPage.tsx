import { Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { useAdminAudit } from '../hooks/useAdminData';

/**
 * Audit trail — read-only. Rows are written server-side by the privileged
 * RPCs themselves (invitations, role changes, lifecycle transitions); no
 * client can insert, edit, or delete them, including administrators.
 */
export function AuditPage() {
  const { data, isLoading, isError, refetch } = useAdminAudit();

  if (isLoading) return <LoadingState label="Loading the audit trail…" />;
  if (isError)
    return <ErrorState message="We couldn’t load the audit trail right now." onRetry={() => void refetch()} />;

  const rows = data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit trail"
        lede="Who did what, recorded by the server at the moment it happened."
      />
      <Card>
        <CardTitle>Most recent {rows.length} entries</CardTitle>
        {rows.length === 0 ? (
          <p className="mt-1 text-ink-muted">No audit entries yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {rows.map((row) => (
              <li key={row.id} className="py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-ink">{row.action}</span>
                  <span className="text-sm text-ink-muted">
                    {new Date(row.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {row.entity_table}
                  {row.entity_id != null ? ` #${row.entity_id}` : ''}
                  {row.actor_person_id != null ? ` · actor person ${row.actor_person_id}` : ' · system'}
                </p>
                {row.detail && Object.keys(row.detail).length > 0 ? (
                  <p className="mt-0.5 break-all font-mono text-xs text-ink-faint">
                    {JSON.stringify(row.detail)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-ink-faint">
          This trail is append-only: entries are written by the database functions that performed
          each action, and no client — administrators included — can modify them.
        </p>
      </Card>
    </div>
  );
}
