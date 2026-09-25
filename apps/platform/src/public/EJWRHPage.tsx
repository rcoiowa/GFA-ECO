import { Link } from 'react-router';

export function EJWRHPage() {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line bg-surface-raised">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-semibold text-experience-700">
            RecoveryOS
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/recovery-residences"
              className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
            >
              Housing
            </Link>
            <Link
              to="/support"
              className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
            >
              Support now
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-muted">
          <Link to="/recovery-residences" className="hover:text-experience-700 hover:underline">
            Recovery residences
          </Link>
          <span aria-hidden> / </span>
          <span aria-current="page" className="text-ink">
            EJWRH
          </span>
        </nav>

        <p className="font-semibold text-experience-700">Des Moines, Iowa · Men</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">
          Ernest &amp; Johnnie White Recovery House
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-ink-muted">
          A peer-led men&rsquo;s recovery residence supported by Grace For Addictions with
          wraparound recovery support. EJWRH is approved for Iowa Department of Corrections
          referrals, honors multiple pathways of recovery, and welcomes people using prescribed
          medications for addiction treatment or recovery.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/recovery-residences/ejwrh/apply"
            className="inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-strong"
          >
            Apply to EJWRH
          </Link>
          <a
            href="tel:15152208771"
            className="inline-flex min-h-11 items-center rounded-md border border-experience-600 px-5 font-semibold text-experience-700 hover:bg-surface-sunken"
          >
            Call 515-220-8771
          </a>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Residence highlights">
          {[
            [
              'Peer-led',
              'A recovery residence centered on connection, accountability, and mutual support.',
            ],
            [
              'All pathways honored',
              'Support is person-centered and does not require one specific recovery pathway.',
            ],
            [
              'Wraparound support',
              'Grace For Addictions provides recovery support, coaching, and resource navigation.',
            ],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-lg border border-line bg-surface-raised p-5">
              <h2 className="font-semibold text-ink">{title}</h2>
              <p className="mt-2 text-sm text-ink-muted">{copy}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-lg bg-experience-soft p-6">
          <h2 className="text-xl font-semibold text-experience-700">How applying works</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink">
            <li>Complete the short, confidential application.</li>
            <li>A real person reviews it and contacts you using the method you choose.</li>
            <li>
              If the residence may be a fit, intake and house documents are reviewed with staff
              before move-in. Nothing is signed in the application.
            </li>
          </ol>
        </section>

        <section className="mt-8 rounded-lg border border-line bg-surface-raised p-6">
          <h2 className="text-xl font-semibold text-ink">Prefer another way to apply?</h2>
          <p className="mt-2 text-ink-muted">
            Applying by phone or email is equally welcome and does not affect eligibility or place
            in line.
          </p>
          <p className="mt-3 text-ink">
            <a className="font-medium text-experience-700 underline" href="tel:15152208771">
              515-220-8771
            </a>{' '}
            ·{' '}
            <a
              className="font-medium text-experience-700 underline"
              href="mailto:ejwrh@rcoiowa.org"
            >
              ejwrh@rcoiowa.org
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
