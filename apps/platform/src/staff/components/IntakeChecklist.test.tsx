import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntakeChecklist } from './IntakeChecklist';
import type { ReadinessItem } from '@recoveryos/data-access';

/**
 * B5A pins: the staff intake checklist renders the canonical six-class
 * readiness in operational language (never taxonomy terms), the medication
 * three-state reconciliation is one action per state (no fabricated "none"
 * rows), the override is an exception flow that only exists when the backend
 * says every unmet item is deferrable, and admission stays a deliberate act.
 */

const mocks = vi.hoisted(() => ({
  applicationIntakeReadiness: vi.fn(),
  listActiveMedicationItems: vi.fn(),
  admitApplicant: vi.fn(),
  confirmNoCurrentMedications: vi.fn(),
  recordMedicationItem: vi.fn(),
  recordEmergencyContact: vi.fn(),
  recordResidenceConsentGrant: vi.fn(),
  recordSupervisionCoordination: vi.fn(),
}));
vi.mock('@recoveryos/data-access', () => mocks);

const item = (over: Partial<ReadinessItem>): ReadinessItem => ({
  key: 'x',
  label: 'x',
  class: 'required_before_admission',
  status: 'missing',
  met: false,
  overridable: false,
  ...over,
});

const signMissing = item({
  key: 'sign:participant_agreement',
  label: 'Sign: Participant Agreement',
  class: 'required_before_admission',
});
const ackDone = item({
  key: 'ack:resident_rights',
  label: 'Acknowledge: Resident Rights',
  class: 'required_for_intake_completion',
  status: 'met',
  met: true,
});
const medUnconfirmed = item({
  key: 'medication_items',
  label: 'Medication status reviewed per medication policy',
  class: 'conditionally_required',
  status: 'unconfirmed',
  overridable: true,
});
const supervisionNA = item({
  key: 'supervision',
  label: 'Supervision coordination authorized + contact on file',
  class: 'not_applicable',
  status: 'not_applicable',
  met: true,
});

function readiness(items: ReadinessItem[]) {
  return {
    ok: true,
    complete: items.every((i) => i.met),
    items,
    blocking_unmet: items.filter((i) => !i.met).map((i) => i.key),
  };
}

const props = {
  applicationId: 5,
  personId: 144,
  personName: 'Jordan',
  applicationStatus: 'approved',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listActiveMedicationItems.mockResolvedValue([]);
});

