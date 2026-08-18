import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import {
  ensureMyPerson,
  listMissingRequiredConsents,
  recordConsentDecision,
} from '@recoveryos/data-access';
import { participantOnboardingApplies, type ConsentType } from '@recoveryos/domain';
import { Alert, Button, Card, ErrorState, LoadingState } from '@recoveryos/ui';
import { track } from '../lib/analytics';

/**
 * Minimal onboarding: provisions the person record (person + profile +
 * participant role; idempotent server-side), then — for people whose home is
 * the participant space — the smallest coherent entry boundary:
 *
 *   1. "Do you need support right now?" — an immediate yes routes straight
 *      to the deterministic Support Now page, before anything else.
 *   2. The required-for-service consent acknowledgments (granular, from the
 *      existing consent authority — never invented client-side).
 *
 * Optional consents stay where they live (Privacy & consent) and are never
 * bundled here. Staff/residence/admin roles and people who already satisfied
 * the boundary pass straight through. Support access is never conditional on
 * consent: the support path stays visible and public throughout.
 */
type Phase = 'preparing' | 'support' | 'consent' | 'failed';

export function OnboardingPage() {
  const { session, person, roles, refreshIdentity, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = useState<Phase>('preparing');
  const [required, setRequired] = useState<ConsentType[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [needAllMessage, setNeedAllMessage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Provisioning rounds this mount — the loop-breaker below reads it.
  const rounds = useRef(0);
  const viewedTracked = useRef(false);
  // Internal-only return path (e.g. back to a residence application).
  const rawNext = searchParams.get('next');
  const destination = rawNext?.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/home';

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        if (!person) {
          // Provisioning is idempotent, so a second pass is harmless — but a
          // third means identity still is not loading, and navigating on would
          // bounce the guard straight back here. Surface the problem instead
          // of flickering.
          if (rounds.current >= 2) {
            setPhase('failed');
            return;
          }
          rounds.current += 1;
          const meta = session.user.user_metadata as Record<string, unknown>;
          await ensureMyPerson({
            firstName: typeof meta.first_name === 'string' ? meta.first_name : 'Friend',
            lastName: typeof meta.last_name === 'string' ? meta.last_name : '',
          });
          await refreshIdentity();
          // The effect re-runs once identity lands with the person.
          return;
        }
        // Staff/residence/admin homes are never captured by participant
        // onboarding; people who already satisfied the boundary continue on.
        if (!participantOnboardingApplies(roles)) {
          navigate(destination, { replace: true });
          return;
        }
        const missing = await listMissingRequiredConsents(person.id);
        if (cancelled) return;
        if (!missing.length) {
          navigate(destination, { replace: true });
          return;
        }
        setRequired(missing);
        if (!viewedTracked.current) {
          viewedTracked.current = true;
          track('onboarding_viewed');
        }
        setPhase((current) => (current === 'preparing' ? 'support' : current));
      } catch {
        if (!cancelled) setPhase('failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, person, roles, attempt, navigate, refreshIdentity, destination]);

  function chooseSupportNow() {
    // Immediate need wins over everything else — no consent, no fields, no
    // account steps stand between a person and support.
    track('onboarding_immediate_support_selected');
    navigate('/support');
  }

  async function submitConsent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!person) return;
    if (!required.every((type) => checked[type.id])) {
      setNeedAllMessage(true);
      return;
    }
    setSaving(true);
    setSaveFailed(false);
    try {
      // Each required type is an individual, affirmative decision written
      // through the existing append-only consent path.
      for (const type of required) {
        await recordConsentDecision({
          personId: person.id,
          consentTypeId: type.id,
          status: 'granted',
        });
      }
      track('onboarding_consent_completed');
      track('onboarding_completed');
      navigate(destination, { replace: true });
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh bg-surface px-4 py-12">
      <div className="mx-auto max-w-md">
        <Card>
          {phase === 'failed' ? (
            <>
              <h1 className="text-2xl font-semibold text-ink">Setting things up</h1>
              <div className="mt-4 flex flex-col gap-4">
                <ErrorState
                  message="We couldn't finish setting up your space. Nothing is lost — please try again."
                  onRetry={() => {
                    rounds.current = 0;
                    setPhase('preparing');
                    setAttempt((n) => n + 1);
                  }}
                />
                <Button variant="secondary" onClick={() => navigate('/')}>
                  Return to home
                </Button>
              </div>
            </>
          ) : phase === 'support' ? (
            <>
              <h1 className="text-2xl font-semibold text-ink">
                Welcome{person?.first_name ? `, ${person.first_name}` : ''}
              </h1>
              <p className="mt-2 text-ink-muted">
                Before anything else — one question. There is no wrong answer.
              </p>
              <h2 className="mt-5 text-lg font-semibold text-ink">
                Do you need support right now?
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                <Button size="lg" onClick={chooseSupportNow}>
                  Yes — show me support options
                </Button>
                <Button variant="secondary" size="lg" onClick={() => setPhase('consent')}>
                  I&rsquo;m okay right now — continue
                </Button>
              </div>
            </>
          ) : phase === 'consent' ? (
            <>
              <h1 className="text-2xl font-semibold text-ink">Your agreements</h1>
              <p className="mt-2 text-ink-muted">
                These decisions are what let us provide your VRCC space. Each one is yours to make,
                and you can withdraw any consent later under Privacy &amp; consent.
              </p>
              {saveFailed ? (
                <div className="mt-4">
                  <Alert tone="critical">
                    We couldn&rsquo;t save your choices — nothing was lost. Please try again.
                  </Alert>
                </div>
              ) : null}
              <form onSubmit={submitConsent} className="mt-5 flex flex-col gap-4" noValidate>
                {required.map((type) => (
                  <label key={type.id} className="flex items-start gap-3 text-ink">
                    <input
                      type="checkbox"
                      className="mt-1.5 size-4"
                      checked={!!checked[type.id]}
                      onChange={(event) => {
                        setNeedAllMessage(false);
                        setChecked((prev) => ({ ...prev, [type.id]: event.target.checked }));
                      }}
                    />
                    <span>
                      <span className="font-semibold">{type.name}</span>
                      {type.description ? (
                        <span className="mt-0.5 block text-sm text-ink-muted">
                          {type.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
                {needAllMessage ? (
                  <p role="alert" className="text-sm font-medium text-ink">
                    Each agreement above is needed to use the VRCC. If you&rsquo;d rather not
                    decide right now, that&rsquo;s okay — support below stays open to you either
                    way.
                  </p>
                ) : null}
                <Button type="submit" size="lg" disabled={saving}>
                  {saving ? 'Saving your choices…' : 'Agree and continue'}
                </Button>
              </form>
              <p className="mt-4 text-sm text-ink-muted">
                Optional choices — like Grace AI — stay off unless you turn them on, and everything
                can be changed anytime under Privacy &amp; consent.
              </p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-3 text-sm text-ink-muted underline underline-offset-2 hover:text-ink"
              >
                Sign out for now
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-ink">Setting things up</h1>
              <LoadingState label="Preparing your space…" />
            </>
          )}
        </Card>
        {phase === 'support' || phase === 'consent' ? (
          <p className="mt-4 text-center text-sm text-ink-muted">
            <Link to="/support" className="underline underline-offset-2 hover:text-ink">
              Support options
            </Link>{' '}
            are always available — no agreement or account needed.
          </p>
        ) : null}
      </div>
    </div>
  );
}
