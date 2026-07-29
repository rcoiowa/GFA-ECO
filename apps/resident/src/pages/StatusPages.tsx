import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="min-h-dvh bg-surface px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-ink">We can't find that page</h1>
      <p className="mt-2 text-ink-muted">The link may be old or mistyped.</p>
      <Link
        to="/today"
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-700"
      >
        Go to Today
      </Link>
    </div>
  );
}

export function NotAuthorizedPage() {
  return (
    <div className="min-h-dvh bg-surface px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-ink">This space is for current residents</h1>
      <p className="mt-2 mx-auto max-w-md text-ink-muted">
        Your account isn't connected to a recovery residence right now. The VRCC is always open
        to you for recovery support.
      </p>
      <a
        href="https://vrcc.app"
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-700"
      >
        Go to the VRCC
      </a>
    </div>
  );
}