describe('IntakeChecklist', () => {
  it('renders readiness classes as human headings, never taxonomy terms', async () => {
    mocks.applicationIntakeReadiness.mockResolvedValue(
      readiness([signMissing, ackDone, medUnconfirmed, supervisionNA]),
    );
    render(<IntakeChecklist {...props} />);
    expect(await screen.findByText('Needed before move-in')).toBeInTheDocument();
    expect(screen.getByText('Intake essentials')).toBeInTheDocument();
    expect(screen.getByText('If it applies')).toBeInTheDocument();
    // Not-applicable items collapse to one honest line; taxonomy words never leak.
    expect(screen.getByText(/Doesn’t apply here:/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/conditionally_required|unconfirmed|not_applicable/);
  });

  it('shows what is done, what remains, and who acts', async () => {
    mocks.applicationIntakeReadiness.mockResolvedValue(readiness([signMissing, ackDone]));
    render(<IntakeChecklist {...props} />);
    expect(await screen.findByText('Still needed')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText(/They sign it in their app/)).toBeInTheDocument();
  });

  it('medication not reviewed: one-tap "No current medications" calls the RPC — no fake rows', async () => {
    mocks.applicationIntakeReadiness.mockResolvedValue(readiness([medUnconfirmed]));
    mocks.confirmNoCurrentMedications.mockResolvedValue({ ok: true, code: 'confirmed' });
    render(<IntakeChecklist {...props} />);
    expect((await screen.findAllByText(/Not reviewed yet/)).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText('No current medications'));
    await waitFor(() => expect(mocks.confirmNoCurrentMedications).toHaveBeenCalledWith(144));
    expect(mocks.recordMedicationItem).not.toHaveBeenCalled();
  });

  it('medication reviewed-none reads as a satisfied state with no confirm button', async () => {
    mocks.applicationIntakeReadiness.mockResolvedValue(
      readiness([item({ ...medUnconfirmed, status: 'reviewed_none', met: true })]),
    );
    render(<IntakeChecklist {...props} />);
    expect((await screen.findAllByText(/Reviewed — no current medications/)).length).toBeGreaterThan(0);
    expect(screen.queryByText('No current medications')).not.toBeInTheDocument();
  });

  it('medication items present: lists them and reads reviewed', async () => {
    mocks.applicationIntakeReadiness.mockResolvedValue(
      readiness([item({ ...medUnconfirmed, status: 'met', met: true })]),
    );
    mocks.listActiveMedicationItems.mockResolvedValue([
      {
        id: 1,
        person_id: 144,
        name: 'lisinopril',
        storage_requirement: 'self_managed',
        is_moud: false,
        prescriber_on_file: true,
        started_at: new Date().toISOString(),
        ended_at: null,
      },
    ]);
    render(<IntakeChecklist {...props} />);
    expect((await screen.findAllByText(/Reviewed — medications recorded/)).length).toBeGreaterThan(0);
    expect(screen.getByText(/lisinopril/)).toBeInTheDocument();
  });

  it('pending document edition blocks move-in with a plain explanation and no override', async () => {
    mocks.applicationIntakeReadiness.mockResolvedValue(
      readiness([
        item({
          key: 'signature_documents',
          label: 'Residence document edition (signature set)',
          status: 'pending_document_edition',
        }),
      ]),
    );
    render(<IntakeChecklist {...props} />);
    expect(await screen.findByText(/documents aren’t ready to sign in the app yet/)).toBeInTheDocument();
    expect(screen.getByText(/can never be skipped or deferred/)).toBeInTheDocument();
    expect(screen.queryByText(/Move in with a follow-up/)).not.toBeInTheDocument();
  });

  it('override renders ONLY when every unmet item is deferrable, as an exception flow', async () => {
    mocks.applicationIntakeReadiness.mockResolvedValue(readiness([medUnconfirmed]));
    mocks.admitApplicant.mockResolvedValue({ ok: true, code: 'admitted', residency_id: 9 });
    render(<IntakeChecklist {...props} />);
    fireEvent.click(await screen.findByText('Move in with a follow-up…'));
    expect(screen.getByText(/This is an exception, not the normal path/)).toBeInTheDocument();
    expect(screen.getByText(/A follow-up assigned to you, due in 7 days/)).toBeInTheDocument();
    const confirm = screen.getByText('Confirm move-in with follow-up');
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Why is move-in going ahead/), {
      target: { value: 'Meds review confirmed verbally; recording tomorrow.' },
    });
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(mocks.admitApplicant).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: 5,
          override: true,
          overrideReason: 'Meds review confirmed verbally; recording tomorrow.',
        }),
      ),
    );
  });

  it('never renders an override control when a non-overridable item is unmet', async () => {
    mocks.applicationIntakeReadiness.mockResolvedValue(readiness([signMissing, medUnconfirmed]));
    render(<IntakeChecklist {...props} />);
    await screen.findByText('Needed before move-in');
    expect(screen.queryByText(/Move in with a follow-up/)).not.toBeInTheDocument();
    expect(screen.getByText(/can never be skipped or deferred/)).toBeInTheDocument();
  });

  it('complete checklist: move-in is a deliberate button; admission allowed', async () => {
    mocks.applicationIntakeReadiness.mockResolvedValue(readiness([ackDone]));
    mocks.admitApplicant.mockResolvedValue({ ok: true, code: 'admitted', residency_id: 9 });
    render(<IntakeChecklist {...props} />);
    fireEvent.click(await screen.findByText('Move Jordan in'));
    await waitFor(() => expect(mocks.admitApplicant).toHaveBeenCalled());
    expect(await screen.findByText(/Jordan is moved in/)).toBeInTheDocument();
  });

  it('intake_incomplete refusal keeps the approval intact and explains plainly', async () => {
    mocks.applicationIntakeReadiness.mockResolvedValue(readiness([ackDone]));
    mocks.admitApplicant.mockResolvedValue({ ok: false, code: 'intake_incomplete' });
    render(<IntakeChecklist {...props} />);
    fireEvent.click(await screen.findByText('Move Jordan in'));
    expect(await screen.findByText(/checklist isn’t complete yet/)).toBeInTheDocument();
  });

  it('unauthorized move-in reads as the manager boundary, not a crash', async () => {
    mocks.applicationIntakeReadiness.mockResolvedValue(readiness([ackDone]));
    mocks.admitApplicant.mockResolvedValue({ ok: false, code: 'not_authorized' });
    render(<IntakeChecklist {...props} />);
    fireEvent.click(await screen.findByText('Move Jordan in'));
    expect(await screen.findByText(/residence-manager decision/)).toBeInTheDocument();
  });

  it('before approval the checklist works but move-in is not offered', async () => {
    mocks.applicationIntakeReadiness.mockResolvedValue(readiness([ackDone]));
    render(<IntakeChecklist {...props} applicationStatus="submitted" />);
    expect(await screen.findByText(/move-in becomes available once the application is approved/)).toBeInTheDocument();
    expect(screen.queryByText('Move Jordan in')).not.toBeInTheDocument();
  });
});
