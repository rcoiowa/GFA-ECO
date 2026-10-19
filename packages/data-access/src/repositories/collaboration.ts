import { getSupabase } from '../client';

export interface CollaborationDocument {
  brief: string;
  notes: string;
  intakeId: number | null;
  batches: unknown[];
}
export interface CollaborationWorkspaceRecord {
  version: number;
  document: CollaborationDocument;
  saved_at: string | null;
  audit: { version: number; actor_person_id: number; saved_at: string }[];
}
const unavailable = () =>
  new Error(
    'Persistence unavailable. Draft was not confirmed saved. Reload server state before retrying; no browser storage is used.',
  );
export async function loadCollaborationWorkspace(
  residenceId: number,
): Promise<CollaborationWorkspaceRecord> {
  const { data, error } = await getSupabase().rpc('read_admin_collaboration_workspace', {
    p_residence_id: residenceId,
  });
  if (error || !data?.ok) throw unavailable();
  return data.workspace as CollaborationWorkspaceRecord;
}
export async function saveCollaborationWorkspace(
  residenceId: number,
  version: number,
  document: CollaborationDocument,
): Promise<CollaborationWorkspaceRecord> {
  const { data, error } = await getSupabase().rpc('save_admin_collaboration_workspace', {
    p_residence_id: residenceId,
    p_version: version,
    p_document: document,
  });
  if (error || !data?.ok) {
    if (data?.code === 'stale_version')
      throw new Error(
        'Another session saved this workspace. Reload server state before retrying; your changes were not saved.',
      );
    throw unavailable();
  }
  return data.workspace as CollaborationWorkspaceRecord;
}
