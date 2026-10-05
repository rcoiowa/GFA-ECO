import { useState } from 'react';
import { Link } from 'react-router';
import { PageHeader, Card } from '@recoveryos/ui';
import { communityResources, resourceCategories, type ResourceCategory } from '../../public/communityCenterResources';

/** Same reviewed directory as the public center, within the participant workspace. */
export function ResourcesPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ResourceCategory | 'all'>('all');
  const matches = communityResources.filter((resource) =>
    (category === 'all' || resource.category === category) &&
    `${resource.name} ${resource.description} ${resource.keywords}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const linkClass = 'mt-3 inline-block font-medium text-experience-700 underline underline-offset-2';
  return (
    <>
      <PageHeader
        title="Resources"
        lede="Housing, work, transportation, benefits — practical help, found together."
        crumbs={[{ to: '/vrcc/today', label: 'Today' }]}
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 font-medium text-ink">Search resources
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try housing, food, jobs, or family…" className="min-h-12 rounded-md border border-line bg-surface px-3 text-ink" />
        </label>
        <label className="flex flex-col gap-1 font-medium text-ink">Resource category
          <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="min-h-12 rounded-md border border-line bg-surface px-3 text-ink">
            <option value="all">All categories</option>
            {resourceCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <p className="mb-4 text-ink-muted" role="status" aria-live="polite">{matches.length} resource{matches.length === 1 ? '' : 's'} found</p>
      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((resource) => <Card key={resource.id}>
          <p className="text-sm text-ink-muted">{resource.category} · {resource.external ? 'External website' : 'In RecoveryOS'}</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">{resource.name}</h2>
          <p className="mt-2 text-ink-muted">{resource.description}</p>
          {resource.external
            ? <a href={resource.href} className={linkClass} rel="noreferrer">{resource.action} →</a>
            : <Link to={resource.href} className={linkClass}>{resource.action} →</Link>}
        </Card>)}
      </div>
      {matches.length === 0 && <Card><p>No matching resource yet. Try another word or select all categories.</p></Card>}
      <p className="mt-6 text-sm text-ink-muted">External links open the provider’s website. Check there for current hours, eligibility, schedules, and availability. Opening a link does not submit a request or confirm a referral. Sources reviewed October 5, 2026.</p>
      <Card className="mt-5">
        <h2 className="text-lg font-semibold text-ink">Would a person help you choose?</h2>
        <p className="mt-1 text-ink-muted">You do not have to figure this out alone.</p>
        <Link to="/community-center/front-desk" className={linkClass}>Visit the front desk →</Link>
      </Card>
    </>
  );
}
