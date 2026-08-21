import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { NotificationsPanel } from './NotificationsPanel';

/**
 * P0.5-B regression: staff notifications were emitted and never rendered.
 * Pins the NOTIFICATION → OBJECT → ACTION → RESOLUTION contract: rows link to
 * real routes (legacy stored paths remapped), opening marks read, mark-all
 * resolves the pile.
 */

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  getMyNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@recoveryos/data-access', () => ({
  getMyNotifications: mocks.getMyNotifications,
  markNotificationRead: mocks.markNotificationRead,
  markAllNotificationsRead: mocks.markAllNotificationsRead,
}));

const note = (over: Record<string, unknown>) => ({
  id: 1,
  kind: 'general',
  title: 'New housing application',
  body: 'A new application came in for Grace House.',
  link_path: '/residences/applications/intake',
  read_at: null,
  created_at: new Date().toISOString(),
  ...over,
});

const wrap = () =>
  render(
    <MemoryRouter>
      <NotificationsPanel fallbackPath="/staff/today" />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue({ person: { id: 5 } });
});

describe('NotificationsPanel', () => {
  it('links each notification to its object, remapping legacy stored paths', async () => {
    mocks.getMyNotifications.mockResolvedValue([
      note({ id: 1 }),
      note({ id: 2, title: 'Session confirmed', link_path: '/sessions' }),
    ]);
    wrap();
    const intake = (await screen.findByText('New housing application')).closest('a');
    expect(intake).toHaveAttribute('href', '/residences/applications/intake');
    const session = screen.getByText('Session confirmed').closest('a');
    expect(session).toHaveAttribute('href', '/vrcc/sessions');
  });

  it('marks a notification read when opened', async () => {
    mocks.getMyNotifications.mockResolvedValue([note({ id: 3 })]);
    mocks.markNotificationRead.mockResolvedValue(undefined);
    wrap();
    fireEvent.click(await screen.findByText('New housing application'));
    await waitFor(() => expect(mocks.markNotificationRead).toHaveBeenCalledWith(3));
  });

  it('resolves the pile with mark-all-read', async () => {
    mocks.getMyNotifications
      .mockResolvedValueOnce([note({ id: 4 })])
      .mockResolvedValueOnce([note({ id: 4, read_at: new Date().toISOString() })]);
    mocks.markAllNotificationsRead.mockResolvedValue(undefined);
    wrap();
    fireEvent.click(await screen.findByRole('button', { name: /mark all read/i }));
    await waitFor(() => expect(mocks.markAllNotificationsRead).toHaveBeenCalledWith(5));
    expect(await screen.findByText('Nothing new.')).toBeInTheDocument();
  });
});
