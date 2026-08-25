import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GettingSettledPage } from './GettingSettledPage';

/**
 * B5A pins: the participant intake view answers what/why/who-can-help in
 * plain, dignity-preserving language; ack-only documents are one tap and the
 * signature document takes a typed name; documents render from the pinned
 * version body; conditional/staff items never become participant homework;
 * no requirement counts ever appear; the pending-document-edition state is
 * honest and calm.
 */

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  getMyLatestApplication: vi.fn(),
  ensureMyDocumentAssignments: vi.fn(),
  listMyDocumentAssignments: vi.fn(),
  applicationIntakeReadiness: vi.fn(),
  acknowledgeDocumentAssignment: vi.fn(),
  recordResidenceConsentGrant: vi.fn(),
  hasElectronicRecordsConsent: vi.fn(),
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@recoveryos/data-access', () => mocks);
vi.mock('@recoveryos/residence-content', () => ({ getDocument: () => undefined }));

const approvedApp = {
  id: 5,
  person_id: 144,
  residence_id: 1,
  status: 'approved',
  submitted_at: new Date().toISOString(),
  residence: { id: 1, name: 'Grace House', phone: '515-220-8771' },
};

const assignment = (over: Record<string, unknown>) => ({
  id: 1,
  document_version_id: 10,
  person_id: 144,
  residency_id: null,
  application_id: 5,
  assigned_at: new Date().toISOString(),
  acknowledged_at: null,
  signed_at: null,
  signature_name: null,
  document_version: {
    id: 10,
    template_id: 3,
    version: '1.0',
    body_markdown: '# The exact pinned terms',
    content_hash: 'abc',
    published_at: new Date().toISOString(),
    template: {
      id: 3,
      organization_id: 1,
      key: 'resident_rights',
      name: 'Resident Rights',
      requires_signature: false,
      requires_acknowledgment: true,
      residence_id: 1,
      is_active: true,
    },
  },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue({ person: { id: 144, first_name: 'Jordan' } });
  mocks.ensureMyDocumentAssignments.mockResolvedValue([]);
  mocks.hasElectronicRecordsConsent.mockResolvedValue(true);
  mocks.applicationIntakeReadiness.mockResolvedValue({
    ok: true,
    items: [{ key: 'screening_consent', met: false }],
  });
});

