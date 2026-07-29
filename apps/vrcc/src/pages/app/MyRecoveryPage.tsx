import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@recoveryos/auth';
import { createGoal, listMyGoals, updateGoalStatus } from '@recoveryos/data-access';
import { goalSchema, type Goal } from '@recoveryos/domain';
import {
  Button,
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  TextAreaField,
  TextField,
} from '@recoveryos/ui';

export function MyRecoveryPage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      setGoals(await listMyGoals(person.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!person) return;
    const form = new FormData(event.currentTarget);
    const parsed = goalSchema.safeParse({
      title: form.get('title'),
      detail: (form.get('detail') as string) || undefined,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] = issue.message;
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const created = await createGoal({
        personId: person.id,
        title: parsed.data.title,
        detail: parsed.data.detail,
      });
      setGoals((prev) => [created, ...prev]);
      setShowForm(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  async function markAchieved(goal: Goal) {
    await updateGoalStatus(goal.id, 'achieved');
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, status: 'achieved' } : g)));
  }

  const active = goals.filter((g) => g.status === 'active');
  const achieved = goals.filter((g) => g.status === 'achieved');

  return (
    <>
      <PageHeader
        title="My Recovery"
        lede="Your goals and your plan — at your pace, in your words."
        crumbs={[{ to: '/today', label: 'Today' }]}
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close' : 'Add a goal'}
          </Button>
        }
      />

      {showForm ? (
        <Card className="mb-5">
          <CardTitle>A new goal</CardTitle>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <TextField
              label="What do you want to work toward?"
              name="title"
              required
              error={fieldErrors.title}
              placeholder="e.g. Attend two recovery circles this month"
            />
            <TextAreaField
              label="Anything that would help you remember why this matters? (optional)"
              name="detail"
              error={fieldErrors.detail}
            />
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save goal'}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : active.length === 0 && achieved.length === 0 ? (
        <EmptyState
          title="No goals yet"
          message="Recovery grows one step at a time. Set a first goal — small counts."
          action={<Button onClick={() => setShowForm(true)}>Set your first goal</Button>}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {active.length > 0 ? (
            <section aria-labelledby="active-goals">
              <h2 id="active-goals" className="mb-3 text-lg font-semibold text-ink">
                Working on now
              </h2>
              <ul className="flex flex-col gap-3">
                {active.map((goal) => (
                  <li key={goal.id}>
                    <Card>
                      <p className="font-semibold text-ink">{goal.title}</p>
                      {goal.detail ? <p className="mt-1 text-ink-muted">{goal.detail}</p> : null}
                      <div className="mt-3">
                        <Button variant="secondary" onClick={() => void markAchieved(goal)}>
                          Mark achieved
                        </Button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {achieved.length > 0 ? (
            <section aria-labelledby="achieved-goals">
              <h2 id="achieved-goals" className="mb-3 text-lg font-semibold text-ink">
                Achieved
              </h2>
              <ul className="flex flex-col gap-3">
                {achieved.map((goal) => (
                  <li key={goal.id} className="rounded-lg border border-positive-600/30 bg-positive-50 px-4 py-3">
                    <p className="font-medium text-positive-700">✓ {goal.title}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
