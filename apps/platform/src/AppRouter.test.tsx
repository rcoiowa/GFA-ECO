import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, Routes, Route, Link } from 'react-router';
import type { ReactNode } from 'react';
import { App } from './App';

// Isolate shell routing from each workspace's backend queries. These nested Routes
// use the same descendant/splat pattern as the real lazy-loaded workspace shells.
function NestedWorkspace({ name }: { name: string }) {
  return (
    <Routes>
      <Route
        index
        element={
          <>
            <h1>{name} home</h1>
            <Link to="details">Open details</Link>
          </>
        }
      />
      <Route
        path="details"
        element={
          <>
            <h1>{name} details</h1>
            <Link to="..">Workspace home</Link>
          </>
        }
      />
    </Routes>
  );
}
vi.mock('./participant/ParticipantArea', () => ({
  ParticipantArea: () => <NestedWorkspace name="Participant" />,
}));
vi.mock('./resident/ResidentArea', () => ({
  ResidentArea: () => <NestedWorkspace name="Resident" />,
}));
vi.mock('./staff/StaffArea', () => ({ StaffArea: () => <NestedWorkspace name="Staff" /> }));
vi.mock('./coach/CoachArea', () => ({ CoachArea: () => <NestedWorkspace name="Coach" /> }));
vi.mock('./navigator/NavigatorArea', () => ({
  NavigatorArea: () => <NestedWorkspace name="Navigator" />,
}));
vi.mock('./admin/AdminArea', () => ({ AdminArea: () => <NestedWorkspace name="Admin" /> }));
vi.mock('./public/HousingIntakeArea', () => ({
  HousingIntakeArea: () => <NestedWorkspace name="Housing intake" />,
}));
vi.mock('@recoveryos/auth', () => ({
  useAuth: () => ({ ready: true, session: null, person: null, roles: [], roleAssignments: [] }),
  RequireAuth: ({ children }: { children: ReactNode }) => <>{children}</>,
  RequireRole: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
const { transferableAbortController } = await vi.importActual<{
  transferableAbortController: () => AbortController;
}>('node:util');
beforeEach(() =>
  vi.stubGlobal(
    'AbortController',
    class {
      constructor() {
        return transferableAbortController();
      }
    },
  ),
);
afterEach(() => vi.unstubAllGlobals());
describe('App under the catch-all data router', () => {
  it.each([
    ['/vrcc', 'Participant'],
    ['/residence', 'Resident'],
    ['/staff', 'Staff'],
    ['/coach', 'Coach'],
    ['/navigator', 'Navigator'],
    ['/admin', 'Admin'],
    ['/my-housing', 'Housing intake'],
  ])('preserves nested relative routing at %s', async (path, name) => {
    const router = createMemoryRouter([{ path: '*', element: <App /> }], {
      initialEntries: [path!],
    });
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('heading', { name: `${name} home` })).toBeInTheDocument();
    const details = screen.getByRole('link', { name: 'Open details' });
    expect(details).toHaveAttribute('href', `${path}/details`);
    await userEvent.setup().click(details);
    expect(await screen.findByRole('heading', { name: `${name} details` })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`${path}/details`);
    await userEvent.setup().click(screen.getByRole('link', { name: 'Workspace home' }));
    expect(await screen.findByRole('heading', { name: `${name} home` })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(path);
  });
});
