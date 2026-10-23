import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { DOCUMENT_ATTESTATION_STATEMENTS } from '@recoveryos/domain';
import { DocumentReviewPage } from './DocumentReviewPage';
const m = vi.hoisted(() => ({
  useStaff: vi.fn(),
  documentReviewApplicationContext: vi.fn(),
  listStaffDocumentReviews: vi.fn(),
  prepareApplicationDocumentReview: vi.fn(),
  recordDocumentPaperReview: vi.fn(),
  confirmDocumentExplanation: vi.fn(),
  documentWorkflowState: vi.fn(),
}));
vi.mock('../staffContext', () => ({ useStaff: m.useStaff }));
vi.mock('@recoveryos/data-access', () => m);
const item = {
  assignment_id: 901,
  person_id: 100,
  person_name: 'Synthetic Participant',
  document_name: 'Synthetic Paper Policy',
  template_key: 'synthetic',
  requires_signature: true,
  document_version_id: 91,
  version: '2',
  content_hash: 'paper-hash',
  body_markdown: '# Exact paper edition',
  state: { ok: true, current: true, clarification: null },
};
function mount() {
  return render(
    <MemoryRouter initialEntries={['/staff/document-review?application=800']}>
      <DocumentReviewPage />
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  m.useStaff.mockReturnValue({ residence: { id: 1 }, setResidenceId: vi.fn() });
  m.documentReviewApplicationContext.mockResolvedValue({ ok: true, residence_id: 1 });
  m.listStaffDocumentReviews.mockResolvedValue({ ok: true, items: [item] });
  m.documentWorkflowState.mockResolvedValue({ ok: true, current: true });
  m.recordDocumentPaperReview.mockResolvedValue({ ok: true });
});
it('scopes the queue to selected residence and application, with no automatic assignment writes', async () => {
  mount();
  await screen.findByRole('button', { name: 'Open document review' });
  expect(m.listStaffDocumentReviews).toHaveBeenCalledWith(1, 800);
  expect(m.prepareApplicationDocumentReview).not.toHaveBeenCalled();
  expect(m.recordDocumentPaperReview).not.toHaveBeenCalled();
});
it('requires all paper statements, full name, and separate witness confirmation', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Open document review' }));
  const b = screen.getByRole('button', { name: 'Record witnessed paper signature' });
  expect(b).toBeDisabled();
  DOCUMENT_ATTESTATION_STATEMENTS.forEach((s) => {
    expect(screen.getByLabelText(s.label)).not.toBeChecked();
    fireEvent.click(screen.getByLabelText(s.label));
  });
  fireEvent.change(screen.getByLabelText(/exactly as signed on paper/), {
    target: { value: 'Synthetic Participant' },
  });
  expect(b).toBeDisabled();
  fireEvent.click(screen.getByLabelText(/I witnessed this participant/));
  fireEvent.click(b);
  await waitFor(() =>
    expect(m.recordDocumentPaperReview).toHaveBeenCalledWith({
      assignmentId: 901,
      versionId: 91,
      contentHash: 'paper-hash',
      signatureName: 'Synthetic Participant',
      witnessConfirmed: true,
      attestations: {
        provided: true,
        received: true,
        read_or_explained: true,
        understood: true,
        questions: true,
      },
    }),
  );
});
it('paper acknowledgment requires no typed signature', async () => {
  m.listStaffDocumentReviews.mockResolvedValue({
    ok: true,
    items: [{ ...item, requires_signature: false }],
  });
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Open document review' }));
  expect(screen.queryByLabelText(/exactly as signed/)).not.toBeInTheDocument();
  DOCUMENT_ATTESTATION_STATEMENTS.forEach((s) => fireEvent.click(screen.getByLabelText(s.label)));
  fireEvent.click(screen.getByLabelText(/I witnessed this participant/));
  fireEvent.click(screen.getByRole('button', { name: 'Record witnessed paper acknowledgment' }));
  await waitFor(() => expect(m.recordDocumentPaperReview).toHaveBeenCalled());
  expect(m.recordDocumentPaperReview.mock.calls[0]![0]).not.toHaveProperty('signatureName');
});
it('question resolution needs explicit participant confirmation and never completes document', async () => {
  m.listStaffDocumentReviews.mockResolvedValue({
    ok: true,
    items: [
      {
        ...item,
        state: {
          ok: true,
          current: true,
          clarification: { question: 'Explain the fee', requested_at: '2026-10-23' },
        },
      },
    ],
  });
  m.confirmDocumentExplanation.mockResolvedValue({ ok: true });
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Open document review' }));
  const b = screen.getByRole('button', { name: 'Record participant’s explanation confirmation' });
  expect(b).toBeDisabled();
  fireEvent.click(screen.getByLabelText(/The participant confirmed/));
  fireEvent.click(b);
  await waitFor(() => expect(m.confirmDocumentExplanation).toHaveBeenCalledWith(901, true));
  expect(m.recordDocumentPaperReview).not.toHaveBeenCalled();
});
it('authorization refusal renders no participant document or completion button', async () => {
  m.listStaffDocumentReviews.mockResolvedValue({ ok: false, code: 'not_authorized' });
  mount();
  expect(await screen.findByText(/not available to your account/)).toBeInTheDocument();
  expect(screen.queryByText('Exact paper edition')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Open document review' })).not.toBeInTheDocument();
});

it('resolves the authorized application residence before querying its queue', async () => {
  const setResidenceId = vi.fn();
  m.useStaff.mockReturnValue({ residence: { id: 1 }, setResidenceId });
  m.documentReviewApplicationContext.mockResolvedValue({ ok: true, residence_id: 2 });
  mount();
  await screen.findByRole('button', { name: 'Open document review' });
  expect(setResidenceId).toHaveBeenCalledWith(2);
  expect(m.listStaffDocumentReviews).toHaveBeenCalledWith(2, 800);
  expect(m.listStaffDocumentReviews).not.toHaveBeenCalledWith(1, 800);
});
const paperReceipt = {
  assignment_id: 901,
  person_id: 100,
  document_version_id: 91,
  document_name: 'Synthetic Paper Policy',
  version: '2',
  content_hash: 'paper-hash',
  actor_person_id: 200,
  actor_name: 'Synthetic Staff',
  signature_name: 'Synthetic Participant',
  method: 'paper',
  recorded_at: '2026-10-23T21:00:00Z',
  legacy_record: false,
  statements: [...DOCUMENT_ATTESTATION_STATEMENTS],
};
it('renders saved paper receipts after a fresh page load', async () => {
  m.listStaffDocumentReviews.mockResolvedValue({
    ok: true,
    items: [{ ...item, state: { ok: true, receipt: paperReceipt } }],
  });
  mount();
  expect(await screen.findByText('Your receipt')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Print receipt' })).toBeInTheDocument();
});
it('keeps the successful paper receipt without depending on a follow-up read', async () => {
  m.recordDocumentPaperReview.mockResolvedValue({ ok: true, receipt: paperReceipt });
  m.documentWorkflowState.mockRejectedValue(new Error('network failed after commit'));
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Open document review' }));
  DOCUMENT_ATTESTATION_STATEMENTS.forEach((s) => fireEvent.click(screen.getByLabelText(s.label)));
  fireEvent.change(screen.getByLabelText(/exactly as signed on paper/), {
    target: { value: 'Synthetic Participant' },
  });
  fireEvent.click(screen.getByLabelText(/I witnessed this participant/));
  fireEvent.click(screen.getByRole('button', { name: 'Record witnessed paper signature' }));
  expect(await screen.findByText('Your receipt')).toBeInTheDocument();
  expect(m.documentWorkflowState).not.toHaveBeenCalled();
});

it('blocks another paper attempt until an uncertain result can be reconciled', async () => {
  m.recordDocumentPaperReview.mockRejectedValue(new Error('response lost'));
  m.documentWorkflowState.mockResolvedValue({ ok: false, code: 'not_authorized' });
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Open document review' }));
  DOCUMENT_ATTESTATION_STATEMENTS.forEach((s) => fireEvent.click(screen.getByLabelText(s.label)));
  fireEvent.change(screen.getByLabelText(/exactly as signed on paper/), {
    target: { value: 'Synthetic Participant' },
  });
  fireEvent.click(screen.getByLabelText(/I witnessed this participant/));
  fireEvent.click(screen.getByRole('button', { name: 'Record witnessed paper signature' }));
  expect(
    await screen.findByText(/Refresh document requests to load the saved record/),
  ).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Open document review' })).not.toBeInTheDocument();
});
