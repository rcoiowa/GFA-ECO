import { useCallback, useEffect, useState } from 'react';
import {
  assignLead,
  findDuplicateLeads,
  listIntakeAssignees,
  listIntakeLeads,
  listLeadContacts,
  recordLeadContact,
  routeLead,
  setLeadStatus,
  type IntakeLead,
  type LeadContactEvent,
  type LeadStatus,
  type ResidenceInterest,
} from '@recoveryos/data-access';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
  TextField,
} from '@recoveryos/ui';

/**
 * Shared inquiry queue (leads v2, prepared migration 0147). One queue for every
 * front-door inquiry — website/Wix, Grace House, EJWRH — with six stages,
 * explicit self-selected residence routing (never inferred), response deadlines,
 * and the shared append-only contact log that prevents duplicate outreach.
 *
 * Visibility is enforced server-side: coordinators see everything, intake
 * workers see only inquiries assigned to them. This page renders whatever RLS
 * returns and never widens it.
 */

const STAGE_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  contacted: 'Contacted',
  waiting: 'Waiting',
  scheduled: 'Scheduled',
  closed: 'Closed',
  converted: 'Converted',
};

const OPEN_STAGES: LeadStatus[] = ['new', 'assigned', 'contacted', 'waiting', 'scheduled'];

const RESIDENCE_LABELS: Record<ResidenceInterest, string> = {
  unspecified: 'Pathway not selected',
  grace_house: 'Grace House',
  ejwrh: "Ernest & Johnnie White's Recovery House",
  confirm_route: 'Confirm pathway with them',
};

type Assignee = { person_id: number; first_name: string | null; last_name: string | null };

function isOverdue(lead: IntakeLead): boolean {
  return (
    OPEN_STAGES.includes(lead.status) &&
    !!lead.response_due_at &&
    new Date(lead.response_due_at).getTime() < Date.now()
  );
}

