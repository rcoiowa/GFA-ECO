import type {
  BedAssignment,
  FeeLedgerEntry,
  Incident,
  IowaChecklistItem,
  IowaChecklistStatus,
  NarrCompliance,
  NarrStandard,
  Pass,
  Person,
  Residence,
  ResidenceApplication,
  ResidenceBed,
  ResidenceRoom,
  ResidenceUnit,
  Residency,
  ResidencyPhase,
  Screening,
} from '@recoveryos/domain';
import { getSupabase } from '../client';

/**
 * Room 1 — Operator Dashboard data access. Every call here is bounded by
 * the staff RLS policies (staff_residence_ids()); nothing leaks past the
 * residences where the person holds an unrevoked staff/manager role.
 */

/** Residences where the current person holds a staff or manager role. */
export async function listMyStaffResidences(personId: number): Promise<Residence[]> {
  const { data: roles, error } = await getSupabase()
    .from('role_assignments')
    .select('residence_id')
    .eq('person_id', personId)
    .in('role_key', ['residence_staff', 'residence_manager'])
    .is('revoked_at', null)
    .not('residence_id', 'is', null);
  if (error) throw error;
  const ids = [...new Set((roles ?? []).map((r: { residence_id: number }) => r.residence_id))];
  if (ids.length === 0) return [];
  const { data, error: resError } = await getSupabase()
    .from('residences')
    .select('*')
    .in('id', ids)
    .order('name');
  if (resError) throw resError;
  return data ?? [];
}

export type RosterEntry = Residency & { person: Person };

/** Active roster (residents currently living in the residence). */
export async function listResidenceRoster(residenceId: number): Promise<RosterEntry[]> {
  const { data, error } = await getSupabase()
    .from('residencies')
    .select('*, person:people(*)')
    .eq('residence_id', residenceId)
    .in('residency_status', ['approved', 'active', 'on_pass', 'transitioning'])
    .order('admission_date');
  if (error) throw error;
  return data ?? [];
}

export type BedBoardRoom = ResidenceRoom & { unit: ResidenceUnit; beds: ResidenceBed[] };

/** All units/rooms/beds for the residence (staff RLS). */
export async function getBedBoard(residenceId: number): Promise<{
  rooms: BedBoardRoom[];
  activeAssignments: (BedAssignment & { residency: Residency & { person: Person } })[];
}> {
  const sb = getSupabase();
  const { data: units, error: unitsError } = await sb
    .from('residence_units')
    .select('*, rooms:residence_rooms(*, beds:residence_beds(*))')
    .eq('residence_id', residenceId)
    .order('name');
  if (unitsError) throw unitsError;

  // bed_assignments and residencies reference each other (residencies also
  // carries bed_assignment_id), so the embed must name the foreign key or
  // PostgREST rejects it as ambiguous.
  const { data: assignments, error: assignError } = await sb
    .from('bed_assignments')
    .select('*, residency:residencies!bed_assignments_residency_id_fkey(*, person:people(*))')
    .is('released_at', null);
  if (assignError) throw assignError;

  const rooms: BedBoardRoom[] = (units ?? []).flatMap(
    (u: ResidenceUnit & { rooms: (ResidenceRoom & { beds: ResidenceBed[] })[] }) =>
      (u.rooms ?? []).map((r) => ({ ...r, unit: u, beds: r.beds ?? [] })),
  );
  const inResidence = new Set(rooms.flatMap((r) => r.beds.map((b) => b.id)));
  return {
    rooms,
    activeAssignments: (assignments ?? []).filter(
      (a: BedAssignment & { residency: Residency & { person: Person } }) =>
        inResidence.has(a.bed_id),
    ),
  };
}

/**
 * P4F: bed operations are server-authoritative RPCs — residence-scoped staff,
 * database uniqueness as the race arbiter, transfer history preserved, audited.
 */
export async function assignBed(input: { residencyId: number; bedId: number }): Promise<void> {
  const { data, error } = await getSupabase().rpc('assign_bed', {
    p_residency_id: input.residencyId,
    p_bed_id: input.bedId,
  });
  if (error) throw error;
  const result = data as { ok?: boolean; code?: string; message?: string } | null;
  if (!result?.ok) throw new Error(result?.message ?? String(result?.code ?? 'assign_failed'));
}

export async function releaseBed(assignmentId: number): Promise<void> {
  const { data, error } = await getSupabase().rpc('release_bed', { p_assignment_id: assignmentId });
  if (error) throw error;
  const result = data as { ok?: boolean; code?: string } | null;
  if (!result?.ok) throw new Error(String(result?.code ?? 'release_failed'));
}

// Applications / waitlist --------------------------------------------------

export type ApplicationWithPerson = ResidenceApplication & { person: Person };

