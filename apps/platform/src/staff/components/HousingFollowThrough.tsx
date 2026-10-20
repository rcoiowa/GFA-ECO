import { useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  actHousingFollowThrough,
  loadHousingFollowThrough,
  loadLinkedHousingContacts,
  type HousingAction,
  type HousingFollowThrough as HousingState,
  type HousingEvent,
  type LeadContactEvent,
  type ResidenceApplicationIntake,
} from '@recoveryos/data-access';
import { Alert, Button, TextField } from '@recoveryos/ui';

export function HousingFollowThrough({ intake }: { intake: ResidenceApplicationIntake }) {
  const enabled = import.meta.env.VITE_HOUSING_FOLLOW_THROUGH_ENABLED === 'true';
  return (
    <details className="mt-3 border-t border-line pt-3">
      <summary className="cursor-pointer font-medium">
        Housing follow-through · intake #{intake.id}
      </summary>
      <p className="my-2 text-sm">
        Application #{intake.converted_application_id ?? 'not yet created'} · Person #
        {intake.converted_person_id ?? 'not yet linked'}. Conversion and admission do not establish
        bed occupancy or complete commitments.
      </p>
      <p className="text-sm">
        Original source: {intake.source}. Intake disposition: {intake.status}.{' '}
        {intake.reviewed_at
          ? `Last intake review: ${intake.reviewed_at}.`
          : 'No intake review time recorded.'}
      </p>
      {intake.review_notes && <p className="text-sm">Intake review notes: {intake.review_notes}</p>}
      {enabled ? (
        <HousingEditor key={intake.id} intake={intake} />
      ) : (
        <Alert tone="attention">
          Housing controls await the reviewed backend proposal. Existing intake and contact context
          remain visible; no housing changes are saved from this build until activation.
        </Alert>
      )}
    </details>
  );
}

