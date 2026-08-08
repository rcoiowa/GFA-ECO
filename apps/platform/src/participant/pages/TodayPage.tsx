import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { listMyGoals, listMyRecentCheckIns } from '@recoveryos/data-access';
import { dailySlogan } from '@recoveryos/recovery-content';
import type { CheckIn, Goal } from '@recoveryos/domain';
import { Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { TodayConnection } from '../components/TodayConnection';

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

  const today = new Date().toDateString();
  const checkedInToday = checkIns.some((c) => new Date(c.created_at).toDateString() === today);
  const currentGoal = goals[0];
  const displayName = person?.preferred_name || person?.first_name || 'Friend';
  // Ambient, not modal: the same slogan the check-in works with, greeting
  // the person on arrival (deterministic per person per day).
  const slogan = person ? dailySlogan(person.id, new Date().toISOString().slice(0, 10)) : null;

  return (
    <>
      <PageHeader title={`Hello, ${displayName}`} lede="Here's what may help you today." />
      <TodayConnection />
      {slogan ? (
        <p className="-mt-3 mb-5 max-w-2xl text-ink-muted">
          <em>&ldquo;{slogan.text}&rdquo;</em>
          <span className="text-ink-faint"> — today&rsquo;s slogan, walking with you</span>
        </p>
      ) : null}

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
                <p className="text-ink-muted">
                  You've checked in today — well done showing up. Evening check-in closes the day
                  whenever you're ready.
                </p>
                <div className="mt-3 flex flex-wrap gap-4">
                  <Link
                    to="/app/check-in"
                    className="font-medium text-experience-700 underline underline-offset-2"
                  >
                    Open your check-in
                  </Link>
                  <Link
                    to="/app/journey"
                    className="font-medium text-experience-700 underline underline-offset-2"
                  >
                    See your recent check-ins
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-ink-muted">
                  About a minute — how you're arriving, and one intention for the day.
                </p>
                <Link
                  to="/app/check-in"
                  className="mt-3 inline-flex min-h-11 items-center rounded-full bg-experience-600 px-5 font-semibold text-white hover:bg-experience-strong"
                >
                  Start your check-in
                </Link>
              </>
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
