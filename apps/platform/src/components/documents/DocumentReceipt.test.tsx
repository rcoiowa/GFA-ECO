import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DocumentReceipt, documentReceiptText } from './DocumentReceipt';
import { printDocumentText } from './printDocumentText';
vi.mock('./printDocumentText', () => ({ printDocumentText: vi.fn() }));
const r = {
  assignment_id: 12,
  document_version_id: 55,
  document_name: 'Synthetic Document',
  version: '2026-10-22.1',
  content_hash: 'exact-sha',
  person_id: 5,
  participant_name: 'Synthetic Participant',
  actor_person_id: 7,
  actor_name: 'Synthetic Witness',
  signature_name: 'Synthetic Participant',
  method: 'paper',
  recorded_at: '2026-10-23T20:00:00.123Z',
  legacy_record: false,
  statements: [{ key: 'provided', label: 'Provided exact text' }],
};
it('download and print use the exact server receipt, including actor, timestamp, hash and selected statements', () => {
  const create = vi.fn(() => 'blob:synthetic'),
    revoke = vi.fn();
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }));
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(<DocumentReceipt receipt={r} />);
  fireEvent.click(screen.getByRole('button', { name: 'Download receipt' }));
  expect(create).toHaveBeenCalledWith(expect.any(Blob));
  fireEvent.click(screen.getByRole('button', { name: 'Print receipt' }));
  expect(printDocumentText).toHaveBeenCalledWith(documentReceiptText(r));
  const text = documentReceiptText(r);
  [
    'exact-sha',
    'version',
    'Synthetic Witness',
    'person 7',
    '2026-10-23T20:00:00.123Z',
    '[x] Provided exact text',
  ].forEach((s) => expect(text.toLowerCase()).toContain(s.toLowerCase()));
  click.mockRestore();
  vi.unstubAllGlobals();
});
