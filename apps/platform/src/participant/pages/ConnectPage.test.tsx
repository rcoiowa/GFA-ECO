import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { ConnectionState } from '@recoveryos/domain';
import { ConnectPage } from './ConnectPage';

// Mock the hooks module — the page under test renders states, the hooks are
// covered by domain derivation tests + contract types.
const mocks = vi.hoisted(() => ({
  useConnection: vi.fn(),
  useCreateSupportRequest: vi.fn(),
  useCancelSupportRequest: vi.fn(),
}));
vi.mock('../hooks/useConnection', () => ({
  useConnection: mocks.useConnection,
  useCreateSupportRequest: mocks.useCreateSupportRequest,
  useCancelSupportRequest: mocks.useCancelSupportRequest,
}));

const base: ConnectionState = {
  kind: 'NO_REQUEST',
  currentRequest: null,
  relationship: null,
  supportTeam: [],
  nextAppointment: null,
  openBooking: null,
  schedulingUnderway: false,
};

const idleMutation = { mutate: vi.fn(), isPending: false, isError: false };

function setState(state: ConnectionState, createMutation = idleMutation) {
  mocks.useConnection.mockReturnValue({ state, isLoading: false, hasError: false, refetch: vi.fn() });
  mocks.useCreateSupportRequest.mockReturnValue(createMutation);
  mocks.useCancelSupportRequest.mockReturnValue(idleMutation);
}

const wrap = () => render(<MemoryRouter><ConnectPage /></MemoryRouter>);

beforeEach(() => vi.clearAllMocks());

describe('ConnectPage — Mode A (I need support)', () => {
  it('offers humane support options mapped to canonical types', () => {
    setState(base);
    wrap();
    expect(screen.getByText('How can we support you today?')).toBeInTheDocument();
    expect(screen.getByText('Talk with a recovery coach')).toBeInTheDocument();
    expect(screen.getByText('I’m not sure — I just need someone')).toBeInTheDocument();
  });

  it('submits type + modality + optional context, no assessment fields', async () => {
    const mutate = vi.fn();
    setState(base, { ...idleMutation, mutate });
    wrap();
    await userEvent.click(screen.getByText('Talk with a recovery coach'));
    await userEvent.click(screen.getByLabelText('Phone call'));
    await userEvent.type(
      screen.getByLabelText(/Anything you’d like us to know/),
      'mornings are hard',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Request support' }));
    expect(mutate).toHaveBeenCalledWith({
      requestType: 'recovery_coach',
      preferredModality: 'phone',
      focus: 'mornings are hard',
    });
  });

  it('preserves what was written when the server fails', async () => {
    setState(base, { ...idleMutation, isError: true });
    wrap();
    await userEvent.click(screen.getByText('Peer support'));
    const textarea = screen.getByLabelText(/Anything you’d like us to know/);
    await userEvent.type(textarea, 'still here');
    expect(
      screen.getByText(/What you wrote is still here — try again\./),
    ).toBeInTheDocument();
    expect(textarea).toHaveValue('still here');
  });
});

describe('ConnectPage — Mode B (we heard you)', () => {
  const open: ConnectionState = {
    ...base,
    kind: 'REQUEST_OPEN',
    currentRequest: {
      id: 1,
      person_id: 10,
      request_type: 'recovery_coach',
      focus: null,
      preferred_modality: 'video',
      status: 'open',
      claimed_by_person_id: null,
      created_at: '2026-08-08T10:00:00Z',
    },
  };

  it('reassures without database vocabulary', () => {
    setState(open);
    wrap();
    expect(screen.getByText('We’ve got your request')).toBeInTheDocument();
    expect(screen.getByText(/finding someone to connect with you/)).toBeInTheDocument();
    expect(screen.queryByText(/OPEN/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ticket/i)).not.toBeInTheDocument();
  });

  it('withdrawal needs confirmation and speaks gently', async () => {
    setState(open);
    wrap();
    await userEvent.click(screen.getByText('I no longer need this request'));
    expect(screen.getByText('Let this request go?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep my request' })).toBeInTheDocument();
  });

  it('claimed state says someone is on it and hides withdrawal', () => {
    setState({
      ...open,
      kind: 'REQUEST_CLAIMED',
      currentRequest: { ...open.currentRequest!, status: 'claimed', claimed_by_person_id: 20 },
    });
    wrap();
    expect(screen.getByText('Someone is on it')).toBeInTheDocument();
    expect(screen.queryByText('I no longer need this request')).not.toBeInTheDocument();
  });
});

describe('ConnectPage — Mode C (connected)', () => {
  it('shows the support person and no dead action buttons', () => {
    setState({
      ...base,
      kind: 'RELATIONSHIP_ACTIVE',
      supportTeam: [
        {
          relationship_id: 5,
          support_person_id: 20,
          display_name: 'Jordan B.',
          role_label: 'Recovery Coach',
          relationship_type: 'coach',
          is_primary: true,
          started_at: '2026-08-01',
        },
      ],
    });
    wrap();
    expect(screen.getByText('Jordan B.')).toBeInTheDocument();
    // Messaging/scheduling land in later slices — no fake buttons now.
    expect(screen.queryByRole('button', { name: /message/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /schedule/i })).not.toBeInTheDocument();
    // No staff-only fields leak.
    expect(screen.queryByText(/capacity/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/person_id/i)).not.toBeInTheDocument();
  });
});
