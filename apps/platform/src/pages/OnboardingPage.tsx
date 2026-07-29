import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { ensureMyPerson } from '@recoveryos/data-access';
import { Button, Card, ErrorState, LoadingState } from '@recoveryos/ui';

/**
 * Provisions the person record (person + profile + participant role) for a
 * newly signed-up auth user, then routes to Today. Idempotent server-side.
 */
export function OnboardingPage() {
  const { session, person, refreshIdentity } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (person) {
      navigate('/app/today', { replace: true });
      return;
    }
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        const meta = session.user.user_metadata as Record<string, unknown>;
        await ensureMyPerson({
          firstName: typeof meta.first_name === 'string' ? meta.first_name : 'Friend',
          lastName: typeof meta.last_name === 'string' ? meta.last_name : '',
        });
        await refreshIdentity();
        if (!cancelled) navigate('/app/today', { replace: true });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, person, attempt, navigate, refreshIdentity]);

  return (
    <div className="min-h-dvh bg-surface px-4 py-12">
      <div className="mx-auto max-w-md">
        <Card>
          <h1 className="text-2xl font-semibold text-ink">Setting things up</h1>
          {failed ? (
            <div className="mt-4 flex flex-col gap-4">
              <ErrorState
                message="We couldn't finish setting up your space. Nothing is lost — please try again."
                onRetry={() => {
                  setFailed(false);
                  setAttempt((n) => n + 1);
                }}
              />
              <Button variant="secondary" onClick={() => navigate('/')}>
                Return to home
              </Button>
            </div>
          ) : (
            <LoadingState label="Preparing your space…" />
          )}
        </Card>
      </div>
    </div>
  );
}
