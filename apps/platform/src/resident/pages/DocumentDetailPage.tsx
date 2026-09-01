import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import {
  acknowledgeDocumentAssignment,
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
export function DocumentDetailPage() {
  const { key } = useParams<{ key: string }>();
  const { person } = useAuth();
  const staticDocument = key ? getDocument(key) : undefined;

  const [assignments, setAssignments] = useState<AssignmentWithDocument[]>([]);
  const [loaded, setLoaded] = useState(false);
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
    try {
      setAssignments(await listMyDocumentAssignments(person.id));
      setEConsent(await hasElectronicRecordsConsent(person.id));
    } catch {
      // Signature state is progressive enhancement when a bundled copy
      // exists; the pinned-version fallback simply won't be available.
    } finally {
      setLoaded(true);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  const myAssignment = useMemo(
    () => assignments.find((a) => a.document_version.template.key === key),
    [assignments, key],
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
    : staticDocument
      ? {
          name: staticDocument.name,
          summary: staticDocument.summary,
          body: staticDocument.body,
          version: staticDocument.version,
          requiresSignature: staticDocument.requiresSignature,
        }
      : undefined;

  if (!display) {
    // Don't flash NotFound while the assignment (the only source for
    // residence-scoped editions) is still loading.
    return loaded ? <NotFoundPage /> : null;
  }
  const document = display;

  const sign = async () => {
    if (!myAssignment || !signatureName.trim()) return;
    setSigning(true);
    setSignError(false);
    try {
      const result = await acknowledgeDocumentAssignment({
        assignmentId: myAssignment.id,
        signatureName: signatureName.trim(),
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

  const pendingSignature =
    document.requiresSignature && myAssignment && !myAssignment.acknowledged_at;

  return (
    <>
      <PageHeader
        title={document.name}
        lede={document.summary}
        crumbs={[
          { to: '/residence/today', label: 'Today' },
          { to: '/residence/documents', label: 'Documents' },
        ]}
      />

      <div className="flex flex-col gap-5">
        {justSigned ? (
          <Alert tone="positive">
            Signed. A record of your signature is stored with this document, and staff can print you
            a copy any time.
          </Alert>
        ) : myAssignment?.acknowledged_at ? (
          <Alert tone="positive">
            You signed this document on{' '}
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
            <h2 className="mb-1 text-lg font-semibold text-ink">Ready to sign?</h2>
            <p className="mb-3 text-sm text-ink-muted">
              Only sign once you've read it and had your questions answered — there is no rush, and
              asking questions first is exactly what this page is for.
            </p>
            {signError ? (
              <Alert tone="critical">
                Your signature didn't save. Please try again, or sign the paper copy with staff.
              </Alert>
            ) : null}
            <div className="flex flex-col gap-3 sm:max-w-md">
              {!eConsent ? (
                <div data-testid="e-consent-step">
                  <p className="text-sm font-medium text-ink">Before signing electronically</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-ink-muted">
                    <li>You can sign on paper with staff instead — always, at no cost.</li>
                    <li>
                      You can withdraw electronic consent at any time; anything already signed
                      stays valid.
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
              <button
                type="button"
                className="self-start text-sm text-experience-700 underline underline-offset-2"
                onClick={() => setPaperInfo(!paperInfo)}
              >
                I prefer to sign on paper
              </button>
              {paperInfo ? (
                <Alert tone="info">
                  No problem — tell any staff member. They&rsquo;ll print it, you sign with them,
                  and they record your paper signature. Choosing paper never affects your
                  standing, your eligibility, or anything else.
                </Alert>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>
    </>
  );
}
