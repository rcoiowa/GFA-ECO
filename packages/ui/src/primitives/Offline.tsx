import { useEffect, useState } from 'react';

/**
 * Offline-AWARE, not offline-first (P4H spec §39): we detect and truthfully
 * show connection state, keep already-rendered content on screen, and never
 * claim an unconfirmed mutation succeeded. Nothing here persists private
 * data.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

/** Quiet connection banner: appears only while offline; announces politely. */
export function OfflineNotice() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-attention-600/30 bg-attention-50 px-4 py-2 text-sm text-attention-700"
    >
      You&rsquo;re offline right now. What&rsquo;s on screen stays available, and we&rsquo;ll
      reconnect automatically — nothing you send will be marked as delivered until it truly is.
    </div>
  );
}
