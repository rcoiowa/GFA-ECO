import { Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { SUPPORT_WAIT_TARGET_HOURS } from '@recoveryos/domain';
import { useOperationsSummary } from '../hooks/useAdminData';

/**
 * Live operational counts — facts about flow, not judgments about people.
 * Every number is computed server-side over production people only (fixtures
 * excluded), and none of it reads anyone's private conversation or narrative.
 */
export function OperationsPage() {
  const { data, isLoading, isError, refetch } = useOperationsSummary();

  if (isLoading) return <LoadingState label="Loading operations…" />;
  if (isError || !data)
    return <ErrorState message="We couldn’t load operations right now." onRetry={() => void refetch()} />;
  if (!data.ok)
    return (
      <Card>
        <CardTitle>Not available</CardTitle>
        <p className="mt-1 text-ink-muted">This summary is limited to platform administrators.</p>
      </Card>
    );

  const waitNote =
    data.open_support_requests === 0
      ? 'No one is waiting for a first connection.'
      : data.oldest_open_request_hours >= SUPPORT_WAIT_TARGET_HOURS
        ? `The longest wait is about ${Math.round(data.oldest_open_request_hours)} hours — past the ${SUPPORT_WAIT_TARGET_HOURS}-hour target.`
        : `The longest wait is about ${Math.round(data.oldest_open_request_hours)} hours — inside the ${SUPPORT_WAIT_TARGET_HOURS}-hour target.`;

  const groups: Array<{ title: string; note?: string; rows: Array<[string, number]> }> = [
    {
      title: 'Connection',
      note: waitNote,
      rows: [
        ['Open support requests (unclaimed)', data.open_support_requests],
        ['Of those, navigation requests', data.open_navigation_requests],
        ['Sessions on the calendar today', data.sessions_today],
        ['Follow-ups past due', data.overdue_follow_ups],
      ],
    },
    {
      title: 'Navigation',
      note: 'An open loop is a referral without a confirmed arrival yet — activity, not outcome.',
      rows: [
        ['Referral loops still open', data.open_referral_loops],
        ['Identified needs not yet resolved', data.unresolved_needs],
      ],
    },
    {
      title: 'Residences',
      rows: [
        ['Applications waiting for review', data.residence_applications_waiting],
        ['Active residencies', data.active_residencies],
        ['Incident reports awaiting review', data.unreviewed_incidents],
      ],
    },
    {
      title: 'Access',
      rows: [['Staff invitations pending', data.pending_invitations]],
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Operations"
        lede="The flow of connection across the platform — counts, waits, and open loops."
      />
      {groups.map((g) => (
        <Card key={g.title}>
          <CardTitle>{g.title}</CardTitle>
          {g.note ? <p className="mt-1 text-sm text-ink-muted">{g.note}</p> : null}
          <ul className="mt-2 divide-y divide-line">
            {g.rows.map(([label, value]) => (
              <li key={label} className="flex items-center justify-between py-2">
                <span className="text-ink">{label}</span>
                <span className="text-lg font-semibold text-ink">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
      <p className="text-sm text-ink-faint">
        Fixture and demonstration accounts are excluded from every count. Message content is never
        part of any administrative view.
      </p>
    </div>
  );
}
