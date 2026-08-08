import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessagesPage } from './MessagesPage';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  getMySupportTeam: vi.fn(),
  useEnsureConversation: vi.fn(),
  useConversationThread: vi.fn(),
  useSendMessage: vi.fn(),
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@recoveryos/data-access', () => ({ getMySupportTeam: mocks.getMySupportTeam }));
vi.mock('../../messaging/useMessaging', () => ({
  useEnsureConversation: mocks.useEnsureConversation,
  useConversationThread: mocks.useConversationThread,
  useSendMessage: mocks.useSendMessage,
}));

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MessagesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue({ person: { id: 20, first_name: 'Pat' } });
  mocks.useConversationThread.mockReturnValue({
    messages: [],
    isLoading: false,
    hasError: false,
    refetch: vi.fn(),
  });
  mocks.useSendMessage.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ ok: true }),
    isPending: false,
    isError: false,
  });
});

describe('MessagesPage — participant', () => {
  it('without a coach it explains gently and points at Connect — no dead thread', async () => {
    mocks.getMySupportTeam.mockResolvedValue([]);
    mocks.useEnsureConversation.mockReturnValue({ data: undefined, isPending: false });
    wrap();
    expect(
      await screen.findByText('Messaging opens once you’re connected'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Connect' })).toHaveAttribute(
      'href',
      '/vrcc/connect',
    );
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
  });

  it('with a coach it opens the one relationship thread under their name', async () => {
    mocks.getMySupportTeam.mockResolvedValue([
      {
        relationship_id: 1,
        support_person_id: 10,
        display_name: 'Jordan',
        role_label: 'Recovery Coach',
        relationship_type: 'coach',
        is_primary: true,
        started_at: '2026-08-01',
      },
    ]);
    mocks.useEnsureConversation.mockReturnValue({
      data: { ok: true, code: 'ready', conversationId: 7 },
      isPending: false,
    });
    wrap();
    expect(
      await screen.findByText('Your conversation with Jordan (Recovery Coach)'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    // No database vocabulary anywhere on the surface.
    expect(screen.queryByText(/conversation_id|unread_count|rpc/i)).not.toBeInTheDocument();
  });
});
