import { useState, type FormEvent } from 'react';
import { Alert, Button } from '@recoveryos/ui';

/**
 * Offer up to three possible times. Native datetime-local inputs keep the
 * person in their own timezone — values convert to instants (ISO) on submit,
 * so the same moment reads correctly in every workspace. The server discards
 * past times; we catch the obvious case first with a gentle message.
 */
export function TimeOffersForm({
  onSubmit,
  submitting,
  submitLabel,
  onCancel,
}: {
  onSubmit: (startsIso: string[]) => void;
  submitting: boolean;
  submitLabel: string;
  onCancel?: () => void;
}) {
  const [slots, setSlots] = useState<string[]>(['', '', '']);
  const [problem, setProblem] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const instants = slots
      .filter((s) => s !== '')
      .map((s) => new Date(s))
      .filter((d) => !Number.isNaN(d.getTime()));
    if (instants.length === 0) {
      setProblem('Add at least one time.');
      return;
    }
    if (instants.every((d) => d.getTime() <= Date.now())) {
      setProblem('Those times have already passed — pick times in the future.');
      return;
    }
    setProblem(null);
    onSubmit(instants.filter((d) => d.getTime() > Date.now()).map((d) => d.toISOString()));
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {slots.map((value, index) => (
        <div key={index}>
          <label htmlFor={`offer-${index}`} className="block text-sm text-ink-muted">
            {index === 0 ? 'A time that could work' : 'Another option (optional)'}
          </label>
          <input
            id={`offer-${index}`}
            type="datetime-local"
            value={value}
            onChange={(e) =>
              setSlots((prev) => prev.map((s, i) => (i === index ? e.target.value : s)))
            }
            className="mt-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
        </div>
      ))}
      {problem ? <Alert tone="info">{problem}</Alert> : null}
      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="secondary" disabled={submitting}>
          {submitting ? 'Sending…' : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Never mind
          </Button>
        ) : null}
      </div>
    </form>
  );
}
