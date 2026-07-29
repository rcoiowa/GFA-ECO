import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="min-h-dvh bg-surface px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold text-ink">We can't find that page</h1>
        <p className="mt-2 text-ink-muted">
          The link may be old or mistyped. You haven't lost anything.
        </p>
        <Link
          to="/app/today"
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-700"
        >
          Go to Today
        </Link>
      </div>
    </div>
  );
}

export function NotAuthorizedPage() {
  return (
    <div className="min-h-dvh bg-surface px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold text-ink">That area isn't available</h1>
        <p className="mt-2 text-ink-muted">
          Your account doesn't have access to that part of RecoveryOS. If you think it should,
          reach out to the Grace For Addictions team.
        </p>
        <Link
          to="/app/today"
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-700"
        >
          Go to Today
        </Link>
      </div>
    </div>
  );
}
