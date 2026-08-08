import { Card, CardTitle, PageHeader } from '@recoveryos/ui';

/**
 * System — the honest launch state. Three different claims are kept distinct
 * on purpose: CONFIGURED (it exists in code/config), DB-VERIFIED (proven by
 * transactional tests against the live database), and HTTP-VERIFIED (proven
 * end-to-end over authenticated HTTP, which this environment cannot run).
 * Nothing on this page claims more than what was actually proven.
 */

type Claim = 'Configured' | 'DB-verified' | 'HTTP-verified' | 'Off by design' | 'Not activated' | 'Not performed';

const CLAIM_STYLE: Record<Claim, string> = {
  Configured: 'bg-surface-sunken text-ink-muted',
  'DB-verified': 'bg-positive-50 text-positive-700',
  'HTTP-verified': 'bg-positive-50 text-positive-700',
  'Off by design': 'bg-surface-sunken text-ink-muted',
  'Not activated': 'bg-attention-50 text-attention-700',
  'Not performed': 'bg-attention-50 text-attention-700',
};

function StateRow({ name, claim, note }: { name: string; claim: Claim; note: string }) {
  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-ink">{name}</span>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${CLAIM_STYLE[claim]}`}>{claim}</span>
      </div>
      <p className="mt-0.5 text-sm text-ink-muted">{note}</p>
    </li>
  );
}

export function SystemPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="System"
        lede="What is running, what is ready but deliberately off, and exactly how each claim was verified."
      />

      <Card>
        <CardTitle>Core platform</CardTitle>
        <ul className="mt-1 divide-y divide-line">
          <StateRow
            name="Row-level security & table privileges"
            claim="DB-verified"
            note="The launch contract preflight (grants, RLS bite, anon scope, append-only tables, RPC-only lifecycle, member-only message bodies) passes against the live launch database."
          />
          <StateRow
            name="Connection, messaging, navigation, residence & governance RPCs"
            claim="DB-verified"
            note="Every privileged transition was exercised in rolled-back transactional tests as the real JWT roles, including refusal cases (lockout, privilege tiers, replayed invitations, forged actors)."
          />
          <StateRow
            name="Realtime message doorbell"
            claim="Configured"
            note="Postgres changes publication is live and the client subscribes, but delivery has not been proven over live HTTP — so the 15–20 second polling fallback stays on until it is."
          />
          <StateRow
            name="Frontend build & tests"
            claim="Configured"
            note="Typecheck, unit tests, and production build pass in CI-equivalent runs. End-to-end browser verification is part of the soft-launch checklist."
          />
        </ul>
      </Card>

      <Card>
        <CardTitle>Deliberately not on</CardTitle>
        <ul className="mt-1 divide-y divide-line">
          <StateRow
            name="Session reminder engine"
            claim="DB-verified"
            note="Reminder generation and idempotency are proven in the database, but the cron schedule is READY — NOT ACTIVATED. It stays off until explicitly authorized."
          />
          <StateRow
            name="External SMS & email delivery"
            claim="Off by design"
            note="No message, reminder, or notification leaves the platform. In-app notifications only, and they never contain message content."
          />
          <StateRow
            name="Public cutover (vrcc.app)"
            claim="Not performed"
            note="Public DNS still points at the current production experience. Cutover is a separate, explicitly authorized step."
          />
          <StateRow
            name="Development archive retirement"
            claim="Not performed"
            note="The archived development project is retained untouched as the system of record for pre-launch history."
          />
        </ul>
      </Card>

      <Card>
        <CardTitle>How to read these labels</CardTitle>
        <ul className="mt-1 space-y-1.5 text-sm text-ink-muted">
          <li>
            <span className="font-medium text-ink">Configured</span> — it exists in code or
            settings; behavior not yet independently proven.
          </li>
          <li>
            <span className="font-medium text-ink">DB-verified</span> — proven by transactional
            tests run against the live database as real roles, then rolled back.
          </li>
          <li>
            <span className="font-medium text-ink">HTTP-verified</span> — proven end-to-end over
            authenticated HTTP. Nothing carries this label until the soft-launch harness runs.
          </li>
        </ul>
      </Card>
    </div>
  );
}
