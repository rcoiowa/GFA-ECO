import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InquiriesPage } from './InquiriesPage';
import type { IntakeLead } from '@recoveryos/data-access';

/**
 * Shared inquiry queue pins: six-stage rendering in human language, partnership
 * inquiries visibly priority, residence routing is explicit-selection language
 * (never inferred traits), outreach is logged through the append-only contact
 * RPC with the attempted-vs-connected distinction (2026-09-05 decision 1),
 * closing records the human triage classification (decision 6), and — with
 * response_due_at dormant pending the operating-calendar ratification
 * (decision 3) — the queue surfaces age since receipt and never fabricates an
 * overdue state (the badge logic stays, keyed only on a populated deadline).
 */

const mocks = vi.hoisted(() => ({
  listIntakeLeads: vi.fn(),
  listLeadContacts: vi.fn(),
  listIntakeAssignees: vi.fn(),
  findDuplicateLeads: vi.fn(),
  assignLead: vi.fn(),
  recordLeadContact: vi.fn(),
  setLeadStatus: vi.fn(),
  routeLead: vi.fn(),
}));
vi.mock('@recoveryos/data-access', () => mocks);

const lead = (over: Partial<IntakeLead>): IntakeLead => ({
  id: 1,
  first_name: 'Sam',
  last_name: 'Q',
  email: 'sam@example.test',
  phone: null,
  message: 'Looking for recovery housing',
  interest: null,
  readiness: null,
  source: 'website',
  status: 'new',
  assigned_to_person_id: null,
  organization_inquiry: false,
  residence_interest: 'unspecified',
  // Dormant by default (decision 3): no writer populates it until the
  // operating calendar is ratified. Overdue tests set it explicitly.
  response_due_at: null,
  triage_classification: null,
  triage_classification_note: null,
  wix_submission_id: null,
  submitted_at: null,
  linked_intake_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listIntakeLeads.mockResolvedValue([lead({})]);
  mocks.listLeadContacts.mockResolvedValue([]);
  mocks.listIntakeAssignees.mockResolvedValue({ ok: true, code: 'listed', assignees: [] });
  mocks.findDuplicateLeads.mockResolvedValue({ ok: true, code: 'checked', duplicates: [] });
  mocks.recordLeadContact.mockResolvedValue({ ok: true, code: 'recorded', event_id: 9 });
  mocks.setLeadStatus.mockResolvedValue({ ok: true, code: 'status_set' });
});

