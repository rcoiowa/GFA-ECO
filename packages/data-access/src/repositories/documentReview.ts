import type { DocumentAttestations } from '@recoveryos/domain';
import { getSupabase } from '../client';

export interface DocumentReceiptRecord {
  assignment_id: number;
  document_version_id: number;
  document_name: string;
  version: string;
  content_hash: string;
  person_id: number;
  participant_name?: string;
  actor_person_id: number | null;
  actor_name: string | null;
  signature_name: string | null;
  method: string | null;
  recorded_at: string;
  legacy_record: boolean;
  statements: { key: string; label: string }[];
  electronic_consent_grant_id?: number | null;
}
export interface DocumentWorkflowState {
  ok: boolean;
  code?: string;
  assignment_id?: number;
  current?: boolean;
  receipt?: DocumentReceiptRecord | null;
  clarification?: { question: string | null; requested_at: string } | null;
}
async function call<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().rpc(name, args);
  if (error) throw error;
  if (!data) throw new Error('Empty document workflow response');
  return data as T;
}
export const documentWorkflowState = (assignmentId: number) =>
  call<DocumentWorkflowState>('document_workflow_state', { p_assignment_id: assignmentId });
export const listMyDocumentReviewStates = () =>
  call<DocumentWorkflowState[]>('list_my_document_review_states', {});
export const requestDocumentExplanation = (assignmentId: number, question: string) =>
  call<DocumentWorkflowState>('request_document_explanation', {
    p_assignment_id: assignmentId,
    p_question: question,
  });
export const confirmDocumentExplanation = (assignmentId: number, confirmed: boolean) =>
  call<DocumentWorkflowState>('confirm_document_explanation', {
    p_assignment_id: assignmentId,
    p_confirm: confirmed,
  });
export interface CompleteDocumentInput {
  assignmentId: number;
  versionId: number;
  contentHash: string;
  attestations: DocumentAttestations;
  signatureName?: string;
}
function completionArgs(input: CompleteDocumentInput) {
  return {
    p_assignment_id: input.assignmentId,
    p_expected_version_id: input.versionId,
    p_expected_hash: input.contentHash,
    p_attestations: input.attestations,
    p_signature_name: input.signatureName ?? null,
  };
}
export const completeDocumentReview = (input: CompleteDocumentInput) =>
  call<DocumentWorkflowState>('complete_document_review', completionArgs(input));
export const recordDocumentPaperReview = (
  input: CompleteDocumentInput & { witnessConfirmed: boolean },
) =>
  call<DocumentWorkflowState>('record_document_paper_review', {
    ...completionArgs(input),
    p_witness_confirmed: input.witnessConfirmed,
  });
export interface StaffDocumentReview {
  assignment_id: number;
  person_id: number;
  person_name: string;
  document_name: string;
  template_key: string;
  requires_signature: boolean;
  document_version_id: number;
  version: string;
  content_hash: string;
  body_markdown: string;
  state: DocumentWorkflowState;
}
export const listStaffDocumentReviews = (residenceId: number, applicationId?: number) =>
  call<{ ok: boolean; code?: string; items?: StaffDocumentReview[] }>(
    'list_staff_document_reviews',
    { p_residence_id: residenceId, p_application_id: applicationId ?? null },
  );
export const prepareApplicationDocumentReview = (applicationId: number) =>
  call<DocumentWorkflowState>('prepare_application_document_review', {
    p_application_id: applicationId,
  });
