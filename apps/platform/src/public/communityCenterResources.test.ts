import { describe, expect, it } from 'vitest';
import { communityResources, resourceCategories } from './communityCenterResources';

const normalizedUrl = (href: string) => {
  const url = new URL(href, 'https://recoverycommunity.center');
  return url.hostname.replace(/^www\./, '').toLowerCase() + url.pathname.replace(/\/+$/, '');
};

describe('public resource directory integrity', () => {
  it('has unique identities, names, and destinations across imported sources', () => {
    for (const values of [
      communityResources.map((resource) => resource.id),
      communityResources.map((resource) => resource.name.toLowerCase().trim()),
      communityResources.map((resource) => normalizedUrl(resource.href)),
    ]) {
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it('uses known categories and secure external destinations', () => {
    for (const resource of communityResources) {
      expect(resourceCategories).toContain(resource.category);
      if (resource.external) {
        expect(new URL(resource.href).protocol).toBe('https:');
      } else {
        expect(resource.href.startsWith('/')).toBe(true);
      }
    }
  });
});
