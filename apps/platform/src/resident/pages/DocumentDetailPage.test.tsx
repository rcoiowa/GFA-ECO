import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { DOCUMENT_ATTESTATION_STATEMENTS } from '@recoveryos/domain';
import { DocumentDetailPage } from './DocumentDetailPage';
const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  ensureMyDocumentAssignments: vi.fn(),
  listMyDocumentAssignments: vi.fn(),
  hasElectronicRecordsConsent: vi.fn(),
  completeDocumentReview: vi.fn(),
  documentWorkflowState: vi.fn(),
  recordResidenceConsentGrant: vi.fn(),
  requestDocumentExplanation: vi.fn(),
  confirmDocumentExplanation: vi.fn(),
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@recoveryos/data-access', () => mocks);
const assignment = {
  id: 501,
  person_id: 144,
  acknowledged_at: null,
  document_version: {
    id: 90,
    version: '2026-10-22.1',
    published_at: '2026-10-23',
    content_hash: 'exact-synthetic-hash',
    body_markdown: '# Exact assigned text\n\n| Phase | Time |\n| --- | --- |\n| One | 9 PM |',
    template: { key: 'synthetic_policy', name: 'Synthetic Policy', requires_signature: true },
  },
};
const receipt = {
  assignment_id: 501,
  person_id: 144,
  document_version_id: 90,
  document_name: 'Synthetic Policy',
  version: '2026-10-22.1',
  content_hash: 'exact-synthetic-hash',
  recorded_at: '2026-10-23T20:00:00Z',
  actor_person_id: 144,
  actor_name: 'Synthetic Person',
  participant_name: 'Synthetic Person',
  signature_name: 'Synthetic Person',
  method: 'electronic',
  legacy_record: false,
  statements: [...DOCUMENT_ATTESTATION_STATEMENTS],
};
function renderAt(base = '/residence', suffix = 'synthetic_policy') {
  return render(
    <MemoryRouter initialEntries={[`${base}/documents/${suffix}`]}>
      <Routes>
        <Route
          path={`${base}/documents/:key`}
          element={<DocumentDetailPage basePath={base} assignedOnly={base === '/my-housing'} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}
function selectStatements() {
  DOCUMENT_ATTESTATION_STATEMENTS.forEach((s) => fireEvent.click(screen.getByLabelText(s.label)));
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.useAuth.mockReturnValue({
    person: { id: 144, first_name: 'Synthetic', last_name: 'Person' },
  });
  mocks.listMyDocumentAssignments.mockResolvedValue([assignment]);
  mocks.ensureMyDocumentAssignments.mockResolvedValue([]);
  mocks.hasElectronicRecordsConsent.mockResolvedValue(true);
  mocks.documentWorkflowState.mockResolvedValue({
    ok: true,
    current: true,
    receipt: null,
    clarification: null,
  });
  mocks.completeDocumentReview.mockResolvedValue({ ok: true });
});
describe('explicit document review', () => {
  it.each(['/residence', '/my-housing'])(
    'shows exact assigned body/table with unchecked statements at %s',
    async (base) => {
      renderAt(base);
      const button = await screen.findByRole('button', { name: 'Sign Synthetic Policy' });
      expect(button).toBeDisabled();
      expect(screen.getByRole('table')).toHaveTextContent('9 PM');
      DOCUMENT_ATTESTATION_STATEMENTS.forEach((s) =>
        expect(screen.getByLabelText(s.label)).not.toBeChecked(),
      );
      expect(mocks.completeDocumentReview).not.toHaveBeenCalled();
    },
  );
  it('requires each statement and typed name, then submits the pinned version/hash', async () => {
    renderAt();
    const button = await screen.findByRole('button', { name: 'Sign Synthetic Policy' });
    fireEvent.change(screen.getByLabelText(/Type your full name/), {
      target: { value: 'Synthetic Person' },
    });
    DOCUMENT_ATTESTATION_STATEMENTS.slice(0, 4).forEach((s) =>
      fireEvent.click(screen.getByLabelText(s.label)),
    );
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByLabelText(DOCUMENT_ATTESTATION_STATEMENTS[4]!.label));
    mocks.documentWorkflowState.mockResolvedValue({ ok: true, current: true, receipt });
    fireEvent.click(button);
    await waitFor(() =>
      expect(mocks.completeDocumentReview).toHaveBeenCalledWith({
        assignmentId: 501,
        versionId: 90,
        contentHash: 'exact-synthetic-hash',
        signatureName: 'Synthetic Person',
        attestations: {
          provided: true,
          received: true,
          read_or_explained: true,
          understood: true,
          questions: true,
        },
      }),
    );
    expect(await screen.findByText('Your receipt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download receipt' })).toBeInTheDocument();
    expect(screen.getByText(/Server timestamp: 2026-10-23T20:00:00Z/)).toBeInTheDocument();
  });
  it('acknowledgment-only has no typed signature or e-consent requirement', async () => {
    mocks.hasElectronicRecordsConsent.mockResolvedValue(false);
    mocks.listMyDocumentAssignments.mockResolvedValue([
      {
        ...assignment,
        document_version: {
          ...assignment.document_version,
          template: { ...assignment.document_version.template, requires_signature: false },
        },
      },
    ]);
    renderAt();
    const b = await screen.findByRole('button', { name: 'Acknowledge this document' });
    expect(b).toBeDisabled();
    selectStatements();
    fireEvent.click(b);
    await waitFor(() => expect(mocks.completeDocumentReview).toHaveBeenCalled());
    expect(mocks.completeDocumentReview.mock.calls[0]![0]).not.toHaveProperty('signatureName');
    expect(screen.queryByLabelText(/Type your full name/)).not.toBeInTheDocument();
    expect(mocks.recordResidenceConsentGrant).not.toHaveBeenCalled();
  });
  it('electronic consent is a separate affirmative action and resets statements', async () => {
    mocks.hasElectronicRecordsConsent.mockResolvedValue(false);
    mocks.recordResidenceConsentGrant.mockResolvedValue({ ok: true });
    renderAt();
    const b = await screen.findByRole('button', {
      name: 'I agree to use electronic records and signatures',
    });
    expect(mocks.recordResidenceConsentGrant).not.toHaveBeenCalled();
    selectStatements();
    fireEvent.click(b);
    expect(await screen.findByRole('button', { name: 'Sign Synthetic Policy' })).toBeDisabled();
    expect(mocks.recordResidenceConsentGrant).toHaveBeenCalledWith({
      personId: 144,
      typeKey: 'electronic_records',
    });
  });
  it('explanation request blocks completion while preserving support access', async () => {
    renderAt();
    fireEvent.click(await screen.findByRole('button', { name: 'I need an explanation' }));
    expect(mocks.requestDocumentExplanation).not.toHaveBeenCalled();
    mocks.requestDocumentExplanation.mockResolvedValue({ ok: true });
    mocks.documentWorkflowState.mockResolvedValue({
      ok: true,
      current: true,
      clarification: { question: 'Explain', requested_at: '2026-10-23' },
    });
    fireEvent.change(screen.getByLabelText(/What would you like explained/), {
      target: { value: 'Explain' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Send explanation request to housing staff' }),
    );
    await waitFor(() =>
      expect(mocks.requestDocumentExplanation).toHaveBeenCalledWith(501, 'Explain'),
    );
    expect(
      await screen.findByRole('button', { name: 'Confirm explanation received' }),
    ).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Sign Synthetic Policy' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Access general recovery support' })).toHaveAttribute(
      'href',
      '/support',
    );
  });
  it('explanation confirmation never completes or prechecks statements', async () => {
    mocks.documentWorkflowState.mockResolvedValue({
      ok: true,
      current: true,
      clarification: { question: null, requested_at: '2026-10-23' },
    });
    mocks.confirmDocumentExplanation.mockResolvedValue({ ok: true });
    renderAt();
    const b = await screen.findByRole('button', { name: 'Confirm explanation received' });
    fireEvent.click(
      screen.getByLabelText('I received an explanation and my questions were answered.'),
    );
    mocks.documentWorkflowState.mockResolvedValue({ ok: true, current: true });
    fireEvent.click(b);
    expect(await screen.findByRole('button', { name: 'Sign Synthetic Policy' })).toBeDisabled();
    expect(mocks.completeDocumentReview).not.toHaveBeenCalled();
  });
  it('uncertain network outcome is reconciled to saved server receipt', async () => {
    mocks.completeDocumentReview.mockRejectedValue(new Error('network lost'));
    renderAt();
    const b = await screen.findByRole('button', { name: 'Sign Synthetic Policy' });
    selectStatements();
    fireEvent.change(screen.getByLabelText(/Type your full name/), {
      target: { value: 'Synthetic Person' },
    });
    mocks.documentWorkflowState.mockResolvedValue({ ok: true, receipt });
    fireEvent.click(b);
    expect(await screen.findByText('Your receipt')).toBeInTheDocument();
    expect(mocks.completeDocumentReview).toHaveBeenCalledTimes(1);
  });
  it('historical completions never invent new statements', async () => {
    mocks.documentWorkflowState.mockResolvedValue({
      ok: true,
      current: true,
      receipt: {
        ...receipt,
        legacy_record: true,
        statements: [],
        actor_person_id: null,
        actor_name: null,
      },
    });
    renderAt();
    expect(
      await screen.findByRole('heading', { name: 'Existing recorded completion' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Checkbox statements were not recorded/)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
  it('superseded or no-longer-applicable assignment has no completion control', async () => {
    mocks.documentWorkflowState.mockResolvedValue({ ok: true, current: false });
    renderAt();
    expect(await screen.findByText(/no longer pending/)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
  it('fails closed on workflow-state read failure', async () => {
    mocks.documentWorkflowState.mockRejectedValue(new Error('denied'));
    renderAt();
    expect(await screen.findByText(/could not be confirmed/)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
  it('applicant assigned-only route does not fall back to bundled policy', async () => {
    mocks.listMyDocumentAssignments.mockResolvedValue([]);
    renderAt('/my-housing', 'resident_handbook');
    expect(await screen.findByText(/can't find that page/i)).toBeInTheDocument();
  });
  it('explicit assignment link never substitutes a different assigned edition', async () => {
    renderAt('/residence', 'synthetic_policy?assignment=999');
    expect(await screen.findByText(/can't find that page/i)).toBeInTheDocument();
    expect(mocks.completeDocumentReview).not.toHaveBeenCalled();
  });
});
