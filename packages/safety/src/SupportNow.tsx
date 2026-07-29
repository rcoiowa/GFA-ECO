import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { SUPPORT_LADDER, type SupportOption } from './ladder';

/**
 * Support Now: a persistent, calm entry point to help. Rendered by every
 * participant- and resident-facing shell. Opens an accessible dialog with the
 * escalation ladder ordered from grounding to emergency services.
 */
export function SupportNowButton({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function act(option: SupportOption) {
    const { action } = option;
    if (action.kind === 'route') {
      setOpen(false);
      navigate(action.to);
    } else {
      window.location.href =
        action.kind === 'tel' ? `tel:${action.number}` : `sms:${action.number}`;
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-support-600 px-4 font-semibold text-white shadow-raised hover:bg-support-700 ${className}`}
      >
        <span aria-hidden>♥</span> Support now
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-labelledby="support-now-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl bg-surface-raised p-0 shadow-raised backdrop:bg-ink/40"
      >
        <div className="p-6">
          <h2 id="support-now-title" className="text-xl font-semibold text-ink">
            You're not alone right now
          </h2>
          <p className="mt-1 text-ink-muted">
            Choose whatever kind of support feels right. There is no wrong choice.
          </p>
          <ul className="mt-5 flex flex-col gap-3">
            {SUPPORT_LADDER.map((option) => (
              <li key={option.key}>
                <button
                  type="button"
                  onClick={() => act(option)}
                  className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-left hover:border-support-500 hover:bg-support-500/5"
                >
                  <span className="block font-semibold text-ink">{option.title}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">{option.description}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-5 min-h-11 w-full rounded-md border border-line font-medium text-ink-muted hover:bg-surface-sunken"
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
