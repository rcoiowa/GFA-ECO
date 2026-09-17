import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  admitApplicant,
  applicationIntakeReadiness,
  confirmNoCurrentMedications,
  listActiveMedicationItems,
  recordEmergencyContact,
  recordMedicationItem,
  recordPaperSignature,
  recordResidenceConsentGrant,
  recordSupervisionCoordination,
  type MedicationItem,
  type ReadinessItem,
} from '@recoveryos/data-access';
import { Alert, Button, LoadingState, TextField } from '@recoveryos/ui';

/**
 * B5A staff intake checklist: translates the canonical derived readiness
 * (application_intake_readiness) into operational language, with the inline
 * one-action flows for what staff record during the real intake conversation.
 * Everything here reads/writes through the audited Gate B RPCs — this panel
 * holds no state of its own and never re-derives what the server derives.
 */

interface Props {
  applicationId: number;
  personId: number;
  personName: string;
  applicationStatus: string;
  onAdmitted?: () => void;
}

/** Group headings in human language — never taxonomy terms. */
const CLASS_HEADINGS: Record<string, string> = {
  required_before_admission: 'Needed before move-in',
  required_for_intake_completion: 'Intake essentials',
  conditionally_required: 'If it applies',
  recommended: 'Encouraged, never blocking',
  deferred_with_follow_up: 'Deferred with a follow-up',
  not_applicable: 'Doesn’t apply here',
};

const CLASS_ORDER = [
  'required_for_intake_completion',
  'required_before_admission',
  'conditionally_required',
  'recommended',
  'deferred_with_follow_up',
];

/** Who acts, in plain words, per item key. */
function actorHint(item: ReadinessItem): string | null {
  if (item.met) return null;
  if (item.key.startsWith('sign:')) return 'They sign it in their app — or on paper with you.';
  if (item.key.startsWith('ack:')) return 'They confirm they received it — one tap in their app.';
  if (item.key === 'screening_consent')
    return 'They can give it in their app, or you record it (verbal or paper).';
  if (item.key === 'emergency_contact') return 'You record it during the intake conversation.';
  if (item.key === 'medication_items') return 'You record the outcome of the medication conversation.';
  if (item.key === 'accommodation')
    return 'Talk it through with them — it can be deferred at move-in with a follow-up.';
  if (item.key === 'supervision') return 'Record their authorization, then the officer contact.';
  return null;
}

/** Item status in plain words. */
function statusLabel(item: ReadinessItem): string {
  if (item.key === 'medication_items') {
    if (item.status === 'met') return 'Reviewed — medications recorded';
    if (item.status === 'reviewed_none') return 'Reviewed — no current medications';
    return 'Not reviewed yet';
  }
  switch (item.status) {
    case 'met':
      return 'Done';
    case 'missing':
      return 'Still needed';
    case 'unconfirmed':
      return 'Not reviewed yet';
    case 'needs_staff_review':
      return 'Review together';
    case 'pending_document_edition':
      return 'Documents not ready yet';
    case 'not_applicable':
      return 'Doesn’t apply';
    default:
      return item.status;
  }
}

const INFO_CATEGORIES: { key: string; label: string }[] = [
  { key: 'residency_status', label: 'Residency status' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'screening_results', label: 'Screening results' },
  { key: 'medication_presence', label: 'Whether medications are present' },
  { key: 'progress_summary', label: 'Progress summary' },
];

