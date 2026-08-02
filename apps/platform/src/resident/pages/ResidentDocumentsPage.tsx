import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  acknowledgeDocument,
  listMyDocuments,
  type DocumentAssignmentRow,
} from '@recoveryos/data-access';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  TextField,
} from '@recoveryos/ui';

/** Assigned documents with read-and-sign acknowledgement (typed-name signature). */
export function ResidentDocumentsPage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [docs, setDocs] = useState<DocumentAssignmentRow[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [signature, setSignature] = useState('');
  const [signError, setSignError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      setDocs(await listMyDocuments(person.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sign(doc: DocumentAssignmentRow) {
    if (signature.trim().length < 2) {
      setSignError('Please type your full name to sign.');
      return;
    }
    setSignError(null);
    setSigning(true);
    try {
      await acknowledgeDocument(doc.id, signature.trim());
      setDocs((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                acknowledged_at: new Date().toISOString(),
                signature_name: signature.trim(),
              }
            : d,
        ),
      );
      setOpenId(null);
      setSignature('');
    } catch {
      setSignError("We couldn't save your signature. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Documents"
        lede="Your agreements and rights — and anything waiting for your signature."
        crumbs={[{ to: '/residence/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : docs.length === 0 ? (
        <EmptyState
          title="No documents yet"
          message="When your residence assigns you a document to review, it will appear here."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {docs.map((doc) => (
            <li key={doc.id}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{doc.version.template.name}</p>
                    <p className="text-sm text-ink-muted">Version {doc.version.version}</p>
                  </div>
                  {doc.acknowledged_at ? (
                    <span className="rounded-full bg-positive-50 px-3 py-1 text-xs font-medium text-positive-700">
                      Signed {new Date(doc.acknowledged_at).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="rounded-full bg-attention-50 px-3 py-1 text-xs font-medium text-attention-700">
                      Needs your signature
                    </span>
                  )}
                </div>

                {openId === doc.id ? (
                  <div className="mt-4">
                    <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink">
                      {doc.version.body_markdown}
                    </div>
                    {!doc.acknowledged_at ? (
                      <div className="mt-4 flex flex-col gap-3">
                        {signError ? <Alert tone="critical">{signError}</Alert> : null}
                        <TextField
                          label="Type your full name to sign"
                          value={signature}
                          onChange={(e) => setSignature(e.target.value)}
                          autoComplete="name"
                        />
                        <div className="flex gap-3">
                          <Button disabled={signing} onClick={() => void sign(doc)}>
                            {signing ? 'Signing…' : 'Sign and acknowledge'}
                          </Button>
                          <Button variant="secondary" onClick={() => setOpenId(null)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="secondary" className="mt-3" onClick={() => setOpenId(null)}>
                        Close
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button variant="secondary" className="mt-3" onClick={() => setOpenId(doc.id)}>
                    {doc.acknowledged_at ? 'Read again' : 'Read and sign'}
                  </Button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
