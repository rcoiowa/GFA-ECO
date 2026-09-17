import { useEffect, useRef, useState } from 'react';

/**
 * Cloudflare Turnstile client integration for public-form abuse control.
 *
 * The canonical residence-intake Edge Function requires a `turnstile_token` in
 * production (fail-closed hardening, 2026-09-07), so every public form that can
 * reach it must render this widget and send the token it produces. The site key
 * is public configuration (VITE_TURNSTILE_SITE_KEY); when it is not configured
 * (local dev, pre-activation builds) the widget renders nothing and forms submit
 * without a token — the receiver's INTAKE_TURNSTILE_OPTIONAL escape hatch governs
 * whether that is accepted. Configure the site key and the receiver's
 * TURNSTILE_SECRET together at activation.
 *
 * Each form passes a distinct `action` (e.g. 'residence_application',
 * 'residence_listing'); the receiver verifies the action and hostname
 * server-side, so tokens minted on one form cannot be replayed on another.
 */

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const TURNSTILE_SITE_KEY: string =
  (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? '';

let scriptLoading: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptLoading) {
    scriptLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptLoading = null;
        reject(new Error('turnstile_script_failed'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptLoading;
}

export function TurnstileWidget({
  action,
  onToken,
}: {
  /** Server-verified action name; must match what the receiver expects for this form. */
  action: string;
  /** Called with a fresh token, and with null when the token expires or errors. */
  onToken: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    const el = containerRef.current;
    if (!el) return;
    let widgetId: string | undefined;
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        widgetId = window.turnstile.render(el, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [action]);

  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <div>
      <div ref={containerRef} />
      {loadFailed ? (
        <p className="text-sm text-ink-muted">
          The security check could not load. Please refresh and try again, or call 515-220-8771 and
          we&rsquo;ll help by phone.
        </p>
      ) : null}
    </div>
  );
}
