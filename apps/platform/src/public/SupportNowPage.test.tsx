import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { GFA_CONTACTS } from '@recoveryos/safety';
import { SupportNowPage } from './SupportNowPage';

// Auth is mocked at the module boundary; everything else on this page must be
// static. Supabase is deliberately NOT configured in these tests — any data
// read (or Grace call) from the page would throw and fail the render, which
// is exactly the guarantee we want: the anonymous safety path depends on no
// backend and no Grace AI.
const mocks = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));

const anonymous = {
  ready: true,
  session: null,
  person: null,
  roles: [],
  roleAssignments: [],
  refreshIdentity: vi.fn(),
  signOut: vi.fn(),
};

const wrap = () =>
  render(
    <MemoryRouter initialEntries={['/support']}>
      <SupportNowPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue(anonymous);
});

describe('SupportNowPage — anonymous safety path', () => {
  it('renders with no session, no backend, and no Grace dependency', () => {
    wrap();
    expect(screen.getByRole('heading', { name: 'Support, right now' })).toBeInTheDocument();
    expect(screen.getByText(/works without an account/i)).toBeInTheDocument();
  });

  it('presents the deterministic hierarchy: emergency, then crisis, then GFA', () => {
    wrap();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'In immediate danger?',
      'Need crisis support right now?',
      'Want to connect with Grace For Addictions?',
    ]);
  });

  it('exposes 911 and 988 with tel actions', () => {
    wrap();
    expect(screen.getByRole('link', { name: /emergency services/i })).toHaveAttribute(
      'href',
      'tel:911',
    );
    expect(screen.getByRole('link', { name: /988/i })).toHaveAttribute('href', 'tel:988');
  });

  it('exposes the GFA warmline and office as tel links from the canonical contacts', () => {
    wrap();
    expect(screen.getByRole('link', { name: /grace warmline/i })).toHaveAttribute(
      'href',
      `tel:${GFA_CONTACTS.warmline.number}`,
    );
    expect(screen.getByRole('link', { name: /office/i })).toHaveAttribute(
      'href',
      `tel:${GFA_CONTACTS.office.number}`,
    );
  });

  it('distinguishes GFA support from emergency/crisis services without response promises', () => {
    wrap();
    expect(
      screen.getByText(/not an emergency service and does not provide clinical care or 24\/7/i),
    ).toBeInTheDocument();
    // The GFA group itself carries the distinction too.
    expect(screen.getByText(/Not an emergency or 24\/7 crisis service/i)).toBeInTheDocument();
  });

  it('asks for no account: no sign-in prompt, no register CTA', () => {
    wrap();
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create.*account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/continue to my space/i)).not.toBeInTheDocument();
  });

  it('offers a way onward (not a dead-end) for a signed-in person', () => {
    mocks.useAuth.mockReturnValue({ ...anonymous, session: { user: { id: 'u1' } } });
    wrap();
    expect(screen.getByRole('link', { name: 'Continue to my space' })).toHaveAttribute(
      'href',
      '/home',
    );
  });
});
