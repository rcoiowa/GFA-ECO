import { Link } from 'react-router';
import { PageHeader, Card } from '@recoveryos/ui';

/** Tools: daily practices and assessments. Assessment engine lands in Phase 3. */
export function ToolsPage() {
  return (
    <>
      <PageHeader
        title="Tools"
        lede="Practices and check-ins for the day you're actually having."
        crumbs={[{ to: '/app/today', label: 'Today' }]}
      />
      <div className="flex flex-col gap-4">
        <Card>
          <h2 className="text-lg font-semibold text-ink">Daily check-in</h2>
          <p className="mt-1 text-ink-muted">A ten-second honest moment with yourself.</p>
          <Link to="/app/today" className="mt-2 inline-block font-medium text-experience-700 underline underline-offset-2">
            Check in on Today
          </Link>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-ink">Grounding moment</h2>
          <p className="mt-1 text-ink-muted">The 5-4-3-2-1 practice for overwhelming moments.</p>
          <Link
            to="/app/support/grounding"
            className="mt-2 inline-block font-medium text-experience-700 underline underline-offset-2"
          >
            Begin grounding
          </Link>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-ink">Recovery capital assessment</h2>
          <p className="mt-1 text-ink-muted">
            Measure your recovery strengths and watch them grow over time.
          </p>
          <p className="mt-2 text-sm font-medium text-attention-700">Arriving soon</p>
        </Card>
      </div>
    </>
  );
}
