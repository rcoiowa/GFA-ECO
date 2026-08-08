import { describe, expect, it } from 'vitest';
import {
  CONNECTION_CONFIRMATION_OPTIONS,
  NEED_CATEGORIES,
  awaitingConnectionConfirmation,
  deriveNavigatorAttention,
  needCategoryLabel,
  needStatusLabel,
  referralStatusLabel,
  referralTypeLabel,
} from './navigation';
import type { NavigationNeedRow, NavigationReferralRow } from './navigation';
import type { FollowUpRow } from './coach';
import type { OpenPoolRow } from './coaching';

const NOW = new Date('2026-08-08T15:00:00Z');

const pool = (over: Partial<OpenPoolRow>): OpenPoolRow => ({
  support_request_id: 1,
  participant_person_id: 101,
  participant_name: 'Casey',
  request_type: 'navigation',
  preferred_modality: 'phone',
  created_at: '2026-08-08T10:00:00Z',
  ...over,
});

const fu = (over: Partial<FollowUpRow>): FollowUpRow => ({
  id: 1,
  person_id: 10,
  assigned_person_id: 20,
  appointment_id: null,
  follow_up_type: 'check_in',
  due_at: '2026-08-08T20:00:00Z',
  status: 'open',
  note: null,
  completed_at: null,
  created_at: '2026-08-07T10:00:00Z',
  ...over,
});

const need = (over: Partial<NavigationNeedRow>): NavigationNeedRow => ({
  id: 1,
  person_id: 10,
  navigation_relationship_id: 5,
  need_category: 'housing',
  status: 'identified',
  identified_at: '2026-08-08T10:00:00Z',
  resolved_at: null,
  note: null,
  ...over,
});

const ref = (over: Partial<NavigationReferralRow>): NavigationReferralRow => ({
  id: 1,
  person_id: 10,
  navigation_need_id: 1,
  resource_id: null,
  organization_id: null,
  destination_name: 'Hope House',
  referral_type: 'warm_handoff',
  status: 'contact_attempted',
  connection_evidence: null,
  attempted_at: '2026-08-08T11:00:00Z',
  connected_at: null,
  created_at: '2026-08-08T10:30:00Z',
  ...over,
});

describe('taxonomy and labels are funder-neutral and humane', () => {
  it('all sixteen categories have stable keys and human labels', () => {
    expect(NEED_CATEGORIES).toHaveLength(16);
    for (const c of NEED_CATEGORIES) {
      expect(c.key).toMatch(/^[a-z_]+$/);
      expect(c.label.length).toBeGreaterThan(2);
      // No grant vocabulary encoded in the taxonomy.
      expect(c.key).not.toMatch(/gpra|suprt|rcorp|exhibit|hrsa|samhsa|bja/i);
      expect(c.label).not.toMatch(/gpra|suprt|rcorp|exhibit/i);
    }
    expect(needCategoryLabel('housing')).toBe('Housing');
    expect(needCategoryLabel('unknown_key')).toBe('Support need');
  });

  it('need statuses never read as participant failure', () => {
    expect(needStatusLabel('unresolved')).toBe('Still unresolved');
    expect(needStatusLabel('deferred')).toBe('Set aside for now');
    for (const s of ['identified', 'in_progress', 'resolved', 'partially_resolved', 'unresolved', 'deferred']) {
      expect(needStatusLabel(s).toLowerCase()).not.toContain('fail');
    }
  });

  it('a warm handoff is not the same as sharing a phone number', () => {
    expect(referralTypeLabel('information')).toBe('Resource shared');
    expect(referralTypeLabel('referral')).toBe('Referral made');
    expect(referralTypeLabel('warm_handoff')).toBe('Warm handoff');
  });

  it('referral statuses distinguish declining from unavailability', () => {
    expect(referralStatusLabel('participant_declined')).toBe('No longer needed');
    expect(referralStatusLabel('partner_unavailable')).toBe('Provider unavailable right now');
    expect(referralStatusLabel('connected')).toBe('Connected');
  });
});

describe('awaitingConnectionConfirmation', () => {
  it('asks only while the loop is genuinely open', () => {
    expect(awaitingConnectionConfirmation('initiated')).toBe(true);
    expect(awaitingConnectionConfirmation('contact_attempted')).toBe(true);
    expect(awaitingConnectionConfirmation('not_connected')).toBe(true);
    expect(awaitingConnectionConfirmation('connected')).toBe(false);
    expect(awaitingConnectionConfirmation('participant_declined')).toBe(false);
  });
});

describe('deriveNavigatorAttention', () => {
  it('participant reply outranks everything; priority order holds', () => {
    const items = deriveNavigatorAttention({
      openPool: [pool({})],
      followUps: [fu({ due_at: '2026-08-08T09:00:00Z' })],
      needs: [need({ status: 'unresolved' })],
      referrals: [ref({})],
      rosterNames: new Map([[10, 'Pia']]),
      unreadMessages: { count: 1, from: 'Pia' },
      now: NOW,
    });
    expect(items[0]?.key).toBe('messages-unread');
    expect(items[1]?.key).toBe('followups-overdue');
    expect(items[2]?.key).toBe('pool');
    expect(items[3]?.key).toBe('handoff-pending');
    expect(items).toHaveLength(4);
  });

  it('warm handoff awaiting confirmation names the person when known', () => {
    const items = deriveNavigatorAttention({
      openPool: [],
      followUps: [],
      needs: [],
      referrals: [ref({})],
      rosterNames: new Map([[10, 'Pia']]),
      now: NOW,
    });
    expect(items[0]?.label).toBe('Check whether Pia got connected.');
  });

  it('only navigation-domain requests count as waiting', () => {
    const items = deriveNavigatorAttention({
      openPool: [pool({ request_type: 'recovery_coach' })],
      followUps: [],
      needs: [],
      referrals: [],
      now: NOW,
    });
    expect(items.find((i) => i.key === 'pool')).toBeUndefined();
  });

  it('empty inputs derive nothing', () => {
    expect(
      deriveNavigatorAttention({ openPool: [], followUps: [], needs: [], referrals: [], now: NOW }),
    ).toHaveLength(0);
  });
});

describe('participant confirmation options', () => {
  it('supportive, optional, never framing failure', () => {
    const labels = CONNECTION_CONFIRMATION_OPTIONS.map((o) => o.label.toLowerCase());
    expect(labels.some((l) => l.includes('fail'))).toBe(false);
    expect(CONNECTION_CONFIRMATION_OPTIONS.map((o) => o.value)).toEqual([
      'yes',
      'not_yet',
      'no_longer_needed',
      'need_more_help',
    ]);
  });
});