export function InquiriesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [leads, setLeads] = useState<IntakeLead[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [contacts, setContacts] = useState<LeadContactEvent[]>([]);
  const [duplicates, setDuplicates] = useState<{ id: number; status: string }[]>([]);
  const [showClosed, setShowClosed] = useState(false);
  const [actionError, setActionError] = useState(false);

  // Log-contact form state
  const [channel, setChannel] = useState<LeadContactEvent['channel']>('phone');
  const [outcome, setOutcome] = useState('');
  const [minutes, setMinutes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setLeads(await listIntakeLeads());
      try {
        const r = await listIntakeAssignees();
        if (r.ok) setAssignees((r.assignees as Assignee[]) ?? []);
      } catch {
        // Workers are not coordinators; the assignment picker simply stays hidden.
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openLead = async (lead: IntakeLead) => {
    if (openId === lead.id) {
      setOpenId(null);
      return;
    }
    setOpenId(lead.id);
    setContacts([]);
    setDuplicates([]);
    setOutcome('');
    setMinutes('');
    setNextFollowUp('');
    try {
      setContacts(await listLeadContacts(lead.id));
      const dup = await findDuplicateLeads(lead.id);
      if (dup.ok) setDuplicates((dup.duplicates as { id: number; status: string }[]) ?? []);
    } catch {
      // History/duplicate hints are progressive enhancement; the row still works.
    }
  };

  const act = async (fn: () => Promise<{ ok: boolean }>) => {
    setActionError(false);
    try {
      const r = await fn();
      if (!r.ok) throw new Error('rpc');
      await load();
    } catch {
      setActionError(true);
    }
  };

  const visible = leads.filter((l) => (showClosed ? true : OPEN_STAGES.includes(l.status)));

  return (
    <>
      <PageHeader
        title="Inquiries"
        lede="Every front-door inquiry in one queue — assigned, answered on time, and logged so nobody gets two calls or none."
      />
      {actionError ? (
        <Alert tone="critical">That didn&rsquo;t save. Please try again.</Alert>
      ) : null}
      {loading ? (
        <LoadingState label="Loading inquiries…" />
      ) : error ? (
        <ErrorState message="Couldn't load the inquiry queue." onRetry={() => void load()} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              {visible.length} {showClosed ? 'total' : 'open'} · overdue first
            </p>
            <button
              type="button"
              className="text-sm text-experience-700 underline underline-offset-2"
              onClick={() => setShowClosed(!showClosed)}
            >
              {showClosed ? 'Hide closed' : 'Show closed'}
            </button>
          </div>

          {visible.length === 0 ? (
            <Card>
              <p className="text-ink-muted">No open inquiries. New ones appear here the moment they arrive.</p>
            </Card>
          ) : (
            visible
              .slice()
              .sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)))
              .map((lead) => {
                const name =
                  [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'No name given';
                const overdue = isOverdue(lead);
                const isOpen = openId === lead.id;
                return (
                  <Card key={lead.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{name}</CardTitle>
                        <span className="rounded-full bg-surface-sunken px-3 py-0.5 text-sm text-ink-muted">
                          {STAGE_LABELS[lead.status]}
                        </span>
                        {lead.organization_inquiry ? (
                          <span className="rounded-full bg-attention-50 px-3 py-0.5 text-sm font-medium text-attention-700">
                            Partnership — priority
                          </span>
                        ) : null}
                        {overdue ? (
                          <span
                            data-testid={`overdue-${lead.id}`}
                            className="rounded-full bg-critical-50 px-3 py-0.5 text-sm font-medium text-critical-700"
                          >
                            Overdue
                          </span>
                        ) : null}
                      </div>
                      <Button variant="secondary" onClick={() => void openLead(lead)}>
                        {isOpen ? 'Close' : 'Work this inquiry'}
                      </Button>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {RESIDENCE_LABELS[lead.residence_interest]}
                      {lead.response_due_at
                        ? ` · respond by ${new Date(lead.response_due_at).toLocaleString()}`
                        : ''}
                      {` · via ${lead.source}`}
                    </p>

                    {isOpen ? (
                      <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4">
                        {duplicates.length > 0 ? (
                          <Alert tone="info">
                            Possible existing inquiry from the same contact (
                            {duplicates.map((d) => `#${d.id}`).join(', ')}). Check the contact
                            log before reaching out so they don&rsquo;t hear from us twice.
                          </Alert>
                        ) : null}

                        {lead.message ? (
                          <p className="text-sm text-ink">{lead.message}</p>
                        ) : null}

                        {assignees.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="text-sm font-medium text-ink" htmlFor={`assign-${lead.id}`}>
                              Assigned to
                            </label>
                            <select
                              id={`assign-${lead.id}`}
                              className="rounded-md border border-line bg-surface px-2 py-1 text-sm"
                              value={lead.assigned_to_person_id ?? ''}
                              onChange={(e) =>
                                e.target.value
                                  ? void act(() =>
                                      assignLead({
                                        leadId: lead.id,
                                        assigneePersonId: Number(e.target.value),
                                      }),
                                    )
                                  : undefined
                              }
                            >
                              <option value="">Unassigned</option>
                              {assignees.map((a) => (
                                <option key={a.person_id} value={a.person_id}>
                                  {[a.first_name, a.last_name].filter(Boolean).join(' ') ||
                                    `Person ${a.person_id}`}
                                </option>
                              ))}
                            </select>

                            <label className="ml-4 text-sm font-medium text-ink" htmlFor={`route-${lead.id}`}>
                              Pathway (their explicit choice)
                            </label>
                            <select
                              id={`route-${lead.id}`}
                              className="rounded-md border border-line bg-surface px-2 py-1 text-sm"
                              value={lead.residence_interest}
                              onChange={(e) =>
                                void act(() =>
                                  routeLead({
                                    leadId: lead.id,
                                    residenceInterest: e.target.value as ResidenceInterest,
                                  }),
                                )
                              }
                            >
                              {(
                                ['unspecified', 'grace_house', 'ejwrh', 'confirm_route'] as const
                              ).map((r) => (
                                <option key={r} value={r}>
                                  {RESIDENCE_LABELS[r]}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-ink">Stage</span>
                          {(['assigned', 'contacted', 'waiting', 'scheduled', 'closed'] as const).map(
                            (s) => (
                              <Button
                                key={s}
                                variant={lead.status === s ? 'primary' : 'secondary'}
                                onClick={() => void act(() => setLeadStatus({ leadId: lead.id, status: s }))}
                              >
                                {STAGE_LABELS[s]}
                              </Button>
                            ),
                          )}
                        </div>

                        <div className="flex flex-col gap-2 sm:max-w-lg">
                          <p className="text-sm font-medium text-ink">Log an actual contact</p>
                          <div className="flex flex-wrap gap-2">
                            {(['phone', 'text', 'email', 'in_person', 'other'] as const).map((c) => (
                              <Button
                                key={c}
                                variant={channel === c ? 'primary' : 'secondary'}
                                onClick={() => setChannel(c)}
                              >
                                {c === 'in_person' ? 'In person' : c.charAt(0).toUpperCase() + c.slice(1)}
                              </Button>
                            ))}
                          </div>
                          <TextField
                            label="What happened (outcome)"
                            value={outcome}
                            onChange={(e) => setOutcome(e.target.value)}
                            placeholder="Spoke with them; sending program info; call back Friday"
                          />
                          <div className="flex flex-wrap gap-3">
                            <TextField
                              label="Minutes spent"
                              value={minutes}
                              onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))}
                              placeholder="10"
                            />
                            <TextField
                              label="Next follow-up (date/time)"
                              type="datetime-local"
                              value={nextFollowUp}
                              onChange={(e) => setNextFollowUp(e.target.value)}
                            />
                          </div>
                          <Button
                            disabled={!outcome.trim()}
                            onClick={() =>
                              void act(async () => {
                                const r = await recordLeadContact({
                                  leadId: lead.id,
                                  channel,
                                  outcome: outcome.trim(),
                                  minutesSpent: minutes ? Number(minutes) : undefined,
                                  nextFollowUpAt: nextFollowUp
                                    ? new Date(nextFollowUp).toISOString()
                                    : undefined,
                                });
                                if (r.ok) {
                                  setOutcome('');
                                  setMinutes('');
                                  setNextFollowUp('');
                                  setContacts(await listLeadContacts(lead.id));
                                }
                                return r;
                              })
                            }
                          >
                            Log contact
                          </Button>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-ink">Contact history</p>
                          {contacts.length === 0 ? (
                            <p className="text-sm text-ink-muted">
                              No outreach logged yet — this person has not been contacted through
                              RecoveryOS.
                            </p>
                          ) : (
                            <ul className="mt-1 flex flex-col gap-1">
                              {contacts.map((c) => (
                                <li key={c.id} className="text-sm text-ink-muted">
                                  {new Date(c.occurred_at).toLocaleString()} ·{' '}
                                  {c.channel === 'in_person' ? 'in person' : c.channel} · {c.outcome}
                                  {c.minutes_spent ? ` · ${c.minutes_spent} min` : ''}
                                  {c.next_follow_up_at
                                    ? ` · next: ${new Date(c.next_follow_up_at).toLocaleString()}`
                                    : ''}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </Card>
                );
              })
          )}
        </div>
      )}
    </>
  );
}
