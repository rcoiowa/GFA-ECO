import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import { fileGrievance, getMyActiveResidency, listMyGrievances } from '@recoveryos/data-access';
import type { Grievance, Residence, Residency } from '@recoveryos/domain';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  LoadingState,
  PageHeader,
  TextAreaField,
} from '@recoveryos/ui';

const STATUS_LABELS: Record<Grievance['status'], string> = {
  open: 'Received — being assigned',
  in_review: 'In review',
  resolved: 'Resolved',
  closed: 'Closed',
};

/**
 * Digital grievance filing. Mirrors the paper Grievance Form; the policy's
 * timelines (acknowledged in 2 business days, decided in 7) apply the same.
 */
export function GrievancePage() {
  const { person } = useAuth();
  const [residency, setResidency] = useState<(Residency & { residence: Residence }) | null>(null);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    try {
      const [res, mine] = await Promise.all([
        getMyActiveResidency(person.id),
        listMyGrievances(person.id),
      ]);
      setResidency(res);
      setGrievances(mine);
    } catch {
      // Non-fatal; the form still explains the paper path.
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!person || !residency || !summary.trim()) return;
    setSubmitting(true);
    setError(false);
    try {
      await fileGrievance({
        residenceId: residency.residence_id,
        personId: person.id,
        summary: summary.trim(),
      });
      setSummary('');
      setSubmitted(true);
      await load();
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="File a grievance"
        lede="Raising a concern is a contribution to this house, not a betrayal of it."
        crumbs={[
          { to: '/residence/today', label: 'Today' },
          { to: '/residence/documents', label: 'Documents' },
        ]}
      />

      <div className="flex flex-col gap-5">
        <Alert tone="info">
          <strong>No retaliation, ever.</strong> Filing a grievance cannot affect your residency,
          fees, privileges, or how anyone here treats you. You'll get written acknowledgment within
          2 business days and a written decision within 7. The full process — including who to
          contact outside this organization — is in the Grievance Policy.
        </Alert>

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <Card>
              <CardTitle>What's going on?</CardTitle>
              {submitted ? (
                <Alert tone="positive">
                  Your grievance is filed. A staff member follows up in writing within 2 business
                  days. If you don't hear back, the paper form posted in the house — or a note to any
                  staff member — reaches the same process, with the same timelines.
                </Alert>
              ) : null}
              {error ? (
                <Alert tone="critical">
                  It didn't go through. Please try again — or use the paper form, or hand a note to
                  any staff member. Every path counts as a filed grievance.
                </Alert>
              ) : null}
              {!residency ? (
                <p className="text-ink-muted">
                  We couldn't confirm your residency just now, so the digital form is unavailable —
                  but the paper grievance form (posted in the house) and a note to any staff member
                  work exactly the same, with the same timelines.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <TextAreaField
                    label="Describe the concern"
                    hint="What happened, when, and who was involved. If you'd like it handled by someone other than the house manager, say so here."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={6}
                  />
                  <Button onClick={() => void submit()} disabled={submitting || !summary.trim()}>
                    {submitting ? 'Filing…' : 'File grievance'}
                  </Button>
                </div>
              )}
            </Card>

            {grievances.length > 0 ? (
              <Card>
                <CardTitle>Your filed grievances</CardTitle>
                <ul className="flex flex-col gap-3">
                  {grievances.map((g) => (
                    <li key={g.id} className="rounded-md border border-line bg-surface-raised p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-ink-muted">
                          Filed {new Date(g.filed_at).toLocaleDateString()}
                        </span>
                        <span className="rounded-full bg-experience-soft px-3 py-0.5 text-sm text-experience-700">
                          {STATUS_LABELS[g.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-ink">{g.summary}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
