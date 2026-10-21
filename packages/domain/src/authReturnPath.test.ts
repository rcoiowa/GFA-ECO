import { describe, it, expect } from 'vitest';
import { safeAuthReturnPath, authFlowPath, locationReturnPath } from './authReturnPath';
describe('auth navigation privacy boundary', () => {
  it.each([
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/%2f%2fevil.test',
    '/vrcc/../admin',
    '/sign-in',
    '/onboarding?next=/home',
    '/home\n',
    '/home%00',
    '/home/../home',
    '/unknown',
    null,
    {},
  ])('rejects %s', (value) => {
    expect(safeAuthReturnPath(value)).toBeNull();
  });
  it.each([
    '/my-housing',
    '/my-housing/documents',
    '/my-housing/consent',
    '/vrcc/resources',
    '/admin/access',
  ])('keeps %s without authorizing it', (path) => {
    expect(safeAuthReturnPath(path)).toBe(path);
  });
  it('keeps published documents but drops assignment and person IDs', () => {
    expect(safeAuthReturnPath('/my-housing/documents/resident_handbook?assignment=42')).toBe(
      '/my-housing/documents/resident_handbook',
    );
    expect(safeAuthReturnPath('/staff/messages/123')).toBe('/staff/messages');
  });
  it('retains reviewed query/hash values and drops personal values and credentials', () => {
    expect(
      safeAuthReturnPath(
        '/my-housing?tab=documents&email=private@example.test&access_token=secret#documents',
      ),
    ).toBe('/my-housing?tab=documents#documents');
    expect(safeAuthReturnPath('/home?tab=private&next=//evil.test#access_token=secret')).toBe(
      '/home',
    );
    expect(safeAuthReturnPath('/home?tab=documents&tab=application')).toBe('/home');
  });
  it('survives repeated auth hops, interruption and a refreshed onboarding route', () => {
    let next = '/my-housing?tab=documents#documents';
    for (const step of [
      '/sign-in',
      '/register',
      '/sign-in',
      '/forgot-password',
      '/reset-password',
      '/onboarding',
      '/sign-in',
    ] as const) {
      const url = new URL(authFlowPath(step, next), 'https://local.test');
      next = safeAuthReturnPath(url.searchParams.get('next'))!;
      expect(next).toBe('/my-housing?tab=documents#documents');
    }
    expect(
      locationReturnPath({
        pathname: '/onboarding',
        search: '?next=%2Fmy-housing%2Fconsent',
        hash: '',
      }),
    ).toBe('/my-housing/consent');
  });
});
