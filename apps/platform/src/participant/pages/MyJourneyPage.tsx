import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import { listMyRecentCheckIns } from '@recoveryos/data-access';
import type { CheckIn } from '@recoveryos/domain';
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';

const MOOD_LABELS: Record<number, string> = {
  1: 'Struggling',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Strong',
};

/** My Journey: progress over time, told kindly. */
export function MyJourneyPage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      setCheckIns(await listMyRecentCheckIns(person.id, 30));
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
        title="My Journey"
        lede="Every check-in and every step is part of your story."
        crumbs={[{ to: '/app/today', label: 'Today' }]}
      />
      <Card>
        <CardTitle>Recent check-ins</CardTitle>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={() => void load()} />
        ) : checkIns.length === 0 ? (
          <EmptyState
            title="Your journey starts here"
            message="Once you check in on the Today page, your history will grow here — a record of showing up for yourself."
          />
        ) : (
          <ul className="divide-y divide-line">
            {checkIns.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <span className="text-ink">
                  {new Date(c.created_at).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="font-medium text-experience-700">
                  {c.mood_rating ? MOOD_LABELS[c.mood_rating] : 'Checked in'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
