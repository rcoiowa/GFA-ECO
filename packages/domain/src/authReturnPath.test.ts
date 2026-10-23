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
    '/admin',
    '/admin/access',
    '/vrcc/resources',
    '/staff/messages/123',
    '/residences/applications/intake/123',
    '/residences/applications/other',
    null,
    {},
  ])('rejects %s', (value) => {
    expect(safeAuthReturnPath(value)).toBeNull();
  });
  it.each([
    '/my-housing',
    '/my-housing/documents',
    '/my-housing/consent',
    '/residence/documents',
    '/staff/document-review',
    '/residences/applications/intake',
  ])('keeps %s without authorizing it', (path) => {
    expect(safeAuthReturnPath(path)).toBe(path);
  });
  it('strips every query and fragment from the exact intake queue return path', () => {
    expect(
      safeAuthReturnPath('/residences/applications/intake?application=42&tab=documents#main'),
    ).toBe('/residences/applications/intake');
    expect(
      safeAuthReturnPath('/residences/applications/intake?next=https://evil.test#private'),
    ).toBe('/residences/applications/intake');
  });
  it('keeps published documents but drops assignment and person IDs', () => {
    expect(safeAuthReturnPath('/my-housing/documents/resident_handbook?assignment=42')).toBe(
      '/my-housing/documents/resident_handbook',
    );
    expect(safeAuthReturnPath('/staff/document-review?application=42')).toBe(
      '/staff/document-review',
    );
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
