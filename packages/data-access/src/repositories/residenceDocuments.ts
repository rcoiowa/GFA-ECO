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
 * Sign/acknowledge a pending assignment. The typed signature name is the
 * resident's e-signature; RLS only permits this on the person's own
 * unacknowledged rows.
 */
export async function acknowledgeDocumentAssignment(input: {
  assignmentId: number;
  signatureName: string;
}): Promise<DocumentAssignment> {
  const { data, error } = await getSupabase()
    .from('document_assignments')
    .update({
      acknowledged_at: new Date().toISOString(),
      signature_name: input.signatureName,
    })
    .eq('id', input.assignmentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
