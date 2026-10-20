import { describe, expect, it, vi } from 'vitest';
import {
  loadCollaborationWorkspace,
  saveCollaborationWorkspace,
} from '../../../../packages/data-access/src/repositories/collaboration';
const rpc = vi.hoisted(() => vi.fn());
vi.mock('../../../../packages/data-access/src/client', () => ({ getSupabase: () => ({ rpc }) }));
describe('collaboration persistence adapter', () => {
  it('fails closed on missing schema or denied access', async () => {
    rpc.mockResolvedValueOnce({ error: { code: 'PGRST202' }, data: null });
    await expect(loadCollaborationWorkspace(10)).rejects.toThrow('Persistence unavailable');
    rpc.mockResolvedValueOnce({ error: null, data: { ok: false, code: 'not_authorized' } });
    await expect(loadCollaborationWorkspace(10)).rejects.toThrow('Persistence unavailable');
  });
  it('uses the server version and never retries stale saves', async () => {
    rpc.mockResolvedValueOnce({ error: null, data: { ok: false, code: 'stale_version' } });
    await expect(
      saveCollaborationWorkspace(10, 4, {
        brief: 'Synthetic',
        notes: '',
        intakeId: null,
        batches: [],
      }),
    ).rejects.toThrow('Another session');
    expect(rpc).toHaveBeenLastCalledWith('save_admin_collaboration_workspace', {
      p_residence_id: 10,
      p_version: 4,
      p_document: { brief: 'Synthetic', notes: '', intakeId: null, batches: [] },
    });
  });
});
