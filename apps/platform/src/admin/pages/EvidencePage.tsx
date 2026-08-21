import { useEffect } from 'react';
import { Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { domainStaffLabel } from '@recoveryos/domain';
import { useEvidenceSummary } from '../hooks/useAdminData';
import { track } from '../../lib/analytics';

/**
 * Evidence — aggregate, denominator-honest, and careful about what a number
 * can claim. OUTPUT means "we did a thing"; OUTCOME means "a thing changed for
 * a person". A referral is an output; a confirmed connection is an outcome.
 * Unmet needs stay on the page — they're evidence, not failures to hide.
 * No time-to-meaningful-human-contact metric is published (not yet approved).
 */

function pct(part: number, whole: number): string {
  if (!whole) return '—';
  return `${Math.round((part / whole) * 100)}%`;
}

function Row({ label, value, of }: { label: string; value: number | string; of?: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="text-ink">{label}</span>
      <span className="text-right">
        <span className="text-lg font-semibold text-ink">{value}</span>
        {of ? <span className="ml-2 text-sm text-ink-muted">{of}</span> : null}
      </span>
    </li>
  );
}

function Badge({ kind }: { kind: 'output' | 'outcome' }) {
  return (
    <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
      {kind}
    </span>
  );
}

export function EvidencePage() {
  const { data, isLoading, isError, refetch } = useEvidenceSummary();

  useEffect(() => {
    track('admin_evidence_viewed');
  }, []);

  if (isLoading) return <LoadingState label="Computing evidence…" />;
  if (isError || !data)
    return <ErrorState message="We couldn’t load evidence right now." onRetry={() => void refetch()} />;
  if (!data.ok)
    return (
      <Card>
        <CardTitle>Not available</CardTitle>
        <p className="mt-1 text-ink-muted">
          Evidence is available to platform administrators and executives.
        </p>
      </Card>
    );

  const { funnel, relationships, navigation, residence, services } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Evidence"
        lede="Aggregate facts with their denominators. Outputs are what we did; outcomes are what changed."
      />

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Connection funnel</CardTitle>
          <Badge kind="output" />
        </div>
        <ul className="mt-2 divide-y divide-line">
          <Row label="Support requests" value={funnel.requests} />
          <Row
            label="Claimed by a human"
            value={funnel.claimed}
            of={`${pct(funnel.claimed, funnel.requests)} of ${funnel.requests}`}
          />
          <Row label="Still waiting" value={funnel.still_waiting} />
          <Row label="Median minutes to claim" value={funnel.median_minutes_to_claim} />
          <Row label="90th percentile minutes to claim" value={funnel.p90_minutes_to_claim} />
        </ul>
        <p className="mt-2 text-sm text-ink-faint">
          Claim time measures our responsiveness, not a person’s experience of being helped. A
          time-to-meaningful-human-contact measure is not yet approved and is deliberately not
          published here.
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Coaching relationships</CardTitle>
          {/* OUTPUT, deliberately (P0-4): every row here is an engagement/activity
              signal — relationship records and message existence — not a verified
              change in a person's life. */}
          <Badge kind="output" />
        </div>
        <ul className="mt-2 divide-y divide-line">
          <Row label="Relationships established" value={relationships.coaching_established} />
          <Row
            label="Currently active"
            value={relationships.coaching_active}
            of={`of ${relationships.coaching_established} established`}
          />
          <Row
            label="Coach responded in the conversation (T1)"
            value={relationships.responded_t1}
            of={`${pct(relationships.responded_t1, relationships.coaching_established)} of established`}
          />
          <Row
            label="Two-way exchange happened (T4a)"
            value={relationships.two_way_t4a}
            of={`${pct(relationships.two_way_t4a, relationships.coaching_established)} of established`}
          />
        </ul>
        <p className="mt-2 text-sm text-ink-faint">
          These are engagement signals (outputs), not participant outcomes. Counts come from
          message existence only — nobody reads the messages to compute this, and
          &ldquo;established&rdquo; counts every relationship record regardless of current status.
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Navigation</CardTitle>
          <Badge kind="outcome" />
        </div>
        <ul className="mt-2 divide-y divide-line">
          <Row label="Needs identified" value={navigation.needs} />
          <Row
            label="Resolved"
            value={navigation.needs_resolved}
            of={`${pct(navigation.needs_resolved, navigation.needs)} of ${navigation.needs} identified`}
          />
          <Row label="Partially resolved" value={navigation.needs_partially_resolved} />
          <Row
            label="Unresolved — kept visible"
            value={navigation.needs_unresolved}
            of={`of ${navigation.needs} identified`}
          />
          <Row label="Referrals made (output)" value={navigation.referrals} />
          <Row
            label="Warm handoffs (output)"
            value={navigation.warm_handoffs}
            of={`of ${navigation.referrals} referrals`}
          />
          <Row
            label="Confirmed connected (outcome)"
            value={navigation.connected}
            of={`${pct(navigation.connected, navigation.referrals)} of ${navigation.referrals} referrals`}
          />
          <Row label="Participant declined" value={navigation.participant_declined} />
          <Row label="Partner unavailable" value={navigation.partner_unavailable} />
        </ul>
        {Object.keys(navigation.needs_by_category).length > 0 ? (
          <>
            <p className="mt-3 text-sm font-medium text-ink">Needs by category</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {Object.entries(navigation.needs_by_category)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <li
                    key={category}
                    className="rounded-full border border-line bg-surface-raised px-3 py-1 text-sm text-ink"
                  >
                    {category.replaceAll('_', ' ')} · {count}
                  </li>
                ))}
            </ul>
          </>
        ) : null}
        {navigation.needs_by_domain && Object.keys(navigation.needs_by_domain).length > 0 ? (
          <>
            {/* P1.6: the domain lens beside (never replacing) needs_by_category. These count
                identified needs — activity on the evidence ladder, not connection or outcome. */}
            <p className="mt-3 text-sm font-medium text-ink">Needs by domain (activity)</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {Object.entries(navigation.needs_by_domain)
                .sort(([, a], [, b]) => b - a)
                .map(([key, count]) => (
                  <li
                    key={key}
                    className="rounded-full border border-line bg-surface-raised px-3 py-1 text-sm text-ink"
                  >
                    {key === 'cross_cutting' ? 'Cross-cutting' : domainStaffLabel(key)} · {count}
                  </li>
                ))}
            </ul>
          </>
        ) : null}
        <p className="mt-2 text-sm text-ink-faint">
          A referral is activity; only a participant-confirmed connection counts as an outcome. An
          unmet need is a real data point about the community, not a performance failure.
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Recovery residences</CardTitle>
          <Badge kind="output" />
        </div>
        <ul className="mt-2 divide-y divide-line">
          <Row label="Applications received" value={residence.applications} />
          <Row
            label="Currently housed"
            value={residence.active_residencies}
            of={residence.capacity ? `of ${residence.capacity} beds` : undefined}
          />
          <Row label="Median length of stay (days)" value={residence.median_length_of_stay_days} />
        </ul>
        {Object.keys(residence.decisions).length > 0 ? (
          <>
            <p className="mt-3 text-sm font-medium text-ink">Application decisions</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {Object.entries(residence.decisions).map(([status, count]) => (
                <li
                  key={status}
                  className="rounded-full border border-line bg-surface-raised px-3 py-1 text-sm text-ink"
                >
                  {status.replaceAll('_', ' ')} · {count}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Services delivered</CardTitle>
          <Badge kind="output" />
        </div>
        <ul className="mt-2 divide-y divide-line">
          <Row label="People served (attested service events)" value={services.people_served} />
          <Row label="Service events" value={services.events} />
        </ul>
        {/* Funding attribution rows removed (P0-4): no workflow writes
            service_events.funding_source_id yet, so the numbers were structurally
            0 / N — a permanent zero presented as evidence. Restore the rows when a
            funding-attribution writer exists. */}
        <p className="mt-2 text-sm text-ink-faint">
          Funding attribution is not yet recorded by any workflow, so no funding split is shown —
          publishing a structural zero would misstate the evidence.
        </p>
        {Object.keys(services.by_type).length > 0 ? (
          <>
            <p className="mt-3 text-sm font-medium text-ink">By service type</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {Object.entries(services.by_type)
                .sort(([, a], [, b]) => b - a)
                .map(([name, count]) => (
                  <li
                    key={name}
                    className="rounded-full border border-line bg-surface-raised px-3 py-1 text-sm text-ink"
                  >
                    {name} · {count}
                  </li>
                ))}
            </ul>
          </>
        ) : null}
        <p className="mt-2 text-sm text-ink-faint">
          &ldquo;People served&rdquo; counts attested service events only — an appointment on the
          calendar is not a service delivered.
        </p>
      </Card>

      <p className="text-sm text-ink-faint">
        Every number aggregates production people only (fixtures excluded), is computed in the
        database, and carries its denominator. These pages describe contribution to outcomes — the
        platform never claims sole credit for a person’s recovery.
      </p>
    </div>
  );
}
