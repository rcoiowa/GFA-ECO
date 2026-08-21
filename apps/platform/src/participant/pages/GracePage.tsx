import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Alert, Button, Card, LoadingState, PageHeader } from '@recoveryos/ui';
import { SupportNowButton } from '@recoveryos/safety';
import { useAuth } from '@recoveryos/auth';
import {
  hasActiveAiConsent,
  invokeGrace,
  setAiConsent,
  type GraceResult,
  type GraceTurn,
} from '@recoveryos/data-access';
import { track } from '../../lib/analytics';

/**
 * Grace — canonical AI recovery companion (P4-Grace). Grace is ONE capability
 * within VRCC, not the center of the app. Everything security- and
 * safety-critical is server-authoritative in the `grace` Edge Function; this
 * surface only renders disclosure, gates on `ai_features` consent, sends turns,
 * and keeps Support Now + human connection reachable.
 *
 * Privacy: the conversation lives in component state only. Nothing here is
 * written to a database, cached by the service worker (§27), or logged.
 */

const DISCLOSURE =
  "I'm Grace, an AI recovery companion from Grace For Addictions. I can help you " +
  'reflect, find a next step, and connect with real people. I’m not a human peer, ' +
  'therapist, or crisis service.';

const STARTERS = [
  'I’m having a hard day.',
  'I’m struggling with a craving right now.',
  'Can you share a slogan for today?',
  'Help me think through a next step.',
];

type UiTurn = GraceTurn & { crisis?: boolean };

export function GracePage() {
  const { person } = useAuth();
  const personId = person?.id ?? 0;

  const [checking, setChecking] = useState(true);
  const [consented, setConsented] = useState(false);
  const [granting, setGranting] = useState(false);

  const [messages, setMessages] = useState<UiTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [surfaceSupport, setSurfaceSupport] = useState(false);
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track('grace_opened');
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const loadConsent = useCallback(async () => {
    if (!personId) return;
    setChecking(true);
    try {
      setConsented(await hasActiveAiConsent(personId));
    } catch {
      setConsented(false);
    } finally {
      setChecking(false);
    }
  }, [personId]);

  useEffect(() => {
    void loadConsent();
  }, [loadConsent]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function grant() {
    if (!personId) return;
    setGranting(true);
    try {
      await setAiConsent(personId, 'granted');
      track('grace_consent_granted');
      setConsented(true);
    } catch {
      setNotice('We couldn’t turn Grace on just now. Please try again.');
    } finally {
      setGranting(false);
    }
  }

  function applyResult(result: GraceResult) {
    setSurfaceSupport(Boolean(result.safety?.surface_support_now));
    if (result.code === 'consent_required') {
      setConsented(false);
      return;
    }
    if (result.code === 'ai_unconfigured') {
      setNotice(
        'Grace isn’t fully set up yet, so she can’t reply right now. If you need support, ' +
          'Support Now and your team are still here.',
      );
      return;
    }
    if (!result.ok || !result.content) {
      setNotice(
        'Grace couldn’t respond just now. If this is urgent, please use Support Now below.',
      );
      return;
    }
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: result.content as string, crisis: result.safety?.surface_support_now },
    ]);
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending || !consented) return;
    if (!online) {
      setNotice('Grace needs an internet connection to reply.');
      return;
    }
    setNotice(null);
    setDraft('');
    const next: UiTurn[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setSending(true);
    track('grace_message_sent');
    try {
      const result = await invokeGrace(next.map((m) => ({ role: m.role, content: m.content })));
      applyResult(result);
    } catch {
      setNotice('Grace couldn’t respond just now. If this is urgent, please use Support Now below.');
    } finally {
      setSending(false);
    }
  }

  if (checking) return <LoadingState label="Opening Grace…" />;

  const disclosureBanner = (
    <Alert tone="info">
      <span className="font-medium">About Grace:</span> {DISCLOSURE}
    </Alert>
  );

  // ---- Consent-required state (§9, §25) ------------------------------------
  if (!consented) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Grace"
          lede="An optional AI companion for reflection and next steps."
          crumbs={[{ to: '/vrcc/today', label: 'Today' }]}
        />
        {disclosureBanner}
        <Card>
          <h2 className="text-lg font-semibold text-ink">Grace needs your okay first</h2>
          <p className="mt-2 text-ink-muted">
            Grace is powered by an AI language model. She listens, reflects, and points you toward
            real people and canonical GFA resources — she doesn’t diagnose, treat, or give medical,
            legal, or clinical advice, and she doesn’t remember conversations between sessions. Your
            conversation isn’t shared with your coach unless you choose to reach out, and Grace never
            alerts anyone on her own.
          </p>
          <p className="mt-2 text-ink-muted">
            You can use everything else in VRCC without Grace, and you can turn her off any time on
            your{' '}
            <Link to="/vrcc/privacy" className="underline underline-offset-2">
              Privacy &amp; consent
            </Link>{' '}
            page.
          </p>
          {notice ? (
            <div className="mt-3">
              <Alert tone="critical">{notice}</Alert>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => void grant()} disabled={granting}>
              {granting ? 'One moment…' : 'Turn on Grace AI'}
            </Button>
            <SupportNowButton basePath="/vrcc" />
          </div>
        </Card>
      </div>
    );
  }

  // ---- Conversation surface -------------------------------------------------
  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-[26rem] flex-col space-y-3">
      <PageHeader
        title="Grace"
        lede="A calm place to think out loud. Grace is AI — real people are one tap away."
        crumbs={[{ to: '/vrcc/today', label: 'Today' }]}
      />
      {disclosureBanner}

      {!online ? (
        <Alert tone="attention">Grace needs an internet connection. Support Now still works offline.</Alert>
      ) : null}
      {surfaceSupport ? (
        <Alert tone="critical">
          It sounds like this is really heavy. You don’t have to carry it alone — you can reach a
          real person right now.
          <span className="mt-2 block">
            <SupportNowButton basePath="/vrcc" />
          </span>
        </Alert>
      ) : null}
      {notice ? <Alert tone="info">{notice}</Alert> : null}

      <div
        ref={logRef}
        role="log"
        tabIndex={0}
        aria-label="Conversation with Grace"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-lg border border-line bg-surface-raised p-4"
      >
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-ink-muted">
              Hi — I’m Grace. There’s no agenda here. What’s on your mind?
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-surface-sunken"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 ${
                  m.role === 'user'
                    ? 'rounded-br-md bg-experience-600 text-white'
                    : 'rounded-bl-md border border-line bg-surface text-ink'
                }`}
              >
                {m.role === 'assistant' ? (
                  <span className="mb-1 block text-xs font-semibold text-ink-faint">Grace · AI</span>
                ) : null}
                {m.content}
              </div>
            </div>
          ))
        )}
        {sending ? <p className="text-sm text-ink-muted">Grace is thinking…</p> : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
        className="flex items-end gap-2"
      >
        <label htmlFor="grace-composer" className="sr-only">
          Message Grace
        </label>
        <textarea
          id="grace-composer"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send(draft);
            }
          }}
          rows={2}
          placeholder="Type a message to Grace…"
          className="min-h-11 flex-1 resize-none rounded-lg border border-line bg-surface px-3 py-2 text-ink"
          disabled={sending}
        />
        <Button type="submit" disabled={!draft.trim() || sending}>
          Send
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
        <span>
          Grace doesn’t replace people.{' '}
          <Link to="/vrcc/connect" className="underline underline-offset-2">
            Connect with your team
          </Link>
          .
        </span>
        <SupportNowButton basePath="/vrcc" />
      </div>
    </div>
  );
}
