import { Link } from 'react-router';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import {
  awaitingConnectionConfirmation,
  formatElapsed,
  referralStatusLabel,
  referralTypeLabel,
} from '@recoveryos/domain';
import { useNavigatorWorkspace } from '../hooks/useNavigatorWorkspace';

/**
 * Every connection in motion and how it actually ended. Both outcomes are real:
 * "connected" closes a loop; "provider unavailable" is community-level evidence
 * of a gap — it never disappears.
 */
export function NavConnectionsPage() {
  const { referrals, roster, isLoading, hasError, refetch } = useNavigatorWorkspace();
  const names = new Map(roster.map((r) => [r.participant_person_id, r.display_name]));

  if (isLoading) return <LoadingState label="Loading connections…" />;
  if (hasError)
    return <ErrorState message="We couldn’t load connections right now." onRetry={refetch} />;

  const open = referrals.filter((r) => awaitingConnectionConfirmation(r.status));
  const settled = referrals.filter((r) => !awaitingConnectionConfirmation(r.status));

  const row = (referral: (typeof referrals)[number]) => (
    <li key={referral.id}>
      <Link
        to={`/navigator/people/${referral.person_id}`}
        className="block rounded-md border border-line bg-surface-raised px-3 py-2.5 hover:border-experience-500"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-ink">
            {names.get(referral.person_id) ?? 'Participant'} →{' '}
            {referral.destination_name ?? 'a community resource'}
          </span>
          <span className="text-sm text-ink-muted">
            {referralTypeLabel(referral.referral_type)} · {referralStatusLabel(referral.status)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink-faint">Started {formatElapsed(referral.created_at)}</p>
      </Link>
    </li>
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Connections" lede="Referrals and handoffs — and whether they actually landed." />
      {referrals.length === 0 ? (
        <EmptyState
          title="No connections yet"
          message="When you connect someone to a resource, you’ll track whether it landed here."
        />
      ) : (
        <>
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">In motion</h2>
            {open.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing waiting on an outcome.</p>
            ) : (
              <ul className="space-y-2">{open.map(row)}</ul>
            )}
          </section>
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">Settled</h2>
            {settled.length === 0 ? (
              <p className="text-sm text-ink-muted">No settled connections yet.</p>
            ) : (
              <ul className="space-y-2">{settled.map(row)}</ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
