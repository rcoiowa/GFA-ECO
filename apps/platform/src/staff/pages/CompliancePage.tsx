import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@recoveryos/auth';
import {
  getIowaTracker,
  getNarrTracker,
  setIowaStatus,
  setNarrStatus,
} from '@recoveryos/data-access';
import type { IowaChecklistStatus, NarrCompliance } from '@recoveryos/domain';
import { Alert, Card, CardTitle, ErrorState, LoadingState, PageHeader } from '@recoveryos/ui';
import { useStaff } from '../staffContext';

const DOMAIN_TITLES: Record<number, string> = {
  1: 'Domain 1 — Administrative Operations',
  2: 'Domain 2 — Physical Environment',
  3: 'Domain 3 — Recovery Support',
  4: 'Domain 4 — Good Neighbor',
};

const NARR_STATUS_OPTIONS: NarrCompliance['status'][] = [
  'met',
  'in_progress',
  'not_met',
  'not_applicable',
];
const NARR_STATUS_LABELS: Record<NarrCompliance['status'], string> = {
  met: 'Met',
  in_progress: 'In progress',
  not_met: 'Not met',
  not_applicable: 'N/A',
};
const IOWA_STATUS_LABELS: Record<IowaChecklistStatus['status'], string> = {
  yes: 'Yes',
  in_progress: 'In progress',
  no: 'No',
};

/**
 * The NARR 3.0 tracker (all Level II rules) and the Iowa HHS 7-item
 * eligibility checklist — the operational heart of Room 1. Daily workflow
 * (screenings, meetings, IRPs) provides the evidence; this page records
 * verification status per standard.
 */
export function CompliancePage() {
  const { person } = useAuth();
  const { residence } = useStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [narr, setNarr] = useState<Awaited<ReturnType<typeof getNarrTracker>> | null>(null);
  const [iowa, setIowa] = useState<Awaited<ReturnType<typeof getIowaTracker>> | null>(null);

  const load = useCallback(async () => {
    if (!residence) return;
    setLoading(true);
    setError(false);
    try {
      const [n, i] = await Promise.all([
        getNarrTracker(residence.id),
        getIowaTracker(residence.id),
      ]);
      setNarr(n);
      setIowa(i);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [residence]);

  useEffect(() => {
    void load();
  }, [load]);

  const narrStatusByStandard = useMemo(
    () => new Map((narr?.statuses ?? []).map((s) => [s.standard_id, s])),
    [narr],
  );
  const iowaStatusByItem = useMemo(
    () => new Map((iowa?.statuses ?? []).map((s) => [s.item_id, s])),
    [iowa],
  );

  const updateNarr = async (standardId: number, status: NarrCompliance['status']) => {
    if (!person || !residence) return;
    const existing = narrStatusByStandard.get(standardId);
    await setNarrStatus({
      residenceId: residence.id,
      standardId,
      status,
      evidence: existing?.evidence ?? null,
      verifiedByPersonId: person.id,
    });
    await load();
  };

  const updateIowa = async (itemId: number, status: IowaChecklistStatus['status']) => {
    if (!person || !residence) return;
    const existing = iowaStatusByItem.get(itemId);
    await setIowaStatus({
      residenceId: residence.id,
      itemId,
      status,
      evidence: existing?.evidence ?? null,
      verifiedByPersonId: person.id,
    });
    await load();
  };

  if (!residence) return <Alert tone="attention">Select a residence to see its trackers.</Alert>;

  const metCount = (narr?.statuses ?? []).filter((s) => s.status === 'met').length;
  const total = narr?.standards.length ?? 0;

  return (
    <>
      <PageHeader
        title="Compliance"
        lede={`NARR 3.0 Level II readiness for ${residence.name} — via ${residence.narr_affiliate ?? 'the certifying affiliate'} through Iowa HHS.`}
        crumbs={[{ to: '/staff/today', label: 'Today' }]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Iowa HHS Eligibility Checklist (Form 470-0025)</CardTitle>
              <span className="rounded-full bg-experience-soft px-3 py-0.5 text-sm text-experience-700">
                {(iowa?.statuses ?? []).filter((s) => s.status === 'yes').length} / 7 confirmed
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {(iowa?.items ?? []).map((item) => {
                const status = iowaStatusByItem.get(item.id);
                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-raised px-3 py-2"
                  >
                    <span className="text-sm text-ink">
                      <span className="font-medium">{item.item_no}.</span> {item.title}
                    </span>
                    <select
                      aria-label={`Item ${item.item_no} status`}
                      className="min-h-9 rounded-md border border-line bg-surface px-2 text-sm"
                      value={status?.status ?? 'in_progress'}
                      onChange={(e) =>
                        void updateIowa(item.id, e.target.value as IowaChecklistStatus['status'])
                      }
                    >
                      {(Object.keys(IOWA_STATUS_LABELS) as IowaChecklistStatus['status'][]).map(
                        (s) => (
                          <option key={s} value={s}>
                            {IOWA_STATUS_LABELS[s]}
                          </option>
                        ),
                      )}
                    </select>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>NARR Standard 3.0 — Level II</CardTitle>
              <span className="rounded-full bg-experience-soft px-3 py-0.5 text-sm text-experience-700">
                {metCount} / {total} met
              </span>
            </div>
            {[1, 2, 3, 4].map((domain) => (
              <details
                key={domain}
                className="mt-2 rounded-md border border-line bg-surface-raised"
              >
                <summary className="cursor-pointer px-4 py-3 font-medium text-ink">
                  {DOMAIN_TITLES[domain]} (
                  {
                    (narr?.standards ?? []).filter(
                      (s) =>
                        s.domain === domain && narrStatusByStandard.get(s.id)?.status === 'met',
                    ).length
                  }
                  /{(narr?.standards ?? []).filter((s) => s.domain === domain).length} met)
                </summary>
                <ul className="flex flex-col gap-1 px-4 pb-3">
                  {(narr?.standards ?? [])
                    .filter((s) => s.domain === domain)
                    .map((s) => {
                      const status = narrStatusByStandard.get(s.id);
                      return (
                        <li
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-1.5"
                        >
                          <span className="text-sm text-ink">
                            <span className="font-mono text-ink-muted">{s.code}</span> {s.title}
                          </span>
                          <select
                            aria-label={`${s.code} status`}
                            className="min-h-9 rounded-md border border-line bg-surface px-2 text-sm"
                            value={status?.status ?? 'in_progress'}
                            onChange={(e) =>
                              void updateNarr(s.id, e.target.value as NarrCompliance['status'])
                            }
                          >
                            {NARR_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {NARR_STATUS_LABELS[opt]}
                              </option>
                            ))}
                          </select>
                        </li>
                      );
                    })}
                </ul>
              </details>
            ))}
            <p className="mt-3 text-sm text-ink-faint">
              Evidence lives in daily workflow: logged screenings evidence 2.F.16.c, house meetings
              3.G.23, IRPs 3.G.21.a, naloxone training 2.F.19.d. The pre-certification punch list is
              in the NARR II Self-Assessment document.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
