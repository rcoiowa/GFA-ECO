import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { listMissingRequiredConsents } from '@recoveryos/data-access';
import { participantOnboardingApplies } from '@recoveryos/domain';
import { ErrorState, LoadingState } from '@recoveryos/ui';

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
 * gates remain the authority. On a read failure it FAILS SAFE (P0-2,
 * 2026-08-21): "cannot verify" renders a retry state rather than silently
 * granting or silently locking — consent status is never assumed. The safety
 * path is never gated: /support stays public regardless of this boundary.
 */
export function OnboardingConsentGate({ children }: { children: ReactNode }) {
  const { person, roles } = useAuth();
  const applicable = !!person && participantOnboardingApplies(roles);
  const [state, setState] = useState<'checking' | 'complete' | 'incomplete' | 'error'>('checking');
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setState('checking');
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!applicable || !person) return;
    let cancelled = false;
    (async () => {
      try {
        const missing = await listMissingRequiredConsents(person.id);
        if (!cancelled) setState(missing.length ? 'incomplete' : 'complete');
      } catch {
        // Fail safe: an unverifiable consent state is neither granted nor
        // silently blocking — the person sees what happened and can retry.
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicable, person, attempt]);

  if (!applicable) return <>{children}</>;
  if (state === 'checking') return <LoadingState label="Getting things ready…" />;
  if (state === 'error')
    return (
      <ErrorState
        message="We couldn’t confirm your consent choices just now. Nothing is wrong with your account — please try again."
        onRetry={retry}
      />
    );
  if (state === 'incomplete') return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
