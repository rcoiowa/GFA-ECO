import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyAppearance,
  getStoredAppearance,
  getStoredAtmosphere,
  setAppearancePreference,
} from '@recoveryos/ui';

/**
 * Appearance architecture (P4H spec §5/§6A): system default, dark as a
 * designed override, Cosmic as ambience that requires the dark field, and a
 * faithful migration of the retired monolithic [data-visual] preference.
 */

describe('appearance preference + legacy migration', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.appearance;
    delete document.documentElement.dataset.atmosphere;
  });

  it('defaults to following the device with the Hearth atmosphere', () => {
    expect(getStoredAppearance()).toBe('system');
    expect(getStoredAtmosphere()).toBe('hearth');
  });

  it('migrates the retired dark theme to dark appearance', () => {
    localStorage.setItem('recoveryos-visual', 'dark');
    expect(getStoredAppearance()).toBe('dark');
    expect(getStoredAtmosphere()).toBe('hearth');
  });

  it('migrates the retired space theme to dark + cosmic', () => {
    localStorage.setItem('recoveryos-visual', 'space');
    expect(getStoredAppearance()).toBe('dark');
    expect(getStoredAtmosphere()).toBe('cosmic');
  });

  it('migrates other retired themes to system + hearth (deferred skins)', () => {
    localStorage.setItem('recoveryos-visual', 'retro');
    expect(getStoredAppearance()).toBe('system');
    expect(getStoredAtmosphere()).toBe('hearth');
  });

  it('stamps the resolved appearance; explicit choice wins over device', () => {
    applyAppearance('dark', 'hearth');
    expect(document.documentElement.dataset.appearance).toBe('dark');
    expect(document.documentElement.dataset.atmosphere).toBeUndefined();
    applyAppearance('light', 'hearth');
    expect(document.documentElement.dataset.appearance).toBe('light');
  });

  it('cosmic forces the dark field and clears when leaving', () => {
    applyAppearance('light', 'cosmic');
    expect(document.documentElement.dataset.appearance).toBe('dark');
    expect(document.documentElement.dataset.atmosphere).toBe('cosmic');
    applyAppearance('light', 'hearth');
    expect(document.documentElement.dataset.atmosphere).toBeUndefined();
  });

  it('persists the preference for future visits', () => {
    setAppearancePreference('dark', 'cosmic');
    expect(localStorage.getItem('recoveryos-appearance')).toBe('dark');
    expect(localStorage.getItem('recoveryos-atmosphere')).toBe('cosmic');
    expect(getStoredAppearance()).toBe('dark');
    expect(getStoredAtmosphere()).toBe('cosmic');
  });
});
