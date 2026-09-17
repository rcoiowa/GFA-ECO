import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@recoveryos/data-access';
import { safeLinkPath, type NotificationRow } from '@recoveryos/domain';
import { Button, Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';

/**
 * P0.5-B — the staff notification inbox. Notifications were emitted to coaches,
 * navigators, staff, and admins and never rendered anywhere. The contract here
 * is NOTIFICATION → OBJECT → ACTION → RESOLUTION: every row links to the real
 * record it is about (safeLinkPath maps previously stored legacy paths onto
 * canonical routes), opening it marks it read, and read state is the
 * resolution — no new notification kinds, no side-channel state.
 */
export function NotificationsPanel({ fallbackPath }: { fallbackPath: string }) {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rows, setRows] = useState<NotificationRow[]>([]);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      setRows(await getMyNotifications(person.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = async (id: number) => {
    // Best-effort read-marking — navigation proceeds via the Link regardless.
    try {
      await markNotificationRead(id);
    } catch {
      /* the destination is the point; read-marking retries on next load */
    }
  };

  const markAll = async () => {
    if (!person) return;
    try {
      await markAllNotificationsRead(person.id);
      await load();
    } catch {
      setError(true);
    }
  };

  const unread = rows.filter((r) => !r.read_at);
  const read = rows.filter((r) => r.read_at);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        lede="Each one links to the record it's about — open it, act, and it's resolved."
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>New ({unread.length})</CardTitle>
              {unread.length > 0 ? (
                <Button variant="ghost" size="md" onClick={() => void markAll()}>
                  Mark all read
                </Button>
              ) : null}
            </div>
            {unread.length === 0 ? (
              <p className="text-ink-muted">Nothing new.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {unread.map((n) => (
                  <li key={n.id}>
                    <Link
                      to={safeLinkPath(n.link_path, fallbackPath)}
                      onClick={() => void open(n.id)}
                      className="block rounded-md border border-line bg-surface-raised px-4 py-3 hover:bg-surface-sunken"
                    >
                      <span className="font-medium text-ink">{n.title}</span>
                      <span className="mt-0.5 block text-sm text-ink-muted">{n.body}</span>
                      <span className="mt-0.5 block text-xs text-ink-faint">
                        {new Date(n.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardTitle>Earlier</CardTitle>
            {read.length === 0 ? (
              <p className="text-ink-muted">Nothing earlier.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1.5">
                {read.map((n) => (
                  <li key={n.id}>
                    <Link
                      to={safeLinkPath(n.link_path, fallbackPath)}
                      className="block rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-surface-sunken"
                    >
                      {n.title} — {n.body}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
