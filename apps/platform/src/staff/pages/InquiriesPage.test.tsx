import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InquiriesPage } from './InquiriesPage';
import type { IntakeLead } from '@recoveryos/data-access';

/**
 * Shared inquiry queue pins: six-stage rendering in human language, overdue
 * flagged from the response deadline, partnership inquiries visibly priority,
 * residence routing is explicit-selection language (never inferred traits),
 * outreach is logged through the append-only contact RPC, and the duplicate
 * hint tells staff to check the log before reaching out.
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
  response_due_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
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
      lead({ id: 8, status: 'closed', response_due_at: new Date(Date.now() - 60_000).toISOString() }),
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
    expect(
      await screen.findByText(/Ernest & Johnnie White's Recovery House/),
    ).toBeInTheDocument();
  });

  it('logs an outreach contact through the append-only RPC', async () => {
    render(<InquiriesPage />);
    fireEvent.click(await screen.findByText('Work this inquiry'));
    const outcome = await screen.findByLabelText('What happened (outcome)');
    fireEvent.change(outcome, { target: { value: 'Spoke with them' } });
    fireEvent.click(screen.getByText('Log contact'));
    await waitFor(() =>
      expect(mocks.recordLeadContact).toHaveBeenCalledWith(
        expect.objectContaining({ leadId: 1, channel: 'phone', outcome: 'Spoke with them' }),
      ),
    );
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
