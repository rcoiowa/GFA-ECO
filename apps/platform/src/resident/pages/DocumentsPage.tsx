import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import {
  ensureMyDocumentAssignments,
  listMyDocumentAssignments,
  type AssignmentWithDocument,
} from '@recoveryos/data-access';
import { allDocuments, type DocumentCategory } from '@recoveryos/residence-content';
import { Alert, Card, CardTitle, LoadingState, PageHeader } from '@recoveryos/ui';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  agreement: 'Your agreements',
  rights: 'Your rights',
  policy: 'House policies',
  form: 'Forms',
};

const CATEGORY_ORDER: DocumentCategory[] = ['agreement', 'rights', 'policy', 'form'];

/**
 * The resident document center: everything waiting for a signature up top,
 * then the full library. The library renders from the bundled canonical
 * package, so it works even before signature records load.
 */
export function DocumentsPage() {
  const { person } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithDocument[] | null>(null);
  const [assignmentsError, setAssignmentsError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setAssignmentsError(false);
    try {
      await ensureMyDocumentAssignments();
      setAssignments(await listMyDocumentAssignments(person.id));
    } catch {
      setAssignmentsError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = useMemo(
    () => (assignments ?? []).filter((a) => !a.acknowledged_at),
    [assignments],
  );
  const signed = useMemo(() => (assignments ?? []).filter((a) => a.acknowledged_at), [assignments]);

  return (
    <>
      <PageHeader
        title="Documents"
        lede="Your agreements, your rights, and every house policy — nothing here is fine print."
        crumbs={[{ to: '/residence/today', label: 'Today' }]}
      />

      <div className="flex flex-col gap-5">
        {loading ? (
          <LoadingState label="Checking for anything that needs your signature…" />
        ) : assignmentsError ? (
          <Alert tone="attention">
            We couldn't load your signature records right now. The document library below still
            works — and your signatures are safe.
          </Alert>
        ) : pending.length > 0 ? (
          <Card>
            <CardTitle>Waiting for your signature</CardTitle>
            <p className="mb-3 text-sm text-ink-muted">
              Take your time with these — and ask staff anything, as many times as you need.
            </p>
            <ul className="flex flex-col gap-2">
              {pending.map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/residence/documents/${a.document_version.template.key}`}
                    className="flex items-center justify-between rounded-md border border-line bg-surface-raised px-4 py-3 hover:bg-experience-soft"
                  >
                    <span className="font-medium text-ink">{a.document_version.template.name}</span>
                    <span className="rounded-full bg-attention-50 px-3 py-0.5 text-sm text-attention-700">
                      Review &amp; sign
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Alert tone="positive">You're all caught up — nothing is waiting for a signature.</Alert>
        )}

        {signed.length > 0 ? (
          <Card>
            <CardTitle>Signed by you</CardTitle>
            <ul className="flex flex-col gap-1">
              {signed.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-1">
                  <Link
                    to={`/residence/documents/${a.document_version.template.key}`}
                    className="font-medium text-experience-700 underline underline-offset-2"
                  >
                    {a.document_version.template.name}
                  </Link>
                  <span className="text-sm text-ink-muted">
                    {new Date(a.acknowledged_at as string).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card>
          <CardTitle>Something not right?</CardTitle>
          <p className="text-ink-muted">
            Any concern — rights, safety, billing, a conflict — deserves a real answer. Filing a
            grievance can never be held against you.
          </p>
          <Link
            to="/residence/documents/grievance"
            className="mt-2 inline-block font-medium text-experience-700 underline underline-offset-2"
          >
            File a grievance
          </Link>
        </Card>

        {CATEGORY_ORDER.map((category) => {
          const docs = allDocuments.filter((d) => d.category === category);
          if (docs.length === 0) return null;
          return (
            <Card key={category}>
              <CardTitle>{CATEGORY_LABELS[category]}</CardTitle>
              <ul className="flex flex-col gap-2">
                {docs.map((d) => (
                  <li key={d.key}>
                    <Link
                      to={`/residence/documents/${d.key}`}
                      className="block rounded-md border border-line bg-surface-raised px-4 py-3 hover:bg-experience-soft"
                    >
                      <span className="font-medium text-ink">{d.name}</span>
                      <span className="mt-0.5 block text-sm text-ink-muted">{d.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