function HousingEditor({ intake }: { intake: ResidenceApplicationIntake }) {
  const { person } = useAuth();
  const [state, setState] = useState<HousingState | null>(null);
  const [events, setEvents] = useState<HousingEvent[]>([]);
  const [contacts, setContacts] = useState<LeadContactEvent[]>([]);
  const [historyWarning, setHistoryWarning] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [cover, setCover] = useState('');
  const [action, setAction] = useState('');
  const [due, setDue] = useState('');
  const [evidence, setEvidence] = useState('');
  const [reference, setReference] = useState('');
  const [verifiedAt, setVerifiedAt] = useState('');
  const [bed, setBed] = useState('available');
  const [source, setSource] = useState('wix_contact');
  const [sourceReference, setSourceReference] = useState('');
  const [dateUnknown, setDateUnknown] = useState(false);
  const [contactKind, setContactKind] = useState('connected');
  const refresh = async () => {
    const result = await loadHousingFollowThrough(intake.id);
    setState(result.state);
    setEvents(result.events);
    setLoaded(true);
  };
  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    Promise.all([
      loadHousingFollowThrough(intake.id).then((r) => {
        if (!cancelled) {
          setState(r.state);
          setEvents(r.events);
          setLoaded(true);
        }
      }),
      loadLinkedHousingContacts(intake.id)
        .then((r) => {
          if (!cancelled) setContacts(r);
        })
        .catch(() => {
          if (!cancelled)
            setHistoryWarning(
              'Linked inquiry history unavailable or outside your access. This does not mean no previous contact occurred.',
            );
        }),
    ])
      .catch(() => {
        if (!cancelled)
          setError('Housing follow-through unavailable; check backend activation and access.');
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [intake.id]);
  const act = async (kind: HousingAction, detail: Record<string, string> = {}) => {
    setBusy(true);
    setError('');
    try {
      await actHousingFollowThrough(intake.id, state?.version ?? 0, kind, detail);
      await refresh();
    } catch {
      setError(
        'Not confirmed saved. Refresh before retrying; ownership, access or commitments may have changed.',
      );
    } finally {
      setBusy(false);
    }
  };
  const owner = !!person && state?.owner_person_id === person.id;
  const canEdit = owner && !state?.closed_at && !busy;
  return (
    <div className="mt-3 space-y-3">
      {error && <Alert tone="critical">{error}</Alert>}
      {historyWarning && <Alert tone="attention">{historyWarning}</Alert>}
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void refresh()
            .then(() => setError(''))
            .catch(() => setError('Refresh failed.'))
            .finally(() => setBusy(false));
        }}
      >
        Refresh housing
      </Button>
      <p>
        Current owner: {state?.owner_person_id ? `Staff #${state.owner_person_id}` : 'Unclaimed'} ·
        Proposed covering staff: {state?.proposed_cover_person_id ?? 'None'} ·{' '}
        {state?.closed_at ? 'Closed' : 'Open'}
      </p>
      {!state?.owner_person_id && (
        <Button disabled={busy || !loaded} onClick={() => void act('claim')}>
          Take housing ownership
        </Button>
      )}
      {state?.proposed_cover_person_id === person?.id && person && (
        <Button disabled={busy} onClick={() => void act('accept_cover')}>
          Accept housing ownership
        </Button>
      )}
      <TextField
        label="Proposed covering staff person ID (confirm identity; grants no access)"
        value={cover}
        onChange={(e) => setCover(e.target.value)}
      />
      <Button
        disabled={!canEdit || !/^\d+$/.test(cover)}
        onClick={() => void act('propose_cover', { person_id: cover })}
      >
        Propose cover
      </Button>{' '}
      <Button
        disabled={!canEdit || !state?.proposed_cover_person_id}
        onClick={() => void act('cancel_cover')}
      >
        Cancel proposal
      </Button>
      <p>
        Outstanding housing commitment: {state?.next_action ?? 'None recorded'}{' '}
        {state?.due_at && `— due ${new Date(state.due_at).toLocaleString()}`}
      </p>
      <TextField
        label="Next housing action"
        value={action}
        onChange={(e) => setAction(e.target.value)}
      />
      <TextField
        label="Due time (your local time)"
        type="datetime-local"
        value={due}
        onChange={(e) => setDue(e.target.value)}
      />
      <Button
        disabled={!canEdit || !!state?.next_action || !action.trim() || !due}
        onClick={() =>
          void act('next_action', { text: action, due_at: new Date(due).toISOString() })
        }
      >
        Add commitment
      </Button>
      <TextField
        label="Evidence or reason (required for completion, contact, bed verification or closure)"
        value={evidence}
        onChange={(e) => setEvidence(e.target.value)}
      />
      <Button
        disabled={!canEdit || !state?.next_action || !evidence.trim()}
        onClick={() => void act('complete_action', { evidence })}
      >
        Record commitment completed
      </Button>
      <p>
        Bed verification: {state?.bed_state ?? 'unverified'} ·{' '}
        {state?.bed_reference ?? 'No bed reference'} ·{' '}
        {state?.bed_verified_at ?? 'No verification time'} · {state?.bed_evidence ?? 'No evidence'}.
        This records evidence; it does not reserve, assign or occupy a bed.
      </p>
      <label className="block">
        Verified bed state{' '}
        <select value={bed} onChange={(e) => setBed(e.target.value)}>
          {['available', 'held', 'assigned', 'occupied'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <TextField
        label="Residence bed reference"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />
      <TextField
        label="Evidence occurred at (your local time; required, no inferred date)"
        type="datetime-local"
        value={verifiedAt}
        onChange={(e) => setVerifiedAt(e.target.value)}
      />
      <Button
        disabled={!canEdit || !reference.trim() || !evidence.trim() || !verifiedAt}
        onClick={() =>
          void act('verify_bed', {
            state: bed,
            reference,
            evidence,
            verified_at: new Date(verifiedAt).toISOString(),
          })
        }
      >
        Record bed evidence
      </Button>
      <label className="block">
        Contact outcome{' '}
        <select value={contactKind} onChange={(e) => setContactKind(e.target.value)}>
          <option value="connected">Connected — including previously completed contact</option>
          <option value="attempted">Attempted only</option>
        </select>
      </label>
      <label className="block">
        <input
          type="checkbox"
          checked={dateUnknown}
          onChange={(e) => setDateUnknown(e.target.checked)}
        />
        Prior contact confirmed, exact date unknown
      </label>
      <Button
        disabled={!canEdit || !evidence.trim() || (!verifiedAt && !dateUnknown)}
        onClick={() =>
          void act('contact', {
            kind: contactKind,
            evidence,
            ...(dateUnknown
              ? { date_unknown: 'true' }
              : { occurred_at: new Date(verifiedAt).toISOString() }),
          })
        }
      >
        Record housing contact
      </Button>
      <div>
        <Button
          disabled={
            !owner ||
            busy ||
            (!state?.closed_at &&
              (!!state?.next_action || !!state?.proposed_cover_person_id || !evidence.trim()))
          }
          onClick={() => void act(state?.closed_at ? 'reopen' : 'close', { evidence })}
        >
          {state?.closed_at ? 'Reopen housing follow-through' : 'Close housing follow-through'}
        </Button>
      </div>
      <label className="block">
        Source kind{' '}
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          {['wix_contact', 'contact_connect_submission', 'pre_application', 'other'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <TextField
        label="Existing source reference (no names or contact details)"
        value={sourceReference}
        onChange={(e) => setSourceReference(e.target.value)}
      />
      <Button
        disabled={!canEdit || !sourceReference.trim()}
        onClick={() => void act('link_source', { source, reference: sourceReference })}
      >
        Record existing source reference
      </Button>
      <p>
        References do not create a person or application, verify identity, or import external
        records. Multiple submissions may describe one inquiry. Requested dates remain uncertain
        until clarified.
      </p>
      <p>
        Closing this housing section never closes linked inquiry follow-ups or establishes their
        completion. Reconcile any existing housing promises before closing; their source history
        remains visible.
      </p>
      <h4 className="font-medium">Contact and action history (retained through conversion)</h4>
      {contacts.length === 0 && (
        <p>
          No linked inquiry contacts visible. Intake review notes and housing events remain separate
          evidence.
        </p>
      )}
      <ul>
        {contacts.map((c) => (
          <li key={c.id}>
            {c.occurred_at} · {c.contact_kind} · {c.channel} · {c.outcome}
            {c.next_follow_up_at &&
              ` · Original inquiry follow-up: ${c.next_follow_up_at} (completion not established here)`}
          </li>
        ))}
      </ul>
      <ul>
        {events.map((e) => (
          <li key={e.id}>
            {e.occurred_at} · Staff #{e.actor_person_id} · {e.action} ·{' '}
            {Object.entries(e.detail.input)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' · ')}
          </li>
        ))}
      </ul>
    </div>
  );
}
