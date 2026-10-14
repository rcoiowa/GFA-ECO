import { getSupabase } from '../client';

async function run(name: string, args: Record<string, unknown>): Promise<void> {
  const { data, error } = await getSupabase().rpc(name, args);
  if (error) throw error;
  const result = data as { ok?: boolean; code?: string; message?: string } | null;
  if (!result?.ok) throw new Error(result?.message ?? result?.code ?? 'Unable to save.');
}

export function reopenHousingApplication(
  applicationId: number,
  expectedStatus: string,
  reason: string,
) {
  return run('reopen_residence_application', {
    p_application_id: applicationId,
    p_expected_status: expectedStatus,
    p_reason: reason,
  });
}

export function setResidenceCapacity(
  residenceId: number,
  capacity: number,
  expectedCapacity: number | null,
) {
  return run('set_residence_capacity', {
    p_residence_id: residenceId,
    p_capacity: capacity,
    p_expected_capacity: expectedCapacity,
  });
}

export function addResidenceRoomBeds(
  residenceId: number,
  unitName: string,
  roomName: string,
  bedCount: number,
) {
  return run('add_residence_room_beds', {
    p_residence_id: residenceId,
    p_unit_name: unitName,
    p_room_name: roomName,
    p_bed_count: bedCount,
  });
}
