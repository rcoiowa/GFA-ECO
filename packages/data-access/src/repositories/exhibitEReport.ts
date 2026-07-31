import { getSupabase } from '../client';

/**
 * Iowa HHS Exhibit E outcomes report (Opioid Settlement / HF 1038).
 * Compiled from the service_events attribution spine plus residence
 * operations data, with each block citing the Exhibit E Schedule A/B use
 * it evidences — citations per GFA's Exhibit E Alignment Analysis
 * (docs/source-documents/GFA_ExhibitE_AlignmentAnalysis.pdf). Aggregate
 * counts only; no participant-identifying information leaves this report.
 */

export interface ExhibitEBlock {
  metric: string;
  value: number;
  exhibitE: string;
  note: string;
}

export interface ExhibitEReportData {
  windowDays: number;
  residenceName: string;
  blocks: ExhibitEBlock[];
  serviceBreakdown: { category: string; count: number }[];
}

const CATEGORY_CITATIONS: Record<string, string> = {
  peer_support: 'B-B.2, B-B.3',
  coaching: 'B-B.2, B-B.3',
  mentoring: 'B-B.2',
  accountability: 'B-B.2',
  recovery_circle: 'B-B.6',
  navigation: 'B-B.1, Sch-A/E.2',
  assessment: 'Sch-A/I, B-J.1, L.1',
  check_in: 'B-J.1, L.1',
  education: 'B-B.8',
  practice: 'B-B.2',
  support_request: 'Sch-A/E.2',
  event: 'B-B.6, B-G.7',
};

export async function compileExhibitEReport(
  residenceId: number,
  residenceName: string,
  windowDays = 90,
): Promise<ExhibitEReportData> {
  const sb = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - windowDays);
  const sinceIso = since.toISOString();
  const sinceDate = sinceIso.slice(0, 10);

  const [events, residencies, screenings, meetings] = await Promise.all([
    sb
      .from('service_events')
      .select('person_id, started_at, service_type:service_types(key, category)')
      .eq('residence_id', residenceId)
      .gte('started_at', sinceIso),
    sb
      .from('residencies')
      .select('id, residency_status, admission_date')
      .eq('residence_id', residenceId),
    sb
      .from('screenings')
      .select('id, residency_id, collected_at, residency:residencies!inner(residence_id)')
      .eq('residency.residence_id', residenceId)
      .gte('collected_at', sinceIso),
    sb
      .from('meetings')
      .select('id, starts_at')
      .eq('residence_id', residenceId)
      .gte('starts_at', sinceIso),
  ]);
  for (const r of [events, residencies, screenings, meetings]) {
    if (r.error) throw r.error;
  }

  type EventRow = { person_id: number; service_type: { category: string } | null };
  const eventRows = (events.data ?? []) as unknown as EventRow[];
  const residencyRows = (residencies.data ?? []) as {
    residency_status: string;
    admission_date: string | null;
  }[];

  const peopleServed = new Set(eventRows.map((e) => e.person_id)).size;
  const byCategory = new Map<string, number>();
  for (const e of eventRows) {
    const cat = e.service_type?.category ?? 'other';
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
  }

  const activeResidents = residencyRows.filter((r) =>
    ['active', 'on_pass', 'transitioning'].includes(r.residency_status),
  ).length;
  const admissions = residencyRows.filter(
    (r) => r.admission_date != null && r.admission_date >= sinceDate,
  ).length;

  const blocks: ExhibitEBlock[] = [
    {
      metric: 'People served (distinct participants with documented services)',
      value: peopleServed,
      exhibitE: 'B-B.1, B-B.2',
      note: 'Comprehensive wrap-around and continuum of recovery services',
    },
    {
      metric: 'Recovery residence — residents currently housed',
      value: activeResidents,
      exhibitE: 'Sch-A/B.4, B-B.4, B-H',
      note: 'Medication-inclusive recovery housing (MAT/MOUD-affirming)',
    },
    {
      metric: 'Recovery residence — admissions in window',
      value: admissions,
      exhibitE: 'B-B.4, B-D.6',
      note: 'Housing access incl. persons transitioning from incarceration',
    },
    {
      metric: 'Documented service events (all categories)',
      value: eventRows.length,
      exhibitE: 'Sch-A/I, B-J.1, L.1',
      note: 'Evidence-based data collection via the service-event spine',
    },
    {
      metric: 'Drug/alcohol screenings administered',
      value: (screenings.data ?? []).length,
      exhibitE: 'B-B.2 (recovery supports); NARR 2.F.16.c',
      note: 'Substance-free environment protocols with dignity standards',
    },
    {
      metric: 'House/community meetings held',
      value: (meetings.data ?? []).length,
      exhibitE: 'B-B.6',
      note: 'Peer recovery center programming',
    },
  ];

  return {
    windowDays,
    residenceName,
    blocks,
    serviceBreakdown: [...byCategory.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/** CSV for grant reporting uploads. */
export function exhibitEReportCsv(report: ExhibitEReportData): string {
  const esc = (s: string) => `"${s.replaceAll('"', '""')}"`;
  const lines = [
    ['Metric', 'Value', 'Exhibit E citation', 'Note'].map(esc).join(','),
    ...report.blocks.map((b) => [b.metric, String(b.value), b.exhibitE, b.note].map(esc).join(',')),
    '',
    ['Service category', 'Events in window', CATEGORY_CITATIONS ? 'Exhibit E citation' : '', '']
      .map(esc)
      .join(','),
    ...report.serviceBreakdown.map((s) =>
      [s.category, String(s.count), CATEGORY_CITATIONS[s.category] ?? '', ''].map(esc).join(','),
    ),
  ];
  return lines.join('\n');
}

export { CATEGORY_CITATIONS as EXHIBIT_E_CATEGORY_CITATIONS };
