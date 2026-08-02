import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  getMyActiveResidency,
  listUpcomingResidenceMeetings,
  type MeetingRow,
} from '@recoveryos/data-access';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';

export function ResidentSchedulePage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      const residency = await getMyActiveResidency(person.id);
      setMeetings(
        residency ? await listUpcomingResidenceMeetings(residency.residence_id, 20) : [],
      );
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
        title="Schedule"
        lede="House meetings and commitments, all in one place."
        crumbs={[{ to: '/residence/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : meetings.length === 0 ? (
        <EmptyState
          title="Nothing scheduled yet"
          message="Upcoming house meetings and events will appear here as staff add them."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {meetings.map((meeting) => (
            <li key={meeting.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{meeting.title}</p>
                    {meeting.description ? (
                      <p className="mt-0.5 text-sm text-ink-muted">{meeting.description}</p>
                    ) : null}
                  </div>
                  {meeting.is_required_for_residents ? (
                    <span className="rounded-full bg-experience-soft px-3 py-1 text-xs font-medium text-experience-700">
                      Required
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-ink-muted">
                  {new Date(meeting.starts_at).toLocaleString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