describe('InquiriesPage', () => {
  it('renders the queue with stage and explicit-pathway language', async () => {
    render(<InquiriesPage />);
    expect(await screen.findByText('Sam Q')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText(/Pathway not selected/)).toBeInTheDocument();
  });

  it('flags an overdue open inquiry from its response deadline', async () => {
    mocks.listIntakeLeads.mockResolvedValue([
      lead({ id: 7, response_due_at: new Date(Date.now() - 60_000).toISOString() }),
    ]);
    render(<InquiriesPage />);
    expect(await screen.findByTestId('overdue-7')).toHaveTextContent('Overdue');
  });

  it('never flags a closed inquiry as overdue', async () => {
    mocks.listIntakeLeads.mockResolvedValue([
      lead({
        id: 8,
        status: 'closed',
        response_due_at: new Date(Date.now() - 60_000).toISOString(),
      }),
    ]);
    render(<InquiriesPage />);
    fireEvent.click(await screen.findByText('Show closed'));
    expect(await screen.findByText('Sam Q')).toBeInTheDocument();
    expect(screen.queryByTestId('overdue-8')).not.toBeInTheDocument();
  });

  it('marks partnership inquiries as priority', async () => {
    mocks.listIntakeLeads.mockResolvedValue([lead({ organization_inquiry: true })]);
    render(<InquiriesPage />);
    expect(await screen.findByText('Partnership — priority')).toBeInTheDocument();
  });

  it('shows EJWRH as an explicit selected pathway', async () => {
    mocks.listIntakeLeads.mockResolvedValue([lead({ residence_interest: 'ejwrh' })]);
    render(<InquiriesPage />);
    expect(await screen.findByText(/Ernest & Johnnie White's Recovery House/)).toBeInTheDocument();
  });

  it('logs an outreach contact as an attempt by default — never presumed connected', async () => {
    render(<InquiriesPage />);
    fireEvent.click(await screen.findByText('Work this inquiry'));
    const outcome = await screen.findByLabelText('What happened (outcome)');
    fireEvent.change(outcome, { target: { value: 'Left a voicemail' } });
    fireEvent.click(screen.getByText('Log contact'));
    await waitFor(() =>
      expect(mocks.recordLeadContact).toHaveBeenCalledWith(
        expect.objectContaining({
          leadId: 1,
          channel: 'phone',
          contactKind: 'attempted',
          outcome: 'Left a voicemail',
        }),
      ),
    );
  });

  it('records an established connection only when staff say so', async () => {
    render(<InquiriesPage />);
    fireEvent.click(await screen.findByText('Work this inquiry'));
    fireEvent.click(await screen.findByText(/Connected — spoke with them/));
    const outcome = screen.getByLabelText('What happened (outcome)');
    fireEvent.change(outcome, { target: { value: 'Spoke with them' } });
    fireEvent.click(screen.getByText('Log contact'));
    await waitFor(() =>
      expect(mocks.recordLeadContact).toHaveBeenCalledWith(
        expect.objectContaining({ contactKind: 'connected' }),
      ),
    );
  });

  it('closing sends the human triage classification with the status change', async () => {
    render(<InquiriesPage />);
    fireEvent.click(await screen.findByText('Work this inquiry'));
    const select = await screen.findByLabelText('Close as');
    fireEvent.change(select, { target: { value: 'spam' } });
    fireEvent.click(screen.getByText('Closed'));
    await waitFor(() =>
      expect(mocks.setLeadStatus).toHaveBeenCalledWith(
        expect.objectContaining({ leadId: 1, status: 'closed', closeClassification: 'spam' }),
      ),
    );
  });

  it("closing as 'other' keeps a legitimate inquiry out of nonqualified and carries the optional note", async () => {
    render(<InquiriesPage />);
    fireEvent.click(await screen.findByText('Work this inquiry'));
    const select = await screen.findByLabelText('Close as');
    fireEvent.change(select, { target: { value: 'other' } });
    const note = await screen.findByLabelText('What kind of inquiry? (optional)');
    fireEvent.change(note, { target: { value: 'Speaker invitation for Job Corps' } });
    fireEvent.click(screen.getByText('Closed'));
    await waitFor(() =>
      expect(mocks.setLeadStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'closed',
          closeClassification: 'other',
          closeNote: 'Speaker invitation for Job Corps',
        }),
      ),
    );
  });

  it('the classification note is offered only for other — no narrative elsewhere', async () => {
    render(<InquiriesPage />);
    fireEvent.click(await screen.findByText('Work this inquiry'));
    await screen.findByLabelText('Close as');
    expect(screen.queryByLabelText('What kind of inquiry? (optional)')).not.toBeInTheDocument();
  });

  it('surfaces age since receipt without fabricating an overdue state', async () => {
    mocks.listIntakeLeads.mockResolvedValue([
      lead({ created_at: new Date(Date.now() - 3 * 24 * 3_600_000).toISOString() }),
    ]);
    render(<InquiriesPage />);
    expect(await screen.findByText(/waiting 3 days/)).toBeInTheDocument();
    expect(screen.queryByTestId('overdue-1')).not.toBeInTheDocument();
    expect(screen.queryByText(/respond by/)).not.toBeInTheDocument();
  });

  it('surfaces the duplicate-outreach hint when a matching inquiry exists', async () => {
    mocks.findDuplicateLeads.mockResolvedValue({
      ok: true,
      code: 'checked',
      duplicates: [{ id: 42, status: 'contacted' }],
    });
    render(<InquiriesPage />);
    fireEvent.click(await screen.findByText('Work this inquiry'));
    expect(await screen.findByText(/#42/)).toBeInTheDocument();
    expect(screen.getByText(/Check the contact\s*log before reaching out/i)).toBeInTheDocument();
  });

  it('shows the honest empty state for the no-contact history', async () => {
    render(<InquiriesPage />);
    fireEvent.click(await screen.findByText('Work this inquiry'));
    expect(
      await screen.findByText(/has not been contacted through\s*RecoveryOS/i),
    ).toBeInTheDocument();
  });

  it('hides the assignment picker for non-coordinators', async () => {
    mocks.listIntakeAssignees.mockRejectedValue(new Error('not_authorized'));
    render(<InquiriesPage />);
    fireEvent.click(await screen.findByText('Work this inquiry'));
    await screen.findByText('Contact history');
    expect(screen.queryByLabelText('Assigned to')).not.toBeInTheDocument();
  });
});
