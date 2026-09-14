import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import { addHousePost, listHousePosts, type HousePostWithAuthor } from '@recoveryos/data-access';
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
import { useStaff } from '../staffContext';

const CATEGORIES: { value: HousePostWithAuthor['category']; label: string }[] = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'meeting_notes', label: 'Meeting notes' },
  { value: 'milestone', label: 'Milestone celebration' },
  { value: 'gratitude', label: 'Gratitude' },
];

/** Staff side of the house board: post announcements and meeting notes. */
export function BoardPage() {
  const { person } = useAuth();
  const { residence } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [posts, setPosts] = useState<HousePostWithAuthor[]>([]);
  const [category, setCategory] = useState<HousePostWithAuthor['category']>('announcement');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!residence) return;
    setLoading(true);
    setError(false);
    try {
      setPosts(await listHousePosts(residence.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [residence]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!person || !residence || !title.trim()) return;
    setSaving(true);
    try {
      await addHousePost({
        residenceId: residence.id,
        authorPersonId: person.id,
        category,
        title: title.trim(),
        body: body.trim() || undefined,
        isPinned: pinned,
      });
      setTitle('');
      setBody('');
      setPinned(false);
      await load();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (!residence) return <Alert tone="attention">Select a residence to manage its board.</Alert>;

  return (
    <>
      <PageHeader
        title="House Board"
        lede="What you post here appears in every resident's Connect area."
        crumbs={[{ to: '/staff/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle>New post</CardTitle>
            <div className="flex flex-col gap-3 sm:max-w-lg">
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Category
                <select
                  className="min-h-11 rounded-md border border-line bg-surface-raised px-2 text-base"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HousePostWithAuthor['category'])}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <TextAreaField
                label="Body (optional)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
              />
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                />
                Pin to the top of the board
              </label>
              <Button onClick={() => void submit()} disabled={saving || !title.trim()}>
                {saving ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle>Current board</CardTitle>
            {posts.length === 0 ? (
              <p className="text-ink-muted">Nothing posted yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {posts.map((p) => (
                  <li key={p.id} className="rounded-md border border-line bg-surface-raised p-3">
                    <div className="flex flex-wrap justify-between gap-2 text-sm text-ink-muted">
                      <span>
                        {CATEGORIES.find((c) => c.value === p.category)?.label}
                        {p.is_pinned ? ' · 📌 pinned' : ''}
                      </span>
                      <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 font-medium text-ink">{p.title}</p>
                    {p.body ? <p className="text-sm text-ink">{p.body}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
