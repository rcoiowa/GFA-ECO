import { useEffect, useState } from 'react';

/**
 * Appearance + atmosphere preferences (P4H spec §5/§6A).
 *
 * APPEARANCE is 'system' | 'light' | 'dark' (system default): the RESOLVED
 * mode is stamped as <html data-appearance="light|dark"> so CSS carries a
 * single dark override block. ATMOSPHERE is ambient only — Hearth (default,
 * attribute-free) or Cosmic (static starfield; forces dark appearance since
 * a lit starfield is not a designed state). Preferences are device-local
 * (localStorage) — deliberately not backend state.
 *
 * A pre-paint copy of this logic lives in each app's index.html so the first
 * frame already wears the saved appearance (no flash).
 */

export const APPEARANCES = [
  { key: 'system', label: 'Match device' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
] as const;
export type AppearancePreference = (typeof APPEARANCES)[number]['key'];

export const ATMOSPHERES = [
  { key: 'hearth', label: 'Hearth' },
  { key: 'cosmic', label: 'Cosmic' },
] as const;
export type Atmosphere = (typeof ATMOSPHERES)[number]['key'];

const APPEARANCE_KEY = 'recoveryos-appearance';
const ATMOSPHERE_KEY = 'recoveryos-atmosphere';
/** Legacy monolithic theme preference (pre-P4H) — migrated on read. */
const LEGACY_KEY = 'recoveryos-visual';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable — preference still applies for this page view
  }
}

export function getStoredAppearance(): AppearancePreference {
  const stored = read(APPEARANCE_KEY);
  if (stored && APPEARANCES.some((a) => a.key === stored)) return stored as AppearancePreference;
  // Migrate the retired [data-visual] preference: dark stays dark, the old
  // space theme becomes dark + cosmic, everything else follows the device.
  const legacy = read(LEGACY_KEY);
  if (legacy === 'dark' || legacy === 'space' || legacy === 'rcoia') return 'dark';
  return 'system';
}

export function getStoredAtmosphere(): Atmosphere {
  const stored = read(ATMOSPHERE_KEY);
  if (stored && ATMOSPHERES.some((a) => a.key === stored)) return stored as Atmosphere;
  return read(LEGACY_KEY) === 'space' ? 'cosmic' : 'hearth';
}

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

/** Stamp the resolved appearance + atmosphere on <html>. */
export function applyAppearance(preference: AppearancePreference, atmosphere: Atmosphere) {
  const resolved =
    atmosphere === 'cosmic'
      ? 'dark'
      : preference === 'system'
        ? systemPrefersDark()
          ? 'dark'
          : 'light'
        : preference;
  document.documentElement.dataset.appearance = resolved;
  if (atmosphere === 'cosmic') document.documentElement.dataset.atmosphere = 'cosmic';
  else delete document.documentElement.dataset.atmosphere;
}

export function setAppearancePreference(preference: AppearancePreference, atmosphere: Atmosphere) {
  write(APPEARANCE_KEY, preference);
  write(ATMOSPHERE_KEY, atmosphere);
  applyAppearance(preference, atmosphere);
}

/** Compact appearance/atmosphere picker for shell utility areas. */
export function AppearanceControls({ className = '' }: { className?: string }) {
  const [preference, setPreference] = useState<AppearancePreference>('system');
  const [atmosphere, setAtmosphere] = useState<Atmosphere>('hearth');

  useEffect(() => {
    setPreference(getStoredAppearance());
    setAtmosphere(getStoredAtmosphere());
  }, []);

  // Follow live device changes while the preference is "system".
  useEffect(() => {
    if (preference !== 'system') return;
    let media: MediaQueryList;
    const onChange = () => applyAppearance('system', atmosphere);
    try {
      media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', onChange);
    } catch {
      return;
    }
    return () => media.removeEventListener('change', onChange);
  }, [preference, atmosphere]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="flex items-center justify-between gap-2 text-sm text-ink-muted">
        <span>Appearance</span>
        <select
          value={preference}
          onChange={(e) => {
            const next = e.target.value as AppearancePreference;
            setPreference(next);
            setAppearancePreference(next, atmosphere);
          }}
          className="min-h-9 rounded-sm border border-line bg-surface-raised px-2 text-sm text-ink"
        >
          {APPEARANCES.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center justify-between gap-2 text-sm text-ink-muted">
        <span>Atmosphere</span>
        <select
          value={atmosphere}
          onChange={(e) => {
            const next = e.target.value as Atmosphere;
            setAtmosphere(next);
            setAppearancePreference(preference, next);
          }}
          className="min-h-9 rounded-sm border border-line bg-surface-raised px-2 text-sm text-ink"
        >
          {ATMOSPHERES.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