describe('GettingSettledPage', () => {
  it('acknowledgment documents are one tap — no name field — from the pinned version body', async () => {
    mocks.getMyLatestApplication.mockResolvedValue(approvedApp);
    mocks.listMyDocumentAssignments.mockResolvedValue([assignment({})]);
    mocks.acknowledgeDocumentAssignment.mockResolvedValue({ ok: true, code: 'acknowledged' });
    render(<GettingSettledPage />);
    expect(await screen.findByText('To read')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Read it'));
    expect(screen.getByText('The exact pinned terms')).toBeInTheDocument();
    expect(screen.getByText(/Version 1.0/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/signature/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("I've read this"));
    await waitFor(() =>
      expect(mocks.acknowledgeDocumentAssignment).toHaveBeenCalledWith({ assignmentId: 1 }),
    );
  });

  it('the signature document takes a typed name and sends it to the audited RPC', async () => {
    mocks.getMyLatestApplication.mockResolvedValue(approvedApp);
    mocks.listMyDocumentAssignments.mockResolvedValue([
      assignment({
        document_version: {
          ...assignment({}).document_version,
          template: {
            ...assignment({}).document_version.template,
            key: 'participant_agreement',
            name: 'Participant Agreement',
            requires_signature: true,
            requires_acknowledgment: false,
          },
        },
      }),
    ]);
    mocks.acknowledgeDocumentAssignment.mockResolvedValue({ ok: true, code: 'signed' });
    render(<GettingSettledPage />);
    expect(await screen.findByText('To sign')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Read & sign'));
    // Intent-to-be-bound statement accompanies the signing control (legal review §3).
    expect(screen.getByText(/is your electronic signature and your agreement to be bound/)).toBeInTheDocument();
    const sign = screen.getByText('Sign Participant Agreement');
    expect(sign).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Type your full name/), {
      target: { value: 'Jordan Fixture' },
    });
    fireEvent.click(sign);
    await waitFor(() =>
      expect(mocks.acknowledgeDocumentAssignment).toHaveBeenCalledWith({
        assignmentId: 1,
        signatureName: 'Jordan Fixture',
      }),
    );
  });

  it('e-signing is gated on affirmative electronic-records consent, with a paper path', async () => {
    mocks.hasElectronicRecordsConsent.mockResolvedValue(false);
    mocks.getMyLatestApplication.mockResolvedValue(approvedApp);
    mocks.listMyDocumentAssignments.mockResolvedValue([
      assignment({
        document_version: {
          ...assignment({}).document_version,
          template: {
            ...assignment({}).document_version.template,
            key: 'participant_agreement',
            name: 'Participant Agreement',
            requires_signature: true,
            requires_acknowledgment: false,
          },
        },
      }),
    ]);
    mocks.recordResidenceConsentGrant.mockResolvedValue({ ok: true, code: 'granted', grant_id: 9 });
    render(<GettingSettledPage />);
    fireEvent.click(await screen.findByText('Read & sign'));
    // No signature field until the affirmative consent action.
    expect(screen.getByTestId('e-consent-step')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Type your full name/)).not.toBeInTheDocument();
    // The paper path is clearly accessible and framed with no adverse consequence.
    fireEvent.click(screen.getByText('I prefer to sign on paper'));
    expect(screen.getByText(/never affects your eligibility/)).toBeInTheDocument();
    // Affirmative consent action records the self-only electronic_records grant.
    fireEvent.click(screen.getByText('I agree to use electronic records and signatures'));
    await waitFor(() =>
      expect(mocks.recordResidenceConsentGrant).toHaveBeenCalledWith({
        personId: 144,
        typeKey: 'electronic_records',
      }),
    );
  });

  it('no assignable documents (pending house edition) reads calm and honest', async () => {
    mocks.getMyLatestApplication.mockResolvedValue(approvedApp);
    mocks.listMyDocumentAssignments.mockResolvedValue([]);
    render(<GettingSettledPage />);
    expect(await screen.findByTestId('pending-edition')).toBeInTheDocument();
    expect(screen.getByText(/nothing is waiting on you/)).toBeInTheDocument();
  });

  it('screening consent is the participant’s own one-tap grant', async () => {
    mocks.getMyLatestApplication.mockResolvedValue(approvedApp);
    mocks.listMyDocumentAssignments.mockResolvedValue([]);
    mocks.recordResidenceConsentGrant.mockResolvedValue({ ok: true, code: 'granted', grant_id: 1 });
    render(<GettingSettledPage />);
    fireEvent.click(await screen.findByText('I give my okay for screening'));
    await waitFor(() =>
      expect(mocks.recordResidenceConsentGrant).toHaveBeenCalledWith({
        personId: 144,
        typeKey: 'residence_screening',
      }),
    );
  });

  it('staff-side and conditional items never become participant homework, and no counts leak', async () => {
    mocks.getMyLatestApplication.mockResolvedValue(approvedApp);
    mocks.listMyDocumentAssignments.mockResolvedValue([assignment({})]);
    render(<GettingSettledPage />);
    expect(await screen.findByText(/The rest happens with staff/)).toBeInTheDocument();
    // The staff-side items are explained, never actionable: no controls exist for them.
    const controls = screen.getAllByRole('button').map((b) => b.textContent ?? '');
    expect(controls.join(' ')).not.toMatch(/emergency|medication|supervision|officer/i);
    // And no requirement counts or taxonomy language ever leaks.
    expect(document.body.textContent).not.toMatch(/unmet|requirement|blocking/i);
  });

  it('a not-yet-approved application shows the waiting state, not tasks', async () => {
    mocks.getMyLatestApplication.mockResolvedValue({ ...approvedApp, status: 'submitted' });
    render(<GettingSettledPage />);
    expect(await screen.findByText(/staff will reach out to you directly/)).toBeInTheDocument();
    expect(mocks.ensureMyDocumentAssignments).not.toHaveBeenCalled();
  });
});
