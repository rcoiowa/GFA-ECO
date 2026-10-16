import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import {
  acknowledgeDocumentAssignment,
  ensureMyDocumentAssignments,
  hasElectronicRecordsConsent,
  listMyDocumentAssignments,
  recordResidenceConsentGrant,
  type AssignmentWithDocument,
} from '@recoveryos/data-access';
import { getDocument } from '@recoveryos/residence-content';
import { Alert, Button, Card, PageHeader, TextField } from '@recoveryos/ui';
import { MarkdownView } from '../../components/MarkdownView';
import { NotFoundPage } from '../../pages/StatusPages';

/**
 * A single document, rendered in full, with the signing flow when this
 * document is pending for the current resident. Signing is a typed-name
 * e-signature recorded on the person's assignment row.
 *
 * Rendering source: when the person has an assignment for this key, the page
 * renders the assignment's PINNED published version — the exact text they act
 * on or signed — and the bundled residence-content library is only a metadata
 * fallback. This is what makes residence-scoped editions (all six EJWRH
 * documents, Grace House Resident Rights) render here without a bundled copy,
 * with provenance guaranteed by the version's content hash.
 */
export function DocumentDetailPage({
  basePath = '/residence',
  assignedOnly = false,
}: {
  basePath?: string;
  assignedOnly?: boolean;
}) {
  const { key } = useParams<{ key: string }>();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignment');
  const { person } = useAuth();
  const staticDocument = key ? getDocument(key) : undefined;

  const [assignments, setAssignments] = useState<AssignmentWithDocument[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState(false);
  const [justSigned, setJustSigned] = useState(false);
  const [eConsent, setEConsent] = useState(false);
  const [paperInfo, setPaperInfo] = useState(false);

  const load = useCallback(async () => {
    if (!person) {
      setLoaded(true);
      return;
    }
    setLoadError(false);
    setLoaded(false);
    setAssignments([]);
    try {
      await ensureMyDocumentAssignments();
      setAssignments(await listMyDocumentAssignments(person.id));
      setEConsent(await hasElectronicRecordsConsent(person.id));
    } catch {
      setLoadError(true);
    } finally {
      setLoaded(true);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  const myAssignment = useMemo(
    () =>
      [...assignments]
        .reverse()
        .find(
          (a) =>
            a.document_version.template.key === key &&
            (!assignmentId || String(a.id) === assignmentId),
        ),
    [assignments, key, assignmentId],
  );

  // The person's pinned version wins; the bundled library is the fallback for
  // documents the person has no assignment for (e.g. browsing before intake).
  const display = myAssignment
    ? {
        name: myAssignment.document_version.template.name,
        summary: staticDocument?.summary,
        body: myAssignment.document_version.body_markdown,
        version: myAssignment.document_version.version,
        requiresSignature: myAssignment.document_version.template.requires_signature,
      }
    : staticDocument && !assignedOnly && !assignmentId
      ? {
          name: staticDocument.name,
          summary: staticDocument.summary,
          body: staticDocument.body,
          version: staticDocument.version,
          requiresSignature: staticDocument.requiresSignature,
        }
      : undefined;

  if (!loaded) return null;
  if (loadError)
    return (
      <Alert tone="attention">
        We couldn’t load your document. Please reload or ask staff for help. No completion was
        recorded.
      </Alert>
    );
  if (!display) {
    // Don't flash NotFound while the assignment (the only source for
    // residence-scoped editions) is still loading.
    return loaded ? <NotFoundPage /> : null;
  }
  const document = display;

  const sign = async () => {
    if (!myAssignment || (document.requiresSignature && !signatureName.trim())) return;
    setSigning(true);
    setSignError(false);
    try {
      const result = await acknowledgeDocumentAssignment({
        assignmentId: myAssignment.id,
        signatureName: document.requiresSignature ? signatureName.trim() : undefined,
      });
      if (!result.ok && result.code !== 'already_acknowledged') throw new Error(result.code);
      setJustSigned(true);
      await load();
    } catch {
      setSignError(true);
    } finally {
      setSigning(false);
    }
  };

  const pendingSignature = myAssignment && !myAssignment.acknowledged_at;

  return (
    <>
      <PageHeader
        title={document.name}
        lede={document.summary}
        crumbs={[
          {
            to: basePath === '/residence' ? '/residence/today' : basePath,
            label: basePath === '/residence' ? 'Today' : 'My housing intake',
          },
          { to: `${basePath}/documents`, label: 'Documents' },
        ]}
      />

      <div className="flex flex-col gap-5">
        {justSigned ? (
          <Alert tone="positive">
            {document.requiresSignature ? 'Signed.' : 'Receipt acknowledged.'} Your record is saved
            with this document. Staff can provide a copy.
          </Alert>
        ) : myAssignment?.acknowledged_at ? (
          <Alert tone="positive">
            You {document.requiresSignature ? 'signed' : 'acknowledged receipt of'} this document on{' '}
            {new Date(myAssignment.acknowledged_at).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            {myAssignment.signature_name ? ` as “${myAssignment.signature_name}”` : ''}.
          </Alert>
        ) : null}

        <Card>
          <MarkdownView markdown={document.body} />
          <p className="mt-4 text-sm text-ink-faint">
            Version {document.version}. Paper copies are always available from the house manager.
          </p>
        </Card>

        {pendingSignature && !justSigned ? (
          <Card>
            <h2 className="mb-1 text-lg font-semibold text-ink">
              {document.requiresSignature ? 'Ready to sign?' : 'Acknowledge receipt'}
            </h2>
            <p className="mb-3 text-sm text-ink-muted">
              {document.requiresSignature
                ? 'Only sign once you have read it and had your questions answered. You can choose paper instead.'
                : 'Confirm that you received and reviewed this document. This is a receipt, not a signature or permission to share information.'}
            </p>
            {signError ? (
              <Alert tone="critical">
                Your action didn’t save. Please try again or ask staff for help.
              </Alert>
            ) : null}
            <div className="flex flex-col gap-3 sm:max-w-md">
              {!document.requiresSignature ? (
                <Button onClick={() => void sign()} disabled={signing}>
                  Acknowledge receipt
                </Button>
              ) : !eConsent ? (
                <div data-testid="e-consent-step">
                  <p className="text-sm font-medium text-ink">Before signing electronically</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-ink-muted">
                    <li>You can sign on paper with staff instead — always, at no cost.</li>
                    <li>
                      You can withdraw electronic consent at any time; anything already signed stays
                      valid.
                    </li>
                    <li>Your signed documents stay available to you here, unrestricted.</li>
                  </ul>
                  <Button
                    className="mt-2"
                    disabled={signing}
                    onClick={() =>
                      void (async () => {
                        if (!person) return;
                        setSigning(true);
                        try {
                          const r = await recordResidenceConsentGrant({
                            personId: person.id,
                            typeKey: 'electronic_records',
                          });
                          if (r.ok || r.code === 'already_granted') setEConsent(true);
                          else setSignError(true);
                        } catch {
                          setSignError(true);
                        } finally {
                          setSigning(false);
                        }
                      })()
                    }
                  >
                    I agree to use electronic records and signatures
                  </Button>
                </div>
              ) : (
                <>
                  <TextField
                    label="Type your full name as your signature"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder={person ? `${person.first_name} ${person.last_name}` : ''}
                    autoComplete="name"
                  />
                  <p className="text-sm text-ink-muted">
                    Selecting &ldquo;Sign {document.name}&rdquo; is your electronic signature and
                    your agreement to be bound by this document.
                  </p>
                  <Button onClick={() => void sign()} disabled={signing || !signatureName.trim()}>
                    {signing ? 'Signing…' : `Sign ${document.name}`}
                  </Button>
                </>
              )}
              {document.requiresSignature && (
                <button
                  type="button"
                  className="self-start text-sm text-experience-700 underline underline-offset-2"
                  onClick={() => setPaperInfo(!paperInfo)}
                >
                  I prefer to sign on paper
                </button>
              )}
              {paperInfo ? (
                <Alert tone="info">
                  No problem — tell any staff member. They&rsquo;ll print it, you sign with them,
                  and they record your paper signature. Choosing paper never affects your standing,
                  your eligibility, or anything else.
                </Alert>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>
    </>
  );
}
