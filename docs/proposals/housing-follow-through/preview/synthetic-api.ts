// Aliased ONLY by the separate synthetic localhost harness. Never contacts Supabase.
export const getAdminOperationsSummary = async () => ({ ok: true });
export const adminListResidences = async () => [{ id: 9010 }];
export const listApplicationIntake = async () => [
  {
    id: 9100,
    residence_id: 9010,
    status: 'converted',
    converted_person_id: 9050,
    converted_application_id: 9500,
  },
];
export const listResidenceRoster = async () => [{ person_id: 9050 }];
export const useAuth = () => ({ person: { id: 9001 } });
export const loadCollaborationWorkspace = async () => {
  const response = await fetch('/__synthetic/workspace');
  if (!response.ok) throw new Error('Synthetic persistence unavailable');
  return response.json();
};
export const saveCollaborationWorkspace = async (
  _residence: number,
  version: number,
  document: unknown,
) => {
  const response = await fetch('/__synthetic/workspace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version, document }),
  });
  if (!response.ok) throw new Error('Synthetic persistence unavailable or stale revision; reload.');
  return response.json();
};
