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
  type ContactKind,
  type IntakeLead,
  type LeadContactEvent,
  type LeadStatus,
  type ResidenceInterest,
  type TriageClassification,
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
 * explicit self-selected residence routing (never inferred), and the shared
 * append-only contact log that prevents duplicate outreach.
 *
 * Response-time policy (ratified 2026-09-05): business-time targets govern
 * operationally, but automated deadline computation is deferred until GFA's
 * operating calendar is ratified — so this page surfaces age since receipt and
 * never fabricates an overdue determination (response_due_at stays dormant; the
 * overdue badge simply cannot fire until a ratified deadline is populated).
 * Contact logging distinguishes an ATTEMPT from an established CONNECTION
 * (decision 1), and closing records the human triage classification so
 * nonqualified records never inflate qualified-request measures (decision 6).
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

const CLASSIFICATION_LABELS: Record<TriageClassification, string> = {
  qualified_recovery_support: 'Qualified recovery-support inquiry',
  organization_partnership: 'Organization / partnership inquiry',
  other: 'Other legitimate inquiry (not recovery support)',
  spam: 'Spam',
  duplicate: 'Duplicate',
  test: 'Test submission',
  unrelated_solicitation: 'Unrelated solicitation',
  other_nonqualified: 'Nonqualified — none of the above',
};

/** Plain-language age since the inquiry reached GFA (decision 3: age, not fabricated overdue). */
function ageSinceReceipt(lead: IntakeLead): string {
  const received = new Date(lead.submitted_at ?? lead.created_at).getTime();
  const hours = Math.max(0, Math.floor((Date.now() - received) / 3_600_000));
  if (hours < 1) return 'received under an hour ago';
  if (hours < 48) return `waiting ${hours} hour${hours === 1 ? '' : 's'}`;
  return `waiting ${Math.floor(hours / 24)} days`;
}

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
  const [contactKind, setContactKind] = useState<ContactKind>('attempted');
  const [outcome, setOutcome] = useState('');
  const [minutes, setMinutes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [closeClassification, setCloseClassification] = useState<TriageClassification>(
    'qualified_recovery_support',
  );
  const [closeNote, setCloseNote] = useState('');

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
    setContactKind('attempted');
    setOutcome('');
    setMinutes('');
    setNextFollowUp('');
    setCloseClassification('qualified_recovery_support');
    setCloseNote('');
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
              {visible.length} {showClosed ? 'total' : 'open'} · waiting longest first
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
              <p className="text-ink-muted">
                No open inquiries. New ones appear here the moment they arrive.
              </p>
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
                      {OPEN_STAGES.includes(lead.status) ? ` · ${ageSinceReceipt(lead)}` : ''}
                      {lead.response_due_at
                        ? ` · respond by ${new Date(lead.response_due_at).toLocaleString()}`
                        : ''}
                      {` · via ${lead.source}`}
                      {lead.status === 'closed' && lead.triage_classification
                        ? ` · ${CLASSIFICATION_LABELS[lead.triage_classification]}`
                        : ''}
                    </p>

                    {isOpen ? (
                      <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4">
                        {duplicates.length > 0 ? (
                          <Alert tone="info">
                            Possible existing inquiry from the same contact (
                            {duplicates.map((d) => `#${d.id}`).join(', ')}). Check the contact log
                            before reaching out so they don&rsquo;t hear from us twice.
                          </Alert>
                        ) : null}

                        {lead.message ? <p className="text-sm text-ink">{lead.message}</p> : null}

                        {assignees.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <label
                              className="text-sm font-medium text-ink"
                              htmlFor={`assign-${lead.id}`}
                            >
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

                            <label
                              className="ml-4 text-sm font-medium text-ink"
                              htmlFor={`route-${lead.id}`}
                            >
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
                          {(['assigned', 'contacted', 'waiting', 'scheduled'] as const).map((s) => (
                            <Button
                              key={s}
                              variant={lead.status === s ? 'primary' : 'secondary'}
                              onClick={() =>
                                void act(() => setLeadStatus({ leadId: lead.id, status: s }))
                              }
                            >
                              {STAGE_LABELS[s]}
                            </Button>
                          ))}
                        </div>

                        {/* Closing records the human quality determination (decision 6) —
                            spam/tests/duplicates never blend into qualified counts. */}
                        <div className="flex flex-wrap items-center gap-2">
                          <label
                            className="text-sm font-medium text-ink"
                            htmlFor={`close-classification-${lead.id}`}
                          >
                            Close as
                          </label>
                          <select
                            id={`close-classification-${lead.id}`}
                            className="rounded-md border border-line bg-surface px-2 py-1 text-sm"
                            value={closeClassification}
                            onChange={(e) =>
                              setCloseClassification(e.target.value as TriageClassification)
                            }
                          >
                            {(Object.keys(CLASSIFICATION_LABELS) as TriageClassification[]).map(
                              (c) => (
                                <option key={c} value={c}>
                                  {CLASSIFICATION_LABELS[c]}
                                </option>
                              ),
                            )}
                          </select>
                          {closeClassification === 'other' ? (
                            <TextField
                              label="What kind of inquiry? (optional)"
                              value={closeNote}
                              onChange={(e) => setCloseNote(e.target.value)}
                              placeholder="Speaker invitation; training request; media contact"
                            />
                          ) : null}
                          <Button
                            variant={lead.status === 'closed' ? 'primary' : 'secondary'}
                            onClick={() =>
                              void act(() =>
                                setLeadStatus({
                                  leadId: lead.id,
                                  status: 'closed',
                                  closeClassification,
                                  closeNote:
                                    closeClassification === 'other' && closeNote.trim()
                                      ? closeNote.trim()
                                      : undefined,
                                }),
                              )
                            }
                          >
                            {STAGE_LABELS.closed}
                          </Button>
                        </div>

                        <div className="flex flex-col gap-2 sm:max-w-lg">
                          <p className="text-sm font-medium text-ink">Log an actual contact</p>
                          <div className="flex flex-wrap gap-2">
                            {(['phone', 'text', 'email', 'in_person', 'other'] as const).map(
                              (c) => (
                                <Button
                                  key={c}
                                  variant={channel === c ? 'primary' : 'secondary'}
                                  onClick={() => setChannel(c)}
                                >
                                  {c === 'in_person'
                                    ? 'In person'
                                    : c.charAt(0).toUpperCase() + c.slice(1)}
                                </Button>
                              ),
                            )}
                          </div>
                          {/* An attempt is honest evidence too — it just isn't a connection. */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={contactKind === 'attempted' ? 'primary' : 'secondary'}
                              onClick={() => setContactKind('attempted')}
                            >
                              Attempted — didn&rsquo;t reach them
                            </Button>
                            <Button
                              variant={contactKind === 'connected' ? 'primary' : 'secondary'}
                              onClick={() => setContactKind('connected')}
                            >
                              Connected — spoke with them
                            </Button>
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
                                  contactKind,
                                  outcome: outcome.trim(),
                                  minutesSpent: minutes ? Number(minutes) : undefined,
                                  nextFollowUpAt: nextFollowUp
                                    ? new Date(nextFollowUp).toISOString()
                                    : undefined,
                                });
                                if (r.ok) {
                                  setContactKind('attempted');
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
                                  {c.channel === 'in_person' ? 'in person' : c.channel} ·{' '}
                                  {c.contact_kind === 'connected' ? 'connected' : 'attempted'} ·{' '}
                                  {c.outcome}
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
