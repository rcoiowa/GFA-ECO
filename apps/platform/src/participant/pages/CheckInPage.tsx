import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { SloganCard } from '../../components/SloganCard';
import {
  getPulseDayState,
  readingsOf,
  submitPulseCheckIn,
  type PulseDayState,
} from '@recoveryos/data-access';
import {
  CHALLENGE_CHIPS,
  CONFIDENCE_SCALE,
  CONNECTION_OPTIONS,
  CONNECTION_QUESTION,
  CRAVING_SCALE,
  evaluatePulseResponses,
  HOPE_SCALE,
  MOOD_SCALE,
  primaryPulseResponse,
  PULSE_PROMPTS,
  PURPOSE_SCALE,
  requiresSupportPathway,
  selectQuadrant,
  type ConnectionAnswer,
  type LabeledScale,
  type PulseResponse,
} from '@recoveryos/domain';
import { bestSlogan, dailySlogan, type SloganMatch } from '@recoveryos/recovery-content';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@recoveryos/ui';

/**
 * Recovery Pulse — one ICARE cycle (ADR-0015):
 * Identify (the pulse) → Connect / Respond (deterministic, explainable) →
 * Empower (intention or next step). Never ends on a bare thank-you, and never
 * records elevated risk silently.
 */
export function CheckInPage() {
  const { person } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<PulseDayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skips, setSkips] = useState(0);
  const [showWhy, setShowWhy] = useState(false);

  // Answers
  const [mood, setMood] = useState<number | null>(null);
  const [craving, setCraving] = useState<number | null>(null);
  const [hope, setHope] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [purpose, setPurpose] = useState<number | null>(null);
  const [connection, setConnection] = useState<ConnectionAnswer | null>(null);
  const [intention, setIntention] = useState('');
  const [promptResponse, setPromptResponse] = useState('');
  const [reflection, setReflection] = useState('');
  const [carryForward, setCarryForward] = useState('');
  const [challenges, setChallenges] = useState<string[]>([]);
  const [done, setDone] = useState<PulseResponse[] | null>(null);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      setState(await getPulseDayState(person.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  const mode = state?.routing.mode;
  const isMorning = mode === 'morning';
  const isEvening = mode === 'evening' || mode === 'evening_streamlined';

  // The quadrant is chosen by us and recorded — never inferred from the answer.
  // The evening reuses the morning's quadrant so the loop actually closes.
  const quadrant = useMemo(() => {
    if (!person || !state) return null;
    if (isEvening && state.morning?.prompt_quadrant) return state.morning.prompt_quadrant;
    return selectQuadrant(person.id, state.routing.localDate, skips);
  }, [person, state, isEvening, skips]);

  const prompt = quadrant ? PULSE_PROMPTS[quadrant] : null;

  const liveResponses = useMemo(
    () =>
      evaluatePulseResponses(
        { mood, craving, hope, confidence, purpose, connection },
        readingsOf(state?.previous ?? null),
        state?.previousConnection ?? null,
      ),
    [mood, craving, hope, confidence, purpose, connection, state],
  );

  // ICARE Connect: while the form is open we are offering a practice. The
  // chain matches on what has been named so far; when nothing matches (a
  // barrier with no slogans behind it), fall back to the day's slogan rather
  // than showing nothing.
  const sloganMatch: SloganMatch | null = useMemo(() => {
    if (!person || !state) return null;
    const matched = bestSlogan({
      challengeTags: isMorning ? challenges : [],
      icarePhase: done ? 'Respond' : 'Connect',
      recentSloganNumbers: state.recentSloganNumbers,
    });
    if (matched) return matched;
    const slogan = dailySlogan(person.id, state.routing.localDate);
    return {
      slogan,
      score: 0,
      reasons: ['This is your slogan for today — one of the 59, in order, so nothing repeats.'],
    };
  }, [person, state, challenges, isMorning, done]);

  const submit = async () => {
    if (!person || !state || !mode) return;
    setSaving(true);
    try {
      const responses = liveResponses;
      await submitPulseCheckIn({
        personId: person.id,
        period: isMorning ? 'morning' : 'evening',
        localDate: state.routing.localDate,
        moodRating: mood,
        cravingRating: craving,
        hopeRating: isMorning ? hope : null,
        confidenceRating: isMorning ? confidence : null,
        purposeRating: isMorning ? purpose : null,
        connectionLevel: isEvening ? connection : null,
        intention: isMorning ? intention : null,
        reflection: isEvening ? reflection : null,
        carryForward: isEvening ? carryForward : null,
        challengeTags: isMorning ? challenges : [],
        promptQuadrant: quadrant,
        promptResponse: isMorning ? promptResponse : reflection,
        promptSkips: skips,
        pairedCheckInId: isEvening ? (state.morning?.id ?? null) : null,
        responseRuleIds: responses.map((r) => r.id),
        sloganNumber: sloganMatch?.slogan.number ?? null,
      });
      setDone(responses);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (!person) return <LoadingState />;
  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={() => void load()} />;
  if (!state) return <ErrorState onRetry={() => void load()} />;

  // ---------------------------------------------------------- after submit --
  if (done) {
    const primary = primaryPulseResponse(done);
    const needsSupport = requiresSupportPathway(done);
    return (
      <>
        <PageHeader title="Thank you for showing up" />
        <div className="flex flex-col gap-5">
          {needsSupport && primary ? (
            <Card>
              <Alert tone="attention">{primary.message}</Alert>
              <p className="mt-3 text-ink">
                Support is available right now — you do not have to explain yourself first.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href="tel:+15153103425"
                  className="inline-flex min-h-11 items-center rounded-md bg-support-600 px-5 font-semibold text-white hover:bg-support-strong"
                >
                  Call the Grace warmline
                </a>
                <a
                  href="tel:988"
                  className="inline-flex min-h-11 items-center rounded-md border border-support-600 px-5 font-semibold text-support-700 hover:bg-surface-raised"
                >
                  Call or text 988
                </a>
              </div>
              <p className="mt-3 text-sm text-ink-faint">{primary.because}</p>
            </Card>
          ) : primary ? (
            <Card>
              <CardTitle>{primary.message}</CardTitle>
              {primary.followUpPrompt ? (
                <p className="text-ink-muted">{primary.followUpPrompt}</p>
              ) : null}
              <button
                type="button"
                className="mt-2 text-sm text-ink-faint underline underline-offset-2"
                onClick={() => setShowWhy((v) => !v)}
              >
                Why am I seeing this?
              </button>
              {showWhy ? <p className="mt-1 text-sm text-ink-muted">{primary.because}</p> : null}
            </Card>
          ) : (
            <Card>
              <CardTitle>That's recorded — and it counts.</CardTitle>
              <p className="text-ink-muted">
                {isMorning
                  ? "Come back this evening and we'll close the day together."
                  : 'Rest well. Tomorrow gets its own beginning.'}
              </p>
            </Card>
          )}

          {!needsSupport && sloganMatch ? (
            <SloganCard match={sloganMatch} heading="Something to carry with you" />
          ) : null}

          <Card>
            <CardTitle>Where to go next</CardTitle>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/vrcc/journey')}>See your journey</Button>
              <Button variant="secondary" onClick={() => navigate('/vrcc')}>
                Back to Today
              </Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  // ------------------------------------------------------------- complete --
  if (mode === 'complete') {
    return (
      <>
        <PageHeader title="You're checked in" />
        <Card>
          <p className="text-ink">{state.routing.reason}</p>
          {state.morning?.intention ? (
            <p className="mt-3 text-ink-muted">
              This morning you set:{' '}
              <span className="font-medium text-ink">{state.morning.intention}</span>
            </p>
          ) : null}
          <Link
            to="/app/journey"
            className="mt-3 inline-block font-medium text-experience-700 underline underline-offset-2"
          >
            See your recent check-ins
          </Link>
        </Card>
      </>
    );
  }

  const canSubmit = mood != null && !saving;

  return (
    <>
      <PageHeader
        title={isMorning ? 'Good to see you' : 'Closing the day'}
        lede={
          isMorning
            ? 'A minute to notice how you are arriving, and to name one intention.'
            : 'A minute to look back at the day you just lived.'
        }
      />

      <div className="flex flex-col gap-5">
        {/* Reciprocity: the morning intention comes back in the evening. */}
        {isEvening && state.morning?.intention ? (
          <Card>
            <CardTitle>This morning you set</CardTitle>
            <p className="text-lg text-ink">{state.morning.intention}</p>
          </Card>
        ) : null}

        {/* --- Identify --- */}
        <Card>
          <CardTitle>How are you right now?</CardTitle>
          <div className="flex flex-col gap-5">
            <ScaleField scale={MOOD_SCALE} value={mood} onChange={setMood} />
            <ScaleField scale={CRAVING_SCALE} value={craving} onChange={setCraving} />
            {isMorning ? (
              <>
                <ScaleField scale={HOPE_SCALE} value={hope} onChange={setHope} />
                <ScaleField scale={CONFIDENCE_SCALE} value={confidence} onChange={setConfidence} />
                <ScaleField scale={PURPOSE_SCALE} value={purpose} onChange={setPurpose} />
              </>
            ) : (
              <fieldset>
                <legend className="mb-2 font-medium text-ink">{CONNECTION_QUESTION}</legend>
                <div className="flex flex-wrap gap-2">
                  {CONNECTION_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={connection === o.value}
                      onClick={() => setConnection(o.value)}
                      className={`min-h-11 rounded-md border px-4 font-medium ${
                        connection === o.value
                          ? 'border-experience-600 bg-experience-soft text-experience-700'
                          : 'border-line bg-surface-raised text-ink hover:bg-surface-sunken'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        </Card>

        {/* Respond in the moment — risk is never held until after submit. */}
        {requiresSupportPathway(liveResponses) ? (
          <Card>
            <Alert tone="attention">
              {primaryPulseResponse(liveResponses)?.message ?? 'Support is available right now.'}
            </Alert>
            <div className="mt-3 flex flex-wrap gap-3">
              <a
                href="tel:+15153103425"
                className="inline-flex min-h-11 items-center rounded-md bg-support-600 px-5 font-semibold text-white hover:bg-support-strong"
              >
                Call the Grace warmline
              </a>
              <a
                href="tel:988"
                className="inline-flex min-h-11 items-center rounded-md border border-support-600 px-5 font-semibold text-support-700 hover:bg-surface-raised"
              >
                Call or text 988
              </a>
            </div>
            <p className="mt-2 text-sm text-ink-faint">
              You can still finish your check-in — this stays here either way.
            </p>
          </Card>
        ) : null}

        {/* --- Empower: intention (morning) or reflection (evening) --- */}
        {isMorning ? (
          <Card>
            <CardTitle>What's one intention for today?</CardTitle>
            <input
              className="min-h-11 w-full rounded-md border border-line bg-surface-raised px-3 text-base"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Stay present · Call my sponsor · Be honest"
            />
            <fieldset className="mt-5">
              <legend className="mb-2 font-medium text-ink">
                Anything likely to be hard today? (optional)
              </legend>
              <div className="flex flex-wrap gap-2">
                {CHALLENGE_CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={challenges.includes(c)}
                    onClick={() =>
                      setChallenges((prev) =>
                        prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                      )
                    }
                    className={`min-h-11 rounded-full border px-4 text-sm font-medium ${
                      challenges.includes(c)
                        ? 'border-experience-600 bg-experience-soft text-experience-700'
                        : 'border-line bg-surface-raised text-ink hover:bg-surface-sunken'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
          </Card>
        ) : null}

        {/* --- Connect: a practice matched to what was just named --- */}
        {sloganMatch && (challenges.length > 0 || mood != null) ? (
          <SloganCard match={sloganMatch} heading="A practice for today" compact />
        ) : null}

        {/* --- The 2x2 prompt, paired morning to evening --- */}
        {prompt ? (
          <Card>
            <CardTitle>{isMorning ? prompt.morning : prompt.evening}</CardTitle>
            {isEvening && state.morning?.prompt_response ? (
              <p className="mb-2 text-ink-muted">
                This morning: <span className="text-ink">{state.morning.prompt_response}</span>
              </p>
            ) : null}
            <textarea
              className="min-h-24 w-full rounded-md border border-line bg-surface-raised p-3 text-base"
              value={isMorning ? promptResponse : reflection}
              onChange={(e) =>
                isMorning ? setPromptResponse(e.target.value) : setReflection(e.target.value)
              }
              placeholder="However much or little you want to say."
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {isMorning ? (
                <button
                  type="button"
                  className="text-sm font-medium text-experience-700 underline underline-offset-2"
                  onClick={() => setSkips((s) => s + 1)}
                >
                  Ask me something different
                </button>
              ) : null}
              <span className="text-sm text-ink-faint">
                Private to you — staff never see what you write here.
              </span>
            </div>
          </Card>
        ) : null}

        {isEvening ? (
          <Card>
            <CardTitle>Anything you want to carry into tomorrow? (optional)</CardTitle>
            <input
              className="min-h-11 w-full rounded-md border border-line bg-surface-raised px-3 text-base"
              value={carryForward}
              onChange={(e) => setCarryForward(e.target.value)}
              placeholder="One thing worth bringing with you"
            />
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void submit()} disabled={!canSubmit}>
            {saving ? 'Saving…' : isMorning ? 'Start the day' : 'Close the day'}
          </Button>
          {isEvening ? (
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setMood((m) => m ?? 2);
                void submit();
              }}
            >
              Today was hard
            </Button>
          ) : null}
          <button
            type="button"
            className="text-sm text-ink-faint underline underline-offset-2"
            onClick={() => setShowWhy((v) => !v)}
          >
            Why am I seeing this?
          </button>
        </div>
        {showWhy ? (
          <p className="text-sm text-ink-muted">
            {state.routing.reason}
            {prompt
              ? ` Today's reflection question practices ${prompt.process} — recognizing what you can influence, and what you can release.`
              : ''}
          </p>
        ) : null}
      </div>
    </>
  );
}

/** Labeled options over a stored 1–5 ordinal (owner decision: words, not numbers). */
function ScaleField({
  scale,
  value,
  onChange,
}: {
  scale: LabeledScale;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-medium text-ink">{scale.question}</legend>
      <div className="flex flex-wrap gap-2">
        {scale.labels.map((label, i) => {
          const v = i + 1;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={value === v}
              onClick={() => onChange(v)}
              className={`min-h-11 rounded-md border px-4 font-medium ${
                value === v
                  ? 'border-experience-600 bg-experience-soft text-experience-700'
                  : 'border-line bg-surface-raised text-ink hover:bg-surface-sunken'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
