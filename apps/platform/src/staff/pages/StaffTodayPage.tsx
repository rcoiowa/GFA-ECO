import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import {
  decidePass,
  getBedBoard,
  getMyAssignedFollowUps,
  listApplications,
  listIncidents,
  listOpenPasses,
  listPendingPasses,
  listResidenceRoster,
  recordPassReturn,
} from '@recoveryos/data-access';
import { deriveResidenceStaffAttention, type ResidenceAttentionItem } from '@recoveryos/domain';
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
import { captureError } from '../../lib/monitor';

/**
 * The morning snapshot: occupancy, who's here, what needs a decision.
 */
export function StaffTodayPage() {
  const { person, roles } = useAuth();
  const { residence, loading: staffLoading } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState({ beds: 0, occupied: 0, roster: 0, openApplications: 0 });
  const [pendingPasses, setPendingPasses] = useState<Awaited<ReturnType<typeof listPendingPasses>>>(
    [],
  );
  const [openPasses, setOpenPasses] = useState<Awaited<ReturnType<typeof listOpenPasses>>>([]);
  const [attention, setAttention] = useState<ResidenceAttentionItem[]>([]);

  const load = useCallback(async () => {
    if (!residence || !person) return;
    setLoading(true);
    setError(false);
    try {
      const [board, roster, applications, passes, outPasses, incidents, myFollowUps] =
        await Promise.all([
          getBedBoard(residence.id),
          listResidenceRoster(residence.id),
          listApplications(residence.id),
          listPendingPasses(residence.id),
          listOpenPasses(residence.id),
          listIncidents(residence.id),
          getMyAssignedFollowUps(person.id),
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
      setOpenPasses(outPasses);
      const assignedResidencies = new Set(board.activeAssignments.map((a) => a.residency_id));
      const now = Date.now();
      setAttention(
        deriveResidenceStaffAttention({
          unreviewedIncidents: incidents.filter((i) => !i.reviewed_at).length,
          applicationsWaiting: applications.filter((a) =>
            ['submitted', 'in_review'].includes(a.status),
          ).length,
          passesWaiting: passes.length,
          unassignedActiveResidencies: roster.filter(
            (r) =>
              ['active', 'on_pass', 'transitioning'].includes(r.residency_status) &&
              !assignedResidencies.has(r.id),
          ).length,
          followUpsDue: myFollowUps.filter(
            (f) => f.status === 'open' && f.due_at !== null && new Date(f.due_at).getTime() <= now,
          ).length,
        }),
      );
    } catch (e) {
      // Redacted operational capture — a blank card with no detail is what
      // made the ambiguous-embed failure hard to diagnose.
      captureError('staff.today.load', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [residence, person]);

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

  const recordReturn = async (passId: number) => {
    try {
      await recordPassReturn(passId);
      await load();
    } catch {
      setError(true);
    }
  };

  if (staffLoading) return <LoadingState label="Loading your residences…" />;
  if (!residence) {
    // P0.5-A: program managers legitimately land here with no residence
    // assignment — they are care-operations staff, not house staff. Give them
    // their actual work surface instead of a dead end.
    if (roles.includes('program_manager')) {
      return (
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Care operations"
            lede="You're not assigned to a residence — your work lives in the intake and support queues."
          />
          <Card>
            <CardTitle>Housing application intake</CardTitle>
            <p className="mt-1 text-ink-muted">
              Public Grace House applications waiting for contact and review.
            </p>
            <Link
              to="/residences/applications/intake"
              className="mt-3 inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-strong"
            >
              Open the intake queue
            </Link>
          </Card>
        </div>
      );
    }
    return (
      <Alert tone="attention">
        No residence is linked to your staff role yet. A program administrator can assign you to a
        residence.
      </Alert>
    );
  }

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
          ) : null}
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

          <Card>
            <CardTitle>Out on a pass</CardTitle>
            {openPasses.length === 0 ? (
              <p className="text-ink-muted">Nobody is out on a pass right now.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {openPasses.map((p) => (
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
                        Due back{' '}
                        {new Date(p.ends_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {p.destination ? ` · ${p.destination}` : ''}
                        {new Date(p.ends_at).getTime() < Date.now() ? ' · past due-back time' : ''}
                      </p>
                    </div>
                    <Button variant="secondary" size="md" onClick={() => void recordReturn(p.id)}>
                      Record return
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm text-ink-faint">
              Recording the return closes the pass — that&rsquo;s what keeps the board honest about
              who is home.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
