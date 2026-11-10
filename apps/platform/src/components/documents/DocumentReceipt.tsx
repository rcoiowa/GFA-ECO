import { printDocumentText } from './printDocumentText';
import type { DocumentReceiptRecord } from '@recoveryos/data-access';
import { Button, Card } from '@recoveryos/ui';
export function documentReceiptText(r: DocumentReceiptRecord): string {
  return [
    r.legacy_record ? 'Existing recorded document completion' : 'Document review receipt',
    r.document_name,
    `Assignment: ${r.assignment_id}`,
    `Version: ${r.version} (ID ${r.document_version_id})`,
    `SHA-256: ${r.content_hash}`,
    `Participant: ${r.participant_name ?? 'Name not recorded in receipt'} (person ${r.person_id})`,
    `Recorded actor: ${r.actor_name ?? 'Not recorded'}${r.actor_person_id == null ? '' : ` (person ${r.actor_person_id})`}`,
    `Signature: ${r.signature_name ?? 'No signature recorded'}`,
    `Method: ${r.method ?? 'Not recorded'}`,
    `Server timestamp: ${r.recorded_at}`,
    ...(r.electronic_consent_grant_id
      ? [`Electronic-records consent record: ${r.electronic_consent_grant_id}`]
      : []),
    r.legacy_record
      ? 'Checkbox statements were not recorded for this historical completion.'
      : 'Selected statements:',
    ...r.statements.map((s) => `[x] ${s.label}`),
    '',
  ].join('\n');
}
export function DocumentReceipt({ receipt }: { receipt: DocumentReceiptRecord }) {
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([documentReceiptText(receipt)], { type: 'text/plain;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-receipt-${receipt.assignment_id}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold">
        {receipt.legacy_record ? 'Existing recorded completion' : 'Your receipt'}
      </h2>
      <pre className="whitespace-pre-wrap break-all font-sans text-sm">
        {documentReceiptText(receipt)}
      </pre>
      <div className="mt-3 flex flex-wrap gap-3 print:hidden">
        <Button onClick={download}>Download receipt</Button>
        <Button variant="secondary" onClick={() => printDocumentText(documentReceiptText(receipt))}>
          Print receipt
        </Button>
      </div>
    </Card>
  );
}
