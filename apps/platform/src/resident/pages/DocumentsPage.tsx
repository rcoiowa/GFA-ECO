import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@recoveryos/auth';
import {
  ensureMyDocumentAssignments,
  listMyDocumentAssignments,
  listMyDocumentReviewStates,
  type AssignmentWithDocument,
} from '@recoveryos/data-access';
import { allDocuments, type DocumentCategory } from '@recoveryos/residence-content';
import { Alert, Card, CardTitle, LoadingState, PageHeader } from '@recoveryos/ui';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  agreement: 'Your agreements',
  handbook: 'Resident Handbook',
  policy: 'House policies',
  form: 'Forms',
};

const CATEGORY_ORDER: DocumentCategory[] = ['handbook', 'agreement', 'policy', 'form'];

/**
 * The resident document center: everything waiting for a signature up top,
 * then the full library. The library renders from the bundled canonical
 * package, so it works even before signature records load.
 */
export function DocumentsPage({
  basePath = '/residence',
  assignedOnly = false,
}: {
  basePath?: string;
  assignedOnly?: boolean;
}) {
  const { person } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithDocument[] | null>(null);
  const [assignmentsError, setAssignmentsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIds, setCurrentIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAssignmentsError(false);
    setAssignments(null);
    setCurrentIds([]);
    void (async () => {
      try {
        if (person) {
          await ensureMyDocumentAssignments();
          const rows = await listMyDocumentAssignments(person.id);
          const states = await listMyDocumentReviewStates();
          if (!cancelled) {
            setCurrentIds(states.filter((s) => s.ok && s.current).map((s) => s.assignment_id!));
            setAssignments(rows);
          }
        }
      } catch {
        if (!cancelled) setAssignmentsError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [person?.id]);

  const pending = useMemo(
    () =>
      (assignments ?? []).filter(
        (a) => !a.acknowledged_at && a.person_id === person?.id && currentIds.includes(a.id),
      ),
    [assignments, currentIds, person?.id],
  );
  const signed = useMemo(
    () => (assignments ?? []).filter((a) => a.acknowledged_at && a.person_id === person?.id),
    [assignments, person?.id],
  );

  return (
    <>
      <PageHeader
        title="Documents"
        lede="Your agreements, your rights, and every house policy — nothing here is fine print."
        crumbs={[
          {
            to: basePath === '/residence' ? '/residence/today' : basePath,
            label: basePath === '/residence' ? 'Today' : 'My housing intake',
          },
        ]}
      />

      <div className="flex flex-col gap-5">
        {loading ? (
          <LoadingState label="Checking for anything that needs your signature…" />
        ) : assignmentsError ? (
          <Alert tone="attention">
            We couldn't load your signature records right now. The document library below still
            works.
          </Alert>
        ) : pending.length > 0 ? (
          <Card>
            <CardTitle>Waiting for your review</CardTitle>
            <p className="mb-3 text-sm text-ink-muted">
              Take your time with these — and ask staff anything, as many times as you need.
            </p>
            <ul className="flex flex-col gap-2">
              {pending.map((a) => (
                <li key={a.id}>
                  <Link
                    to={`${basePath}/documents/${a.document_version.template.key}?assignment=${a.id}`}
                    className="flex items-center justify-between rounded-md border border-line bg-surface-raised px-4 py-3 hover:bg-experience-soft"
                  >
                    <span className="font-medium text-ink">{a.document_version.template.name}</span>
                    <span className="rounded-full bg-attention-50 px-3 py-0.5 text-sm text-attention-700">
                      {a.document_version.template.requires_signature
                        ? 'Review & sign'
                        : 'Review & acknowledge'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Alert tone="positive">
            {assignments?.length
              ? 'No current assigned documents are waiting for your review.'
              : 'No documents are assigned yet. If you are waiting for intake documents, ask staff to check your application and account link.'}
          </Alert>
        )}

        {signed.length > 0 ? (
          <Card>
            <CardTitle>Recorded completions</CardTitle>
            <ul className="flex flex-col gap-1">
              {signed.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-1">
                  <Link
                    to={`${basePath}/documents/${a.document_version.template.key}?assignment=${a.id}`}
                    className="font-medium text-experience-700 underline underline-offset-2"
                  >
                    {a.document_version.template.name} — version {a.document_version.version}
                  </Link>
                  <span className="text-sm text-ink-muted">
                    {new Date(a.acknowledged_at as string).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {(assignments ?? []).some(
          (a) => a.person_id === person?.id && !a.acknowledged_at && !currentIds.includes(a.id),
        ) && (
          <Card>
            <CardTitle>Earlier or inactive assignments</CardTitle>
            <p>
              These records remain available for reference. Review current applicable editions
              above.
            </p>
            <ul>
              {(assignments ?? [])
                .filter(
                  (a) =>
                    a.person_id === person?.id && !a.acknowledged_at && !currentIds.includes(a.id),
                )
                .map((a) => (
                  <li key={a.id}>
                    <Link
                      className="underline"
                      to={`${basePath}/documents/${a.document_version.template.key}?assignment=${a.id}`}
                    >
                      {a.document_version.template.name} — version {a.document_version.version}
                    </Link>
                  </li>
                ))}
            </ul>
          </Card>
        )}

        {!assignedOnly && (
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
        )}

        {!assignedOnly &&
          CATEGORY_ORDER.map((category) => {
            const docs = allDocuments.filter((d) => d.category === category);
            if (docs.length === 0) return null;
            return (
              <Card key={category}>
                <CardTitle>{CATEGORY_LABELS[category]}</CardTitle>
                <ul className="flex flex-col gap-2">
                  {docs.map((d) => (
                    <li key={d.key}>
                      <Link
                        to={`${basePath}/documents/${d.key}`}
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
