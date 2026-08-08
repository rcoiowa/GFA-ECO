import { useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { deriveAdminAttention } from '@recoveryos/domain';
import { useOperationsSummary } from '../hooks/useAdminData';
import { track } from '../../lib/analytics';

/**
 * Admin home answers one question: "What needs organizational attention right
 * now?" — factual operational state, quietly stated. No staff leaderboards,
 * no participant scoring, no manufactured urgency.
 */
export function AdminHomePage() {
  const { data, isLoading, isError, refetch } = useOperationsSummary();

  useEffect(() => {
    track('admin_command_center_viewed');
  }, []);

  if (isLoading) return <LoadingState label="Opening the command center…" />;
  if (isError || !data)
    return <ErrorState message="We couldn’t load the summary right now." onRetry={() => void refetch()} />;
  if (!data.ok)
    return (
      <Card>
        <CardTitle>Operations is limited to platform administrators</CardTitle>
        <p className="mt-1 text-ink-muted">
          The aggregate evidence view is available to you on the{' '}
          <Link to="/admin/evidence" className="text-experience-700 underline underline-offset-2">
            Evidence page
          </Link>
          .
        </p>
      </Card>
    );

  const attention = deriveAdminAttention({
    openSupportRequests: data.open_support_requests,
    oldestOpenRequestHours: data.oldest_open_request_hours,
    overdueFollowUps: data.overdue_follow_ups,
    openReferralLoops: data.open_referral_loops,
    unresolvedNeeds: data.unresolved_needs,
    residenceApplicationsWaiting: data.residence_applications_waiting,
    unreviewedIncidents: data.unreviewed_incidents,
    pendingInvitations: data.pending_invitations,
  });

  const stats = [
    { label: 'Waiting for connection', value: data.open_support_requests, to: '/admin/operations' },
    { label: 'Sessions today', value: data.sessions_today, to: '/admin/operations' },
    { label: 'Active residencies', value: data.active_residencies, to: '/admin/residences' },
    { label: 'Pending invitations', value: data.pending_invitations, to: '/admin/access' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Command Center"
        lede="What needs organizational attention right now — operations, access, and evidence."
      />

      {attention.length > 0 ? (
        <Card>
          <CardTitle>Needs attention</CardTitle>
          <ul className="mt-2 space-y-1.5">
            {attention.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className="block rounded-md border border-line bg-surface-raised px-3 py-2.5 font-medium text-ink hover:bg-surface-sunken"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <CardTitle>All quiet</CardTitle>
          <p className="mt-1 text-ink-muted">
            Nothing is waiting past its target. The counts below are the live operational picture.
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-ink-muted">{s.label}</p>
            <p className="text-3xl font-semibold text-ink">{s.value}</p>
            <Link to={s.to} className="text-sm text-experience-700 underline underline-offset-2">
              Open
            </Link>
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle>Around the platform</CardTitle>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {[
            { to: '/admin/operations', label: 'Operations — connection & navigation flow' },
            { to: '/admin/access', label: 'Access — invitations & roles' },
            { to: '/admin/people', label: 'People — identity & access, never narrative' },
            { to: '/admin/residences', label: 'Residences' },
            { to: '/admin/evidence', label: 'Evidence — aggregate outputs & outcomes' },
            { to: '/admin/system', label: 'System — honest launch state' },
            { to: '/admin/audit', label: 'Audit trail' },
          ].map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="text-experience-700 underline underline-offset-2">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
