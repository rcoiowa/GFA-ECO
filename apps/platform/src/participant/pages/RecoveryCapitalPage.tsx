import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { submitBarc10 } from '@recoveryos/data-access';
import {
  BARC10_ITEMS,
  BARC10_SCALE,
  barc10Insight,
  barc10Total,
  soilForScore,
} from '@recoveryos/domain';
import { Alert, Button, Card, PageHeader } from '@recoveryos/ui';

type Stage = 'intro' | 'questions' | 'done';

/**
 * BARC-10 recovery capital assessment: one item at a time, no wrong answers,
 * finishing with the soil-type reflection. Saves the assessment and its
 * service-event attribution.
 */
export function RecoveryCapitalPage() {
  const { person } = useAuth();
  const [stage, setStage] = useState<Stage>('intro');
  const [answers, setAnswers] = useState<number[]>(Array(BARC10_ITEMS.length).fill(0));
  const [idx, setIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  async function finish(finalAnswers: number[]) {
    if (!person || saving) return;
    setSaving(true);
    setSaveError(false);
    const total = barc10Total(finalAnswers);
    try {
      await submitBarc10({
        personId: person.id,
        answers: finalAnswers,
        totalScore: total,
        deliveryContext: 'vrcc',
      });
      setFinalScore(total);
      setStage('done');
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  function pick(value: number) {
    const next = [...answers];
    next[idx] = value;
    setAnswers(next);
    if (idx < BARC10_ITEMS.length - 1) {
      setIdx(idx + 1);
    } else {
      void finish(next);
    }
  }

  const crumbs = [
    { to: '/app/today', label: 'Today' },
    { to: '/app/tools', label: 'Tools' },
  ];

  if (stage === 'intro') {
    return (
      <>
        <PageHeader
          title="Recovery capital check"
          lede="Ten short statements about the strengths in your life right now. There are no wrong answers, and nothing here is a test."
          crumbs={crumbs}
        />
        <Card>
          <p className="text-ink-muted">
            Recovery capital is everything you can draw on to build your recovery — people, energy,
            meaning, belonging. Answering takes about two minutes, and you can take it again anytime
            to see how things grow.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setStage('questions')}>
              Begin
            </Button>
            <Link
              to="/app/tools"
              className="inline-flex min-h-12 items-center rounded-md border border-line px-5 font-medium text-ink hover:bg-surface-sunken"
            >
              Maybe later
            </Link>
          </div>
        </Card>
      </>
    );
  }

  if (stage === 'done' && finalScore !== null) {
    const soil = soilForScore(finalScore);
    return (
      <>
        <PageHeader title="Thank you for showing up" crumbs={crumbs} />
        <Card>
          <div className="flex items-center gap-4">
            <span aria-hidden className="text-4xl">
              {soil.emoji}
            </span>
            <div>
              <p className="text-xl font-semibold text-ink">{soil.label}</p>
              <p className="text-ink-muted">{soil.description}</p>
            </div>
          </div>
          <p className="mt-4 max-w-prose text-ink">{barc10Insight(finalScore)}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/app/connect"
              className="inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-700"
            >
              Connect with support
            </Link>
            <Link
              to="/app/journey"
              className="inline-flex min-h-11 items-center rounded-md border border-line px-5 font-medium text-ink hover:bg-surface-sunken"
            >
              See my journey
            </Link>
          </div>
        </Card>
      </>
    );
  }

  const item = BARC10_ITEMS[idx];
  return (
    <>
      <PageHeader
        title="Recovery capital check"
        lede={`Statement ${idx + 1} of ${BARC10_ITEMS.length}`}
        crumbs={crumbs}
      />
      {saveError ? (
        <div className="mb-4">
          <Alert tone="critical">
            We couldn't save your answers. Nothing is lost — please try the last answer again.
          </Alert>
        </div>
      ) : null}
      <Card>
        <div aria-hidden className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-experience-500 transition-all"
            style={{ width: `${(idx / BARC10_ITEMS.length) * 100}%` }}
          />
        </div>
        <p className="text-lg font-medium text-ink">{item}</p>
        <div
          role="group"
          aria-label="Choose how much you agree"
          className="mt-5 grid gap-2 sm:grid-cols-2"
        >
          {BARC10_SCALE.map((option) => (
            <Button
              key={option.value}
              variant="secondary"
              disabled={saving}
              onClick={() => pick(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        {idx > 0 ? (
          <button
            type="button"
            onClick={() => setIdx(idx - 1)}
            className="mt-5 text-sm font-medium text-ink-muted hover:text-ink"
          >
            ← Back to the previous statement
          </button>
        ) : null}
      </Card>
    </>
  );
}
