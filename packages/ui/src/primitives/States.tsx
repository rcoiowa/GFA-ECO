import type { ReactNode } from 'react';

/** Meaningful empty / loading / error states — every list view must use these. */

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface-sunken/50 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-ink-muted max-w-prose mx-auto">{message}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  // loading-late keeps fast loads silent (spec §38): the indicator only
  // fades in once loading has actually lasted a beat.
  return (
    <div
      role="status"
      aria-live="polite"
      className="loading-late flex items-center gap-3 px-4 py-8 text-ink-muted"
    >
      <span
        className="inline-block size-5 animate-spin rounded-full border-2 border-line border-t-experience-600"
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  message = 'Something went wrong on our side. Your information is safe.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="rounded-lg border border-critical-600/30 bg-critical-50 px-5 py-6">
      <p className="text-critical-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-11 rounded-md border border-critical-600/40 px-4 font-medium text-critical-700 hover:bg-critical-strong hover:text-white"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
