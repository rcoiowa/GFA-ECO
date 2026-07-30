import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { createCheckIn, listMyGoals, listMyRecentCheckIns } from '@recoveryos/data-access';
import type { CheckIn, Goal } from '@recoveryos/domain';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@recoveryos/ui';

const MOODS = [
  { value: 1, label: 'Struggling' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Strong' },
] as const;

/**
 * Today is a guidance layer, not a feature catalog: one check-in, the current
 * goal, and one clear next action.
 */
export function TodayPage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedNow, setSavedNow] = useState(false);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      const [g, c] = await Promise.all([
        listMyGoals(person.id),
        listMyRecentCheckIns(person.id, 7),
      ]);
      setGoals(g.filter((goal) => goal.status === 'active'));
      setCheckIns(c);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitMood(value: number) {
    if (!person || saving) return;
    setSaving(true);
    try {
      const created = await createCheckIn({
        personId: person.id,
        moodRating: value,
        cravingRating: null,
        deliveryContext: 'vrcc',
      });
      setCheckIns((prev) => [created, ...prev]);
      setSavedNow(true);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toDateString();
  const checkedInToday = checkIns.some((c) => new Date(c.created_at).toDateString() === today);
  const currentGoal = goals[0];
  const displayName = person?.preferred_name || person?.first_name || 'Friend';

  return (
    <>
      <PageHeader title={`Hello, ${displayName}`} lede="Here's what may help you today." />

      {loading ? (
        <LoadingState label="Gathering your day…" />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle>How are you arriving today?</CardTitle>
            {checkedInToday ? (
              <>
                {savedNow ? (
                  <Alert tone="positive">Thanks for checking in. It counts.</Alert>
                ) : (
                  <p className="text-ink-muted">
                    You've already checked in today — well done showing up.
                  </p>
                )}
                <Link
                  to="/app/journey"
                  className="mt-3 inline-block font-medium text-experience-700 underline underline-offset-2"
                >
                  See your recent check-ins
                </Link>
              </>
            ) : (
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Choose how you're feeling"
              >
                {MOODS.map((mood) => (
                  <Button
                    key={mood.value}
                    variant="secondary"
                    disabled={saving}
                    onClick={() => void submitMood(mood.value)}
                  >
                    {mood.label}
                  </Button>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardTitle>Your current focus</CardTitle>
            {currentGoal ? (
              <>
                <p className="font-medium text-ink">{currentGoal.title}</p>
                {currentGoal.detail ? (
                  <p className="mt-1 text-ink-muted">{currentGoal.detail}</p>
                ) : null}
                <Link
                  to="/app/recovery"
                  className="mt-3 inline-block font-medium text-experience-700 underline underline-offset-2"
                >
                  Open My Recovery
                </Link>
              </>
            ) : (
              <>
                <p className="text-ink-muted">
                  You haven't set a goal yet. A small one is a strong start.
                </p>
                <Link
                  to="/app/recovery"
                  className="mt-3 inline-block font-medium text-experience-700 underline underline-offset-2"
                >
                  Set your first goal
                </Link>
              </>
            )}
          </Card>

          <Card>
            <CardTitle>Suggested for today</CardTitle>
            <p className="text-ink-muted">
              Take two quiet minutes with a grounding practice, or explore something new in Learn.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <Link
                to="/app/support/grounding"
                className="font-medium text-experience-700 underline underline-offset-2"
              >
                Grounding moment
              </Link>
              <Link
                to="/app/learn"
                className="font-medium text-experience-700 underline underline-offset-2"
              >
                Explore Learn
              </Link>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
