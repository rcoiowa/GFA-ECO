import { EmptyState, PageHeader } from '@recoveryos/ui';

/** Honest placeholder for destinations whose engines land in later phases. */
export function PlaceholderPage({
  title,
  lede,
  note,
}: {
  title: string;
  lede: string;
  note: string;
}) {
  return (
    <>
      <PageHeader title={title} lede={lede} crumbs={[{ to: '/residence/today', label: 'Today' }]} />
      <EmptyState title="Coming soon" message={note} />
    </>
  );
}
