import { describe, expect, it } from 'vitest';
import { captureError, getMonitorBuffer, redact } from './monitor';

describe('monitor redaction — process metadata only', () => {
  it('strips quoted free text, emails, and long numbers', () => {
    const out = redact(
      new Error(
        'insert failed for "I relapsed last week and told my coach" by sam@example.org id 123456789',
      ),
    );
    expect(out).not.toContain('relapsed');
    expect(out).not.toContain('sam@example.org');
    expect(out).not.toContain('123456789');
    expect(out).toContain('Error');
  });

  it('keeps operational shape (codes, constraint names)', () => {
    const out = redact(new Error('PGRST301 permission denied for table messages'));
    expect(out).toContain('PGRST301');
    expect(out).toContain('permission denied');
  });

  it('caps length hard', () => {
    expect(redact('x'.repeat(5000)).length).toBeLessThanOrEqual(300);
  });

  it('captured events carry scope/release/path, never raw payloads', () => {
    captureError('test.scope', new Error('boom "private words" here'));
    const last = getMonitorBuffer().at(-1)!;
    expect(last.scope).toBe('test.scope');
    expect(last.message).not.toContain('private words');
    expect(last.release).toBeTruthy();
  });
});
