import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
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
import {
  DOMAINS,
  NEED_CATEGORIES,
  awaitingConnectionConfirmation,
  domainForSubcategory,
  formatElapsed,
  needCategoryLabel,
  needStatusLabel,
  referralStatusLabel,
  referralTypeLabel,
  requestTypeLabel,
} from '@recoveryos/domain';
import { createFollowUp } from '@recoveryos/data-access';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@recoveryos/auth';
import {
  useCreateReferral,
  useIdentifyNeed,
  useNavigatorWorkspace,
  useRecordNavigationService,
  useRecordOutcome,
  useUpdateNeedStatus,
} from '../hooks/useNavigatorWorkspace';
import { navigatorKeys } from '../../lib/query';

// Presentation-only grouping of the live need categories under the ratified domain canon
// (P1.3). Canonical need_category values are untouched — only the picker gains structure.
const NEED_CATEGORY_GROUPS = [
  ...DOMAINS.map((d) => ({
    key: d.key,
    label: d.staffLabel,
    categories: NEED_CATEGORIES.filter((c) => domainForSubcategory(c.key) === d.key),
  })),
  {
    key: 'cross_cutting',
    label: 'Cross-cutting',
    categories: NEED_CATEGORIES.filter((c) => domainForSubcategory(c.key) === null),
  },
].filter((g) => g.categories.length > 0);

/**
 * One person's navigation view (P4E): relationship overview, structured needs,
 * closed-loop connections, follow-ups, and honest service attestation.
 * Progressive capture: needs are identified here, inside the relationship —
 * asking for help never required answering a giant intake.
 */
