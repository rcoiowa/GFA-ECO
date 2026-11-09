import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getMyCircleWorkspace,
  recordCircleMeeting,
  type CircleInput,
} from '../../../../packages/data-access/src/repositories/circleMeetings';

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../../../../packages/data-access/src/client', () => ({
  getSupabase: () => ({ rpc: mocks.rpc }),
}));
const input: CircleInput = {
  seriesId: 1,
  startsAt: '2026-11-09T23:30:00.000Z',
  endsAt: '2026-11-10T00:30:00.000Z',
  status: 'held',
  participants: 12,
  facilitators: ['Facilitator'],
  topic: 'Connection',
  theme: 'Welcome',
  icarePhase: 'Connect',
  domain: 'Community',
};
const v1Params = {
  p_series_id: 1,
  p_starts_at: input.startsAt,
  p_ends_at: input.endsAt,
  p_status: 'held',
  p_participant_count: 12,
  p_facilitator_names: ['Facilitator'],
  p_topic_title: 'Connection',
  p_topic_category: 'Welcome',
  p_icare_phase: 'Connect',
  p_domain: 'Community',
};
beforeEach(() => {
  mocks.rpc.mockReset();
  mocks.rpc.mockResolvedValue({ data: { ok: true, code: 'recorded', meeting_id: 7 }, error: null });
});
describe('Circle documentation repository compatibility', () => {
  it('uses only the existing ten-argument RPC without capability', async () => {
    await recordCircleMeeting(input);
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('record_circle_meeting', v1Params);
  });
  it.each([
    { firstTimeParticipants: 1 },
    { firstTimeParticipants: 0 },
    { firstTimeParticipants: null },
    { facilitatorNotes: 'Plan a quieter opening.' },
    { facilitatorNotes: '' },
  ])('rejects supplied extras without capability: %j', async (extras) => {
    await expect(recordCircleMeeting({ ...input, ...extras })).rejects.toThrow('does not support');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('sends the exact v2 contract with trimmed notes', async () => {
    await recordCircleMeeting({
      ...input,
      documentationV2: true,
      firstTimeParticipants: 3,
      facilitatorNotes: '  Plan a quieter opening.  ',
    });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('record_circle_meeting_v2', {
      ...v1Params,
      p_first_time_participant_count: 3,
      p_facilitator_notes: 'Plan a quieter opening.',
    });
  });
  it.each([undefined, null, 0])('preserves unknown versus zero: %j', async (count) => {
    await recordCircleMeeting({
      ...input,
      documentationV2: true,
      firstTimeParticipants: count,
      facilitatorNotes: '   ',
    });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('record_circle_meeting_v2', {
      ...v1Params,
      p_first_time_participant_count: count ?? null,
      p_facilitator_notes: null,
    });
  });
  it('sends null first-time attendance for cancellation', async () => {
    await recordCircleMeeting({
      ...input,
      documentationV2: true,
      status: 'cancelled',
      participants: null,
      facilitators: [],
    });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('record_circle_meeting_v2', {
      ...v1Params,
      p_status: 'cancelled',
      p_participant_count: null,
      p_facilitator_names: [],
      p_first_time_participant_count: null,
      p_facilitator_notes: null,
    });
  });
  it('rejects attendance supplied for a cancellation rather than dropping it', async () => {
    await expect(
      recordCircleMeeting({
        ...input,
        documentationV2: true,
        status: 'cancelled',
        participants: null,
        firstTimeParticipants: 0,
      }),
    ).rejects.toThrow('held meeting');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each([-1, 1.5, 13, NaN, Infinity])('rejects an invalid count: %j', async (count) => {
    await expect(
      recordCircleMeeting({ ...input, documentationV2: true, firstTimeParticipants: count }),
    ).rejects.toThrow('whole number');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('requires total attendance when a first-time count is supplied', async () => {
    await expect(
      recordCircleMeeting({
        ...input,
        documentationV2: true,
        participants: null,
        firstTimeParticipants: 1,
      }),
    ).rejects.toThrow('whole number');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('counts Unicode characters rather than UTF-16 units after trimming', async () => {
    await recordCircleMeeting({
      ...input,
      documentationV2: true,
      facilitatorNotes: `  ${'🌱'.repeat(2000)}  `,
    });
    expect(mocks.rpc.mock.calls[0]![1].p_facilitator_notes).toBe('🌱'.repeat(2000));
    mocks.rpc.mockClear();
    await expect(
      recordCircleMeeting({ ...input, documentationV2: true, facilitatorNotes: '🌱'.repeat(2001) }),
    ).rejects.toThrow('2000 characters');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('propagates RPC errors without retrying or downgrading', async () => {
    const error = { code: 'PGRST202', message: 'Versioned function unavailable' };
    mocks.rpc.mockResolvedValue({ data: null, error });
    await expect(
      recordCircleMeeting({
        ...input,
        documentationV2: true,
        facilitatorNotes: 'Plan a quieter opening.',
      }),
    ).rejects.toEqual(error);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc.mock.calls[0]![0]).toBe('record_circle_meeting_v2');
  });
  it('passes conflicts through without retrying', async () => {
    const conflict = { ok: false, code: 'duplicate_conflict', meeting_id: 7 };
    mocks.rpc.mockResolvedValue({ data: conflict, error: null });
    await expect(recordCircleMeeting({ ...input, documentationV2: true })).resolves.toEqual(
      conflict,
    );
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it('preserves server capability and nullable historical/private readback', async () => {
    const workspace = {
      capabilities: { circle_documentation_v2: true },
      series: [],
      meetings: [{ id: 7, first_time_participant_count: null, facilitator_notes: null }],
    };
    mocks.rpc.mockResolvedValue({ data: workspace, error: null });
    await expect(getMyCircleWorkspace()).resolves.toEqual(workspace);
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('get_my_circle_workspace');
  });
});
