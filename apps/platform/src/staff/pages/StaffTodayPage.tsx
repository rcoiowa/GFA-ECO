import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  decidePass,
  getBedBoard,
  listApplications,
  listPendingPasses,
  listResidenceRoster,
} from '@recoveryos/data-access';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@recoveryos/ui';
import { useStaff } from '../staffContext';

/**
 * The morning snapshot: occupancy, who's here, what needs a decision.
 */
export function StaffTodayPage() {
  const { person } = useAuth();
  const { residence, loading: staffLoading } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState({ beds: 0, occupied: 0, roster: 0, openApplications: 0 });
  const [pendingPasses, setPendingPasses] = useState<Awaited<ReturnType<typeof listPendingPasses>>>(
    [],
  );

  const load = useCallback(async () => {
    if (!residence) return;
    setLoading(true);
    setError(false);
    try {
      const [board, roster, applications, passes] = await Promise.all([
        getBedBoard(residence.id),
        listResidenceRoster(residence.id),
        listApplications(residence.id),
        listPendingPasses(residence.id),
      ]);
      const bedCount = board.rooms.reduce(
        (n, r) => n + r.beds.filter((b) => b.is_active).length,
        0,
      );
      setStats({
        beds: bedCount,
        occupied: board.activeAssignments.length,
        roster: roster.length,
        openApplications: applications.filter((a) =>
          ['submitted', 'in_review', 'waitlisted'].includes(a.status),
        ).length,
      });
      setPendingPasses(passes);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [residence]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (passId: number, status: 'approved' | 'denied') => {
    if (!person) return;
    try {
      await decidePass({ passId, status, decidedByPersonId: person.id });
      await load();
    } catch {
      setError(true);
    }
  };

  if (staffLoading) return <LoadingState label="Loading your residences…" />;
  if (!residence)
    return (
      <Alert tone="attention">
        No residence is linked to your staff role yet. A program administrator can assign you to a
        residence.
      </Alert>
    );

  return (
    <>
      <PageHeader
        title={residence.name}
        lede="Today's snapshot — occupancy, applications, and what needs a decision."
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Beds',
                value: `${stats.occupied} / ${stats.beds || '—'}`,
                note: 'occupied',
              },
              {
                label: 'Available now',
                value: Math.max(0, stats.beds - stats.occupied),
                note: 'beds open',
              },
              { label: 'Residents', value: stats.roster, note: 'on the roster' },
              { label: 'Applications', value: stats.openApplications, note: 'awaiting review' },
            ].map((s) => (
              <Card key={s.label}>
                <p className="text-sm text-ink-muted">{s.label}</p>
                <p className="text-3xl font-semibold text-ink">{s.value}</p>
                <p className="text-sm text-ink-faint">{s.note}</p>
              </Card>
            ))}
          </div>

          <Card>
            <CardTitle>Pass requests awaiting a decision</CardTitle>
            {pendingPasses.length === 0 ? (
              <p className="text-ink-muted">Nothing pending — every request has an answer.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {pendingPasses.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface-raised px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-ink">
                        {p.residency.person.preferred_name || p.residency.person.first_name}{' '}
                        {p.residency.person.last_name}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {new Date(p.starts_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}{' '}
                        →{' '}
                        {new Date(p.ends_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {p.destination ? ` · ${p.destination}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="md" onClick={() => void decide(p.id, 'approved')}>
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => void decide(p.id, 'denied')}
                        title="Share the reason with the resident in person — the policy asks for it"
                      >
                        Not approved
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm text-ink-faint">
              Per the Curfew &amp; Pass Policy: reasons for a &ldquo;not approved&rdquo; are always
              shared with the resident in person and on the form.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
