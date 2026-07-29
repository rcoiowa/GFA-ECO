import { PageHeader, Card, EmptyState } from '@recoveryos/ui';

/** Resources: navigation needs and the provider directory. Engine lands in Phase 3/6. */
export function ResourcesPage() {
  return (
    <>
      <PageHeader
        title="Resources"
        lede="Housing, work, transportation, benefits — practical help, found together."
        crumbs={[{ to: '/today', label: 'Today' }]}
      />
      <Card>
        <EmptyState
          title="Resource navigation is on its way"
          message="Soon you'll be able to share what you need — housing, employment, IDs, benefits — and a navigator will work alongside you to find it."
        />
      </Card>
    </>
  );
}
