import { Link } from 'react-router';
import { GFA_CONTACTS } from '@recoveryos/safety';

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
          <Link to="/" className="hover:text-experience-700 underline underline-offset-2">
            Home
          </Link>
          <span aria-hidden> / </span>
          <Link
            to="/recovery-residences"
            className="hover:text-experience-700 underline underline-offset-2"
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
          safe, structured, supportive home for women building their lives in recovery.
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
            Start with one short application. No account or password is required to apply. After
            submitting, you can create or connect your free RecoveryOS account for VRCC access.
            Staff will verify your identity and link your application. Admission and resident access
            are separate steps; applying does not guarantee a bed.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/recovery-residences/grace-house/apply"
              className="inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-strong"
            >
              Apply online here
            </Link>
            <a
              href="https://gracehouse4.pages.dev/"
              className="inline-flex min-h-11 items-center rounded-md border border-experience-600 px-5 font-semibold text-experience-700 hover:bg-surface-raised"
            >
              Read Grace House documents
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

        <section aria-labelledby="gh-talk" className="mt-8">
          <h2 id="gh-talk" className="text-xl font-semibold text-ink">
            Rather talk with a person first?
          </h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Call the Grace For Addictions office at{' '}
            <a
              href={`tel:${GFA_CONTACTS.office.number}`}
              className="font-medium text-experience-700 underline underline-offset-2"
            >
              {GFA_CONTACTS.office.display}
            </a>{' '}
            during office hours, or the warmline at{' '}
            <a
              href={`tel:${GFA_CONTACTS.warmline.number}`}
              className="font-medium text-experience-700 underline underline-offset-2"
            >
              {GFA_CONTACTS.warmline.display}
            </a>{' '}
            — no application or account needed.{' '}
            <Link
              to="/support"
              className="font-medium text-experience-700 underline underline-offset-2"
            >
              See every support option
            </Link>
            .
          </p>
        </section>

        <p className="mt-8 text-sm text-ink-muted">
          Grace House does not discriminate on any basis protected by law. Detailed program and
          eligibility information is being finalized with Grace For Addictions and will appear here.
        </p>
      </main>

      <footer className="border-t border-line py-6">
        <p className="mx-auto max-w-4xl px-4 text-sm text-ink-muted">
          Grace For Addictions · No shame. No stigma. Just grace. · In immediate danger, call 911.
          For crisis support, call or text 988. ·{' '}
          <Link to="/support" className="underline underline-offset-2 hover:text-ink">
            All support options
          </Link>
        </p>
      </footer>
    </div>
  );
}
