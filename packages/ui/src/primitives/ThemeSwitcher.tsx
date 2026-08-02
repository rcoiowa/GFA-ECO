import { useEffect, useState } from 'react';

export const VISUAL_THEMES = [
  { key: 'default', label: 'Default' },
  { key: 'dark', label: 'Dark' },
  { key: 'space', label: 'Space' },
  { key: 'sky', label: 'Sky' },
  { key: 'retro', label: 'Retro' },
] as const;
export type VisualTheme = (typeof VISUAL_THEMES)[number]['key'];

const STORAGE_KEY = 'recoveryos-visual';

export function getStoredVisualTheme(): VisualTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VISUAL_THEMES.some((t) => t.key === stored)) return stored as VisualTheme;
  } catch {
    // storage unavailable — fall through to default
  }
  return 'default';
}

export function applyVisualTheme(theme: VisualTheme) {
  document.documentElement.dataset.visual = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage unavailable — theme still applies for this page view
  }
}

/**
 * User-selectable visual theme (Default / Dark / Space / Sky / Retro).
 * A preference, not a mode: every theme keeps AA contrast, and the choice
 * follows the person across every experience on this device.
 */
export function ThemeSwitcher({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<VisualTheme>('default');

  useEffect(() => {
    setTheme(getStoredVisualTheme());
  }, []);

  return (
    <label className={`flex items-center gap-2 text-sm text-ink-muted ${className}`}>
      <span>Theme</span>
      <select
        value={theme}
        onChange={(e) => {
          const next = e.target.value as VisualTheme;
          setTheme(next);
          applyVisualTheme(next);
        }}
        className="min-h-9 rounded-md border border-line bg-surface-raised px-2 text-sm text-ink"
      >
        {VISUAL_THEMES.map((t) => (
          <option key={t.key} value={t.key}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  );
}
