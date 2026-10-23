import { printDocumentText } from '../../components/documents/printDocumentText';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  confirmDocumentExplanation,
  listStaffDocumentReviews,
  prepareApplicationDocumentReview,
  recordDocumentPaperReview,
  documentWorkflowState,
  type StaffDocumentReview,
  type DocumentReceiptRecord,
} from '@recoveryos/data-access';
import {
  allDocumentAttestationsSelected,
  emptyDocumentAttestations,
  DOCUMENT_ATTESTATION_STATEMENTS,
} from '@recoveryos/domain';
import { Alert, Button, Card, LoadingState, PageHeader, TextField } from '@recoveryos/ui';
import { useStaff } from '../staffContext';
import { MarkdownView } from '../../components/MarkdownView';
import { DocumentAttestationFields } from '../../components/documents/DocumentAttestationFields';
import { DocumentReceipt } from '../../components/documents/DocumentReceipt';
import { documentReviewMessage } from '../../components/documents/documentReviewMessages';

export function DocumentReviewPage() {
  const { residence } = useStaff();
  const [params] = useSearchParams();
  const app = params.get('application');
  const applicationId = app && /^\d+$/.test(app) ? Number(app) : undefined;
  const [items, setItems] = useState<StaffDocumentReview[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setItems([]);
    setError('');
    if (!residence) return;
    setLoading(true);
    void listStaffDocumentReviews(residence.id, applicationId)
      .then((r) => {
        if (!cancelled) {
          if (r.ok) setItems(r.items ?? []);
          else setError(documentReviewMessage(r.code));
        }
      })
      .catch(() => {
        if (!cancelled) setError(documentReviewMessage());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [residence?.id, applicationId, revision]);
  return (
    <>
      <PageHeader
        title="Document review"
        lede="Respond to document questions and record witnessed paper reviews for your selected residence."
      />
      {!residence ? (
        <Alert tone="info">Select an authorized residence to continue.</Alert>
      ) : (
        <div className="flex flex-col gap-5">
          {applicationId && (
            <Card>
              <p>
                Prepare current documents for this approved applicant or active resident. This
                creates assignments only.
              </p>
              <Button
                disabled={loading}
                onClick={() =>
                  void (async () => {
                    setLoading(true);
                    setError('');
                    try {
                      const r = await prepareApplicationDocumentReview(applicationId);
                      if (!r.ok) setError(documentReviewMessage(r.code));
                      else setRevision((x) => x + 1);
                    } catch {
                      setError(documentReviewMessage());
                    } finally {
                      setLoading(false);
                    }
                  })()
                }
              >
                Prepare application documents
              </Button>
            </Card>
          )}
          {error && <Alert tone="attention">{error}</Alert>}
          <Button variant="secondary" onClick={() => setRevision((x) => x + 1)} disabled={loading}>
            Refresh document requests
          </Button>
          {loading ? (
            <LoadingState label="Loading document reviews…" />
          ) : !items.length && !error ? (
            <Alert tone="info">No current pending document assignments in this selection.</Alert>
          ) : (
            items.map((item) => (
              <PaperDocumentReview
                key={`${residence.id}:${item.assignment_id}:${revision}`}
                item={item}
              />
            ))
          )}
        </div>
      )}
    </>
  );
}
function PaperDocumentReview({ item }: { item: StaffDocumentReview }) {
  const [open, setOpen] = useState(false);
  const [checks, setChecks] = useState(emptyDocumentAttestations);
  const [witness, setWitness] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [signature, setSignature] = useState('');
  const [state, setState] = useState(item.state);
  const [receipt, setReceipt] = useState<DocumentReceiptRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (receipt) return <DocumentReceipt receipt={receipt} />;
  const run = async (paper: boolean) => {
    setBusy(true);
    setError('');
    try {
      const r = paper
        ? await recordDocumentPaperReview({
            assignmentId: item.assignment_id,
            versionId: item.document_version_id,
            contentHash: item.content_hash,
            attestations: checks,
            witnessConfirmed: witness,
            ...(item.requires_signature ? { signatureName: signature.trim() } : {}),
          })
        : await confirmDocumentExplanation(item.assignment_id, answered);
      if (!r.ok) setError(documentReviewMessage(r.code));
      const saved = await documentWorkflowState(item.assignment_id);
      if (saved.ok) {
        setState(saved);
        setReceipt(saved.receipt ?? null);
      }
      setChecks(emptyDocumentAttestations());
      setWitness(false);
      setAnswered(false);
      setSignature('');
    } catch {
      setError(documentReviewMessage());
      // Reload evidence after an uncertain result; never assume no commit.
      try {
        const saved = await documentWorkflowState(item.assignment_id);
        if (saved.ok) {
          setState(saved);
          setReceipt(saved.receipt ?? null);
        }
      } catch {
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <h2 className="text-lg font-semibold">
        {item.person_name} — {item.document_name}
      </h2>
      <p>
        Version {item.version}; assignment {item.assignment_id}
      </p>
      {state.clarification && (
        <Alert tone="attention">
          Explanation requested
          {state.clarification.question ? `: ${state.clarification.question}` : '.'}
        </Alert>
      )}
      <Button variant="secondary" onClick={() => setOpen(!open)}>
        {open ? 'Close document review' : 'Open document review'}
      </Button>
      {open && (
        <div className="mt-4 flex flex-col gap-4">
          <MarkdownView markdown={item.body_markdown} />
          <p className="break-all text-xs">SHA-256: {item.content_hash}</p>
          <p>
            Ask the participant to select their own statements and, when required, sign this exact
            paper edition. Retain the paper record under house practice. Do not infer statements or
            attest to old records.
          </p>
          <Button
            variant="secondary"
            onClick={() =>
              printDocumentText(
                [
                  item.document_name,
                  `Participant: ${item.person_name} (person ${item.person_id})`,
                  `Assignment: ${item.assignment_id}; version ${item.version} (ID ${item.document_version_id})`,
                  `SHA-256: ${item.content_hash}`,
                  '',
                  item.body_markdown,
                  '',
                  'Select each statement only when true:',
                  ...DOCUMENT_ATTESTATION_STATEMENTS.map((s) => `[ ] ${s.label}`),
                  '',
                  ...(item.requires_signature
                    ? ['Participant signature: __________________________']
                    : ['Participant acknowledgment: __________________________']),
                  'Date: __________________________',
                  'Staff witness: __________________________',
                ].join('\n'),
              )
            }
          >
            Print document and paper review statements
          </Button>
          {state.clarification ? (
            <>
              <label className="flex gap-3">
                <input
                  type="checkbox"
                  checked={answered}
                  disabled={busy}
                  onChange={(e) => setAnswered(e.target.checked)}
                />
                The participant confirmed they received an explanation and their questions were
                answered.
              </label>
              <Button disabled={busy || !answered} onClick={() => void run(false)}>
                Record participant’s explanation confirmation
              </Button>
            </>
          ) : (
            <>
              <DocumentAttestationFields
                value={checks}
                onChange={setChecks}
                paper
                disabled={busy}
              />
              {item.requires_signature && (
                <TextField
                  label="Their full name, exactly as signed on paper"
                  value={signature}
                  maxLength={200}
                  onChange={(e) => setSignature(e.target.value)}
                  disabled={busy}
                />
              )}
              <label className="flex gap-3">
                <input
                  type="checkbox"
                  checked={witness}
                  disabled={busy}
                  onChange={(e) => setWitness(e.target.checked)}
                />
                I witnessed this participant’s paper review of this exact version, their selected
                statements{item.requires_signature ? ', and their signature' : ''}.
              </label>
              <Button
                disabled={
                  busy ||
                  !witness ||
                  !allDocumentAttestationsSelected(checks) ||
                  (item.requires_signature && signature.trim().length < 2)
                }
                onClick={() => void run(true)}
              >
                Record witnessed paper {item.requires_signature ? 'signature' : 'acknowledgment'}
              </Button>
            </>
          )}
          {error && <Alert tone="attention">{error}</Alert>}
        </div>
      )}
    </Card>
  );
}
