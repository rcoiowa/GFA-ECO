import { useState } from 'react';
import {
  SLOGAN_ATTRIBUTION,
  icarePhaseWhy,
  wellnessDisplayLabel,
  type SloganMatch,
} from '@recoveryos/recovery-content';
import { Card, CardTitle } from '@recoveryos/ui';

/**
 * A slogan offered as an intervention, not decoration (ADR-0015 principle 4):
 * the practice is the point, and "Why am I seeing this?" answers from the
 * signals that actually produced the match.
 */
export function SloganCard({
  match,
  heading,
  compact = false,
}: {
  match: SloganMatch;
  heading: string;
  /** Compact hides the practice behind a disclosure — used mid-form. */
  compact?: boolean;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [showPractice, setShowPractice] = useState(!compact);
  const { slogan, reasons } = match;

  return (
    <Card>
      <CardTitle>{heading}</CardTitle>
      <p className="text-lg text-ink">“{slogan.text}”</p>
      <p className="mt-2 text-ink-muted">{slogan.condensedCommentary}</p>

      <div className="mt-3">
        {compact ? (
          <button
            type="button"
            className="text-sm font-medium text-experience-700 underline underline-offset-2"
            onClick={() => setShowPractice((v) => !v)}
          >
            {showPractice ? 'Hide the practice' : "Show today's practice"}
          </button>
        ) : (
          <p className="font-medium text-ink">The practice</p>
        )}
        {showPractice ? (
          <p className="mt-1 border-l-2 border-experience-600 pl-3 text-ink">{slogan.practice}</p>
        ) : null}
      </div>

      {/* P1.5 display-language pass: humanized wellness tag; the ICARE phase is method
          context, so it lives inside "Why am I seeing this?" rather than on the tag line. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-sm text-ink-faint">
          #{slogan.number}
          {slogan.wellnessDomain ? <> · {wellnessDisplayLabel(slogan.wellnessDomain)}</> : null}
        </span>
        <button
          type="button"
          className="text-sm text-ink-faint underline underline-offset-2"
          onClick={() => setShowWhy((v) => !v)}
        >
          Why am I seeing this?
        </button>
      </div>

      {showWhy ? (
        <ul className="mt-2 flex flex-col gap-1">
          {reasons.map((r) => (
            <li key={r} className="text-sm text-ink-muted">
              {r}
            </li>
          ))}
          {icarePhaseWhy(slogan.icarePhase) ? (
            <li className="text-sm text-ink-muted">{icarePhaseWhy(slogan.icarePhase)}</li>
          ) : null}
        </ul>
      ) : null}

      <p className="mt-3 text-sm text-ink-faint">{SLOGAN_ATTRIBUTION.replace(/\*/g, '')}</p>
    </Card>
  );
}
