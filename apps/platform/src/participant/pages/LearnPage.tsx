import { PageHeader, Card } from '@recoveryos/ui';

const TRACKS = [
  ['Brain Atlas', 'Understand what addiction does in the brain — and how recovery rebuilds it.'],
  ['Recovering the Mind', 'A guided path through the early work of recovery thinking.'],
  ['Training the Mind', 'Practices that strengthen attention, patience, and self-kindness.'],
  ['The Tapes We Carry', 'Recognizing the old internal messages — and recording new ones.'],
  ['The 59 Slogans', 'Short recovery wisdom you can carry through the day.'],
] as const;

/** Learn: canonical educational content. Content engine lands in Phase 3. */
export function LearnPage() {
  return (
    <>
      <PageHeader
        title="Learn"
        lede="Understanding is part of healing. Explore at your own pace."
        crumbs={[{ to: '/app/today', label: 'Today' }]}
      />
      <ul className="flex flex-col gap-4">
        {TRACKS.map(([title, body]) => (
          <li key={title}>
            <Card>
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
              <p className="mt-1 text-ink-muted">{body}</p>
              <p className="mt-2 text-sm font-medium text-attention-700">Content arriving soon</p>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
