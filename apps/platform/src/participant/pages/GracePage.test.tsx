import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { GracePage } from './GracePage';
const mocks = vi.hoisted(() => ({
  consent: vi.fn(),
  invoke: vi.fn(),
  person: { id: 1 } as { id: number } | null,
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: () => ({ person: mocks.person }) }));
vi.mock('@recoveryos/data-access', () => ({
  hasActiveAiConsent: mocks.consent,
  invokeGrace: mocks.invoke,
  setAiConsent: vi.fn(),
}));
vi.mock('../../lib/analytics', () => ({ track: vi.fn() }));
const disclosure =
  'I’m Grace, an AI support navigator—not a human peer, counselor, or crisis service. I can help you slow things down, explore your options, find recovery supports, and choose whether to connect with a real person. You remain in control of what you share and what happens next.';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.person = { id: 1 };
});
describe('Grace editorial identity and independent support', () => {
  it.each([false, true])(
    'shows full identity and exact disclosure with consent=%s',
    async (consent) => {
      mocks.consent.mockResolvedValue(consent);
      render(
        <MemoryRouter>
          <GracePage />
        </MemoryRouter>,
      );
      expect(
        await screen.findByRole('heading', { name: 'Grace, AI Support Navigator' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText((_, element) => element?.textContent === `About Grace: ${disclosure}`),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Support Now/i })).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.queryByText('Checking Grace consent…')).not.toBeInTheDocument(),
      );
      expect(mocks.invoke).not.toHaveBeenCalled();
      expect(screen.queryByText(/real people are one tap away/i)).not.toBeInTheDocument();
    },
  );
});

it('keeps support and disclosure visible while consent never resolves', () => {
  mocks.consent.mockReturnValue(new Promise(() => {}));
  render(
    <MemoryRouter>
      <GracePage />
    </MemoryRouter>,
  );
  expect(screen.getByText('Checking Grace consent…')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Support now/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View public support options' })).toHaveAttribute(
    'href',
    '/support',
  );
  expect(mocks.invoke).not.toHaveBeenCalled();
});
it('explains missing identity without offering consent or spinning indefinitely', () => {
  mocks.person = null;
  render(
    <MemoryRouter>
      <GracePage />
    </MemoryRouter>,
  );
  expect(screen.getByText(/needs a verified account link/)).toBeInTheDocument();
  expect(screen.queryByText('Checking Grace consent…')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Turn on Grace AI' })).not.toBeInTheDocument();
  expect(mocks.consent).not.toHaveBeenCalled();
});
it('fails closed on consent errors while retaining support', async () => {
  mocks.consent.mockRejectedValue(new Error('synthetic unavailable'));
  render(
    <MemoryRouter>
      <GracePage />
    </MemoryRouter>,
  );
  expect(await screen.findByText('Grace needs your okay first')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Support now/i })).toBeInTheDocument();
  expect(mocks.invoke).not.toHaveBeenCalled();
});
it('respects reduced motion when scrolling the conversation', async () => {
  const scroll = vi.fn();
  const previous = HTMLElement.prototype.scrollTo;
  HTMLElement.prototype.scrollTo = scroll;
  const media = vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
  mocks.consent.mockResolvedValue(true);
  try {
    render(
      <MemoryRouter>
        <GracePage />
      </MemoryRouter>,
    );
    await screen.findByRole('log');
    // A user message causes the existing scroll effect to run with a mounted log.
    const { fireEvent } = await import('@testing-library/react');
    mocks.invoke.mockResolvedValue({ ok: false });
    fireEvent.click(screen.getByRole('button', { name: 'I’m having a hard day.' }));
    await waitFor(() =>
      expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' })),
    );
  } finally {
    media.mockRestore();
    HTMLElement.prototype.scrollTo = previous;
  }
});
