import type { DocumentAssignment, DocumentTemplate, DocumentVersion } from '@recoveryos/domain';
import { getSupabase } from '../client';

export type AssignmentWithDocument = DocumentAssignment & {
  document_version: DocumentVersion & { template: DocumentTemplate };
};

/**
 * Make sure the current resident has assignments for every required
 * document, then return all of their assignments (pending + signed).
 * Server-side RPC keeps assignment logic in one place.
 */
export async function ensureMyDocumentAssignments(): Promise<DocumentAssignment[]> {
  const { data, error } = await getSupabase().rpc('ensure_my_document_assignments');
  if (error) throw error;
  return data ?? [];
}

/** The person's assignments joined with document bodies for display. */
export async function listMyDocumentAssignments(
  personId: number,
): Promise<AssignmentWithDocument[]> {
  const { data, error } = await getSupabase()
    .from('document_assignments')
    .select('*, document_version:document_versions(*, template:document_templates(*))')
    .eq('person_id', personId)
    .order('assigned_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Sign/acknowledge a pending assignment through the audited RPC (Gate B1):
 * the server pins the exact document version + content hash into the audit
 * trail, distinguishes acknowledgment from signature, and only ever acts on
 * the person's own unacknowledged assignment. (The legacy direct-update path
 * is retired in Gate B6.)
 */
export async function acknowledgeDocumentAssignment(input: {
  assignmentId: number;
  signatureName?: string;
}): Promise<{ ok: boolean; code?: string; content_hash?: string }> {
  const { data, error } = await getSupabase().rpc('acknowledge_document', {
    p_assignment_id: input.assignmentId,
    p_signature_name: input.signatureName ?? null,
  });
  if (error) throw error;
  return (data as { ok: boolean; code?: string; content_hash?: string }) ?? { ok: false, code: 'empty' };
}
