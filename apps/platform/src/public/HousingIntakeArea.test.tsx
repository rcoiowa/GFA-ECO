import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { HousingIntakeArea } from './HousingIntakeArea';
const state = vi.hoisted(() => ({ person: { id: 21 } as { id: number } | null }));
vi.mock('@recoveryos/auth', () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ person: state.person, roles: ['participant'], signOut: vi.fn() }),
}));
vi.mock('./MyApplicationPage', () => ({ MyApplicationPage: () => <div>My application only</div> }));
vi.mock('./HousingConsentPage', () => ({ HousingConsentPage: () => <div>My consent only</div> }));
vi.mock('../resident/pages/DocumentsPage', () => ({
  DocumentsPage: ({ assignedOnly }: { assignedOnly: boolean }) => (
    <div>{assignedOnly ? 'Assigned documents only' : 'Full library'}</div>
  ),
}));
vi.mock('../resident/pages/DocumentDetailPage', () => ({
  DocumentDetailPage: () => <div>Assigned document</div>,
}));
beforeEach(() => {
  state.person = { id: 21 };
});
it('lets a participant reach own assigned documents without resident or staff role', () => {
  render(
    <MemoryRouter initialEntries={['/documents']}>
      <HousingIntakeArea />
    </MemoryRouter>,
  );
  expect(screen.getByText('Assigned documents only')).toBeInTheDocument();
  expect(screen.queryByText('Full library')).not.toBeInTheDocument();
});
it('does not provision another person or redirect an unlinked housing login into VRCC onboarding', () => {
  state.person = null;
  render(
    <MemoryRouter>
      <HousingIntakeArea />
    </MemoryRouter>,
  );
  expect(screen.getByText(/Your login is not linked/)).toBeInTheDocument();
  expect(screen.queryByText('My application only')).not.toBeInTheDocument();
});