export function NavPersonPage() {
  const { personId: raw } = useParams();
  const personId = Number(raw);
  const { person } = useAuth();
  const { roster, needs, referrals, followUps, isLoading, hasError, refetch } =
    useNavigatorWorkspace();
  const identify = useIdentifyNeed();
  const setNeedStatus = useUpdateNeedStatus();
  const createReferral = useCreateReferral();
  const recordOutcome = useRecordOutcome();
  const recordService = useRecordNavigationService();
  const queryClient = useQueryClient();

  const [needCategory, setNeedCategory] = useState('');
  const [referralOpenFor, setReferralOpenFor] = useState<number | 'general' | null>(null);
  const [referralType, setReferralType] = useState<'information' | 'referral' | 'warm_handoff'>('referral');
  const [destination, setDestination] = useState('');
  const [outcomeNotice, setOutcomeNotice] = useState<string | null>(null);
  const [evidenceFor, setEvidenceFor] = useState<number | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceMinutes, setServiceMinutes] = useState('30');
  // One human action → one dedupe key (P2.4): minted when the attestation form opens,
  // reused across retries of that submission, regenerated only by reopening the form.
  const [serviceDedupeKey, setServiceDedupeKey] = useState('');
  const toggleServiceOpen = () => {
    setServiceOpen((v) => {
      if (!v) setServiceDedupeKey(crypto.randomUUID());
      return !v;
    });
  };

  const entry = useMemo(
    () => roster.find((r) => r.participant_person_id === personId),
    [roster, personId],
  );

  const followUp = useMutation({
    mutationFn: async (dueDate: string) => {
      const result = await createFollowUp({
        personId,
        dueAt: new Date(`${dueDate}T12:00:00`).toISOString(),
        followUpType: 'navigation_check',
      });
      if (!result.ok) throw new Error(String(result.code));
      return result;
    },
    onSettled: () => {
      if (person) void queryClient.invalidateQueries({ queryKey: navigatorKeys.followUps(person.id) });
    },
  });

  if (isLoading) return <LoadingState label="Loading…" />;
  if (hasError)
    return <ErrorState message="We couldn’t load this person’s information right now." onRetry={refetch} />;
  if (!entry) return <ErrorState message="This person isn’t in your active people." />;

  const personNeeds = needs.filter((n) => n.person_id === personId);
  const personReferrals = referrals.filter((r) => r.person_id === personId);
  const openFollowUps = followUps.filter((f) => f.person_id === personId && f.status === 'open');

  function addNeed(e: FormEvent) {
    e.preventDefault();
    if (!needCategory) return;
    void identify
      .mutateAsync({ personId, category: needCategory })
      .then(() => setNeedCategory(''))
      .catch(() => undefined);
  }

  function sendReferral(e: FormEvent) {
    e.preventDefault();
    if (!destination.trim()) return;
    void createReferral
      .mutateAsync({
        personId,
        referralType,
        needId: referralOpenFor === 'general' ? null : referralOpenFor,
        destinationName: destination.trim(),
      })
      .then(() => {
        setReferralOpenFor(null);
        setDestination('');
      })
      .catch(() => undefined);
  }

  async function markOutcome(referralId: number, status: string, evidence?: string) {
    setOutcomeNotice(null);
    const result = await recordOutcome.mutateAsync({ referralId, status, evidence });
    if (result === 'consent_required') {
      setOutcomeNotice(
        'There’s no data-sharing consent on file for partner confirmation — check with them directly instead.',
      );
    } else if (result === 'failed') {
      setOutcomeNotice('We couldn’t record that. Try again.');
    } else {
      setEvidenceFor(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={entry.display_name}
        lede={entry.pronouns ? `(${entry.pronouns})` : undefined}
        crumbs={[{ label: 'My People', to: '/navigator/people' }]}
      />

      <Card>
        <CardTitle>Overview</CardTitle>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="text-ink-faint">Connected:</dt>
            <dd className="text-ink-muted">
              {entry.started_at ? formatElapsed(entry.started_at) : '—'}
            </dd>
          </div>
          {entry.origin_request_type ? (
            <div className="flex gap-2">
              <dt className="text-ink-faint">They asked for:</dt>
              <dd className="text-ink-muted">{requestTypeLabel(entry.origin_request_type)}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            to={`/navigator/messages/${personId}`}
            className="inline-flex min-h-11 items-center rounded-md bg-experience-600 px-5 font-semibold text-white hover:bg-experience-strong"
          >
            Message {entry.display_name}
          </Link>
          <Button variant="secondary" onClick={toggleServiceOpen}>
            I provided navigation support
          </Button>
        </div>
        {serviceOpen ? (
          <div className="mt-3 rounded-md border border-line bg-surface p-3">
            <p className="text-sm text-ink-muted">
              Record the support you just provided — this is the honest service record, separate
              from referrals and messages.
            </p>
            <div className="mt-2 flex items-end gap-2">
              <TextField
                label="About how many minutes?"
                type="number"
                value={serviceMinutes}
                onChange={(e) => setServiceMinutes(e.target.value)}
              />
              <Button
                variant="secondary"
                disabled={recordService.isPending}
                onClick={() =>
                  void recordService
                    .mutateAsync({
                      personId,
                      durationMinutes: Number(serviceMinutes) || undefined,
                      dedupeKey: serviceDedupeKey || undefined,
                    })
                    .then(() => setServiceOpen(false))
                    .catch(() => undefined)
                }
              >
                {recordService.isPending ? 'Saving…' : 'Record it'}
              </Button>
            </div>
            {recordService.isError ? (
              <Alert tone="critical">We couldn’t record that. Try again.</Alert>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card>
        <CardTitle>What we’re working on</CardTitle>
        {personNeeds.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            Nothing identified yet. Ask: “What would be most helpful to work on first?”
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {personNeeds.map((need) => (
              <li key={need.id} className="rounded-md border border-line px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-ink">{needCategoryLabel(need.need_category)}</span>
                  <span className="text-sm text-ink-muted">{needStatusLabel(need.status)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {need.status !== 'resolved' ? (
                    <>
                      <Button variant="ghost" size="md" onClick={() => void setNeedStatus.mutateAsync({ needId: need.id, status: 'resolved' }).catch(() => undefined)}>
                        Resolved
                      </Button>
                      <Button variant="ghost" size="md" onClick={() => void setNeedStatus.mutateAsync({ needId: need.id, status: 'partially_resolved' }).catch(() => undefined)}>
                        Partly resolved
                      </Button>
                      <Button variant="ghost" size="md" onClick={() => void setNeedStatus.mutateAsync({ needId: need.id, status: 'unresolved' }).catch(() => undefined)}>
                        Still unresolved
                      </Button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setReferralOpenFor(need.id)}
                    className="text-sm font-medium text-experience-700 underline underline-offset-2"
                  >
                    Connect to a resource
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addNeed} className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="need-category" className="block text-sm text-ink-muted">
              What would be most helpful to work on?
            </label>
            <select
              id="need-category"
              value={needCategory}
              onChange={(e) => setNeedCategory(e.target.value)}
              className="mt-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Choose…</option>
              {NEED_CATEGORY_GROUPS.map((group) => (
                <optgroup key={group.key} label={group.label}>
                  {group.categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary" disabled={identify.isPending || !needCategory}>
            {identify.isPending ? 'Adding…' : 'Add need'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Connections</CardTitle>
        {outcomeNotice ? (
          <div className="mt-2">
            <Alert tone="info">{outcomeNotice}</Alert>
          </div>
        ) : null}
        {personReferrals.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No referrals or handoffs yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {personReferrals.map((referral) => (
              <li key={referral.id} className="rounded-md border border-line px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-ink">
                    {referral.destination_name ?? 'A community resource'}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {referralTypeLabel(referral.referral_type)} · {referralStatusLabel(referral.status)}
                  </span>
                </div>
                {awaitingConnectionConfirmation(referral.status) ? (
                  evidenceFor === referral.id ? (
                    // P0.5-14: CONNECTION REQUIRES EVIDENCE — the navigator says
                    // how they know before 'connected' can be recorded. Partner
                    // confirmation is consent-gated server-side; the refusal
                    // message surfaces verbatim above.
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => void markOutcome(referral.id, 'connected', 'navigator_confirmation')}
                      >
                        I confirmed it myself
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => void markOutcome(referral.id, 'connected', 'participant_report')}
                      >
                        They told me
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => void markOutcome(referral.id, 'connected', 'partner_confirmation')}
                      >
                        The provider confirmed
                      </Button>
                      <Button variant="ghost" size="md" onClick={() => setEvidenceFor(null)}>
                        Back
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="ghost" size="md" onClick={() => setEvidenceFor(referral.id)}>
                        They connected — how do I know?
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => void markOutcome(referral.id, 'contact_attempted')}
                      >
                        I reached out
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => void markOutcome(referral.id, 'not_connected')}
                      >
                        Not connected yet
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => void markOutcome(referral.id, 'participant_declined')}
                      >
                        No longer needed
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => void markOutcome(referral.id, 'partner_unavailable')}
                      >
                        Provider unavailable
                      </Button>
                    </div>
                  )
                ) : referral.status !== 'closed' ? (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => void markOutcome(referral.id, 'closed')}
                    >
                      Close this connection
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {referralOpenFor !== null ? (
          <form onSubmit={sendReferral} className="mt-3 space-y-2 rounded-md border border-line bg-surface p-3">
            <div>
              <label htmlFor="referral-type" className="block text-sm text-ink-muted">
                What kind of connection is this?
              </label>
              <select
                id="referral-type"
                value={referralType}
                onChange={(e) => setReferralType(e.target.value as typeof referralType)}
                className="mt-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              >
                <option value="information">Resource shared — they have the info</option>
                <option value="referral">Referral — I directed them there</option>
                <option value="warm_handoff">Warm handoff — I helped make the connection myself</option>
              </select>
            </div>
            <TextField
              label="Where are they being connected?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            {createReferral.isError ? (
              <Alert tone="critical">We couldn’t save that connection. Try again.</Alert>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" variant="secondary" disabled={createReferral.isPending || !destination.trim()}>
                {createReferral.isPending ? 'Saving…' : 'Save connection'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setReferralOpenFor(null)}>
                Never mind
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setReferralOpenFor('general')}
            className="mt-3 text-sm font-medium text-experience-700 underline underline-offset-2"
          >
            Add a connection
          </button>
        )}
      </Card>

      <Card>
        <CardTitle>Follow-up</CardTitle>
        {openFollowUps.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {openFollowUps.map((f) => (
              <li key={f.id} className="rounded-md border border-line px-3 py-2 text-sm text-ink-muted">
                {f.follow_up_type.replace(/_/g, ' ')}
                {f.due_at ? ` · due ${formatElapsed(f.due_at)}` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">No follow-up scheduled.</p>
        )}
        <div className="mt-3 flex items-end gap-2">
          <TextField
            label="Follow up on"
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={followUp.isPending || !followUpDate}
            onClick={() =>
              void followUp
                .mutateAsync(followUpDate)
                .then(() => setFollowUpDate(''))
                .catch(() => undefined)
            }
          >
            {followUp.isPending ? 'Saving…' : 'Add follow-up'}
          </Button>
        </div>
        {followUp.isError ? <Alert tone="critical">We couldn’t save that follow-up.</Alert> : null}
      </Card>
    </div>
  );
}
