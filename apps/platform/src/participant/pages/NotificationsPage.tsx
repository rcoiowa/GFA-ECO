import { useNavigate } from 'react-router';
import { Button, Card, EmptyState, LoadingState, PageHeader } from '@recoveryos/ui';
import { formatElapsed, safeLinkPath } from '@recoveryos/domain';
import { useNotifications } from '../hooks/useConnection';
import { track } from '../../lib/analytics';

/** Participant notifications — recent events, unread state, safe navigation. */
export function NotificationsPage() {
  const { notifications, unread, isLoading, markRead, markAllRead } = useNotifications(30);
  const navigate = useNavigate();

  function open(id: number, linkPath: string | null, alreadyRead: boolean) {
    if (!alreadyRead) markRead(id);
    track('notification_opened');
    navigate(safeLinkPath(linkPath, '/vrcc/today'));
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        lede="What’s happened with your support."
        action={
          unread > 0 ? (
            <Button variant="ghost" size="md" onClick={markAllRead}>
              Mark all read
            </Button>
          ) : undefined
        }
      />
      {isLoading ? (
        <LoadingState label="Loading notifications…" />
      ) : notifications.length === 0 ? (
        <EmptyState title="Nothing here yet" message="When something happens with your support, you’ll see it here." />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => open(n.id, n.link_path, n.read_at !== null)}
                className={`block w-full rounded-md border p-3 text-left ${
                  n.read_at
                    ? 'border-line bg-surface'
                    : 'border-experience-500 bg-surface-raised'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-medium ${n.read_at ? 'text-ink-muted' : 'text-ink'}`}>
                    {n.title}
                    {!n.read_at ? <span className="sr-only"> (unread)</span> : null}
                  </p>
                  <span className="shrink-0 text-xs text-ink-faint">{formatElapsed(n.created_at)}</span>
                </div>
                <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Card>
        <p className="text-sm text-ink-muted">
          Notifications live here in the app. Grace never sends recovery details over text or
          email without your say-so.
        </p>
      </Card>
    </div>
  );
}
