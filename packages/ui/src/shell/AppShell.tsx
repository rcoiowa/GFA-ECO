import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import { AppearanceControls } from '../primitives/ThemeSwitcher';
import { OfflineNotice } from '../primitives/Offline';

export interface NavItem {
  to: string;
  label: string;
  /** Short label for the mobile bottom bar; defaults to label. */
  shortLabel?: string;
  icon?: ReactNode;
}

export interface AppShellProps {
  productName: string;
  /** Experience context shown under the product name, e.g. residence name. */
  contextLabel?: string;
  navItems: NavItem[];
  /** Persistent utilities (Support Now, profile, sign out) rendered in header. */
  utilities?: ReactNode;
  /** Theme key for this experience subtree ([data-experience] token override). */
  experience?: 'vrcc' | 'residence' | 'professional';
  children: ReactNode;
}

/**
 * Shared responsive shell: sidebar navigation on desktop, bottom bar on
 * mobile (first five destinations) with the rest reachable via the sidebar
 * pattern. Every page renders inside a labeled <main> with a skip link.
 */
export function AppShell({
  productName,
  contextLabel,
  navItems,
  utilities,
  experience,
  children,
}: AppShellProps) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  // Every destination stays reachable on mobile: when there are more than five,
  // the fifth slot becomes a "More" sheet holding the rest (nothing silently drops).
  const hasOverflow = navItems.length > 5;
  const mobileItems = hasOverflow ? navItems.slice(0, 4) : navItems;
  const overflowItems = hasOverflow ? navItems.slice(4) : [];
  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to.endsWith('/') ? to : `${to}/`);
  const overflowActive = overflowItems.some((item) => isActive(item.to));

  return (
    <div data-experience={experience} className="min-h-dvh flex flex-col md:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface-raised focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <header className="hidden md:flex md:w-64 md:flex-col md:shrink-0 border-r border-line bg-surface-raised">
        <div className="px-5 py-5 border-b border-line">
          <p className="text-xl font-semibold text-experience-700">{productName}</p>
          {contextLabel ? <p className="text-sm text-ink-muted mt-0.5">{contextLabel}</p> : null}
        </div>
        <nav aria-label="Primary" className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2.5 font-medium ${
                      isActive
                        ? 'bg-experience-soft text-experience-700'
                        : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {utilities ? <div className="border-t border-line p-3">{utilities}</div> : null}
        <div className="border-t border-line px-3 py-2.5">
          <AppearanceControls />
        </div>
      </header>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-line bg-surface-raised px-4 py-3">
        <div>
          <p className="font-semibold text-experience-700">{productName}</p>
          {contextLabel ? <p className="text-xs text-ink-muted">{contextLabel}</p> : null}
        </div>
        {utilities}
      </div>

      <main id="main-content" className="flex-1 pb-24 md:pb-8">
        <OfflineNotice />
        <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">{children}</div>
      </main>

      {/* Mobile bottom navigation — the one approved Veil surface (spec §7):
          translucent only where backdrop-filter exists; solid fallback. */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-raised supports-[backdrop-filter]:bg-surface-raised/85 supports-[backdrop-filter]:backdrop-blur-md"
      >
        {moreOpen && overflowItems.length > 0 ? (
          <div className="border-b border-line bg-surface-raised px-2 py-2">
            <ul className="flex flex-col">
              {overflowItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={`flex min-h-11 items-center gap-2 rounded-md px-3 font-medium ${
                      isActive(item.to) ? 'bg-experience-soft text-experience-700' : 'text-ink-muted'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <ul
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${mobileItems.length + (hasOverflow ? 1 : 0)}, 1fr)`,
          }}
        >
          {mobileItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  isActive(item.to) ? 'text-experience-700' : 'text-ink-muted'
                }`}
              >
                {item.icon}
                <span>{item.shortLabel ?? item.label}</span>
              </NavLink>
            </li>
          ))}
          {hasOverflow ? (
            <li>
              <button
                type="button"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  overflowActive && !moreOpen ? 'text-experience-700' : moreOpen ? 'text-experience-700' : 'text-ink-muted'
                }`}
              >
                <span aria-hidden="true">⋯</span>
                <span>More</span>
              </button>
            </li>
          ) : null}
        </ul>
      </nav>
    </div>
  );
}
