import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { DocumentDetailPage } from './DocumentDetailPage';

/**
 * Pins the pinned-version rendering rule: a residence-scoped edition with no
 * bundled residence-content module (all six EJWRH documents, Grace House
 * Resident Rights) renders from the person's assignment — the exact published
 * version they act on — instead of NotFound. NotFound remains the honest
 * answer only when neither a bundled copy nor an assignment exists.
 */

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  listMyDocumentAssignments: vi.fn(),
  hasElectronicRecordsConsent: vi.fn(),
  acknowledgeDocumentAssignment: vi.fn(),
  recordResidenceConsentGrant: vi.fn(),
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@recoveryos/data-access', () => mocks);

function renderAt(key: string) {
  return render(
    <MemoryRouter initialEntries={[`/residence/documents/${key}`]}>
      <Routes>
        <Route path="/residence/documents/:key" element={<DocumentDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const ejwrhAssignment = {
  id: 501,
  person_id: 144,
  acknowledged_at: null,
  signature_name: null,
  document_version: {
    id: 90,
    version: '1.0',
    body_markdown: '# EJWRH Participant & Residency Agreement\n\nProgram participation terms.',
    template: {
      key: 'ejwrh_participant_agreement',
      name: 'EJWRH Participant & Residency Agreement',
      requires_signature: true,
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue({ person: { id: 144, first_name: 'Jordan', last_name: 'Q' } });
  mocks.listMyDocumentAssignments.mockResolvedValue([ejwrhAssignment]);
  mocks.hasElectronicRecordsConsent.mockResolvedValue(true);
});

describe('DocumentDetailPage pinned-version fallback', () => {
  it('renders a residence-scoped edition from the assignment when no bundled copy exists', async () => {
    renderAt('ejwrh_participant_agreement');
    expect(
      await screen.findByRole('button', {
        name: 'Sign EJWRH Participant & Residency Agreement',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Program participation terms.')).toBeInTheDocument();
    expect(screen.getByText(/Version 1.0/)).toBeInTheDocument();
    expect(screen.queryByText(/can't find that page/i)).not.toBeInTheDocument();
  });

  it('still answers NotFound honestly when neither a bundled copy nor an assignment exists', async () => {
    mocks.listMyDocumentAssignments.mockResolvedValue([]);
    renderAt('never_a_real_document');
    expect(await screen.findByText(/can't find that page/i)).toBeInTheDocument();
  });

  it('renders the signed confirmation from the pinned assignment', async () => {
    mocks.listMyDocumentAssignments.mockResolvedValue([
      {
        ...ejwrhAssignment,
        acknowledged_at: '2026-08-31T12:00:00Z',
        signature_name: 'Jordan Q',
      },
    ]);
    renderAt('ejwrh_participant_agreement');
    expect(await screen.findByText(/You signed this document on/)).toBeInTheDocument();
    expect(screen.getByText(/Jordan Q/)).toBeInTheDocument();
  });
});
