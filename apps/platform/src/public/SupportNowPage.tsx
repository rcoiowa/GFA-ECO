import { useEffect } from 'react';
import { Link } from 'react-router';
import { PUBLIC_SUPPORT_GROUPS, type SupportOption } from '@recoveryos/safety';
import { useAuth } from '@recoveryos/auth';
import { track } from '../lib/analytics';

/**
 * Public Support Now — the anonymous human-connection path. Everything on
 * this page works without an account: emergency services, crisis lines, and
 * Grace For Addictions' own warmline and office. Fully deterministic and
 * static — no Grace AI, no backend reads, no participant data.
 */
function SupportCall({ option }: { option: SupportOption }) {
  if (option.action.kind !== 'tel') return null;
  return (
    <li>
      <a
        href={`tel:${option.action.number}`}
        className="block rounded-lg border border-line bg-surface-raised px-4 py-3 hover:border-support-500 hover:bg-support-500/5"
      >
        <span className="block font-semibold text-ink">{option.title}</span>
        <span className="mt-0.5 block text-sm text-ink-muted">{option.description}</span>
        <span className="mt-1 block font-medium text-support-700">{option.action.display}</span>
      </a>
    </li>
  );
}

export function SupportNowPage() {
  const { session } = useAuth();

  useEffect(() => {
    track('public_support_viewed');
  }, []);

  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line bg-surface-raised">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-semibold text-experience-700">
            VRCC
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/"
              className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-semibold text-ink">Support, right now</h1>
        <p className="mt-2 text-lg text-ink-muted">
          Every option on this page works without an account. Choose whatever kind of support feels
          right — there is no wrong choice.
        </p>

        {PUBLIC_SUPPORT_GROUPS.map((group) => (
          <section key={group.key} aria-labelledby={`support-${group.key}`} className="mt-8">
            <h2 id={`support-${group.key}`} className="text-xl font-semibold text-ink">
              {group.title}
            </h2>
            <p className="mt-1 text-ink-muted">{group.lede}</p>
            <ul className="mt-3 flex flex-col gap-3">
              {group.options.map((option) => (
                <SupportCall key={option.key} option={option} />
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-8 text-sm text-ink-muted">
          Grace For Addictions offers human recovery support — it is not an emergency service and
          does not provide clinical care or 24/7 crisis response. In immediate danger, call 911; in
          crisis, call or text 988.
        </p>

        {session ? (
          <p className="mt-4">
            <Link
              to="/home"
              className="font-medium text-experience-700 underline underline-offset-2"
            >
              Continue to my space
            </Link>
          </p>
        ) : null}
      </main>

      <footer className="border-t border-line py-6">
        <p className="mx-auto max-w-4xl px-4 text-sm text-ink-muted">
          Grace For Addictions · Connection prevents crisis · No shame. No stigma. Just grace.
        </p>
      </footer>
    </div>
  );
}
