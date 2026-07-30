import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface BaseFieldProps {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({
  label,
  hint,
  error,
  className = '',
  ...rest
}: BaseFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-medium text-ink">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        aria-describedby={
          [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
        }
        aria-invalid={error ? true : undefined}
        className={`min-h-11 rounded-md border bg-surface-raised px-3 text-base text-ink placeholder:text-ink-faint ${
          error ? 'border-critical-600' : 'border-line'
        }`}
        {...rest}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-critical-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className = '',
  ...rest
}: BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-medium text-ink">
        {label}
      </label>
      {hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}
      <textarea
        id={id}
        rows={4}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className={`rounded-md border bg-surface-raised px-3 py-2 text-base text-ink ${
          error ? 'border-critical-600' : 'border-line'
        }`}
        {...rest}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-critical-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
