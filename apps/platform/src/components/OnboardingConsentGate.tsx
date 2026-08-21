import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { listMissingRequiredConsents } from '@recoveryos/data-access';
import { participantOnboardingApplies } from '@recoveryos/domain';
import { LoadingState } from '@recoveryos/ui';

/**
 * The participant-space onboarding boundary: a provisioned participant who
 * has not yet made the required-for-service consent decisions is routed to
 * /onboarding, which shows the minimal consent + immediate-support step and
 * then returns them here.
 *
 * Scope is deliberately narrow: only people whose home is the participant
 * space (participantOnboardingApplies) — staff, residence, and admin roles
 * pass straight through, as does everyone once the boundary is satisfied
 * (no loops: /onboarding itself forwards completed people to /home).
 *
 * This is a UX boundary, not enforcement — RLS and the server-side consent
 * gates remain the authority. On a read failure it fails open rather than
 * locking a person out of their space; and it never gates the safety path,
 * which is public at /support.
 */
export function OnboardingConsentGate({ children }: { children: ReactNode }) {
  const { person, roles } = useAuth();
  const applicable = !!person && participantOnboardingApplies(roles);
  const [state, setState] = useState<'checking' | 'complete' | 'incomplete'>('checking');

  useEffect(() => {
    if (!applicable || !person) return;
    let cancelled = false;
    (async () => {
      try {
        const missing = await listMissingRequiredConsents(person.id);
        if (!cancelled) setState(missing.length ? 'incomplete' : 'complete');
      } catch {
        // Fail open: a transient read failure must not lock someone out.
        if (!cancelled) setState('complete');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicable, person]);

  if (!applicable) return <>{children}</>;
  if (state === 'checking') return <LoadingState label="Getting things ready…" />;
  if (state === 'incomplete') return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
