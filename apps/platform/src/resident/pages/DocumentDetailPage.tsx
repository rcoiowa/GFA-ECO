import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import {
  completeDocumentReview,
  confirmDocumentExplanation,
  documentWorkflowState,
  ensureMyDocumentAssignments,
  hasElectronicRecordsConsent,
  listMyDocumentAssignments,
  recordResidenceConsentGrant,
  requestDocumentExplanation,
  type AssignmentWithDocument,
  type DocumentWorkflowState,
} from '@recoveryos/data-access';
import { allDocumentAttestationsSelected, emptyDocumentAttestations } from '@recoveryos/domain';
import { getDocument } from '@recoveryos/residence-content';
import { Alert, Button, Card, LoadingState, PageHeader, TextField } from '@recoveryos/ui';
import { MarkdownView } from '../../components/MarkdownView';
import { DocumentAttestationFields } from '../../components/documents/DocumentAttestationFields';
import { DocumentReceipt } from '../../components/documents/DocumentReceipt';
import { documentReviewMessage } from '../../components/documents/documentReviewMessages';
import { NotFoundPage } from '../../pages/StatusPages';

export function DocumentDetailPage({
  basePath = '/residence',
  assignedOnly = false,
}: {
  basePath?: string;
  assignedOnly?: boolean;
}) {
  const { key } = useParams<{ key: string }>();
  const [params] = useSearchParams();
  const { person } = useAuth();
  const assignmentId = params.get('assignment');
  const [assignments, setAssignments] = useState<AssignmentWithDocument[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [eConsent, setEConsent] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setLoadError(false);
    setAssignments([]);
    setEConsent(false);
    void (async () => {
      try {
        if (person) {
          await ensureMyDocumentAssignments();
          const rows = await listMyDocumentAssignments(person.id);
          const consent = await hasElectronicRecordsConsent(person.id);
          if (!cancelled) {
            setAssignments(rows);
            setEConsent(consent);
          }
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [person?.id, key, assignmentId]);
  const assignment = useMemo(
    () =>
      assignments
        .filter(
          (a) =>
            a.person_id === person?.id &&
            a.document_version.template.key === key &&
            (!assignmentId || String(a.id) === assignmentId),
        )
        .sort(
          (a, b) =>
            (b.document_version.published_at ?? '').localeCompare(
              a.document_version.published_at ?? '',
            ) ||
            b.document_version.id - a.document_version.id ||
            b.id - a.id,
        )[0],
    [assignments, key, assignmentId, person?.id],
  );
  const bundled = key ? getDocument(key) : undefined;
  const display = assignment
    ? {
        name: assignment.document_version.template.name,
        body: assignment.document_version.body_markdown,
        version: assignment.document_version.version,
      }
    : !assignedOnly && !assignmentId && bundled
      ? bundled
      : undefined;
  if (!loaded) return <LoadingState label="Loading your document…" />;
  if (loadError)
    return (
      <Alert tone="attention">We couldn’t load your document. Reload or ask staff for help.</Alert>
    );
  if (!display) return <NotFoundPage />;
  return (
    <>
      <PageHeader
        title={display.name}
        crumbs={[{ to: `${basePath}/documents`, label: 'Documents' }]}
      />
      <div className="flex flex-col gap-5">
        <Card>
          <MarkdownView markdown={display.body} />
          <p className="mt-4 text-sm">
            Version {display.version}. Paper copies are available from housing staff.
          </p>
          {assignment && (
            <p className="break-all text-xs">SHA-256: {assignment.document_version.content_hash}</p>
          )}
        </Card>
        {assignment && (
          <AssignedDocumentReview
            key={`${person?.id}:${assignment.id}`}
            assignment={assignment}
            eConsent={eConsent}
            setEConsent={setEConsent}
            basePath={basePath}
          />
        )}
      </div>
    </>
  );
}
function AssignedDocumentReview({
  assignment,
  eConsent,
  setEConsent,
  basePath,
}: {
  assignment: AssignmentWithDocument;
  eConsent: boolean;
  setEConsent: (v: boolean) => void;
  basePath: string;
}) {
  const { person } = useAuth();
  const [state, setState] = useState<DocumentWorkflowState | null>(null);
  const [checks, setChecks] = useState(emptyDocumentAttestations);
  const [signature, setSignature] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ask, setAsk] = useState(false);
  const [question, setQuestion] = useState('');
  const [answered, setAnswered] = useState(false);
  const [paper, setPaper] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const v = assignment.document_version;
  const needsSignature = v.template.requires_signature;
  useEffect(() => {
    let cancelled = false;
    void documentWorkflowState(assignment.id)
      .then((s) => {
        if (!cancelled) {
          if (s.ok) setState(s);
          else setError(documentReviewMessage(s.code));
        }
      })
      .catch(() => {
        if (!cancelled) setError(documentReviewMessage());
      });
    return () => {
      cancelled = true;
    };
  }, [assignment.id, refresh]);
  const act = async (action: () => Promise<DocumentWorkflowState>) => {
    setBusy(true);
    setError('');
    try {
      const result = await action();
      if (!result.ok) {
        setError(documentReviewMessage(result.code));
        if (result.code === 'electronic_consent_required') setEConsent(false);
      } else {
        setChecks(emptyDocumentAttestations());
        setSignature('');
        setAnswered(false);
        setAsk(false);
      }
      // Reconcile with server evidence even after a business refusal.
      const saved = await documentWorkflowState(assignment.id);
      if (saved.ok) setState(saved);
    } catch {
      setError(documentReviewMessage());
      // A network error can follow a commit. Read back before offering any retry.
      try {
        const saved = await documentWorkflowState(assignment.id);
        if (saved.ok) setState(saved);
        else setState(null);
      } catch {
        setState(null);
      }
    } finally {
      setBusy(false);
    }
  };
  if (state?.receipt) return <DocumentReceipt receipt={state.receipt} />;
  if (!state)
    return (
      <Card>
        {error ? (
          <Alert tone="attention">{error}</Alert>
        ) : (
          <LoadingState label="Checking your document record…" />
        )}
        <Button
          variant="secondary"
          onClick={() => {
            setError('');
            setRefresh((n) => n + 1);
          }}
        >
          Reload saved record
        </Button>
      </Card>
    );
  if (!state.current)
    return (
      <Alert tone="info">
        This edition is no longer pending for your current housing context.{' '}
        <Link to={`${basePath}/documents`}>Return to Documents</Link> to review applicable
        documents. Historical records remain available.
      </Alert>
    );
  return (
    <Card>
      <h2 className="text-lg font-semibold">
        {needsSignature ? 'Review and sign this document' : 'Review and acknowledge this document'}
      </h2>
      <p className="my-3">
        Select each statement only when it is true. You can ask for an explanation before completing
        this document. These statements do not grant optional permission to share your information.
      </p>
      {error && <Alert tone="attention">{error}</Alert>}
      {state.clarification ? (
        <div className="my-4 flex flex-col gap-3">
          <Alert tone="info">
            Your explanation request is saved for housing staff. Speak with them before completing
            this document. General recovery support remains available.
          </Alert>
          {state.clarification.question && <p>Your question: {state.clarification.question}</p>}
          <label className="flex gap-3">
            <input
              type="checkbox"
              checked={answered}
              disabled={busy}
              onChange={(e) => setAnswered(e.target.checked)}
            />
            I received an explanation and my questions were answered.
          </label>
          <Button
            disabled={busy || !answered}
            onClick={() => void act(() => confirmDocumentExplanation(assignment.id, answered))}
          >
            Confirm explanation received
          </Button>
        </div>
      ) : (
        <>
          <DocumentAttestationFields value={checks} onChange={setChecks} disabled={busy || ask} />
          <div className="my-4">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setAsk(!ask);
                setChecks(emptyDocumentAttestations());
              }}
            >
              I need an explanation
            </Button>
          </div>
          {ask && (
            <div className="my-3 flex flex-col gap-3">
              <label>
                What would you like explained? (optional)
                <textarea
                  className="mt-1 block w-full border p-2"
                  maxLength={2000}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={busy}
                />
              </label>
              <p>
                Your request will be available to authorized housing staff in the app. You can also
                speak with them directly.
              </p>
              <Button
                disabled={busy}
                onClick={() => void act(() => requestDocumentExplanation(assignment.id, question))}
              >
                Send explanation request to housing staff
              </Button>
            </div>
          )}
          {!ask && (
            <div className="mt-4 flex flex-col gap-3">
              {needsSignature && !eConsent ? (
                <div data-testid="e-consent-step">
                  <h3 className="font-semibold">Before signing electronically</h3>
                  <p>
                    Electronic records and signatures are optional. You may use paper with staff at
                    no cost. You may withdraw electronic consent; existing signed records remain
                    available. You can download or print your receipt here.
                  </p>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void act(async () => {
                        if (!person) return { ok: false, code: 'unauthenticated' };
                        const result = await recordResidenceConsentGrant({
                          personId: person.id,
                          typeKey: 'electronic_records',
                        });
                        if (result.ok) setEConsent(true);
                        return result;
                      })
                    }
                  >
                    I agree to use electronic records and signatures
                  </Button>
                </div>
              ) : (
                <>
                  {needsSignature && (
                    <>
                      <TextField
                        label="Type your full name as your signature"
                        value={signature}
                        maxLength={200}
                        autoComplete="off"
                        onChange={(e) => setSignature(e.target.value)}
                        disabled={busy}
                      />
                      <p>
                        Selecting “Sign {v.template.name}” records your electronic signature and
                        agreement to this document.
                      </p>
                    </>
                  )}
                  <Button
                    disabled={
                      busy ||
                      !allDocumentAttestationsSelected(checks) ||
                      (needsSignature && signature.trim().length < 2)
                    }
                    onClick={() =>
                      void act(() =>
                        completeDocumentReview({
                          assignmentId: assignment.id,
                          versionId: v.id,
                          contentHash: v.content_hash ?? '',
                          attestations: checks,
                          ...(needsSignature ? { signatureName: signature.trim() } : {}),
                        }),
                      )
                    }
                  >
                    {busy
                      ? 'Saving…'
                      : needsSignature
                        ? `Sign ${v.template.name}`
                        : 'Acknowledge this document'}
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}
      <div className="mt-4 flex flex-col gap-3">
        <Button variant="secondary" onClick={() => setPaper(!paper)}>
          I prefer to review {needsSignature ? 'and sign ' : ''}on paper
        </Button>
        {paper && (
          <Alert tone="info">
            Ask housing staff for this exact document and the paper acknowledgment statements. They
            can record your choices and {needsSignature ? 'signature' : 'acknowledgment'} after
            witnessing your paper review. Nothing is completed by selecting this option.
          </Alert>
        )}
        <Link to="/support" className="underline">
          Access general recovery support
        </Link>
      </div>
    </Card>
  );
}
