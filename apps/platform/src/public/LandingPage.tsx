import { Link } from 'react-router';

/**
 * Public landing. Success test: "What is this?" in 5 seconds, "What can I do
 * here?" in 10, "Where should I begin?" in 20. No private data.
 */
export function LandingPage() {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line bg-surface-raised">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <p className="text-xl font-semibold text-experience-700">VRCC</p>
          <nav className="flex items-center gap-3">
            <Link
              to="/sign-in"
              className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex min-h-11 items-center rounded-md bg-experience-600 px-4 font-semibold text-white hover:bg-experience-700"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="max-w-2xl text-3xl font-semibold text-ink">
          The Virtual Recovery Community Center
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          Free recovery support from Grace For Addictions — coaching, peer support, resource
          navigation, and a community that meets you exactly where you are. No residence stay
          required, no cost, no judgment.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="inline-flex min-h-12 items-center rounded-md bg-experience-600 px-6 text-lg font-semibold text-white hover:bg-experience-700"
          >
            Begin here
          </Link>
          <a
            href="tel:988"
            className="inline-flex min-h-12 items-center rounded-md bg-support-600 px-6 text-lg font-semibold text-white hover:bg-support-700"
          >
            Need help now? Call or text 988
          </a>
        </div>

        <section aria-labelledby="what-you-can-do" className="mt-14">
          <h2 id="what-you-can-do" className="text-xl font-semibold text-ink">
            What you can do here
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ['Work with a recovery coach', 'One-on-one support for building the life you want.'],
              [
                'Find resources',
                'Housing, employment, benefits, transportation, and more — with a navigator beside you.',
              ],
              ['Join recovery circles', 'Connect with people who understand, online or in person.'],
              ['Build recovery capital', 'Track your strengths, set goals, and watch them grow.'],
            ].map(([title, body]) => (
              <li key={title} className="rounded-lg border border-line bg-surface-raised p-5">
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-ink-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 rounded-lg bg-experience-soft p-6">
          <h2 className="text-xl font-semibold text-experience-700">Who is this for?</h2>
          <p className="mt-2 max-w-2xl text-ink">
            Anyone exploring recovery, actively building it, or supporting someone who is. If you're
            curious whether this is for you, it probably is — and registering takes about two
            minutes.
          </p>
        </section>

        <section aria-labelledby="residences" className="mt-10">
          <h2 id="residences" className="text-xl font-semibold text-ink">
            Recovery residences
          </h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Grace For Addictions also operates recovery housing, including Grace House — a women's
            recovery residence in Des Moines.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            <Link
              to="/recovery-residences/grace-house"
              className="inline-block font-medium text-experience-700 underline underline-offset-2"
            >
              Learn about Grace House
            </Link>
            {/* Plain anchor: the directory is a static page served by the
                Worker at this path, not a client-side route. */}
            <a
              href="/residence/directory/"
              className="inline-block font-medium text-experience-700 underline underline-offset-2"
            >
              Browse the RecoveryResidence.org directory
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-6">
        <p className="mx-auto max-w-4xl px-4 text-sm text-ink-muted">
          Grace For Addictions · Connection prevents crisis · No shame. No stigma. Just grace. ·
          Your information is private and protected. VRCC is not an emergency service — in immediate
          danger, call 911.
        </p>
      </footer>
    </div>
  );
}
