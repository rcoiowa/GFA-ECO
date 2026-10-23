export function documentReviewMessage(code?: string): string {
  const messages: Record<string, string> = {
    attestations_required: 'Select each statement only when it is true for you.',
    explanation_pending:
      'Please receive an explanation and confirm your questions were answered before completing this document.',
    electronic_consent_required:
      'Electronic-records consent is needed for electronic signing. You can choose paper with staff.',
    signature_name_required: 'Enter your full name as your signature.',
    signature_not_required: 'This document requires acknowledgment only.',
    witness_required: 'Confirm that you witnessed the participant’s paper review.',
    document_changed:
      'The document version could not be verified. Reload and review the current document.',
    not_pending_current:
      'This is not a current pending document. Return to Documents to find the applicable edition.',
    not_authorized: 'This document action is not available to your account.',
    application_not_approved:
      'Documents are available after application approval or active residency.',
  };
  return (
    messages[code ?? ''] ??
    'The action could not be confirmed. Reload to check the saved record before trying again.'
  );
}
