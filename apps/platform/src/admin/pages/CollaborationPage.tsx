import { useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  adminListResidences,
  loadCollaborationWorkspace,
  saveCollaborationWorkspace,
  type CollaborationWorkspaceRecord,
  getAdminOperationsSummary,
  listApplicationIntake,
  listResidenceRoster,
  type ResidenceApplicationIntake,
} from '@recoveryos/data-access';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  PageHeader,
  TextAreaField,
  TextField,
} from '@recoveryos/ui';
import {
  decideReview,
  destination,
  editReview,
  extractReviewItems,
  ITEM_TYPES,
  REPORT_STATES,
  type Decision,
  type ReviewBatch,
  type ReviewItem,
} from '../collaboration/reviewModel';

export function CollaborationPage() {
  const { person } = useAuth();
  // Remount on actor change so one administrator's drafts never survive into another session.
  return person ? <CollaborationWorkspace key={person.id} actorId={person.id} /> : null;
}
export function CollaborationWorkspace({ actorId }: { actorId: number }) {
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [residences, setResidences] = useState<{ id: number }[]>([]);
  const [intakes, setIntakes] = useState<ResidenceApplicationIntake[]>([]);
  const [residenceId, setResidenceId] = useState<number | null>(null);
  const [intakeId, setIntakeId] = useState<number | null>(null);
  const [residents, setResidents] = useState<number[]>([]);
  const [brief, setBrief] = useState('');
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [sourceType, setSourceType] = useState<ReviewBatch['sourceType']>(
    'AI-generated GroupMe recap',
  );
  const [sourceDate, setSourceDate] = useState('');
  const [coverage, setCoverage] = useState('');
  const [overlap, setOverlap] = useState('');
  const [anonymized, setAnonymized] = useState(false);
  const [batches, setBatches] = useState<ReviewBatch[]>([]);
  const [reason, setReason] = useState('');
  const [record, setRecord] = useState<CollaborationWorkspaceRecord | null>(null);
  const [persistenceError, setPersistenceError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const document = { brief, notes, intakeId, batches };
  const dirty =
    record !== null &&
    JSON.stringify(document) !==
      JSON.stringify({
        brief: record.document.brief,
        notes: record.document.notes,
        intakeId: record.document.intakeId,
        batches: record.document.batches,
      });
  useEffect(() => {
    let cancelled = false;
    setRecord(null);
    setPersistenceError('');
    setBrief('');
    setNotes('');
    setBatches([]);
    setIntakeId(null);
    setSummary('');
    setAnonymized(false);
    if (authorized && residenceId)
      void loadCollaborationWorkspace(residenceId)
        .then((saved) => {
          if (cancelled) return;
          setRecord(saved);
          setBrief(saved.document.brief);
          setNotes(saved.document.notes);
          setIntakeId(saved.document.intakeId);
          setBatches(saved.document.batches as ReviewBatch[]);
        })
        .catch(() => {
          if (!cancelled)
            setPersistenceError(
              'Persistence unavailable. This residence workspace cannot be edited or saved until the reviewed schema and access are available.',
            );
        });
    return () => {
      cancelled = true;
    };
  }, [authorized, residenceId, reload]);
  const save = async () => {
    if (!record || !residenceId || saving || persistenceError) return;
    setSaving(true);
    setError('');
    try {
      const saved = await saveCollaborationWorkspace(residenceId, record.version, document);
      setRecord(saved);
      setBatches(saved.document.batches as ReviewBatch[]);
    } catch (e) {
      setPersistenceError(
        e instanceof Error ? e.message : 'Persistence unavailable; save not confirmed.',
      );
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const gate = await getAdminOperationsSummary();
      if (!gate.ok) throw new Error('Administrator access required.');
      const [r, i] = await Promise.all([adminListResidences(), listApplicationIntake()]);
      if (!cancelled) {
        setResidences(r.map(({ id }) => ({ id })));
        setIntakes(i);
        setAuthorized(true);
      }
    })().catch(() => {
      if (!cancelled) setError('Administrator context unavailable. No review actions are enabled.');
    });
    return () => {
      cancelled = true;
    };
  }, [actorId]);
  useEffect(() => {
    let cancelled = false;
    setResidents([]);
    if (residenceId)
      void listResidenceRoster(residenceId)
        .then((rows) => {
          if (!cancelled) setResidents(rows.map((r) => r.person_id));
        })
        .catch(() => {
          if (!cancelled)
            setError('Resident matching is unavailable; restricted items cannot be approved.');
        });
    return () => {
      cancelled = true;
    };
  }, [residenceId]);
  const selected = intakes.find((i) => i.id === intakeId && i.residence_id === residenceId);
  const change = (batchId: string, item: ReviewItem, patch: Partial<ReviewItem>) =>
    setBatches((bs) =>
      bs.map((b) =>
        b.id !== batchId
          ? b
          : {
              ...b,
              items: b.items.map((i) =>
                i.id === item.id ? editReview(i, patch, actorId, new Date().toISOString()) : i,
              ),
            },
      ),
    );
  const decide = (batchId: string, item: ReviewItem, decision: Decision) => {
    try {
      // Resident authority is loaded only for the currently selected residence.
      if (decision === 'approved for review' && item.residenceId !== residenceId)
        throw new Error(
          'Select this item’s residence and review its current matching context first.',
        );
      const revised = decideReview(
        item,
        decision,
        reason,
        actorId,
        residences.map((r) => r.id),
        residents,
        new Date().toISOString(),
      );
      setBatches((bs) =>
        bs.map((b) =>
          b.id !== batchId
            ? b
            : { ...b, items: b.items.map((i) => (i.id === item.id ? revised : i)) },
        ),
      );
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed.');
    }
  };
  const importSummary = () => {
    const extracted = extractReviewItems(summary, batches, () => crypto.randomUUID());
    setBatches((bs) => [
      ...bs,
      {
        id: crypto.randomUUID(),
        sourceType,
        sourceDate,
        coverage,
        overlapNote: overlap,
        importedAt: new Date().toISOString(),
        ...extracted,
      },
    ]);
    setSummary('');
    setAnonymized(false);
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="Admin collaboration review"
        lede="Prepare context, review proposed work, and preserve uncertainty before any operational action."
      />
      <Alert tone="attention">
        Private, residence-scoped review workspace. Use Save to persist a server revision; unsaved
        edits are not retained. No browser localStorage is used. No live assistant connection is
        verified. Nothing here sends messages, executes actions or updates resident records.
      </Alert>
      {error && <Alert tone="critical">{error}</Alert>}
      {authorized && (
        <Card>
          <CardTitle>Open a private residence workspace</CardTitle>
          <label>
            Authorized residence{' '}
            <select
              aria-label="Authorized residence"
              value={residenceId ?? ''}
              disabled={saving || dirty}
              onChange={(e) => setResidenceId(Number(e.target.value) || null)}
            >
              <option value="">Select explicitly</option>
              {residences.map((r) => (
                <option key={r.id} value={r.id}>
                  Residence #{r.id}
                </option>
              ))}
            </select>
          </label>
          <p>
            {record
              ? dirty
                ? 'Unsaved changes — save before switching residence.'
                : `Server revision ${record.version} · ${record.saved_at ?? 'No saved draft yet'}`
              : residenceId
                ? 'Opening server workspace…'
                : 'Choose a residence to check durable persistence.'}
          </p>
          {persistenceError && <Alert tone="critical">{persistenceError}</Alert>}
          <Button
            disabled={!record || !dirty || saving || !!persistenceError}
            onClick={() => void save()}
          >
            {saving ? 'Saving…' : 'Save review workspace'}
          </Button>{' '}
          <Button
            variant="secondary"
            disabled={!residenceId || saving}
            onClick={() => {
              if (!dirty || window.confirm('Discard unsaved edits and reload the server revision?'))
                setReload((n) => n + 1);
            }}
          >
            Reload server revision
          </Button>
          {record && (
            <details>
              <summary>Server save audit ({record.audit.length})</summary>
              <ul>
                {record.audit.map((a) => (
                  <li key={a.version}>
                    Revision {a.version} · Admin #{a.actor_person_id} · {a.saved_at}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>
      )}
      {!authorized ? (
        <p>Waiting for authorized administrator context.</p>
      ) : !record ? null : (
        <fieldset disabled={saving || !!persistenceError} className="space-y-5">
          <Card>
            <CardTitle>Contextual brief</CardTitle>
            <p>
              Use anonymized notes and internal IDs only. Never paste names, contact details,
              screenshots or original chat transcripts.
            </p>
            <label className="block">
              Existing intake / application{' '}
              <select
                aria-label="Existing intake / application"
                value={intakeId ?? ''}
                onChange={(e) => setIntakeId(Number(e.target.value) || null)}
              >
                <option value="">No application selected</option>
                {intakes
                  .filter((i) => i.residence_id === residenceId)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      Intake #{i.id} · application #{i.converted_application_id ?? 'unlinked'}
                    </option>
                  ))}
              </select>
            </label>
            {selected && (
              <p>
                Current intake status: {selected.status} · Canonical person #
                {selected.converted_person_id ?? 'unlinked'}. Do not create a duplicate when
                matching is unresolved.
              </p>
            )}
            <TextAreaField
              label="Brief for manual handoff"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
            />
            <TextAreaField
              label="Administrator notes and proposed actions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <p>
              Manual handoff only: select and copy the brief into your authorized assistant session.
              No assistant replies are generated here.
            </p>
          </Card>
          <Card>
            <CardTitle>Review a periodic summary</CardTitle>
            <p>
              Paste buffer is not saved; extract a batch before saving. One anonymized event per
              line. Extraction splits lines only; it does not infer sentiment, risk, misconduct,
              policy approval or completion. Relative weekdays remain text. Overlapping recaps need
              manual comparison even when wording differs.
            </p>
            <label>
              Source type{' '}
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as ReviewBatch['sourceType'])}
              >
                <option>AI-generated GroupMe recap</option>
                <option>manual anonymized summary</option>
              </select>
            </label>
            <TextField
              label="Source date (enter unknown if not established)"
              value={sourceDate}
              onChange={(e) => setSourceDate(e.target.value)}
            />
            <TextField
              label="Coverage window as reported (do not infer dates)"
              value={coverage}
              onChange={(e) => setCoverage(e.target.value)}
            />
            <TextField
              label="Overlap / deduplication notes"
              value={overlap}
              onChange={(e) => setOverlap(e.target.value)}
            />
            <TextAreaField
              label="Anonymized summary events"
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setAnonymized(false);
              }}
            />
            <label className="block">
              <input
                type="checkbox"
                checked={anonymized}
                onChange={(e) => setAnonymized(e.target.checked)}
              />
              I removed names, contact details and identifying source content.
            </label>
            <Button
              disabled={!summary.trim() || !sourceDate.trim() || !coverage.trim() || !anonymized}
              onClick={importSummary}
            >
              Extract review batch
            </Button>
          </Card>
          <TextField
            label="Reason for next review decision"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {batches.map((batch) => (
            <Card key={batch.id}>
              <CardTitle>
                {batch.sourceType} · {batch.sourceDate}
              </CardTitle>
              <p>
                Coverage: {batch.coverage} · Imported: {batch.importedAt} · Exact normalized
                duplicates skipped: {batch.duplicates}. Possible overlap:{' '}
                {batch.overlapNote || 'Not assessed'}
              </p>
              {batch.items.map((item) => (
                <section key={item.id} className="my-4 space-y-3 border-t border-line pt-4">
                  <p className="font-medium">Reported source text: {item.text}</p>
                  <label>
                    Item type{' '}
                    <select
                      aria-label="Item type"
                      value={item.type}
                      onChange={(e) =>
                        change(batch.id, item, {
                          type: e.target.value as ReviewItem['type'],
                          matchingConfirmed: false,
                        })
                      }
                    >
                      {ITEM_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>{' '}
                  <label>
                    Evidence state{' '}
                    <select
                      aria-label="Evidence state"
                      value={item.reportState}
                      onChange={(e) =>
                        change(batch.id, item, {
                          reportState: e.target.value as ReviewItem['reportState'],
                        })
                      }
                    >
                      {REPORT_STATES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <p>
                    Potential destination: {destination(item.type)}. Policy statements remain
                    pending verification; allegations cannot become violations, sanctions,
                    eligibility decisions or risk scores.
                  </p>
                  <Button
                    variant="secondary"
                    disabled={!residenceId}
                    onClick={() =>
                      change(batch.id, item, {
                        residenceId,
                        personId: null,
                        matchingConfirmed: false,
                      })
                    }
                  >
                    Match selected residence #{residenceId ?? '—'}
                  </Button>
                  <p>Matched residence: #{item.residenceId ?? 'unmatched'}</p>
                  {item.type === 'restricted resident-specific question' && (
                    <label>
                      Authorized resident ID{' '}
                      <select
                        aria-label="Authorized resident ID"
                        value={item.personId ?? ''}
                        disabled={item.residenceId !== residenceId}
                        onChange={(e) =>
                          change(batch.id, item, {
                            personId: Number(e.target.value) || null,
                            matchingConfirmed: false,
                          })
                        }
                      >
                        <option value="">Explicit match required</option>
                        {residents.map((id) => (
                          <option key={id} value={id}>
                            Person #{id}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="block">
                    <input
                      type="checkbox"
                      checked={item.matchingConfirmed}
                      onChange={(e) =>
                        change(batch.id, item, { matchingConfirmed: e.target.checked })
                      }
                    />
                    I verified the exact residence and, when required, resident ID; no first-name
                    matching.
                  </label>
                  <TextAreaField
                    label="Current record / evidence reviewed"
                    value={item.currentRecord}
                    onChange={(e) => change(batch.id, item, { currentRecord: e.target.value })}
                  />
                  <TextAreaField
                    label="Proposed change (review only)"
                    value={item.proposedChange}
                    onChange={(e) => change(batch.id, item, { proposedChange: e.target.value })}
                  />
                  <TextField
                    label="Verification evidence / source reference"
                    value={item.evidence}
                    onChange={(e) => change(batch.id, item, { evidence: e.target.value })}
                  />
                  <p>Decision: {item.decision}. Execution: unavailable.</p>
                  {(['approved for review', 'rejected', 'evidence requested'] as const).map((d) => (
                    <Button
                      key={d}
                      variant="secondary"
                      disabled={!reason.trim()}
                      onClick={() => decide(batch.id, item, d)}
                    >
                      {d === 'approved for review'
                        ? 'Approve review only'
                        : d === 'rejected'
                          ? 'Reject'
                          : 'Request evidence'}
                    </Button>
                  ))}
                  <details>
                    <summary>Draft review annotations ({item.history.length})</summary>
                    <ul>
                      {item.history.map((h, n) => (
                        <li key={n}>
                          {h.at} · Admin #{h.actorId} · {h.decision} · {h.reason}
                          <details>
                            <summary>
                              Prior draft annotation (server save audit is authoritative)
                            </summary>
                            <pre className="whitespace-pre-wrap">{h.snapshot}</pre>
                          </details>
                        </li>
                      ))}
                    </ul>
                  </details>
                </section>
              ))}
            </Card>
          ))}
        </fieldset>
      )}
    </div>
  );
}
