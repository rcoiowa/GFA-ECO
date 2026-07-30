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

  const { data: assignments, error: assignError } = await sb
    .from('bed_assignments')
    .select('*, residency:residencies(*, person:people(*))')
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

export async function assignBed(input: {
  residencyId: number;
  bedId: number;
}): Promise<BedAssignment> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('bed_assignments')
    .insert({ residency_id: input.residencyId, bed_id: input.bedId })
    .select()
    .single();
  if (error) throw error;
  await sb.from('residencies').update({ bed_assignment_id: data.id }).eq('id', input.residencyId);
  return data;
}

export async function releaseBed(assignmentId: number): Promise<void> {
  const { error } = await getSupabase()
    .from('bed_assignments')
    .update({ released_at: new Date().toISOString() })
    .eq('id', assignmentId);
  if (error) throw error;
}

// Applications / waitlist --------------------------------------------------

export type ApplicationWithPerson = ResidenceApplication & { person: Person };

export async function listApplications(residenceId: number): Promise<ApplicationWithPerson[]> {
  const { data, error } = await getSupabase()
    .from('residence_applications')
    .select('*, person:people(*)')
    .eq('residence_id', residenceId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Decide an application; approving also opens the residency record. */
export async function decideApplication(input: {
  application: ResidenceApplication;
  status: 'in_review' | 'approved' | 'waitlisted' | 'declined';
  decidedByPersonId: number;
  notes?: string;
}): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from('residence_applications')
    .update({
      status: input.status,
      decided_at: new Date().toISOString(),
      decided_by_person_id: input.decidedByPersonId,
      notes: input.notes ?? input.application.notes,
    })
    .eq('id', input.application.id);
  if (error) throw error;

  if (input.status === 'approved') {
    const { error: resError } = await sb.from('residencies').insert({
      person_id: input.application.person_id,
      residence_id: input.application.residence_id,
      residency_status: 'approved',
    });
    if (resError && resError.code !== '23505') throw resError; // ignore existing live residency
  }
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

export async function decidePass(input: {
  passId: number;
  status: 'approved' | 'denied';
  decidedByPersonId: number;
}): Promise<void> {
  const { error } = await getSupabase()
    .from('passes')
    .update({ status: input.status, decided_by_person_id: input.decidedByPersonId })
    .eq('id', input.passId);
  if (error) throw error;
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
