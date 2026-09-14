import { PageHeader, Card, CardTitle, EmptyState } from '@recoveryos/ui';

/** Connect: support team, coaching, peers, circles. Engines land in Phase 3/6. */
export function ConnectPage() {
  return (
    <>
      <PageHeader
        title="Connect"
        lede="Your support team and your community."
        crumbs={[{ to: '/app/today', label: 'Today' }]}
      />
      <div className="flex flex-col gap-5">
        <Card>
          <CardTitle>Your support team</CardTitle>
          <EmptyState
            title="No support team members yet"
            message="When you're matched with a recovery coach or navigator, they'll appear here so you can reach them easily."
          />
        </Card>
        <Card>
          <CardTitle>Recovery circles</CardTitle>
          <EmptyState
            title="Circles are coming soon"
            message="Group meetings and community circles will be listed here with easy ways to join."
          />
        </Card>
      </div>
    </>
  );
}
