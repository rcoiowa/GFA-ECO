import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  addHousePost,
  getMyActiveResidency,
  listHousePosts,
  type HousePostWithAuthor,
} from '@recoveryos/data-access';
import type { Residence, Residency } from '@recoveryos/domain';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
  TextAreaField,
  TextField,
} from '@recoveryos/ui';

const CATEGORY_BADGES: Record<HousePostWithAuthor['category'], { label: string; cls: string }> = {
  announcement: { label: 'Announcement', cls: 'bg-experience-soft text-experience-700' },
  meeting_notes: { label: 'Meeting notes', cls: 'bg-surface-sunken text-ink-muted' },
  milestone: { label: 'Milestone 🎉', cls: 'bg-positive-50 text-positive-700' },
  gratitude: { label: 'Gratitude', cls: 'bg-attention-50 text-attention-700' },
};

/**
 * The house community board — announcements, meeting notes, milestones,
 * gratitude. Feels like belonging, not a bulletin board.
 */
export function HouseBoardPage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [residency, setResidency] = useState<(Residency & { residence: Residence }) | null>(null);
  const [posts, setPosts] = useState<HousePostWithAuthor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<'milestone' | 'gratitude'>('milestone');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      const res = await getMyActiveResidency(person.id);
      setResidency(res);
      if (res) setPosts(await listHousePosts(res.residence_id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!person || !residency || !title.trim()) return;
    setSaving(true);
    try {
      await addHousePost({
        residenceId: residency.residence_id,
        authorPersonId: person.id,
        category,
        title: title.trim(),
        body: body.trim() || undefined,
      });
      setTitle('');
      setBody('');
      setShowForm(false);
      await load();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Connect"
        lede="Your house community board — announcements, meeting notes, and each other's wins."
        crumbs={[{ to: '/residence/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : !residency ? (
        <Alert tone="attention">No active residency found for your account.</Alert>
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Share with the house</CardTitle>
              {!showForm ? (
                <Button variant="secondary" onClick={() => setShowForm(true)}>
                  Celebrate something
                </Button>
              ) : null}
            </div>
            {showForm ? (
              <div className="flex flex-col gap-3 sm:max-w-md">
                <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                  Kind of post
                  <select
                    className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'milestone' | 'gratitude')}
                  >
                    <option value="milestone">Milestone — a win worth celebrating</option>
                    <option value="gratitude">Gratitude — a thank-you to the house</option>
                  </select>
                </label>
                <TextField
                  label="Title"
                  placeholder={
                    category === 'milestone' ? '90 days today!' : 'Thank you, kitchen crew'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <TextAreaField
                  label="Say more (optional)"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={() => void submit()} disabled={saving || !title.trim()}>
                    {saving ? 'Posting…' : 'Post to the board'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-ink-muted">
                Milestones and gratitude belong to everyone — share yours. Announcements and meeting
                notes come from house leadership.
              </p>
            )}
          </Card>

          {posts.length === 0 ? (
            <Alert tone="info">
              The board is quiet so far. The first milestone posted here starts a tradition.
            </Alert>
          ) : (
            posts.map((p) => {
              const badge = CATEGORY_BADGES[p.category];
              return (
                <Card key={p.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`rounded-full px-3 py-0.5 text-sm font-medium ${badge.cls}`}>
                      {badge.label}
                      {p.is_pinned ? ' · 📌' : ''}
                    </span>
                    <span className="text-sm text-ink-muted">
                      {new Date(p.created_at).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-ink">{p.title}</h3>
                  {p.body ? <p className="mt-1 text-ink">{p.body}</p> : null}
                  <p className="mt-2 text-sm text-ink-faint">
                    — {p.author.preferred_name || p.author.first_name}
                  </p>
                </Card>
              );
            })
          )}
        </div>
      )}
    </>
  );
}