export function IntakeChecklist({
  applicationId,
  personId,
  personName,
  applicationStatus,
  onAdmitted,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ReadinessItem[]>([]);
  const [complete, setComplete] = useState(false);
  const [meds, setMeds] = useState<MedicationItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Inline flows (one open at a time keeps the panel calm).
  const [openFlow, setOpenFlow] = useState<
    null | 'emergency_contact' | 'medication_add' | 'screening_consent' | 'supervision' | 'override' | 'paper_sign'
  >(null);
  const [paperSign, setPaperSign] = useState({ templateKey: '', label: '', name: '' });
  const [contact, setContact] = useState({ name: '', phone: '', relationship: '' });
  const [med, setMed] = useState({ name: '', storage: 'self_managed', isMoud: false, prescriber: false });
  const [consentMethod, setConsentMethod] = useState<'verbal_witnessed' | 'paper'>('verbal_witnessed');
  const [officer, setOfficer] = useState({ name: '', phone: '', agency: '', purpose: 'Probation/parole coordination' });
  const [officerScope, setOfficerScope] = useState<string[]>(['residency_status']);
  const [overrideReason, setOverrideReason] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await applicationIntakeReadiness(applicationId);
      if (!r.ok) {
        setError('We couldn’t load the checklist.');
        return;
      }
      setItems(r.items ?? []);
      setComplete(Boolean(r.complete));
      setMeds(await listActiveMedicationItems(personId));
    } catch {
      setError('We couldn’t load the checklist.');
    } finally {
      setLoading(false);
    }
  }, [applicationId, personId]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (fn: () => Promise<{ ok: boolean; code?: string; message?: string }>) => {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      const r = await fn();
      if (!r.ok) setError(r.message ?? 'That didn’t save — try again.');
      else setOpenFlow(null);
      await load();
    } catch {
      setError('That didn’t save — try again.');
    } finally {
      setBusy(false);
    }
  };

  const medItem = items.find((i) => i.key === 'medication_items');
  const unmet = useMemo(
    () => items.filter((i) => !i.met && i.status !== 'not_applicable'),
    [items],
  );
  const unmetDeferrable = unmet.filter((i) => i.overridable);
  const unmetHard = unmet.filter((i) => !i.overridable);
  const pendingEdition = items.some((i) => i.status === 'pending_document_edition');
  const grouped = useMemo(() => {
    const byClass = new Map<string, ReadinessItem[]>();
    for (const i of items) {
      if (i.status === 'not_applicable') continue;
      const list = byClass.get(i.class) ?? [];
      list.push(i);
      byClass.set(i.class, list);
    }
    return byClass;
  }, [items]);
  const notApplicable = items.filter((i) => i.status === 'not_applicable');

  const admit = async (withOverride: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const r = await admitApplicant({
        applicationId,
        override: withOverride,
        overrideReason: withOverride ? overrideReason.trim() : undefined,
      });
      if (r.ok) {
        setNotice(`${personName} is moved in — their residency is open.`);
        setOpenFlow(null);
        onAdmitted?.();
        await load();
      } else if (r.code === 'intake_incomplete') {
        setError('The checklist isn’t complete yet — finish the items above first.');
      } else if (r.code === 'override_not_permitted') {
        setError('Some remaining items can never be deferred — they must be done before move-in.');
      } else if (r.code === 'override_reason_required') {
        setError('Write a short reason for the deferral.');
      } else if (r.code === 'not_authorized') {
        setError('Move-in is a residence-manager decision.');
      } else {
        setError(r.message ?? 'Move-in didn’t go through.');
      }
    } catch {
      setError('Move-in didn’t go through.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label="Loading the intake checklist…" />;

  return (
    <div className="mt-3 rounded-md border border-line bg-surface p-4" data-testid="intake-checklist">
      <p className="mb-2 font-medium text-ink">Intake checklist</p>
      {notice ? <Alert tone="positive">{notice}</Alert> : null}
      {error ? <Alert tone="critical">{error}</Alert> : null}

      {pendingEdition ? (
        <Alert tone="attention">
          This house’s documents aren’t ready to sign in the app yet — move-in stays locked until
          the house document set is activated. Everything else on the checklist can still be
          completed now.
        </Alert>
      ) : null}

      {CLASS_ORDER.map((cls) => {
        const group = grouped.get(cls);
        if (!group || group.length === 0) return null;
        return (
          <div key={cls} className="mt-3">
            <p className="text-sm font-medium text-ink-muted">{CLASS_HEADINGS[cls]}</p>
            <ul className="mt-1 flex flex-col gap-1.5">
              {group.map((item) => (
                <li
                  key={item.key}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm"
                >
                  <span className={item.met ? 'text-ink-muted' : 'text-ink'}>
                    {item.met ? '✓ ' : ''}
                    {item.label.replace(/^Sign: /, 'Sign the ').replace(/^Acknowledge: /, 'Has read the ')}
                  </span>
                  <span className={item.met ? 'text-positive-700' : 'text-attention-700'}>
                    {statusLabel(item)}
                  </span>
                  {!item.met && actorHint(item) ? (
                    <span className="w-full text-ink-faint">{actorHint(item)}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {notApplicable.length > 0 ? (
        <p className="mt-2 text-sm text-ink-faint">
          Doesn’t apply here: {notApplicable.map((i) => i.label.toLowerCase()).join('; ')}.
        </p>
      ) : null}

      {/* Medication reconciliation: one honest state, two one-action buttons. */}
      {medItem && medItem.status !== 'not_applicable' ? (
        <div className="mt-4 rounded-md bg-surface-raised p-3">
          <p className="text-sm font-medium text-ink">
            Medication review: <span className="font-normal">{statusLabel(medItem)}</span>
          </p>
          {meds.length > 0 ? (
            <ul className="mt-1 text-sm text-ink-muted">
              {meds.map((m) => (
                <li key={m.id}>
                  {m.name} · {m.storage_requirement.replace(/_/g, ' ')}
                  {m.prescriber_on_file ? ' · prescriber on file' : ''}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            {medItem.status === 'unconfirmed' ? (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void act(() => confirmNoCurrentMedications(personId))}
              >
                No current medications
              </Button>
            ) : null}
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setOpenFlow(openFlow === 'medication_add' ? null : 'medication_add')}
            >
              Add a medication
            </Button>
          </div>
          {openFlow === 'medication_add' ? (
            <div className="mt-2 flex flex-col gap-2 sm:max-w-md">
              <TextField
                label="Medication name"
                value={med.name}
                onChange={(e) => setMed({ ...med, name: e.target.value })}
              />
              <label className="text-sm text-ink">
                Storage
                <select
                  className="mt-1 block w-full rounded-md border border-line bg-surface p-2"
                  value={med.storage}
                  onChange={(e) => setMed({ ...med, storage: e.target.value })}
                >
                  <option value="self_managed">Self-managed</option>
                  <option value="secure_storage">Secure storage</option>
                  <option value="staff_count">Stored with staff counts</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={med.isMoud}
                  onChange={(e) => setMed({ ...med, isMoud: e.target.checked })}
                />
                MOUD / MAT (care coordination only — never affects eligibility)
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={med.prescriber}
                  onChange={(e) => setMed({ ...med, prescriber: e.target.checked })}
                />
                Prescriber on file
              </label>
              <Button
                disabled={busy || !med.name.trim()}
                onClick={() =>
                  void act(() =>
                    recordMedicationItem({
                      personId,
                      name: med.name.trim(),
                      storageRequirement: med.storage as MedicationItem['storage_requirement'],
                      isMoud: med.isMoud,
                      prescriberOnFile: med.prescriber,
                    }),
                  ).then(() => setMed({ name: '', storage: 'self_managed', isMoud: false, prescriber: false }))
                }
              >
                Save medication
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Paper signature: the resident signed on paper with staff — record it onto the
          same assignment (same pinned version + hash; never an adverse consequence). */}
      {items.some((i) => i.key.startsWith('sign:') && !i.met) ? (
        <div className="mt-3">
          {openFlow === 'paper_sign' ? (
            <div className="flex flex-col gap-2 sm:max-w-md" data-testid="paper-sign-flow">
              <p className="text-sm text-ink-muted">
                For a document {personName} signed on paper with you, witnessed. The recorded
                signature carries the exact document version — keep the paper copy per house
                practice.
              </p>
              <label className="text-sm text-ink">
                Document
                <select
                  className="mt-1 block w-full rounded-md border border-line bg-surface p-2"
                  value={paperSign.templateKey}
                  onChange={(e) => setPaperSign({ ...paperSign, templateKey: e.target.value })}
                >
                  <option value="">Choose…</option>
                  {items
                    .filter((i) => i.key.startsWith('sign:') && !i.met)
                    .map((i) => (
                      <option key={i.key} value={i.key.slice(5)}>
                        {i.label.replace(/^Sign: /, '')}
                      </option>
                    ))}
                </select>
              </label>
              <TextField
                label="Their full name, exactly as signed on paper"
                value={paperSign.name}
                onChange={(e) => setPaperSign({ ...paperSign, name: e.target.value })}
              />
              <Button
                disabled={busy || !paperSign.templateKey || paperSign.name.trim().length < 2}
                onClick={() =>
                  void act(() =>
                    recordPaperSignature({
                      personId,
                      templateKey: paperSign.templateKey,
                      signatureName: paperSign.name.trim(),
                    }),
                  )
                }
              >
                Record paper signature
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setOpenFlow('paper_sign')}>
              Record a paper signature…
            </Button>
          )}
        </div>
      ) : null}

      {/* Emergency contact inline add. */}
      {items.some((i) => i.key === 'emergency_contact' && !i.met) ? (
        <div className="mt-3">
          {openFlow === 'emergency_contact' ? (
            <div className="flex flex-col gap-2 sm:max-w-md">
              <TextField
                label="Emergency contact name"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
              />
              <TextField
                label="Phone"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
              <TextField
                label="Relationship (optional)"
                value={contact.relationship}
                onChange={(e) => setContact({ ...contact, relationship: e.target.value })}
              />
              <Button
                disabled={busy || !contact.name.trim() || !contact.phone.trim()}
                onClick={() =>
                  void act(() =>
                    recordEmergencyContact({
                      personId,
                      name: contact.name.trim(),
                      phone: contact.phone.trim(),
                      relationship: contact.relationship.trim() || undefined,
                    }),
                  )
                }
              >
                Save emergency contact
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setOpenFlow('emergency_contact')}>
              Add emergency contact
            </Button>
          )}
        </div>
      ) : null}

      {/* Screening consent, recorded by staff when given verbally or on paper. */}
      {items.some((i) => i.key === 'screening_consent' && !i.met) ? (
        <div className="mt-3">
          {openFlow === 'screening_consent' ? (
            <div className="flex flex-col gap-2 sm:max-w-md">
              <p className="text-sm text-ink-muted">
                How did {personName} give screening consent? (They can also do it themselves in
                their app.)
              </p>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  checked={consentMethod === 'verbal_witnessed'}
                  onChange={() => setConsentMethod('verbal_witnessed')}
                />
                Verbally, witnessed by me
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  checked={consentMethod === 'paper'}
                  onChange={() => setConsentMethod('paper')}
                />
                On paper
              </label>
              <Button
                disabled={busy}
                onClick={() =>
                  void act(() =>
                    recordResidenceConsentGrant({
                      personId,
                      typeKey: 'residence_screening',
                      method: consentMethod,
                    }),
                  )
                }
              >
                Record screening consent
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setOpenFlow('screening_consent')}>
              Record screening consent
            </Button>
          )}
        </div>
      ) : null}

      {/* Supervision coordination: authorization first, contact second, one flow. */}
      {items.some((i) => i.key === 'supervision' && !i.met && i.status !== 'not_applicable') ? (
        <div className="mt-3">
          {openFlow === 'supervision' ? (
            <div className="flex flex-col gap-2 sm:max-w-md">
              <p className="text-sm text-ink-muted">
                Records {personName}’s authorization (verbal, witnessed) and the officer contact
                together. They can revoke it any time.
              </p>
              <TextField
                label="Officer name"
                value={officer.name}
                onChange={(e) => setOfficer({ ...officer, name: e.target.value })}
              />
              <TextField
                label="Officer phone (optional)"
                value={officer.phone}
                onChange={(e) => setOfficer({ ...officer, phone: e.target.value })}
              />
              <TextField
                label="Agency (optional)"
                value={officer.agency}
                onChange={(e) => setOfficer({ ...officer, agency: e.target.value })}
              />
              <TextField
                label="Purpose"
                value={officer.purpose}
                onChange={(e) => setOfficer({ ...officer, purpose: e.target.value })}
              />
              <fieldset className="text-sm text-ink">
                <legend className="font-medium">What they authorized sharing</legend>
                {INFO_CATEGORIES.map((c) => (
                  <label key={c.key} className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={officerScope.includes(c.key)}
                      onChange={(e) =>
                        setOfficerScope(
                          e.target.checked
                            ? [...officerScope, c.key]
                            : officerScope.filter((k) => k !== c.key),
                        )
                      }
                    />
                    {c.label}
                  </label>
                ))}
              </fieldset>
              <Button
                disabled={busy || !officer.name.trim() || !officer.purpose.trim() || officerScope.length === 0}
                onClick={() =>
                  void act(async () => {
                    const grant = await recordResidenceConsentGrant({
                      personId,
                      typeKey: 'supervision_coordination',
                      method: 'verbal_witnessed',
                      scope: {
                        recipient_name: officer.name.trim(),
                        purpose: officer.purpose.trim(),
                        information_scope: officerScope as never,
                      },
                    });
                    if (!grant.ok || !grant.grant_id) return grant;
                    return recordSupervisionCoordination({
                      personId,
                      consentGrantId: grant.grant_id,
                      officerName: officer.name.trim(),
                      officerPhone: officer.phone.trim() || undefined,
                      agency: officer.agency.trim() || undefined,
                    });
                  })
                }
              >
                Record authorization + contact
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setOpenFlow('supervision')}>
              Record supervision coordination
            </Button>
          )}
        </div>
      ) : null}

      {/* Move-in: a deliberate act, separate from approval. */}
      {applicationStatus === 'approved' ? (
        <div className="mt-4 border-t border-line pt-3">
          {complete ? (
            <Button disabled={busy} onClick={() => void admit(false)}>
              Move {personName} in
            </Button>
          ) : unmetHard.length > 0 ? (
            <p className="text-sm text-ink-muted">
              Move-in unlocks when the remaining required items are done — they can never be
              skipped or deferred.
            </p>
          ) : unmetDeferrable.length > 0 ? (
            openFlow === 'override' ? (
              <div className="flex flex-col gap-2 sm:max-w-md" data-testid="override-flow">
                <Alert tone="attention">
                  This is an exception, not the normal path. Deferring:{' '}
                  {unmetDeferrable.map((i) => statusLabel(i) + ' — ' + i.label.toLowerCase()).join('; ')}.
                  A follow-up assigned to you, due in 7 days, will be created automatically.
                </Alert>
                <TextField
                  label="Why is move-in going ahead without these?"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    disabled={busy || overrideReason.trim().length < 5}
                    onClick={() => void admit(true)}
                  >
                    Confirm move-in with follow-up
                  </Button>
                  <Button variant="ghost" onClick={() => setOpenFlow(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" disabled={busy} onClick={() => setOpenFlow('override')}>
                Move in with a follow-up…
              </Button>
            )
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-faint">
          The checklist can be worked any time; move-in becomes available once the application is
          approved.
        </p>
      )}
    </div>
  );
}
