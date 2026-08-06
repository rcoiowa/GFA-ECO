import { Link } from 'react-router';

/**
 * Public Grace House information page (feature-matrix: PRESERVE CONTENT,
 * REBUILD EXPERIENCE from the grace-harbor-16 build). Informational only —
 * the authenticated resident portal lives at /residence and is never linked
 * from here as if it were public.
 */
export function GraceHousePage() {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line bg-surface-raised">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-semibold text-experience-700">
            VRCC
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/sign-in"
              className="min-h-11 rounded-md px-4 py-2 font-medium text-ink hover:bg-surface-sunken"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-muted">
          <Link to="/" className="hover:text-experience-700 underline-offset-2 hover:underline">
            Home
          </Link>
          <span aria-hidden> / </span>
          <Link
            to="/recovery-residences"
            className="hover:text-experience-700 underline-offset-2 hover:underline"
          >
            Recovery residences
          </Link>
          <span aria-hidden> / </span>
          <span aria-current="page" className="text-ink">
            Grace House
          </span>
        </nav>

        <h1 className="text-3xl font-semibold text-ink">Grace House</h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-muted">
          A women's recovery residence in Des Moines, Iowa, operated by Grace For Addictions — a
          safe, structured, recovery-supportive home for women building their lives in recovery.
        </p>

        <section aria-labelledby="gh-about" className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface-raised p-5">
            <h2 id="gh-about" className="font-semibold text-ink">
              What living here includes
            </h2>
            <ul className="mt-2 list-disc pl-5 text-ink-muted">
              <li>A supportive, substance-free home with clear expectations</li>
              <li>House community, meetings, and peer accountability</li>
              <li>Full access to VRCC recovery support — coaching, navigation, community</li>
              <li>Help planning your next step, from day one to transition</li>
            </ul>
          </div>
          <div className="rounded-lg border border-line bg-surface-raised p-5">
            <h2 className="font-semibold text-ink">Who Grace House serves</h2>
            <p className="mt-2 text-ink-muted">
              Women in recovery seeking structured recovery housing. Grace House is preparing for
              NARR Level II certification and follows recognized recovery residence standards,
              including resident rights and a fair grievance process.
            </p>
          </div>
        </section>

        <section aria-labelledby="gh-apply" className="mt-8 rounded-lg bg-experience-soft p-6">
          <h2 id="gh-apply" className="text-xl font-semibold text-experience-700">
            Ready to apply?
          </h2>
          <p className="mt-2 max-w-2xl text-ink">
            The Grace House site walks you through every document and house rule, then the
            application itself. Submitting creates your resident account, and staff respond within 2
            business days — with a bed or a place on the waitlist. Exploring is not a commitment.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/recovery-residences/grace-house/apply"
              className="inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-700"
            >
              Apply online here
            </Link>
            <a
              href="https://gracehouse4.pages.dev/"
              className="inline-flex min-h-11 items-center rounded-md border border-experience-600 px-5 font-semibold text-experience-700 hover:bg-surface-raised"
            >
              Visit the Grace House site
            </a>
            {/* Plain anchor: the RecoveryResidence.org directory is a static
                page served at this path, not a client-side route. */}
            <a
              href="/residence/directory/"
              className="inline-flex min-h-11 items-center rounded-md border border-line px-5 font-medium text-ink hover:bg-surface-raised"
            >
              See all residences
            </a>
          </div>
        </section>

        <p className="mt-8 text-sm text-ink-muted">
          Grace House does not discriminate on any basis protected by law. Detailed program,
          eligibility, and contact information is being finalized with Grace For Addictions and will
          appear here.
        </p>
      </main>

      <footer className="border-t border-line py-6">
        <p className="mx-auto max-w-4xl px-4 text-sm text-ink-muted">
          Grace For Addictions · No shame. No stigma. Just grace. · In immediate danger, call 911.
          For crisis support, call or text 988.
        </p>
      </footer>
    </div>
  );
}
