import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  acknowledgeDocumentAssignment,
  applicationIntakeReadiness,
  ensureMyDocumentAssignments,
  getMyLatestApplication,
  listMyDocumentAssignments,
  recordResidenceConsentGrant,
  type AssignmentWithDocument,
  type MyApplication,
} from '@recoveryos/data-access';
import { getDocument } from '@recoveryos/residence-content';
import { Alert, Button, Card, CardTitle, LoadingState, PageHeader, TextField } from '@recoveryos/ui';
import { MarkdownView } from '../../components/MarkdownView';

/**
 * B5A "Getting settled": the participant's intake-stage view. Documents render
 * from THEIR assignment's pinned version (the exact terms they act on — never
 * the latest edition), acknowledgments are one tap, the single signature
 * document takes a typed name, and screening consent is their own one-tap
 * grant. Items that don't apply never render; there are no counts of
 * requirements — just what's theirs to do, why, and who can help.
 */

/** Why each action matters, in one plain sentence. */
function whyText(a: AssignmentWithDocument): string {
  if (a.document_version.template.requires_signature)
    return 'This is an agreement you sign — take your time and ask about anything unclear first.';
  return 'This just confirms you received and read it — nothing more.';
}

export function GettingSettledPage() {
  const { person } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [application, setApplication] = useState<MyApplication | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithDocument[]>([]);
  const [screeningConsentMet, setScreeningConsentMet] = useState<boolean | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');
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

  const pending = useMemo(() => assignments.filter((a) => !a.acknowledged_at), [assignments]);
  const done = useMemo(() => assignments.filter((a) => a.acknowledged_at), [assignments]);

  const act = async (fn: () => Promise<{ ok: boolean; code?: string }>) => {
    setBusy(true);
    setActionError(false);
    try {
      const r = await fn();
      if (!r.ok && r.code !== 'already_acknowledged') setActionError(true);
      else {
        setOpenKey(null);
        setSignatureName('');
      }
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
            <Alert tone="critical">That didn't save. Try again, or do it on paper with staff.</Alert>
          ) : null}

          {assignments.length === 0 ? (
            <Card data-testid="pending-edition">
              <CardTitle>Your documents aren't in the app yet</CardTitle>
              <p className="text-ink-muted">
                Your house's document set is still being prepared here. Staff will go through
                everything with you in person, on paper — you're not missing anything, and nothing
                is waiting on you.
              </p>
            </Card>
          ) : (
            <>
              {pending.length > 0 ? (
                <Card>
                  <CardTitle>To look through ({pending.length} left)</CardTitle>
                  <ul className="flex flex-col gap-3">
                    {pending.map((a) => {
                      const t = a.document_version.template;
                      const summary = getDocument(t.key)?.summary;
                      const isOpen = openKey === t.key;
                      return (
                        <li key={a.id} className="rounded-md border border-line bg-surface-raised p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium text-ink">{t.name}</span>
                            <span className="rounded-full bg-attention-50 px-3 py-0.5 text-sm text-attention-700">
                              {t.requires_signature ? 'To sign' : 'To read'}
                            </span>
                          </div>
                          {summary ? <p className="mt-1 text-sm text-ink-muted">{summary}</p> : null}
                          <p className="mt-1 text-sm text-ink-faint">{whyText(a)}</p>
                          {isOpen ? (
                            <div className="mt-3">
                              <MarkdownView markdown={a.document_version.body_markdown} />
                              <p className="mt-3 text-sm text-ink-faint">
                                Version {a.document_version.version}. Paper copies are always
                                available from staff.
                              </p>
                              {t.requires_signature ? (
                                <div className="mt-3 flex flex-col gap-2 sm:max-w-md">
                                  <TextField
                                    label="Type your full name as your signature"
                                    value={signatureName}
                                    onChange={(e) => setSignatureName(e.target.value)}
                                    autoComplete="name"
                                  />
                                  <Button
                                    disabled={busy || !signatureName.trim()}
                                    onClick={() =>
                                      void act(() =>
                                        acknowledgeDocumentAssignment({
                                          assignmentId: a.id,
                                          signatureName: signatureName.trim(),
                                        }),
                                      )
                                    }
                                  >
                                    {busy ? 'Signing…' : `Sign the ${t.name}`}
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  className="mt-3"
                                  disabled={busy}
                                  onClick={() =>
                                    void act(() =>
                                      acknowledgeDocumentAssignment({ assignmentId: a.id }),
                                    )
                                  }
                                >
                                  I've read this
                                </Button>
                              )}
                            </div>
                          ) : (
                            <Button
                              variant="secondary"
                              className="mt-2"
                              onClick={() => {
                                setOpenKey(t.key);
                                setSignatureName('');
                              }}
                            >
                              {t.requires_signature ? 'Read & sign' : 'Read it'}
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              ) : (
                <Alert tone="positive">Your documents are all done — nothing left to sign or read.</Alert>
              )}

              {done.length > 0 ? (
                <Card>
                  <CardTitle>Done</CardTitle>
                  <ul className="flex flex-col gap-1">
                    {done.map((a) => (
                      <li key={a.id} className="flex items-center justify-between py-1 text-sm">
                        <span className="text-ink">{a.document_version.template.name}</span>
                        <span className="text-ink-muted">
                          {a.signed_at ? 'Signed' : 'Read'}{' '}
                          {new Date(a.acknowledged_at as string).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </>
          )}

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
