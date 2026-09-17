import { useCallback, useEffect, useState } from 'react';
import {
  listListingSubmissions,
  publishListingSubmission,
  reviewListingSubmission,
  type ResidenceListingSubmission,
} from '@recoveryos/data-access';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
  TextField,
} from '@recoveryos/ui';

/**
 * P0.5-A — moderation queue for public directory listing submissions (0122,
 * Flow 1). A submission never auto-becomes a listing: review moves it through
 * the lifecycle, and PUBLISH is the deliberate act that creates the canonical
 * residence with is_public_directory=true. Platform-admin only (RLS + RPC).
 */

const STATUS_LABELS: Record<ResidenceListingSubmission['status'], string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  approved: 'Approved — ready to publish',
  published: 'Published',
  rejected: 'Not listed',
};

export function DirectorySubmissionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rows, setRows] = useState<ResidenceListingSubmission[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [orgIdFor, setOrgIdFor] = useState<number | null>(null);
  const [orgId, setOrgId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setRows(await listListingSubmissions());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (
    submissionId: number,
    status: 'under_review' | 'approved' | 'rejected',
  ) => {
    setActionError(null);
    try {
      await reviewListingSubmission({ submissionId, status });
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'We couldn’t record that.');
    }
  };

  const publish = async (submissionId: number) => {
    setActionError(null);
    const parsed = Number(orgId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setActionError('Enter the organization id this residence belongs to before publishing.');
      return;
    }
    try {
      await publishListingSubmission({ submissionId, organizationId: parsed });
      setOrgIdFor(null);
      setOrgId('');
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Publish failed.');
    }
  };

  const openRows = rows.filter((r) => ['submitted', 'under_review', 'approved'].includes(r.status));
  const settled = rows.filter((r) => ['published', 'rejected'].includes(r.status));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Directory submissions"
        lede="Operators asking to be listed on the public directory. Nothing appears publicly until it is deliberately published."
      />
      {loading ? (
        <LoadingState label="Loading submissions…" />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <>
          {actionError ? <Alert tone="critical">{actionError}</Alert> : null}
          <Card>
            <CardTitle>In moderation ({openRows.length})</CardTitle>
            {openRows.length === 0 ? (
              <p className="text-ink-muted">No submissions waiting.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-3">
                {openRows.map((r) => (
                  <li key={r.id} className="rounded-md border border-line bg-surface-raised p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-ink">{r.residence_name}</span>
                      <span className="text-sm text-ink-muted">{STATUS_LABELS[r.status]}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {[
                        r.organization_name,
                        [r.address_city, r.address_state].filter(Boolean).join(', '),
                        r.support_level ? `Level ${r.support_level}` : null,
                        r.narr_certified ? 'NARR certified (claimed)' : null,
                        r.capacity ? `${r.capacity} beds` : null,
                        r.contact_email,
                        r.contact_phone,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {r.notes ? <p className="mt-1 text-sm text-ink-muted">Notes: {r.notes}</p> : null}
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      {r.status === 'submitted' ? (
                        <Button variant="secondary" size="md" onClick={() => void review(r.id, 'under_review')}>
                          Start review
                        </Button>
                      ) : null}
                      {['submitted', 'under_review'].includes(r.status) ? (
                        <>
                          <Button variant="secondary" size="md" onClick={() => void review(r.id, 'approved')}>
                            Approve
                          </Button>
                          <Button variant="ghost" size="md" onClick={() => void review(r.id, 'rejected')}>
                            Don&rsquo;t list
                          </Button>
                        </>
                      ) : null}
                      {r.status === 'approved' ? (
                        orgIdFor === r.id ? (
                          <div className="flex items-end gap-2">
                            <TextField
                              label="Organization id"
                              value={orgId}
                              onChange={(e) => setOrgId(e.target.value)}
                            />
                            <Button size="md" onClick={() => void publish(r.id)}>
                              Publish listing
                            </Button>
                          </div>
                        ) : (
                          <Button size="md" onClick={() => setOrgIdFor(r.id)}>
                            Publish…
                          </Button>
                        )
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardTitle>Decided</CardTitle>
            {settled.length === 0 ? (
              <p className="text-ink-muted">Nothing decided yet.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {settled.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2"
                  >
                    <span className="text-ink">{r.residence_name}</span>
                    <span className="text-sm text-ink-muted">{STATUS_LABELS[r.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
