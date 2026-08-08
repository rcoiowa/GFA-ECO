import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import {
  MySupportCard,
  NeedsAttentionCard,
  NextConnectionCard,
  deriveAttentionItems,
} from './ConnectionCards';
import type { ConnectionState, SupportTeamMember } from '@recoveryos/domain';

const member: SupportTeamMember = {
  relationship_id: 5,
  support_person_id: 20,
  display_name: 'Jordan B.',
  role_label: 'Recovery Coach',
  relationship_type: 'coach',
  context: 'coaching',
  is_primary: true,
  started_at: '2026-08-01',
};

const base: ConnectionState = {
  kind: 'NO_REQUEST',
  currentRequest: null,
  relationship: null,
  supportTeam: [],
  nextAppointment: null,
  openBooking: null,
  schedulingUnderway: false,
};

const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('MySupportCard', () => {
  it('invites connection when nothing is active', () => {
    wrap(<MySupportCard state={base} />);
    expect(screen.getByText('Need someone to talk with?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Connect' })).toHaveAttribute('href', '/vrcc/connect');
  });

  it('reassures while waiting — no lifecycle vocabulary', () => {
    wrap(
      <MySupportCard
        state={{
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
        }}
      />,
    );
    expect(screen.getByText('We’re working on your connection.')).toBeInTheDocument();
    expect(screen.queryByText(/open/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unassigned/i)).not.toBeInTheDocument();
  });

  it('shows the support person when connected', () => {
    wrap(<MySupportCard state={{ ...base, kind: 'RELATIONSHIP_ACTIVE', supportTeam: [member] }} />);
    expect(screen.getByText('Jordan B.')).toBeInTheDocument();
    expect(screen.getByText(/Recovery Coach/)).toBeInTheDocument();
  });
});

describe('NextConnectionCard', () => {
  it('renders nothing loud when no session is scheduled', () => {
    const { container } = wrap(<NextConnectionCard state={base} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('distinguishes choosing-a-time from nothing-scheduled', () => {
    wrap(<NextConnectionCard state={{ ...base, schedulingUnderway: true }} />);
    expect(screen.getByText('You and your coach are choosing a time.')).toBeInTheDocument();
  });

  it('shows the confirmed session with who/when in appointment timezone', () => {
    wrap(
      <NextConnectionCard
        state={{
          ...base,
          supportTeam: [member],
          nextAppointment: {
            id: 9,
            person_id: 10,
            provider_person_id: 20,
            status: 'confirmed',
            starts_at: '2026-08-10T15:00:00Z',
            ends_at: null,
            modality: 'video',
            meeting_url: null,
            timezone: 'America/Chicago',
            confirmed_at: null,
          },
        }}
      />,
    );
    expect(screen.getByText('Session with Jordan B.')).toBeInTheDocument();
    expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
  });
});

describe('deriveAttentionItems', () => {
  it('caps at three, highest value first, participant-actionable only', () => {
    const items = deriveAttentionItems(
      {
        ...base,
        kind: 'REQUEST_CLAIMED',
        schedulingUnderway: true,
        currentRequest: {
          id: 1,
          person_id: 10,
          request_type: 'recovery_coach',
          focus: null,
          preferred_modality: 'video',
          status: 'claimed',
          claimed_by_person_id: 20,
          created_at: '2026-08-08T10:00:00Z',
        },
      },
      4,
    );
    expect(items).toHaveLength(3);
    expect(items[0]?.key).toBe('scheduling');
  });

  it('is empty when nothing needs the participant', () => {
    expect(deriveAttentionItems(base, 0)).toHaveLength(0);
  });
});

describe('NeedsAttentionCard', () => {
  it('renders nothing for an empty list (calm surface)', () => {
    const { container } = wrap(<NeedsAttentionCard items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
