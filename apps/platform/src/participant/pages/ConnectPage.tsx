import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@recoveryos/ui';
import { Alert, Button, Card, CardTitle, ErrorState, LoadingState, TextAreaField } from '@recoveryos/ui';
import {
  MODALITY_OPTIONS,
  SUPPORT_REQUEST_OPTIONS,
  formatElapsed,
  requestTypeLabel,
  type ConnectionState,
  type SupportRequestType,
} from '@recoveryos/domain';
import { useCancelSupportRequest, useConnection, useCreateSupportRequest } from '../hooks/useConnection';
import { NextAppointmentCard, SupportPersonCard } from '../components/ConnectionCards';
import { track } from '../../lib/analytics';

/**
 * Connect — the participant's human-connection hub (P4B). Three modes derived
 * from canonical truth: ask for support → we heard you → you're connected.
 * No database vocabulary, no dead buttons: messaging and interactive
 * scheduling actions appear when those slices ship.
 */
export function ConnectPage() {
  const { state, isLoading, hasError, refetch } = useConnection();

  useEffect(() => {
    track('connect_page_viewed');
  }, []);

  if (isLoading) return <LoadingState label="Checking on your connection…" />;
  if (hasError || !state)
    return (
      <ErrorState
        message="We couldn’t load your connection right now. Your information is safe."
        onRetry={refetch}
      />
    );

  const connected = state.supportTeam.length > 0;
  const waiting =
    !connected && (state.kind === 'REQUEST_OPEN' || state.kind === 'REQUEST_CLAIMED');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Connect"
        lede={
          connected
            ? 'The people supporting you.'
            : waiting
              ? 'Your request is with the Grace team.'
              : 'How can we support you today?'
        }
      />
      {connected ? <ConnectedMode state={state} /> : waiting ? <WaitingMode state={state} /> : <AskMode />}
    </div>
  );
}

// ---- MODE A — I need support -------------------------------------------------

function AskMode() {
  const [selected, setSelected] = useState<SupportRequestType | null>(null);
  const [modality, setModality] = useState<'video' | 'phone' | 'chat' | 'in_person'>('video');
  const [focus, setFocus] = useState('');
  const create = useCreateSupportRequest();

  function choose(type: SupportRequestType) {
    setSelected(type);
    track('support_request_started');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    create.mutate({ requestType: selected, preferredModality: modality, focus: focus.trim() || undefined });
  }

  if (!selected) {
    return (
      <div className="space-y-2.5" role="group" aria-label="Kinds of support">
        {SUPPORT_REQUEST_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => choose(option.type)}
            className="block w-full rounded-lg border border-line bg-surface-raised p-4 text-left hover:border-experience-500 focus-visible:border-experience-500"
          >
            <p className="font-semibold text-ink">{option.title}</p>
            <p className="mt-0.5 text-sm text-ink-muted">{option.description}</p>
          </button>
        ))}
      </div>
    );
  }

  const option = SUPPORT_REQUEST_OPTIONS.find((o) => o.type === selected)!;

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card>
        <CardTitle>{option.title}</CardTitle>
        <p className="mt-0.5 text-sm text-ink-muted">{option.description}</p>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mt-1 text-sm font-medium text-experience-700 underline underline-offset-2"
        >
          Choose something else
        </button>
      </Card>

      <fieldset>
        <legend className="font-medium text-ink">How would you prefer to connect?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {MODALITY_OPTIONS.map((m) => (
            <label
              key={m.value}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-3 text-center font-medium ${
                modality === m.value
                  ? 'border-experience-600 bg-experience-soft text-experience-700'
                  : 'border-line bg-surface-raised text-ink-muted'
              }`}
            >
              <input
                type="radio"
                name="modality"
                value={m.value}
                checked={modality === m.value}
                onChange={() => setModality(m.value)}
                className="sr-only"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      <TextAreaField
        label="Anything you’d like us to know? (optional)"
        hint="Share as much or as little as feels right."
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
        rows={3}
      />

      {create.isError ? (
        <Alert tone="critical">
          We couldn’t send your request yet. What you wrote is still here — try again.
        </Alert>
      ) : null}

      <Button type="submit" size="lg" disabled={create.isPending}>
        {create.isPending ? 'Sending…' : 'Request support'}
      </Button>
    </form>
  );
}

// ---- MODE B — we heard you ---------------------------------------------------

function WaitingMode({ state }: { state: ConnectionState }) {
  const request = state.currentRequest!;
  const cancel = useCancelSupportRequest();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const claimed = state.kind === 'REQUEST_CLAIMED';

  return (
    <div className="space-y-4">
      <Card>
        <div role="status">
          <CardTitle>{claimed ? 'Someone is on it' : 'We’ve got your request'}</CardTitle>
          <p className="mt-1 text-ink-muted">
            {claimed
              ? 'A member of the Grace team picked up your request and is getting things ready. You’ll see them here as soon as you’re connected.'
              : 'We’re finding someone to connect with you. You don’t need to do anything else right now.'}
          </p>
        </div>
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="text-ink-faint">Support:</dt>
            <dd className="text-ink-muted">{requestTypeLabel(request.request_type)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink-faint">Preferred:</dt>
            <dd className="text-ink-muted">
              {MODALITY_OPTIONS.find((m) => m.value === request.preferred_modality)?.label ??
                request.preferred_modality}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink-faint">Requested:</dt>
            <dd className="text-ink-muted">{formatElapsed(request.created_at)}</dd>
          </div>
        </dl>
      </Card>

      {!claimed ? (
        confirmingCancel ? (
          <Card>
            <p className="text-ink">Let this request go?</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              You can always reach out again — any time.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => cancel.mutate(request.id)}
                disabled={cancel.isPending}
              >
                {cancel.isPending ? 'One moment…' : 'Yes, I no longer need this'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingCancel(false)}>
                Keep my request
              </Button>
            </div>
          </Card>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingCancel(true)}
            className="text-sm font-medium text-ink-faint underline underline-offset-2"
          >
            I no longer need this request
          </button>
        )
      ) : null}
    </div>
  );
}

// ---- MODE C — you're connected ----------------------------------------------

function ConnectedMode({ state }: { state: ConnectionState }) {
  useEffect(() => {
    track('connection_established_viewed');
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Your Support</CardTitle>
        <div className="mt-2 space-y-2">
          {state.supportTeam.map((member) => (
            <SupportPersonCard key={member.relationship_id} member={member} />
          ))}
        </div>
        {/* Messaging + interactive scheduling actions land with those slices —
            no dead buttons rendered until their destinations genuinely work. */}
      </Card>

      {state.nextAppointment ? (
        <Card>
          <CardTitle>Next session</CardTitle>
          <div className="mt-2">
            <NextAppointmentCard appointment={state.nextAppointment} supportTeam={state.supportTeam} />
          </div>
        </Card>
      ) : state.schedulingUnderway ? (
        <Card>
          <CardTitle>Scheduling</CardTitle>
          <p className="mt-1 text-ink-muted">
            You and your coach are choosing a time. When a session is confirmed, you’ll see it
            here.
          </p>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Need something else?</CardTitle>
        <p className="mt-1 text-sm text-ink-muted">
          Your support team is here for what you’re facing — and if something new comes up, you
          can always ask for more support from this page once your current connection settles in.
        </p>
      </Card>
    </div>
  );
}
