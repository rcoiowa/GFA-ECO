import type { FeeLedgerEntry, Residency, Screening, ServiceEvent } from '@recoveryos/domain';
import { getSupabase } from '../client';
import { feeBalance } from './staffOperations';

/**
 * Supervision compliance report (Integration Plan Room 4): auto-compiled
 * from participant data for probation/parole/IDOC partners. Shared only
 * under a signed Release of Information — the page that renders this
 * says so, and staff attest to it before printing.
 */
export interface SupervisionReportData {
  residency: Residency;
  screenings: Screening[];
  meetingsAttended: number;
  meetingsExpected: number;
  serviceEvents: ServiceEvent[];
  checkInDays: number;
  feeEntries: FeeLedgerEntry[];
  feeBalanceOwed: number;
  windowDays: number;
}

export async function compileSupervisionReport(
  residency: Residency,
  windowDays = 90,
): Promise<SupervisionReportData> {
  const sb = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - windowDays);
  const sinceIso = since.toISOString();

  const [screenings, attendance, events, checkIns, fees] = await Promise.all([
    sb
      .from('screenings')
      .select('*')
      .eq('residency_id', residency.id)
      .gte('collected_at', sinceIso)
      .order('collected_at', { ascending: false }),
    sb
      .from('meeting_attendance')
      .select('id, status, meeting:meetings!inner(residence_id, starts_at)')
      .eq('person_id', residency.person_id)
      .eq('meeting.residence_id', residency.residence_id)
      .gte('meeting.starts_at', sinceIso),
    sb
      .from('service_events')
      .select('*')
      .eq('person_id', residency.person_id)
      .gte('started_at', sinceIso)
      .order('started_at', { ascending: false }),
    sb
      .from('check_ins')
      .select('id, created_at')
      .eq('person_id', residency.person_id)
      .gte('created_at', sinceIso),
    sb.from('fee_ledger').select('*').eq('residency_id', residency.id),
  ]);

  for (const r of [screenings, attendance, events, checkIns, fees]) {
    if (r.error) throw r.error;
  }

  const attendanceRows = (attendance.data ?? []) as { status: string }[];
  const checkInRows = (checkIns.data ?? []) as { created_at: string }[];
  const distinctCheckInDays = new Set(checkInRows.map((c) => c.created_at.slice(0, 10)));

  return {
    residency,
    screenings: screenings.data ?? [],
    meetingsAttended: attendanceRows.filter((a) => a.status === 'present').length,
    meetingsExpected: attendanceRows.length,
    serviceEvents: events.data ?? [],
    checkInDays: distinctCheckInDays.size,
    feeEntries: fees.data ?? [],
    feeBalanceOwed: feeBalance(fees.data ?? []),
    windowDays,
  };
}
