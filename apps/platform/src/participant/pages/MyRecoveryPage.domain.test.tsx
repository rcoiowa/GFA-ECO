import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { Goal } from '@recoveryos/domain';
import { MyRecoveryPage } from './MyRecoveryPage';

/**
 * P1.3 pins — goal domain attribution is a participant CHOICE:
 * the picker is optional, skipping it is a first-class path, the stored key never
 * leaks raw (participants see ratified labels), and unclassified goals render
 * exactly like before.
 */

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  listMyGoals: vi.fn(),
  createGoal: vi.fn(),
  updateGoalStatus: vi.fn(),
}));
vi.mock('@recoveryos/auth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@recoveryos/data-access', () => ({
  listMyGoals: mocks.listMyGoals,
  createGoal: mocks.createGoal,
  updateGoalStatus: mocks.updateGoalStatus,
}));

const goal = (over: Partial<Goal>): Goal => ({
  id: 1,
  person_id: 10,
  recovery_plan_id: null,
  title: 'Attend two circles',
  detail: null,
  status: 'active',
  target_date: null,
  domain_key: null,
  created_at: '2026-08-20T10:00:00Z',
  updated_at: '2026-08-20T10:00:00Z',
  ...over,
});

const wrap = () => render(<MemoryRouter><MyRecoveryPage /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useAuth.mockReturnValue({ person: { id: 10 } });
  mocks.listMyGoals.mockResolvedValue([]);
});

describe('MyRecoveryPage — optional domain attribution (P1.3)', () => {
  it('offers the ratified participant labels behind an explicitly optional picker', async () => {
    wrap();
    await userEvent.click(await screen.findByRole('button', { name: 'Add a goal' }));
    const picker = screen.getByLabelText('This is about… (optional)');
    const labels = [...picker.querySelectorAll('option')].map((o) => o.textContent);
    expect(labels[0]).toBe("Skip this — it's still your goal");
    expect(labels).toContain('My recovery');
    expect(labels).toContain('My community');
    expect(labels).toContain('Money & basics');
    // Participant-facing options never leak machine keys.
    expect(labels.some((l) => /_/.test(l ?? ''))).toBe(false);
  });

  it('saves a goal with NO domain when the picker is skipped', async () => {
    mocks.createGoal.mockResolvedValue(goal({ id: 2, title: 'Call my sponsor weekly' }));
    wrap();
    await userEvent.click(await screen.findByRole('button', { name: 'Add a goal' }));
    await userEvent.type(
      screen.getByLabelText(/What do you want to work toward/),
      'Call my sponsor weekly',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save goal' }));
    expect(mocks.createGoal).toHaveBeenCalledWith({
      personId: 10,
      title: 'Call my sponsor weekly',
      detail: undefined,
      domainKey: null,
    });
  });

  it('saves the chosen domain key when the participant picks one', async () => {
    mocks.createGoal.mockResolvedValue(goal({ id: 3, domain_key: 'community' }));
    wrap();
    await userEvent.click(await screen.findByRole('button', { name: 'Add a goal' }));
    await userEvent.type(
      screen.getByLabelText(/What do you want to work toward/),
      'Volunteer at GFARC',
    );
    await userEvent.selectOptions(
      screen.getByLabelText('This is about… (optional)'),
      'My community',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save goal' }));
    expect(mocks.createGoal).toHaveBeenCalledWith(
      expect.objectContaining({ domainKey: 'community' }),
    );
  });

  it('shows a human label chip on classified goals and nothing on unclassified ones', async () => {
    mocks.listMyGoals.mockResolvedValue([
      goal({ id: 4, title: 'Get my license back', domain_key: 'transportation' }),
      goal({ id: 5, title: 'One day at a time', domain_key: null }),
    ]);
    wrap();
    expect(await screen.findByText('Get my license back')).toBeInTheDocument();
    expect(screen.getByText('Getting around')).toBeInTheDocument();
    // The raw key never renders, and the unclassified goal carries no chip.
    expect(screen.queryByText('transportation')).not.toBeInTheDocument();
    expect(screen.getByText('One day at a time')).toBeInTheDocument();
  });
});
