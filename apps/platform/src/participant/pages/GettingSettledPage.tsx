import { Link } from 'react-router';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  applicationIntakeReadiness,
  ensureMyDocumentAssignments,
  getMyLatestApplication,
  listMyDocumentAssignments,
  recordResidenceConsentGrant,
  type AssignmentWithDocument,
  type MyApplication,
} from '@recoveryos/data-access';
import { Alert, Button, Card, CardTitle, LoadingState, PageHeader } from '@recoveryos/ui';

/** Intake overview. Document actions use the shared, server-enforced review page. */
export function GettingSettledPage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [application, setApplication] = useState<MyApplication | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithDocument[]>([]);
  const [screeningConsentMet, setScreeningConsentMet] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(false);

  const load = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    setError(false);
    try {
      const app = await getMyLatestApplication(person.id);
      setApplication(app);
      if (app && app.status === 'approved') {
        await ensureMyDocumentAssignments();
        setAssignments(await listMyDocumentAssignments(person.id));
        try {
          const r = await applicationIntakeReadiness(app.id);
          const item = (r.items ?? []).find((i) => i.key === 'screening_consent');
          setScreeningConsentMet(item ? item.met : null);
        } catch {
          setScreeningConsentMet(null);
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (fn: () => Promise<{ ok: boolean; code?: string }>) => {
    setBusy(true);
    setActionError(false);
    try {
      const r = await fn();
      if (!r.ok && r.code !== 'already_acknowledged') setActionError(true);
      await load();
    } catch {
      setActionError(true);
    } finally {
      setBusy(false);
    }
  };

  const residencePhone = application?.residence?.phone;
  const helpLine = residencePhone
    ? `Any staff member can sit with you through any of this — and paper copies are always available. Call ${residencePhone} any time.`
    : 'Any staff member can sit with you through any of this — and paper copies are always available.';

  return (
    <>
      <PageHeader
        title="Getting settled"
        lede="A few things to look through before move-in — at your pace, with help whenever you want it."
      />
      {loading ? (
        <LoadingState label="Checking what's yours to look at…" />
      ) : error ? (
        <Alert tone="attention">
          We couldn't load this right now — nothing is lost. Try again in a moment, or ask staff.
        </Alert>
      ) : !application ? (
        <Card>
          <p className="text-ink-muted">
            Nothing here right now. When a residence application is in motion, this is where you'll
            see what's yours to do.
          </p>
        </Card>
      ) : application.status !== 'approved' ? (
        <Card>
          <CardTitle>Your application is in</CardTitle>
          <p className="text-ink-muted">
            {application.residence?.name ?? 'The residence'} has your application
            {application.status === 'waitlisted'
              ? " — you're on the waitlist, and staff will stay in touch at least every two weeks."
              : ' — staff will reach out to you directly. There is nothing you need to do here yet.'}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          <Alert tone="positive">
            You're approved at {application.residence?.name ?? 'your residence'}. {helpLine}
          </Alert>
          {actionError ? (
            <Alert tone="critical">
              That didn't save. Try again, or do it on paper with staff.
            </Alert>
          ) : null}

          <Card
            data-testid={assignments.length === 0 ? 'pending-edition' : 'document-review-links'}
          >
            <CardTitle>Your documents</CardTitle>
            {assignments.length === 0 ? (
              <p>
                No documents are assigned yet. Ask staff to check your application and document set.
              </p>
            ) : (
              <p>
                Open each document to review its exact edition, ask questions, select your
                statements, and sign when required. Your saved receipts remain available.
              </p>
            )}
            <Link className="mt-3 block underline" to="/my-housing/documents">
              Open my documents and receipts
            </Link>
          </Card>

          {screeningConsentMet === false ? (
            <Card data-testid="screening-consent-card">
              <CardTitle>Screening consent</CardTitle>
              <p className="text-ink-muted">
                The house does drug and alcohol screening to keep the home safe for everyone's
                recovery. This records your okay — you can change your mind at any time by telling
                staff, and your prescribed medications are never a violation.
              </p>
              <Button
                className="mt-3"
                disabled={busy}
                onClick={() =>
                  void act(() =>
                    recordResidenceConsentGrant({
                      personId: person!.id,
                      typeKey: 'residence_screening',
                    }),
                  )
                }
              >
                I give my okay for screening
              </Button>
            </Card>
          ) : screeningConsentMet === true ? (
            <p className="text-sm text-ink-muted">Screening consent: given. ✓</p>
          ) : null}

          <Card>
            <CardTitle>The rest happens with staff</CardTitle>
            <p className="text-ink-muted">
              A few things — like your emergency contact and a quick medication review — get done
              together in the intake conversation. Nothing there is homework for you here.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
