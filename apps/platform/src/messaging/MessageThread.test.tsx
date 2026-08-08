import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MessageRow } from '@recoveryos/domain';
import { MessageThread } from './MessageThread';

const messages: MessageRow[] = [
  {
    id: 1,
    conversation_id: 7,
    sender_person_id: 10,
    body: 'Checking in — how was this week?',
    read_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    conversation_id: 7,
    sender_person_id: 20,
    body: 'Better than last week, honestly.',
    read_at: null,
    created_at: new Date().toISOString(),
  },
];

function setup(over: Partial<Parameters<typeof MessageThread>[0]> = {}) {
  const onSend = vi.fn().mockResolvedValue(true);
  render(
    <MessageThread
      messages={messages}
      myPersonId={20}
      otherName="Jordan"
      onSend={onSend}
      sending={false}
      sendError={null}
      {...over}
    />,
  );
  return { onSend };
}

describe('MessageThread', () => {
  it('renders both sides with clear sender attribution and day grouping', () => {
    setup();
    expect(screen.getByText('Checking in — how was this week?')).toBeInTheDocument();
    expect(screen.getByText('Better than last week, honestly.')).toBeInTheDocument();
    expect(screen.getByText('Jordan said:')).toBeInTheDocument();
    expect(screen.getByText('You said:')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('sends the trimmed draft and clears the composer on success', async () => {
    const { onSend } = setup();
    const box = screen.getByLabelText('Message Jordan');
    await userEvent.type(box, '  see you tuesday  ');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalledWith('see you tuesday');
    expect((box as HTMLTextAreaElement).value).toBe('');
  });

  it('a failed send preserves the draft and explains humanely', async () => {
    const onSend = vi.fn().mockResolvedValue(false);
    render(
      <MessageThread
        messages={messages}
        myPersonId={20}
        otherName="Jordan"
        onSend={onSend}
        sending={false}
        sendError="send_failed"
      />,
    );
    const box = screen.getByLabelText('Message Jordan');
    await userEvent.type(box, 'important words');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect((box as HTMLTextAreaElement).value).toBe('important words');
    expect(screen.getByText(/It’s still here — try again/)).toBeInTheDocument();
    expect(screen.queryByText(/rpc|conversation_id|42501/i)).not.toBeInTheDocument();
  });

  it('empty drafts cannot send', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('empty thread invites gently', () => {
    setup({ messages: [] });
    expect(screen.getByText(/No messages yet/)).toBeInTheDocument();
  });
});
