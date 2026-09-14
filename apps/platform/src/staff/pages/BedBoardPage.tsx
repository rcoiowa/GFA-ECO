import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  assignBed,
  getBedBoard,
  listResidenceRoster,
  releaseBed,
  type RosterEntry,
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

/** Live view of every bed: occupied, available, and one-click assignment. */
export function BedBoardPage() {
  const { residence } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [board, setBoard] = useState<Awaited<ReturnType<typeof getBedBoard>> | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [assigningBed, setAssigningBed] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!residence) return;
    setLoading(true);
    setError(false);
    try {
      const [b, r] = await Promise.all([
        getBedBoard(residence.id),
        listResidenceRoster(residence.id),
      ]);
      setBoard(b);
      setRoster(r);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [residence]);

  useEffect(() => {
    void load();
  }, [load]);

  const occupantByBed = useMemo(() => {
    const map = new Map<number, NonNullable<typeof board>['activeAssignments'][number]>();
    board?.activeAssignments.forEach((a) => map.set(a.bed_id, a));
    return map;
  }, [board]);

  const unassignedResidents = useMemo(() => {
    const assignedResidencyIds = new Set(board?.activeAssignments.map((a) => a.residency_id));
    return roster.filter((r) => !assignedResidencyIds.has(r.id));
  }, [board, roster]);

  const doAssign = async (bedId: number, residencyId: number) => {
    try {
      await assignBed({ residencyId, bedId });
      setAssigningBed(null);
      await load();
    } catch {
      setError(true);
    }
  };

  if (!residence) return <Alert tone="attention">Select a residence to see its bed board.</Alert>;

  return (
    <>
      <PageHeader
        title="Bed Board"
        lede="Every bed at a glance. Availability here feeds the public directory."
        crumbs={[{ to: '/staff/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : !board || board.rooms.length === 0 ? (
        <Alert tone="attention">
          No rooms or beds are set up for {residence.name} yet — the physical layout (units, rooms,
          beds) is created by an administrator.
        </Alert>
      ) : (
        <div className="flex flex-col gap-5">
          {board.rooms.map((room) => (
            <Card key={room.id}>
              <CardTitle>
                {room.unit.name} — {room.name}
              </CardTitle>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {room.beds.map((bed) => {
                  const assignment = occupantByBed.get(bed.id);
                  return (
                    <li
                      key={bed.id}
                      className={`rounded-md border px-4 py-3 ${
                        assignment
                          ? 'border-line bg-surface-raised'
                          : 'border-positive-600/40 bg-positive-50'
                      }`}
                    >
                      <p className="text-sm text-ink-muted">{bed.name}</p>
                      {assignment ? (
                        <>
                          <p className="font-medium text-ink">
                            {assignment.residency.person.preferred_name ||
                              assignment.residency.person.first_name}{' '}
                            {assignment.residency.person.last_name}
                          </p>
                          <button
                            type="button"
                            className="mt-1 text-sm text-ink-muted underline underline-offset-2 hover:text-ink"
                            onClick={() => void releaseBed(assignment.id).then(load)}
                          >
                            Release bed
                          </button>
                        </>
                      ) : assigningBed === bed.id ? (
                        <div className="mt-1 flex flex-col gap-2">
                          {unassignedResidents.length === 0 ? (
                            <p className="text-sm text-ink-muted">No unassigned residents.</p>
                          ) : (
                            unassignedResidents.map((r) => (
                              <Button
                                key={r.id}
                                variant="secondary"
                                onClick={() => void doAssign(bed.id, r.id)}
                              >
                                {r.person.preferred_name || r.person.first_name}{' '}
                                {r.person.last_name}
                              </Button>
                            ))
                          )}
                          <button
                            type="button"
                            className="text-sm text-ink-muted underline underline-offset-2"
                            onClick={() => setAssigningBed(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-positive-700">Available</p>
                          <button
                            type="button"
                            className="mt-1 text-sm text-experience-700 underline underline-offset-2"
                            onClick={() => setAssigningBed(bed.id)}
                          >
                            Assign a resident
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