export async function listApplications(residenceId: number): Promise<ApplicationWithPerson[]> {
  // residence_applications has two foreign keys to people (the applicant and
  // the staff member who decided), so name the one we mean.
  const { data, error } = await getSupabase()
    .from('residence_applications')
    .select('*, person:people!residence_applications_person_id_fkey(*)')
    .eq('residence_id', residenceId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * P4F: decisions go through review_residence_application — the server derives
 * the decider, enforces legal transitions, and requires residence-manager
 * authority for terminal decisions. B5A: approval is ONLY approval — it
 * unlocks the intake checklist; the residency is opened later by the separate,
 * deliberate move-in action (admitApplicant), readiness-gated on the server.
 * `decidedByPersonId` is retained for signature compatibility but ignored —
 * identity is never client-supplied.
 */
export async function decideApplication(input: {
  application: ResidenceApplication;
  status: 'in_review' | 'approved' | 'waitlisted' | 'declined';
  decidedByPersonId?: number;
  notes?: string;
}): Promise<void> {
  const { data, error } = await getSupabase().rpc('review_residence_application', {
    p_application_id: input.application.id,
    p_decision: input.status,
    p_note: input.notes ?? null,
  });
  if (error) throw error;
  const result = data as { ok?: boolean; code?: string; message?: string } | null;
  if (!result?.ok) throw new Error(result?.message ?? String(result?.code ?? 'review_failed'));
}

// Screenings ---------------------------------------------------------------

export async function listScreenings(residencyIds: number[]): Promise<Screening[]> {
  if (residencyIds.length === 0) return [];
  const { data, error } = await getSupabase()
    .from('screenings')
    .select('*')
    .in('residency_id', residencyIds)
    .order('collected_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function recordScreening(input: {
  residencyId: number;
  screeningType: string;
  result: string;
  recordedByPersonId: number;
}): Promise<Screening> {
  const { data, error } = await getSupabase()
    .from('screenings')
    .insert({
      residency_id: input.residencyId,
      screening_type: input.screeningType,
      result: input.result,
      recorded_by_person_id: input.recordedByPersonId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Incidents ----------------------------------------------------------------

export async function listIncidents(residenceId: number): Promise<Incident[]> {
  const { data, error } = await getSupabase()
    .from('incidents')
    .select('*')
    .eq('residence_id', residenceId)
    .order('occurred_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function reportIncident(input: {
  residenceId: number;
  residencyId: number | null;
  category: string;
  severity: number;
  summary: string;
  reportedByPersonId: number;
}): Promise<Incident> {
  const { data, error } = await getSupabase()
    .from('incidents')
    .insert({
      residence_id: input.residenceId,
      residency_id: input.residencyId,
      occurred_at: new Date().toISOString(),
      category: input.category,
      severity: input.severity,
      summary: input.summary,
      reported_by_person_id: input.reportedByPersonId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Passes -------------------------------------------------------------------

export async function listPendingPasses(
  residenceId: number,
): Promise<(Pass & { residency: Residency & { person: Person } })[]> {
  const { data, error } = await getSupabase()
    .from('passes')
    .select('*, residency:residencies!inner(*, person:people(*))')
    .eq('residency.residence_id', residenceId)
    .eq('status', 'requested')
    .order('starts_at');
  if (error) throw error;
  return data ?? [];
}

/** P4F: pass decisions are RPC-only; the server derives the decider identity. */
export async function decidePass(input: {
  passId: number;
  status: 'approved' | 'denied';
  decidedByPersonId?: number;
}): Promise<void> {
  const { data, error } = await getSupabase().rpc('decide_pass', {
    p_pass_id: input.passId,
    p_decision: input.status,
  });
  if (error) throw error;
  const result = data as { ok?: boolean; code?: string; message?: string } | null;
  if (!result?.ok) throw new Error(result?.message ?? String(result?.code ?? 'decide_failed'));
}

/**
 * Passes that are out the door and not yet back: approved or active. Recording
 * the return (below) is what makes `returned`/`overdue` reachable states.
 */
export async function listOpenPasses(
  residenceId: number,
): Promise<(Pass & { residency: Residency & { person: Person } })[]> {
  const { data, error } = await getSupabase()
    .from('passes')
    .select('*, residency:residencies!inner(*, person:people(*))')
    .eq('residency.residence_id', residenceId)
    .in('status', ['approved', 'active'])
    .order('ends_at');
  if (error) throw error;
  return data ?? [];
}

/** P0.5-A: record a pass return (RPC `record_pass_return`, 0115) — closes the pass loop. */
export async function recordPassReturn(passId: number): Promise<void> {
  const { data, error } = await getSupabase().rpc('record_pass_return', { p_pass_id: passId });
  if (error) throw error;
  const result = data as { ok?: boolean; code?: string; message?: string } | null;
  if (!result?.ok) throw new Error(result?.message ?? String(result?.code ?? 'return_failed'));
}

/**
 * P0.5-A: review an incident (RPC `review_incident`, 0115). Records the
 * reviewer + timestamp and an optional follow-up line; the report itself stays
 * append-only. This is what clears "waiting for review" on Staff Today.
 */
export async function reviewIncident(incidentId: number, followUp?: string): Promise<void> {
  const { data, error } = await getSupabase().rpc('review_incident', {
    p_incident_id: incidentId,
    p_follow_up: followUp?.trim() || null,
  });
  if (error) throw error;
  const result = data as { ok?: boolean; code?: string; message?: string } | null;
  if (!result?.ok) throw new Error(result?.message ?? String(result?.code ?? 'review_failed'));
}

/**
 * P0.5-A: end a residency (RPC `discharge_residency`, 0115 — manager-gated
 * server-side). Releases the bed, revokes the resident role, and ends the
 * residence-support designation; history is preserved, never deleted.
 */
export async function dischargeResidency(input: {
  residencyId: number;
  status: 'exited' | 'discharged' | 'transitioning';
  reason?: string;
}): Promise<void> {
  const { data, error } = await getSupabase().rpc('discharge_residency', {
    p_residency_id: input.residencyId,
    p_status: input.status,
    p_reason: input.reason?.trim() || null,
  });
  if (error) throw error;
  const result = data as { ok?: boolean; code?: string; message?: string } | null;
  if (!result?.ok) throw new Error(result?.message ?? String(result?.code ?? 'discharge_failed'));
}

// Compliance ---------------------------------------------------------------

export async function getNarrTracker(residenceId: number): Promise<{
  standards: NarrStandard[];
  statuses: NarrCompliance[];
}> {
  const sb = getSupabase();
  const [{ data: standards, error: e1 }, { data: statuses, error: e2 }] = await Promise.all([
    sb.from('narr_standards').select('*').order('sort'),
    sb.from('narr_compliance').select('*').eq('residence_id', residenceId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { standards: standards ?? [], statuses: statuses ?? [] };
}

export async function setNarrStatus(input: {
  residenceId: number;
  standardId: number;
  status: NarrCompliance['status'];
  evidence: string | null;
  verifiedByPersonId: number;
}): Promise<void> {
  const { error } = await getSupabase().from('narr_compliance').upsert(
    {
      residence_id: input.residenceId,
      standard_id: input.standardId,
      status: input.status,
      evidence: input.evidence,
      verified_by_person_id: input.verifiedByPersonId,
      verified_at: new Date().toISOString(),
    },
    { onConflict: 'residence_id,standard_id' },
  );
  if (error) throw error;
}

export async function getIowaTracker(residenceId: number): Promise<{
  items: IowaChecklistItem[];
  statuses: IowaChecklistStatus[];
}> {
  const sb = getSupabase();
  const [{ data: items, error: e1 }, { data: statuses, error: e2 }] = await Promise.all([
    sb.from('iowa_checklist_items').select('*').order('item_no'),
    sb.from('iowa_checklist_status').select('*').eq('residence_id', residenceId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { items: items ?? [], statuses: statuses ?? [] };
}

export async function setIowaStatus(input: {
  residenceId: number;
  itemId: number;
  status: IowaChecklistStatus['status'];
  evidence: string | null;
  verifiedByPersonId: number;
}): Promise<void> {
  const { error } = await getSupabase().from('iowa_checklist_status').upsert(
    {
      residence_id: input.residenceId,
      item_id: input.itemId,
      status: input.status,
      evidence: input.evidence,
      verified_by_person_id: input.verifiedByPersonId,
      verified_at: new Date().toISOString(),
    },
    { onConflict: 'residence_id,item_id' },
  );
  if (error) throw error;
}

// Fees ---------------------------------------------------------------------

export async function listFeeLedger(residencyId: number): Promise<FeeLedgerEntry[]> {
  const { data, error } = await getSupabase()
    .from('fee_ledger')
    .select('*')
    .eq('residency_id', residencyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Balance owed = charges − payments − adjustments − refunds. */
export function feeBalance(entries: FeeLedgerEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.entry_type === 'charge' ? e.amount : -e.amount), 0);
}

export async function addFeeEntry(input: {
  residencyId: number;
  entryType: FeeLedgerEntry['entry_type'];
  amount: number;
  method?: string;
  note?: string;
  recordedByPersonId: number;
}): Promise<FeeLedgerEntry> {
  const { data, error } = await getSupabase()
    .from('fee_ledger')
    .insert({
      residency_id: input.residencyId,
      entry_type: input.entryType,
      amount: input.amount,
      method: input.method ?? null,
      note: input.note ?? null,
      recorded_by_person_id: input.recordedByPersonId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Phases -------------------------------------------------------------------

export async function getLatestPhaseOverride(residencyId: number): Promise<ResidencyPhase | null> {
  const { data, error } = await getSupabase()
    .from('residency_phases')
    .select('*')
    .eq('residency_id', residencyId)
    .order('started_on', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function recordPhase(input: {
  residencyId: number;
  phase: number;
  note?: string;
  recordedByPersonId: number;
}): Promise<ResidencyPhase> {
  const { data, error } = await getSupabase()
    .from('residency_phases')
    .insert({
      residency_id: input.residencyId,
      phase: input.phase,
      note: input.note ?? null,
      recorded_by_person_id: input.recordedByPersonId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
