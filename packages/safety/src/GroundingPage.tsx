import { useNavigate } from 'react-router';

const STEPS = [
  { count: '5', sense: 'things you can see', hint: 'Look around slowly. Name them to yourself.' },
  { count: '4', sense: 'things you can touch', hint: 'Your chair, your clothing, the air.' },
  { count: '3', sense: 'things you can hear', hint: 'Near sounds and far sounds.' },
  { count: '2', sense: 'things you can smell', hint: 'Or two smells you like.' },
  { count: '1', sense: 'thing you can taste', hint: 'Or one kind thing about yourself.' },
];

/** A calm 5-4-3-2-1 grounding exercise. Shared by every experience shell. */
export function GroundingPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold text-ink">A grounding moment</h1>
      <p className="mt-2 text-ink-muted">
        Take a slow breath in through your nose, hold it gently, and let it out through your mouth.
        Then move through these five steps at your own pace.
      </p>
      <ol className="mt-6 flex flex-col gap-4">
        {STEPS.map((step) => (
          <li
            key={step.count}
            className="flex gap-4 rounded-lg border border-line bg-surface-raised p-4"
          >
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-support-600/10 text-lg font-bold text-support-700"
            >
              {step.count}
            </span>
            <div>
              <p className="font-semibold text-ink">
                Notice {step.count} {step.sense}
              </p>
              <p className="text-sm text-ink-muted">{step.hint}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-ink-muted">
        However you're feeling is okay. If you'd like more support, it's here for you.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="min-h-11 rounded-md border border-line px-4 font-medium text-ink hover:bg-surface-sunken"
        >
          Go back
        </button>
        <a
          href="tel:988"
          className="inline-flex min-h-11 items-center rounded-md bg-support-600 px-4 font-semibold text-white hover:bg-support-strong"
        >
          Call or text 988
        </a>
      </div>
    </div>
  );
}
