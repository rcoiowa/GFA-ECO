import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import { Button, Card, CardTitle, PageHeader } from '@recoveryos/ui';

export function ProfilePage() {
  const { person, session, signOut } = useAuth();

  return (
    <>
      <PageHeader
        title="Profile"
        lede="Your account and how RecoveryOS speaks to you."
        crumbs={[{ to: '/vrcc/today', label: 'Today' }]}
      />
      <div className="flex flex-col gap-5">
        <Card>
          <CardTitle>About you</CardTitle>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-ink-muted">Name</dt>
              <dd className="font-medium text-ink">
                {person ? `${person.first_name} ${person.last_name}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">Preferred name</dt>
              <dd className="font-medium text-ink">{person?.preferred_name ?? 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">Email</dt>
              <dd className="font-medium text-ink">{session?.user.email ?? '—'}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <CardTitle>Privacy and consent</CardTitle>
          <p className="text-ink-muted">
            Review what you've agreed to and change your mind at any time.
          </p>
          <Link
            to="/app/privacy"
            className="mt-2 inline-block font-medium text-experience-700 underline underline-offset-2"
          >
            Manage privacy choices
          </Link>
        </Card>
        <Card>
          <CardTitle>Account</CardTitle>
          <Button variant="secondary" onClick={() => void signOut()}>
            Sign out
          </Button>
        </Card>
      </div>
    </>
  );
}
