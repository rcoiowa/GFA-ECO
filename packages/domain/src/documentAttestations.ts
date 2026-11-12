/** Versioned wording is also pinned by the document-completion RPC and receipt. */
export const DOCUMENT_ATTESTATION_STATEMENTS = [
  { key: 'provided', label: 'This document has been provided to me and I can access it.' },
  { key: 'received', label: 'I have received this document.' },
  {
    key: 'read_or_explained',
    label: 'I have read this document, or it has been read and explained to me.',
  },
  { key: 'understood', label: 'I understand this document.' },
  { key: 'questions', label: 'I have had an opportunity to ask questions and receive answers.' },
] as const;

export type DocumentAttestationKey = (typeof DOCUMENT_ATTESTATION_STATEMENTS)[number]['key'];
export type DocumentAttestations = Record<DocumentAttestationKey, boolean>;

export function emptyDocumentAttestations(): DocumentAttestations {
  return {
    provided: false,
    received: false,
    read_or_explained: false,
    understood: false,
    questions: false,
  };
}

export function allDocumentAttestationsSelected(value: DocumentAttestations): boolean {
  return DOCUMENT_ATTESTATION_STATEMENTS.every(({ key }) => value[key] === true);
}
